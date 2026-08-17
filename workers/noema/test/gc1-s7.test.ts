import { describe, expect, it } from "vitest";
import {
  LATENT_AFTER_CYCLES,
  SURVEYOR_TRACK,
  applyPracticeCredits,
  emptyPractice,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc1-s7",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "down", to_room_id: "room.vault" }],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Vault",
        description: "Sealed.",
        hidden: true,
        tags: ["hidden"],
        exits: [{ direction: "up", to_room_id: "room.hub" }],
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

describe("GC1-S7 mapper", () => {
  it("parses focus tracks and names FOCUS on help without WED/ATTEST", () => {
    const parsed = parseHumanCommand("focus surveyor");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("FOCUS");
      expect(parsed.action.arguments.track).toBe("surveyor");
    }
    expect(helpText()).toMatch(/\bFOCUS\b/);
    expect(helpText("focus")).toMatch(/focus explorer\|surveyor\|broker\|engineer/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
    expect(helpText("focus")).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});

describe("GC1-S7 world path", () => {
  it("declares one focus, shows it to others, and withholds when LATENT or hidden", async () => {
    const w = world();
    const a = principal("player.sable");
    const b = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    for (const p of [a, b]) w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const set = await run(w, a, "FOCUS", { track: "surveyor" });
    expect(set.ok).toBe(true);
    expect(set.observation?.focus_lines).toEqual(["You are focusing on survey work."]);
    expect(JSON.stringify(set.events || [])).not.toMatch(/FOCUS_DECLARED/);

    const lookB = await run(w, b, "LOOK");
    expect(lookB.observation?.players_here?.find((p) => p.player_id === a.player_id)?.public_focus_lines).toEqual([
      "sable is focusing on survey work.",
    ]);

    const units = Array.from({ length: 5 }, (_, i) => ({
      track_id: SURVEYOR_TRACK,
      unit: `e.${i}`,
      recognition_unit: `e.${i}`,
    }));
    w.players[a.player_id].practice = applyPracticeCredits(emptyPractice(), units, 0);
    w.cycle = LATENT_AFTER_CYCLES;
    const latentLook = await run(w, b, "LOOK");
    expect(
      latentLook.observation?.players_here?.find((p) => p.player_id === a.player_id)?.public_focus_lines,
    ).toBeUndefined();

    w.cycle = 0;
    w.players[a.player_id].room_id = "room.vault";
    w.players[b.player_id].room_id = "room.vault";
    const hiddenLook = await run(w, b, "LOOK");
    expect(
      hiddenLook.observation?.players_here?.find((p) => p.player_id === a.player_id)?.public_focus_lines,
    ).toBeUndefined();

    w.players[a.player_id].room_id = "room.hub";
    const watch = buildWatchLive({
      world_id: w.world_id,
      cycle: 0,
      sequence: 2,
      rooms: {
        "room.hub": { room_id: "room.hub", name: "Hub", description: "Grid.", exits: [], entities: [] },
      },
      players: [
        {
          player_id: a.player_id,
          handle: "sable",
          room_id: "room.hub",
          entered: true,
          last_seen_ms: 1_700_000_000_000,
          actor_kind: "live",
          practice: emptyPractice(),
          focus: { track: "surveyor", declared_cycle: 0 },
        },
      ],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(watch.public_focus_lines).toEqual(["sable is focusing on survey work."]);

    const cleared = await run(w, a, "FOCUS", { clear: true });
    expect(cleared.ok).toBe(true);
    expect(cleared.observation?.focus_lines || []).toEqual([]);
  });
});
