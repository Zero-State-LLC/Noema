import { describe, expect, it } from "vitest";
import { allPresentWaiting, commitCycleIfReady, presentPlayerIds } from "../src/world-time";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { helpText } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * RFC-0019 hosted WAIT-quorum cycle commit.
 * Does not thaw contest or WED.
 */

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

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
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

describe("RFC-0019 mapper", () => {
  const now = 2_000_000_000_000;

  it("treats empty present set as no commit", () => {
    expect(presentPlayerIds({}, now)).toEqual([]);
    expect(allPresentWaiting({}, 0, now)).toBe(false);
    expect(commitCycleIfReady({ cycle: 0, players: {} }, now)).toBe(false);
  });

  it("ignores idle entered Players", () => {
    const players = {
      "player.nacre": {
        entered: true,
        last_seen_ms: now - 40 * 60 * 1000,
        wait_until_cycle: 1,
      },
      "player.vesper": { entered: true, last_seen_ms: now, wait_until_cycle: 1 },
    };
    expect(presentPlayerIds(players, now)).toEqual(["player.vesper"]);
    expect(allPresentWaiting(players, 0, now)).toBe(true);
  });
});

describe("RFC-0019 WAIT quorum", () => {
  it("solo WAIT commits exactly one cycle", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const before = w.cycle;
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.cycle).toBe(before + 1);
    expect(w.players[p.player_id].wait_until_cycle).toBe(before + 1);
    expect(r.events?.map((e) => e.event_type)).toEqual(["WAIT"]);
    expect(r.events?.[0]?.payload?.cycle_committed).toBe(true);
    expect(r.events?.[0]?.payload?.world_cycle).toBe(before + 1);
    expect(r.events?.some((e) => /^WED_|CONTEST_|CYCLE_/.test(e.event_type))).toBe(false);
  });

  it("second present WAIT commits; first does not", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const first = await run(w, a, "WAIT");
    expect(w.cycle).toBe(0);
    expect(first.events?.[0]?.payload?.cycle_committed).toBe(false);
    const second = await run(w, b, "WAIT");
    expect(second.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(second.events?.[0]?.payload?.cycle_committed).toBe(true);
  });

  it("LOOK does not commit; help omits contest and WED", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const look = await run(w, p, "LOOK");
    expect(look.ok).toBe(true);
    expect(w.cycle).toBe(0);
    expect(helpText()).not.toMatch(/\bcontest\b/i);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText()).not.toMatch(/cycle commit/i);
  });
});
