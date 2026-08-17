import { describe, expect, it } from "vitest";
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

/** Genesis-shaped public rooms: hub relay + harvestable cache + a neighbor. */
function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.first-entry",
    world_name: "Perihelion Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Relay Quarter",
        description: "Entry.",
        exits: [{ direction: "east", to_room_id: "room.transit-ring" }],
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "Relay 7",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          },
        ],
      },
      "room.transit-ring": {
        room_id: "room.transit-ring",
        name: "Transit Ring",
        description: "Route.",
        exits: [
          { direction: "west", to_room_id: "room.relay-quarter" },
          { direction: "north", to_room_id: "room.civic-exchange" },
        ],
        entities: [],
      },
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        description: "Trade.",
        exits: [{ direction: "south", to_room_id: "room.transit-ring" }],
        entities: [
          {
            entity_id: "entity.storage-cell-cache",
            label: "Storage Cell Cache",
            entity_type: "INFRASTRUCTURE",
            condition: 60,
          },
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("first-entry inhabit", () => {
  it("enters, acts, and sees a world report after five waits", async () => {
    expect(helpText()).toMatch(/\bBUILD\b/);
    const w = world();
    const p = principal("player.nacre");
    const entered = await run(w, p, "ENTER_WORLD");
    expect(entered.ok).toBe(true);
    expect(entered.observation?.location?.room_id).toBe("room.relay-quarter");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const looked = await run(w, p, "LOOK");
    expect(looked.ok).toBe(true);
    expect(looked.observation?.location?.name).toMatch(/Relay/);

    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    await run(w, p, "MOVE", { direction: "west" });

    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(inspected.ok).toBe(true);

    w.players[p.player_id].room_id = "room.civic-exchange";
    const harvested = await run(w, p, "HARVEST", { entity_id: "entity.storage-cell-cache", amount: 1 });
    expect(harvested.ok).toBe(true);

    w.players[p.player_id].room_id = "room.relay-quarter";
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const repaired = await run(w, p, "REPAIR", { entity_id: "entity.relay-7" });
    expect(repaired.ok).toBe(true);

    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    for (let i = 0; i < 5; i++) {
      expect((await run(w, p, "WAIT")).ok).toBe(true);
    }
    expect(w.cycle).toBe(5);
    const look = await run(w, p, "LOOK");
    expect((look.observation?.report_lines || []).some((l) => /condition \d+\./.test(l))).toBe(true);
  });
});
