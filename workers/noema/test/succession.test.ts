import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
import { EMERGENCY_DURATION } from "../src/emergency";
import { WATCH_SUCCESSION_PULSE } from "../src/succession";
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

async function formOrg(
  w: WorldRuntime,
  founder: PlayerPrincipal,
  member: PlayerPrincipal,
  extra?: PlayerPrincipal,
) {
  await run(w, founder, "ENTER_WORLD");
  await run(w, member, "ENTER_WORLD");
  if (extra) await run(w, extra, "ENTER_WORLD");
  w.players[founder.player_id].handle = "Nacre";
  w.players[member.player_id].handle = "Sable";
  if (extra) w.players[extra.player_id].handle = "Vesper";
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  if (extra) w.players[extra.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
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
  if (extra) {
    await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: "org.line",
      agent_id: extra.player_id,
      role: "member",
    });
  }
  w.organizations["org.line"].treasury = { ...emptyTreasury(), energy: 8, compute: 8, storage: 8 };
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  if (extra) w.players[extra.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

async function makeOffice(w: WorldRuntime, founder: PlayerPrincipal, holder: PlayerPrincipal) {
  const created = await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_CREATE",
    org_id: "org.line",
    display_name: "Treasurer",
    authority_profile: "PUBLISH_NOTICE",
  });
  expect(created.ok).toBe(true);
  const officeId = Object.keys(w.organizations["org.line"].offices || {})[0];
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_ASSIGN",
    office_id: officeId,
    agent_id: holder.player_id,
  });
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return officeId;
}

describe("GC4-S4 designated succession", () => {
  it("parses succession aliases and keeps them off KNOWN COMMANDS", () => {
    const parsed = parseHumanCommand("succession office.treasurer player.sable player.vesper");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.action.arguments.operation).toBe("ORG_SUCCESSION_DESIGNATE");
      expect(parsed.action.arguments.successors).toEqual(["player.sable", "player.vesper"]);
    }
    const scope = parseHumanCommand("succession scope emscope.x player.sable");
    expect(scope.ok).toBe(true);
    if (scope.ok) expect(scope.action.arguments.emergency_scope_id).toBe("emscope.x");
    expect(helpText()).toMatch(/KNOWN COMMANDS/);
    expect(helpText()).not.toMatch(/succession|SUCCESSION_|DYNASTY|\bWED\b|ATTEST|BUILD|CONTEST/i);
    expect(helpText("org")).toMatch(/succession <office>/);
  });

  it("does not treat speech as designation", () => {
    const speech = parseHumanCommand("I name Sable as successor to Treasurer");
    expect(speech.ok).toBe(false);
  });

  it("designates then resigns onto the same office identity", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const successor = principal("player.sable", "agent");
    await formOrg(w, founder, successor, holder);
    const officeId = await makeOffice(w, founder, holder);
    const energyBefore = w.organizations["org.line"].treasury!.energy;
    const designated = await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [successor.player_id],
    });
    expect(designated.ok).toBe(true);
    expect(designated.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);
    w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const resigned = await run(w, holder, "COMMIT", {
      operation: "ORG_OFFICE_VACATE",
      office_id: officeId,
    });
    expect(resigned.ok).toBe(true);
    const office = w.organizations["org.line"].offices![officeId];
    expect(office.office_id).toBe(officeId);
    expect(office.status).toBe("OCCUPIED");
    expect(office.holder_player_id).toBe(successor.player_id);
    expect(office.history.map((h) => h.kind)).toEqual(["ASSIGNED", "VACATED", "ASSIGNED"]);
    expect(w.organizations["org.line"].treasury!.energy).toBe(energyBefore);
    expect(w.institution_pulses).toContain(WATCH_SUCCESSION_PULSE);
    const look = await run(w, successor, "LOOK");
    expect(look.observation?.office_lines?.some((l) => /designated successor — Sable/i.test(l))).toBe(true);
  });

  it("leaves the office vacant when no designation exists", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const other = principal("player.sable");
    await formOrg(w, founder, other, holder);
    const officeId = await makeOffice(w, founder, holder);
    const resigned = await run(w, holder, "COMMIT", {
      operation: "ORG_OFFICE_VACATE",
      office_id: officeId,
    });
    expect(resigned.ok).toBe(true);
    expect(w.organizations["org.line"].offices![officeId].status).toBe("VACANT");
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBeUndefined();
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);
  });

  it("seats the secondary successor when the primary is ineligible", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const primary = principal("player.vesper");
    const secondary = principal("player.sable");
    await formOrg(w, founder, holder, primary);
    await run(w, secondary, "ENTER_WORLD");
    w.players[secondary.player_id].handle = "Sable";
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: "org.line",
      agent_id: secondary.player_id,
      role: "member",
    });
    const officeId = await makeOffice(w, founder, holder);
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [primary.player_id, secondary.player_id],
    });
    w.players[primary.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, primary, "COMMIT", {
      operation: "ORG_MEMBER_REMOVE",
      org_id: "org.line",
      agent_id: primary.player_id,
    });
    w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, holder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: officeId });
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBe(secondary.player_id);
  });

  it("does not activate an ineligible successor", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const outsider = principal("player.sable");
    await formOrg(w, founder, holder);
    await run(w, outsider, "ENTER_WORLD");
    const officeId = await makeOffice(w, founder, holder);
    const denied = await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [outsider.player_id],
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");
    w.organizations["org.line"].offices![officeId].succession = {
      successors: [outsider.player_id],
      designated_by: founder.player_id,
      designated_cycle: 0,
    };
    await run(w, holder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: officeId });
    expect(w.organizations["org.line"].offices![officeId].status).toBe("VACANT");
  });

  it("rejects a cross-world successor id", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    await formOrg(w, founder, holder);
    const officeId = await makeOffice(w, founder, holder);
    const denied = await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: ["player.other-world"],
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("NOT_FOUND");
  });

  it("rejects holder self-designation and dissolved orgs", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    await formOrg(w, founder, holder);
    const officeId = await makeOffice(w, founder, holder);
    const holderTry = await run(w, holder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [founder.player_id],
    });
    expect(holderTry.ok).toBe(false);
    expect(holderTry.error?.code).toBe("FORBIDDEN");
    (w.organizations["org.line"] as { status: string }).status = "DISSOLVED";
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const dissolved = await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [holder.player_id],
    });
    expect(dissolved.ok).toBe(false);
    expect(dissolved.error?.code).toBe("NOT_FOUND");
  });

  it("does not fire on LEAVE_WORLD or controller replacement", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const successor = principal("player.sable");
    await formOrg(w, founder, successor, holder);
    const officeId = await makeOffice(w, founder, holder);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [successor.player_id],
    });
    const left = await run(w, holder, "LEAVE_WORLD");
    expect(left.ok).toBe(true);
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBe(holder.player_id);
    holder.controller_id = "ctrl.replaced.oriole";
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBe(holder.player_id);
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);
  });

  it("does not succeed a retired office", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const successor = principal("player.sable");
    await formOrg(w, founder, successor, holder);
    const officeId = await makeOffice(w, founder, holder);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [successor.player_id],
    });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const retired = await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_RETIRE",
      office_id: officeId,
    });
    expect(retired.ok).toBe(true);
    expect(w.organizations["org.line"].offices![officeId].status).toBe("RETIRED");
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBeUndefined();
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);
  });

  it("hands off emergency authority with remaining duration", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const successor = principal("player.sable", "agent");
    await formOrg(w, founder, successor, holder);
    const act = await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: holder.player_id,
    });
    expect(act.ok).toBe(true);
    const scope = w.organizations["org.line"].emergency_scopes![0];
    expect(scope.end_cycle).toBe(EMERGENCY_DURATION);
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      emergency_scope_id: scope.scope_id,
      successors: [successor.player_id],
    });
    w.players[holder.player_id].wait_until_cycle = w.cycle + 1;
    w.players[successor.player_id].wait_until_cycle = w.cycle + 1;
    await run(w, founder, "WAIT");
    expect(w.cycle).toBe(1);
    w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const left = await run(w, holder, "COMMIT", {
      operation: "ORG_MEMBER_REMOVE",
      org_id: "org.line",
      agent_id: holder.player_id,
    });
    expect(left.ok).toBe(true);
    const after = w.organizations["org.line"].emergency_scopes![0];
    expect(after.holder_player_id).toBe(successor.player_id);
    expect(after.end_cycle).toBe(EMERGENCY_DURATION);
    expect(after.capability).toBe("REPAIR");
    expect(after.target_ref).toBe("entity.relay");
    w.players[successor.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const repaired = await run(w, successor, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
      emergency_scope_id: after.scope_id,
    });
    expect(repaired.ok).toBe(true);
  });

  it("does not reset an expired emergency window", async () => {
    const w = world(20);
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    const successor = principal("player.sable");
    await formOrg(w, founder, successor, holder);
    await run(w, founder, "COMMIT", {
      operation: "ORG_EMERGENCY_ACTIVATE",
      org_id: "org.line",
      template_id: "emrule.repair",
      target_ref: "entity.relay",
      agent_id: holder.player_id,
    });
    const scope = w.organizations["org.line"].emergency_scopes![0];
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      emergency_scope_id: scope.scope_id,
      successors: [successor.player_id],
    });
    for (let i = 0; i < EMERGENCY_DURATION; i++) {
      w.players[holder.player_id].wait_until_cycle = w.cycle + 1;
      w.players[successor.player_id].wait_until_cycle = w.cycle + 1;
      await run(w, founder, "WAIT");
    }
    expect(w.organizations["org.line"].emergency_scopes![0].status).toBe("EXPIRED");
    w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, holder, "COMMIT", {
      operation: "ORG_MEMBER_REMOVE",
      org_id: "org.line",
      agent_id: holder.player_id,
    });
    const after = w.organizations["org.line"].emergency_scopes![0];
    expect(after.holder_player_id).toBe(holder.player_id);
    expect(after.end_cycle).toBe(EMERGENCY_DURATION);
    expect(after.status).toBe("EXPIRED");
  });

  it("is idempotent on the same designation key", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const holder = principal("player.oriole");
    await formOrg(w, founder, holder);
    const officeId = await makeOffice(w, founder, holder);
    const first = await run(
      w,
      founder,
      "COMMIT",
      { operation: "ORG_SUCCESSION_DESIGNATE", office_id: officeId, successors: [holder.player_id] },
      "designate-once",
    );
    expect(first.ok).toBe(true);
    const compute = w.players[founder.player_id].budgets.compute;
    const second = await run(
      w,
      founder,
      "COMMIT",
      { operation: "ORG_SUCCESSION_DESIGNATE", office_id: officeId, successors: [holder.player_id] },
      "designate-once",
    );
    expect(second.ok).toBe(true);
    expect(w.players[founder.player_id].budgets.compute).toBe(compute);
    expect(w.organizations["org.line"].offices![officeId].succession?.successors).toEqual([holder.player_id]);
  });

  it("treats a second designate as an explicit rewrite, not a competing claim", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const a = principal("player.oriole");
    const b = principal("player.sable");
    await formOrg(w, founder, a, b);
    const officeId = await makeOffice(w, founder, a);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [a.player_id],
    });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [b.player_id],
    });
    expect(w.organizations["org.line"].offices![officeId].succession?.successors).toEqual([b.player_id]);
  });

  it("grants human and agent successors the same office authority", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const human = principal("player.oriole", "human");
    const agent = principal("player.sable", "agent");
    await formOrg(w, founder, human, agent);
    const officeId = await makeOffice(w, founder, human);
    await run(w, founder, "COMMIT", {
      operation: "ORG_SUCCESSION_DESIGNATE",
      office_id: officeId,
      successors: [agent.player_id],
    });
    w.players[human.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, human, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: officeId });
    expect(w.organizations["org.line"].offices![officeId].holder_player_id).toBe(agent.player_id);
    w.players[agent.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const notice = await run(w, agent, "COMMIT", {
      operation: "ORG_OFFICE_ACT",
      org_id: "org.line",
      notice: "grid holds",
    });
    expect(notice.ok).toBe(true);
  });
});
