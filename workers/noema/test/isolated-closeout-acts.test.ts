import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.isolated-closeout",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.isolated-closeout",
    world_name: "Isolated Closeout",
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
        exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
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
    request_id: `r.${command}`,
    idempotency_key: `i.${command}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("isolated closeout residual — agent INSPECT then MOVE", () => {
  it("an agent ENTER LOOK INSPECT MOVE without touching Perihelion", async () => {
    const w = world();
    const p = agent("player.isolated-lyra");
    const entered = await run(w, p, "ENTER_WORLD");
    expect(entered.ok).toBe(true);
    expect(entered.observation?.location?.room_id).toBe("room.relay-quarter");

    const looked = await run(w, p, "LOOK");
    expect(looked.ok).toBe(true);

    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(inspected.ok).toBe(true);
    expect(inspected.events?.map((e) => e.event_type)).toEqual(
      expect.arrayContaining(["INSPECT", "OBSERVATION_GENERATED"]),
    );
    expect(inspected.observation?.location?.room_id).toBe("room.relay-quarter");

    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(moved.events?.map((e) => e.event_type)).toContain("MOVE");
    expect(moved.observation?.location?.room_id).toBe("room.transit-ring");
    expect(w.world_id).toBe("test.hosted-canonical.isolated-closeout");
  });
});
