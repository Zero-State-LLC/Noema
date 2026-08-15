import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
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

function world(): WorldRuntime {
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
) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC4-S1 mapper", () => {
  it("parses office create/assign/resign without adding help verbs", () => {
    const created = parseHumanCommand('office create org.x name="Treasurer" profile=PUBLISH_NOTICE');
    expect(created.ok).toBe(true);
    if (created.ok && created.action.verb === "COMMIT") {
      expect(created.action.verb).toBe("COMMIT");
      expect(created.action.arguments.operation).toBe("ORG_OFFICE_CREATE");
    }
    const text = helpText();
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).not.toMatch(/\boffice\b/i);
    expect(text).not.toMatch(/\btreasurer\b/i);
    expect(text).not.toMatch(/\bconstruct\b|\bcontest\b|\battest\b|\bwed\b/i);
  });
});

describe("GC4-S1 world integration", () => {
  it("creates, assigns, acts, resigns, and reassigns the same office", async () => {
    const w = world();
    const a = principal("player.nacre", "human");
    const b = principal("player.vesper", "agent");
    const c = principal("player.oriole", "human");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[b.player_id].handle = "Vesper";
    w.players[c.player_id].handle = "Oriole";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const formed = await run(w, a, "ORG_CREATE", {
      name: "Nacre Compact",
      charter: "local coordination",
    });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: c.player_id, role: "member" });

    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Treasurer",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    expect(created.events?.map((e) => e.event_type)).toContain("ENTITY_CREATE");
    expect(created.events?.some((e) => String(e.event_type).startsWith("ROLE_"))).toBe(false);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");

    const assigned = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: b.player_id,
    });
    expect(assigned.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(b.player_id);

    const acted = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "Ledger open." });
    expect(acted.ok).toBe(true);
    expect(w.organizations[orgId].public_notice).toBe("Ledger open.");

    const look = await run(w, a, "LOOK");
    expect(look.observation?.office_lines?.join(" ")).toMatch(/Treasurer — Vesper/);
    expect(look.observation?.organizations?.[0]?.offices?.[0]?.holder_handle).toBe("Vesper");

    const resigned = await run(w, b, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(resigned.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBeUndefined();

    const former = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "still me" });
    expect(former.ok).toBe(false);
    expect(former.error?.code).toBe("FORBIDDEN");

    const again = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: c.player_id,
    });
    expect(again.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.office_id).toBe(officeId);
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(c.player_id);
    expect(w.organizations[orgId].offices?.[officeId]?.history.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects unauthorized create, double assign, missing player, and retired act", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, a, "ORG_CREATE", { name: "Compact", charter: "work" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });

    const memberCreate = await run(w, b, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Archivist",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(memberCreate.ok).toBe(false);
    expect(memberCreate.error?.code).toBe("FORBIDDEN");

    await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Archivist",
      authority_profile: "PUBLISH_NOTICE",
    });
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: b.player_id });
    const doubled = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: a.player_id,
    });
    expect(doubled.ok).toBe(false);
    expect(doubled.error?.code).toBe("FORBIDDEN");

    const missing = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: "player.ghost",
      replace: true,
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");

    await run(w, a, "ORG_OFFICE_RETIRE", { office_id: officeId });
    const retiredAct = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "no" });
    expect(retiredAct.ok).toBe(false);
    expect(retiredAct.error?.code).toBe("FORBIDDEN");
  });

  it("vacates offices when the holder leaves and does not charge extra TREASURER power", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, a, "ORG_CREATE", { name: "Compact", charter: "work" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });
    await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Envoy",
      authority_profile: "PUBLISH_NOTICE",
    });
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: b.player_id });
    const computeBefore = w.players[b.player_id].budgets.compute;
    const left = await run(w, b, "ORG_MEMBER_REMOVE", {
      org_id: orgId,
      agent_id: b.player_id,
      reason: "SELF_LEAVE",
    });
    expect(left.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(w.players[b.player_id].budgets.compute).toBe(computeBefore - COSTS.ORG_MEMBER_REMOVE.compute!);
    expect(left.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
  });
});
