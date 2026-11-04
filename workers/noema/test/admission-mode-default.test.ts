/**
 * #766: hosted structured dispatch is the default admission mode of the world
 * reducer; developer text tooling runs only on an explicit `admission: "developer"`.
 * Local reducer evidence only.
 */
import { describe, expect, it } from "vitest";
import { admitTempoAction, pinPlayerTempo } from "../src/player-tempo";
import { applyWorldCommand, runPinnedTempoResolve, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const SENTINEL = "PRIVATE_ADMISSION_DEFAULT_SENTINEL";
const CLOCK = 1_700_000_000_000;

const agent: PlayerPrincipal = {
  player_id: "player.agent",
  agent_id: "agent.agent",
  session_id: "sess.test",
  controller_id: "ctrl.agent.agent",
  controller_type: "agent",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1",
  authentication_context: "test",
};

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.admission-default",
    world_name: "Admission Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.a",
    rooms: {
      "room.a": {
        room_id: "room.a",
        name: "Room A",
        description: "The start.",
        exits: [{ direction: "east", to_room_id: "room.b" }],
        entities: [],
      },
      "room.b": {
        room_id: "room.b",
        name: "Room B",
        description: "The far side.",
        exits: [{ direction: "west", to_room_id: "room.a" }],
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

async function enter(w: WorldRuntime): Promise<void> {
  const envl: CommandEnvelope = { request_id: "enter", idempotency_key: "enter", command: "ENTER_WORLD" };
  expect((await applyWorldCommand(w, agent, envl, async () => true)).ok).toBe(true);
}

describe("admission mode default (#766)", () => {
  it("dispatches a structured JOIN canonically despite a colliding retained alias when no admission mode is given", async () => {
    const w = world();
    await enter(w);
    const aliases = { join: `do look; wait ${SENTINEL}` };
    w.players[agent.player_id].command_aliases = { ...aliases };
    const envl: CommandEnvelope = { request_id: "adm.join", idempotency_key: "adm.join", command: "JOIN" };
    const result = await applyWorldCommand(w, agent, envl, async () => true);
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
    expect(result.request_id).toBe("adm.join");
    expect(result.ok).toBe(true);
    expect(w.players[agent.player_id].command_aliases).toEqual(aliases);
  });

  it("resolves a pinned structured MOVE canonically under a colliding alias when runPinnedTempoResolve gets no admission mode", async () => {
    const w = world();
    await enter(w);
    w.players[agent.player_id].command_aliases = { move: `do look; wait ${SENTINEL}` };
    expect(pinPlayerTempo(w, { mode: "FAST_TEST", now: CLOCK, reason: "admission default" }).ok).toBe(true);
    const envelope: CommandEnvelope = {
      request_id: "adm.move",
      idempotency_key: "adm.move",
      command: "MOVE",
      arguments: { direction: "east" },
    };
    const admitted = admitTempoAction(w, { principal: agent, envelope, verb: "MOVE", now: CLOCK, worldPaused: false });
    expect(admitted.ok).toBe(true);
    const resolved = await runPinnedTempoResolve(w, async () => true, CLOCK);
    expect(resolved.ok).toBe(true);
    expect(JSON.stringify(resolved)).not.toContain(SENTINEL);
    expect(w.players[agent.player_id].room_id).toBe("room.b");
  });

  it("expands a retained alias only when admission is explicitly developer", async () => {
    const w = world();
    await enter(w);
    w.players[agent.player_id].command_aliases = { join: `do look; wait ${SENTINEL}` };
    const envl: CommandEnvelope = { request_id: "adm.dev", idempotency_key: "adm.dev", command: "JOIN" };
    const result = await applyWorldCommand(w, agent, envl, async () => true, { admission: "developer" });
    expect(result.request_id).toMatch(/^adm\.dev\.m/);
  });
});
