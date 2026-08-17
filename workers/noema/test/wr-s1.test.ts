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
    world_id: "test.hosted-canonical.wr-s1",
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
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [
          {
            entity_id: "entity.hidden-relay",
            label: "Hidden Relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          },
        ],
        hidden: true,
        tags: ["hidden"],
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

describe("WR-S1 mapper", () => {
  it("extends S0 and stays silent", () => {
    expect(WORLD_REPORT_CATALOG_ID).toBe("world-report-catalog/wr-s1");
    expect(helpText()).not.toMatch(/\bNEWS\b/);
  });
});

describe("WR-S1 world path", () => {
  it("lists ACTIVE orgs with public infra after five WAITs", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const formed = await run(w, p, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
    expect(formed.ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    for (let i = 0; i < 4; i++) {
      expect((await run(w, p, "WAIT")).ok).toBe(true);
    }
    expect((await run(w, p, "LOOK")).observation?.report_lines || []).toEqual([]);

    const fifth = await run(w, p, "WAIT");
    expect(fifth.ok).toBe(true);
    const lines = fifth.observation?.report_lines || [];
    expect(lines.some((l) => /Relay 7 condition \d+\./.test(l))).toBe(true);
    expect(lines).toContain("Nacre Compact stands.");
    expect(lines.join(" ")).not.toMatch(/Hidden Relay/);
    expect(JSON.stringify(fifth.events || [])).not.toMatch(/REPORT_/);
  });
});
