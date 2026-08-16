import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { RULE_INHERITED, WATCH_SUCCESSION_PULSE, parseSuccessionRuleId } from "../src/succession";
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
    world_id: "test.hosted-canonical.gc4-s7",
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

describe("GC4-S7 mapper", () => {
  it("parses inherited rule and keeps help quiet", () => {
    const parsed = parseHumanCommand("succession rule office.x inherited");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("ORG_SUCCESSION_RULE");
      expect(parsed.action.arguments.rule_id).toBe("inherited");
    }
    expect(parseSuccessionRuleId("inherited")).toBe(RULE_INHERITED);
    expect(parseSuccessionRuleId("inherited_by_organization")).toBe(RULE_INHERITED);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "RULE" })).toBeNull();
    expect(helpText()).not.toMatch(/\binherited\b/i);
    expect(helpText("org")).not.toMatch(/\binherited\b/i);
  });
});

describe("GC4-S7 world path", () => {
  it("publishes inherit-by-org so vacate stays vacant and unretired", async () => {
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
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: founder.player_id });
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const published = await run(w, founder, "ORG_SUCCESSION_RULE", {
      office_id: officeId,
      rule_id: "INHERITED_BY_ORGANIZATION",
    });
    expect(published.ok).toBe(true);
    expect(published.observation?.consequence).toMatch(/organization keeps/i);
    expect(w.organizations[orgId].offices?.[officeId]?.succession?.rule_id).toBe(RULE_INHERITED);
    expect(published.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);

    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const vacated = await run(w, founder, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(vacated.ok).toBe(true);
    const office = w.organizations[orgId].offices?.[officeId];
    expect(office?.status).toBe("VACANT");
    expect(office?.holder_player_id).toBeUndefined();
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);
    expect(vacated.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);

    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const assigned = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: sable.player_id,
    });
    expect(assigned.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("OCCUPIED");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(sable.player_id);
  });
});
