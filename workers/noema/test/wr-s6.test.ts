import { describe, expect, it } from "vitest";
import { WORLD_REPORT_CATALOG_ID } from "../src/world-reports";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.wr-s6",
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
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "Relay 7",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          },
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    agreements: {},
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

describe("WR-S6 mapper", () => {
  it("extends S5 and keeps NEWS and AGREEMENT off help", () => {
    expect(WORLD_REPORT_CATALOG_ID).toBe("world-report-catalog/wr-s6");
    expect(helpText()).not.toMatch(/\bNEWS\b/);
    expect(helpText()).not.toMatch(/\bAGREEMENT\b/);
  });
});

describe("WR-S6 world path", () => {
  it("lists active public agreements after five WAITs and omits offered, broken, and parties", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.agreements = {
      "agreement.live": {
        agreement_id: "agreement.live",
        agreement_type: "TRADE",
        party_ids: ["player.nacre", "player.vesper"],
        status: "ACTIVE",
        offered_by: "player.nacre",
        cost_payer_id: "player.nacre",
        visibility: "PUBLIC",
        formed_cycle: 0,
      },
      "agreement.offer": {
        agreement_id: "agreement.offer",
        agreement_type: "TRADE",
        party_ids: ["player.nacre", "player.other"],
        status: "OFFERED",
        offered_by: "player.nacre",
        cost_payer_id: "player.nacre",
        visibility: "PUBLIC",
      },
      "agreement.dead": {
        agreement_id: "agreement.dead",
        agreement_type: "TRADE",
        party_ids: ["player.nacre", "player.gone"],
        status: "BROKEN",
        offered_by: "player.nacre",
        cost_payer_id: "player.nacre",
        visibility: "PUBLIC",
      },
    };

    for (let i = 0; i < 4; i++) {
      expect((await run(w, p, "WAIT")).ok).toBe(true);
    }
    expect((await run(w, p, "LOOK")).observation?.report_lines || []).toEqual([]);

    const fifth = await run(w, p, "WAIT");
    expect(fifth.ok).toBe(true);
    const lines = fifth.observation?.report_lines || [];
    expect(lines).toContain("trade is agreed.");
    expect(lines.filter((l) => l === "trade is agreed.")).toHaveLength(1);
    expect(lines.join(" ")).not.toMatch(/vesper/i);
    expect(JSON.stringify(fifth.events || [])).not.toMatch(/REPORT_/);
  });
});
