import { describe, expect, it } from "vitest";
import { normalizeStructuredCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { miniChamberState, MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID } from "../src/mini-chamber";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id = "player.hermes"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id.replace(/^player\./, "")}`,
    session_id: "sess.rfc0120-dt",
    controller_id: `ctrl.agent.${id.replace(/^player\./, "")}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "controller_token",
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("RFC-0120 P12 Deep Time traces", () => {
  it("there is no TRACE verb", () => {
    const parsed = normalizeStructuredCommand("TRACE", {});
    expect(parsed.ok).toBe(false);
    expect(parsed.code).toBe("UNKNOWN_COMMAND");
  });

  it("an Agent Player MOVE is a durable public ledger event", async () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-dt");
    const p = agent();
    await run(w, p, "ENTER_WORLD");
    const moved = await run(w, p, "MOVE", { target_id: "east" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.location?.room_id).toBe(MINI_HALL_ROOM_ID);
    const trace = moved.events?.find((e) => e.event_type === "MOVE");
    expect(trace).toBeTruthy();
    expect(trace?.payload?.player_id).toBe(p.player_id);
    expect(trace?.payload?.from).toBe(MINI_ENTRY_ROOM_ID);
    expect(trace?.payload?.to).toBe(MINI_HALL_ROOM_ID);
    expect(moved.observation?.available_actions).not.toContain("TRACE");
  });

  it("WATCH does not carry inhabitant consequence or inbox as Deep Time", () => {
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-dt-watch",
      cycle: 2,
      sequence: 8,
      rooms: {
        [MINI_HALL_ROOM_ID]: {
          room_id: MINI_HALL_ROOM_ID,
          name: "Hall",
          description: "A short public corridor.",
          exits: [{ direction: "west", to_room_id: MINI_ENTRY_ROOM_ID }],
          entities: [],
        },
      },
      players: [{ player_id: "player.hermes", handle: "hermes", room_id: MINI_HALL_ROOM_ID, entered: true }],
      events: [
        {
          event_type: "MOVE",
          sequence: 8,
          cycle: 2,
          player_id: "player.hermes",
          payload: { player_id: "player.hermes", from: MINI_ENTRY_ROOM_ID, to: MINI_HALL_ROOM_ID, direction: "east" },
        },
      ],
      now: 1_700_000_000_000,
    });
    const blob = JSON.stringify(snap);
    expect(blob).not.toMatch(/"messages"/);
    expect(blob).not.toMatch(/TRACE/);
    expect(snap).not.toHaveProperty("practice_lines");
  });
});
