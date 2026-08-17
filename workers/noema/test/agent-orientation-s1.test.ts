import { describe, expect, it } from "vitest";
import { situationFromLive } from "../src/orientation";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import { buildWatchLive } from "../src/watch-live";
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
    world_id: "test.hosted-canonical.agent-orient-s1",
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
      "room.works": {
        room_id: "room.works",
        name: "Grid Anchor",
        description: "A scarred relay floor.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-a",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 37,
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("AGENT-ORIENTATION-S1 mapper", () => {
  it("places the room name and withholds strain when quiet", () => {
    expect(situationFromLive({ name: "Hub", condition: "Open ground — routes lead outward." })).toEqual({
      place: "Hub",
    });
    expect(situationFromLive({ name: "" })).toBeUndefined();
  });

  it("restates live damage and never publishes a thesis", () => {
    expect(
      situationFromLive({
        name: "Grid Anchor",
        condition: "Infrastructure shows damage. Trade structures are nearby.",
        entities: [{ label: "scarred-conduit", condition: 37 }],
      }),
    ).toEqual({
      place: "Grid Anchor",
      strain: "Infrastructure shows damage.",
    });
    expect(
      situationFromLive({
        name: "Hub",
        condition: "The point of the game is to keep the relay alive.",
      }),
    ).toEqual({ place: "Hub" });
  });
});

describe("AGENT-ORIENTATION-S1 world path", () => {
  it("attaches situation on LOOK and omits strain in a quiet room", async () => {
    const w = world();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.situation).toEqual({ place: "Hub" });
    expect(look.observation?.situation?.strain).toBeUndefined();
    expect(JSON.stringify(look.observation || {})).not.toMatch(/point of the game|you should |being tested/i);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });

  it("attaches strain from a damaged room and keeps it off WATCH", async () => {
    const w = world();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].room_id = "room.works";
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.situation?.place).toBe("Grid Anchor");
    expect(look.observation?.situation?.strain).toMatch(/damage|condition 37/i);
    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: 0,
      sequence: 1,
      rooms: {
        "room.works": {
          room_id: "room.works",
          name: "Grid Anchor",
          description: "A scarred relay floor.",
          exits: [],
          entities: [],
        },
      },
      players: [],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(snap).not.toHaveProperty("situation");
    expect(JSON.stringify(snap)).not.toMatch(/"situation"/);
  });
});
