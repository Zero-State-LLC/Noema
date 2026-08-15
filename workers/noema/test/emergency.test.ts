import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
import { EMERGENCY_DURATION, WATCH_EMERGENCY_PULSE, publicEmergencyPulses } from "../src/emergency";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${controller_type}.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(condition = 20): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Test hub.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition,
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function formOrg(w: WorldRuntime, founder: PlayerPrincipal, member: PlayerPrincipal) {
  await run(w, founder, "ENTER_WORLD");
  await run(w, member, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await run(w, founder, "COMMIT", {
    operation: "ORG_CREATE",
    name: "Line",
    charter: "Keep the grid.",
    org_id: "org.line",
  });
  await run(w, founder, "COMMIT", {
    operation: "ORG_MEMBER_ADD",
    org_id: "org.line",
    agent_id: member.player_id,
    role: "member",
  });
  w.organizations["org.line"].treasury = { ...emptyTreasury(), energy: 4, compute: 8, storage: 8 };
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

describe("GC4-S3 emergency scopes", () => {
  it("parses activate/revoke and keeps them off KNOWN COMMANDS", () => {
    const parsed = parseHumanCommand("emergency activate org.line emrule.repair entity.relay");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") expect(parsed.action.arguments.operation).toBe("ORG_EMERGENCY_ACTIVATE");
    expect(helpText()).not.toMatch(/EMERGENCY_STARTED|SUPERUSER|ALL_ACTIONS|\bWED\b|ATTEST|BUILD|CONTEST/);
    expect(helpText("org")).toMatch(/emergency activate/);
  });

  it("authorized activation enables ordinary REPAIR for the holder", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const member = principal("player.vesper");
    await formOrg(w, founder, member);
    const act = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: member.player_id,
    });
    expect(act.ok).toBe(true);
    const scope = w.organizations["org.line"].emergency_scopes![0];
    expect(scope.status).toBe("ACTIVE");
    expect(scope.end_cycle).toBe(EMERGENCY_DURATION);
    w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const repaired = await run(w, member, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
      emergency_scope_id: scope.scope_id,
    });
    expect(repaired.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(35);
    expect(w.organizations["org.line"].treasury!.energy).toBe(4 - 3);
    const look = await run(w, member, "LOOK");
    expect(look.observation?.office_lines?.some((l) => /Emergency authority active/i.test(l))).toBe(true);
    expect(publicEmergencyPulses(w.organizations, w.cycle)).toContain(WATCH_EMERGENCY_PULSE);
  });

  it("expires on world-time and cannot authorize after end_cycle", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const member = principal("player.vesper");
    await formOrg(w, founder, member);
    await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: member.player_id,
    });
    for (let i = 0; i < EMERGENCY_DURATION; i++) {
      w.players[member.player_id].wait_until_cycle = w.cycle + 1;
      await run(w, founder, "WAIT");
    }
    expect(w.cycle).toBe(EMERGENCY_DURATION);
    expect(w.organizations["org.line"].emergency_scopes![0].status).toBe("EXPIRED");
    w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const late = await run(w, member, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
    });
    expect(late.ok).toBe(false);
  });

  it("revokes early and rejects vacant activation / missing condition / forged org", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const member = principal("player.vesper");
    await formOrg(w, founder, member);
    await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: member.player_id,
    });
    const scopeId = w.organizations["org.line"].emergency_scopes![0].scope_id;
    const revoked = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_REVOKE",
      emergency_scope_id: scopeId,
    });
    expect(revoked.ok).toBe(true);
    w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const after = await run(w, member, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
      emergency_scope_id: scopeId,
    });
    expect(after.ok).toBe(false);

    const vacant = await run(w, member, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
    });
    expect(vacant.ok).toBe(false);
    expect(vacant.error?.code).toBe("FORBIDDEN");

    w.rooms["room.hub"].entities[0].condition = 70;
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const healthy = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
    });
    expect(healthy.ok).toBe(false);

    const forged = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.forged",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
    });
    expect(forged.ok).toBe(false);
    expect(forged.error?.code).toBe("NOT_FOUND");
  });

  it("duplicate activation is idempotent; human and agent holders match", async () => {
    const w = world(20);
    const founder = principal("player.nacre", "human");
    const agent = principal("player.vesper", "agent");
    await formOrg(w, founder, agent);
    const first = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: agent.player_id,
    }, "idem.em.1");
    const replay = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: agent.player_id,
    }, "idem.em.1");
    expect(first.ok && replay.ok).toBe(true);
    expect(w.organizations["org.line"].emergency_scopes).toHaveLength(1);
    w.players[agent.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const r = await run(w, agent, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
    });
    expect(r.ok).toBe(true);
  });

  it("bounded emergency TRADE spends treasury under the cap", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const member = principal("player.vesper");
    await formOrg(w, founder, member);
    w.organizations["org.line"].treasury!.energy = 4;
    const act = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.trade",
      target_ref: "treasury",
      agent_id: member.player_id,
    });
    expect(act.ok).toBe(true);
    w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const trade = await run(w, member, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 3 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(trade.ok).toBe(true);
    expect(w.organizations["org.line"].treasury!.energy).toBe(1);
  });
});
