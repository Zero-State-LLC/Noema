import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { RULE_MEMBER_ORDER, WATCH_SUCCESSION_PULSE, parseSuccessionRuleId } from "../src/succession";
import { projectionIdForEvent } from "../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc4-s6",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [],
        entities: [],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC4-S6 mapper", () => {
  it("parses succession rule and keeps help quiet", () => {
    const parsed = parseHumanCommand("succession rule office.x member_order");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("ORG_SUCCESSION_RULE");
      expect(parsed.action.arguments.rule_id).toBe("member_order");
    }
    expect(parseSuccessionRuleId("member-order")).toBe(RULE_MEMBER_ORDER);
    expect(parseSuccessionRuleId("OLDEST")).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "RULE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bmember_order\b/i);
    expect(helpText("org")).not.toMatch(/\bmember_order\b/i);
  });
});

describe("GC4-S6 world path", () => {
  it("publishes MEMBER_ORDER and seats the next remaining member on vacate", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const sable = principal("player.sable");
    await run(w, founder, "ENTER_WORLD");
    await run(w, sable, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[sable.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: sable.player_id, role: "member" });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const created = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Notice",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    const assigned = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: founder.player_id,
    });
    expect(assigned.ok).toBe(true);
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const unknown = await run(w, founder, "ORG_SUCCESSION_RULE", {
      office_id: officeId,
      rule_id: "OLDEST",
    });
    expect(unknown.ok).toBe(false);
    expect(unknown.error?.code).toBe("INVALID_REQUEST");

    const published = await run(w, founder, "ORG_SUCCESSION_RULE", {
      office_id: officeId,
      rule_id: "MEMBER_ORDER",
    });
    expect(published.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.succession?.rule_id).toBe(RULE_MEMBER_ORDER);
    expect(w.organizations[orgId].offices?.[officeId]?.succession?.successors).toBeUndefined();
    expect(published.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);

    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const vacated = await run(w, founder, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(vacated.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("OCCUPIED");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(sable.player_id);
    expect(w.institution_pulses).toContain(WATCH_SUCCESSION_PULSE);
    expect(vacated.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);
  });

  it("leaves a sole-member office vacant when the holder resigns", async () => {
    const w = world();
    const founder = principal("player.nacre");
    await run(w, founder, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_CREATE", { name: "Solo", charter: "Keep" });
    const orgId = Object.keys(w.organizations)[0];
    const created = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Notice",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: founder.player_id });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_SUCCESSION_RULE", { office_id: officeId, rule_id: "MEMBER_ORDER" });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const vacated = await run(w, founder, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(vacated.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBeUndefined();
  });
});
