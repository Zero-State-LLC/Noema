import { describe, expect, it } from "vitest";
import {
  EXPLORER_TRACK,
  LATENT_AFTER_CYCLES,
  SURVEYOR_TRACK,
  applyPracticeCredits,
  emptyPractice,
  publicTitleLine,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
import { buildWatchLive } from "../src/watch-live";
import { toPlayerView } from "../src/presentation/player-view";
import { renderPlayersHereHtml } from "../src/play-ui";
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

function recognize(track: typeof SURVEYOR_TRACK | typeof EXPLORER_TRACK, n: number) {
  const units = Array.from({ length: n }, (_, i) => `${track}.${i}`);
  return applyPracticeCredits(
    emptyPractice(),
    units.map((unit) => ({ track_id: track, unit, recognition_unit: unit })),
    0,
  );
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc1-s6",
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

describe("GC1-S6 mapper", () => {
  it("publishes one third-person line and withholds LATENT / unnamed handles", () => {
    const recognized = recognize(SURVEYOR_TRACK, 5);
    expect(publicTitleLine("sable", recognized, 0)).toBe("sable is known for survey work.");
    expect(publicTitleLine("sable", recognized, LATENT_AFTER_CYCLES)).toBeUndefined();
    expect(publicTitleLine("player.sable", recognized, 0)).toBeUndefined();
    expect(publicTitleLine("sable", emptyPractice(), 0)).toBeUndefined();
    expect(publicTitleLine("sable", recognize(EXPLORER_TRACK, 5), 0)).toBe("sable knows these rooms.");
    const both = applyPracticeCredits(recognize(EXPLORER_TRACK, 5), [
      ...Array.from({ length: 5 }, (_, i) => ({
        track_id: SURVEYOR_TRACK,
        unit: `survey.${i}`,
        recognition_unit: `survey.${i}`,
      })),
    ], 0);
    expect(publicTitleLine("sable", both, 0)).toBe("sable knows these rooms.");
  });
});

describe("GC1-S6 world path", () => {
  it("shows one public title to another Player in a public room", async () => {
    const w = world();
    const a = principal("player.sable");
    const b = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    for (const p of [a, b]) w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].practice = recognize(SURVEYOR_TRACK, 5);

    const lookB = await run(w, b, "LOOK");
    const here = lookB.observation?.players_here || [];
    const sable = here.find((p) => p.player_id === a.player_id);
    expect(sable?.public_practice_lines).toEqual(["sable is known for survey work."]);
    expect(lookB.observation?.practice_lines || []).not.toContain("sable is known for survey work.");
    expect(lookB.observation?.practice_lines || []).not.toContain("You are known for survey work.");

    const lookA = await run(w, a, "LOOK");
    expect(lookA.observation?.practice_lines).toContain("You are known for survey work.");
    expect(lookA.observation?.players_here?.find((p) => p.player_id === b.player_id)?.public_practice_lines).toBeUndefined();

    const view = toPlayerView(lookB.observation || null);
    expect(view.status.filter((r) => r.label === "Here").map((r) => r.value)).toContain(
      "sable is known for survey work.",
    );
    expect(renderPlayersHereHtml(lookB.observation?.players_here)).toMatch(/sable is known for survey work/);
    expect(JSON.stringify(lookB.observation || {})).not.toMatch(/XP|track\.surveyor|SPECIALIZATION/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });

  it("withholds LATENT and hidden-room titles", async () => {
    const w = world();
    const a = principal("player.sable");
    const b = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].practice = recognize(SURVEYOR_TRACK, 5);
    w.cycle = LATENT_AFTER_CYCLES;

    const latentLook = await run(w, b, "LOOK");
    expect(latentLook.observation?.players_here?.find((p) => p.player_id === a.player_id)?.public_practice_lines).toBeUndefined();
    expect(latentLook.observation?.practice_lines || []).not.toContain("You were known for survey work.");

    w.cycle = 0;
    w.players[a.player_id].room_id = "room.vault";
    w.players[b.player_id].room_id = "room.vault";
    const hiddenLook = await run(w, b, "LOOK");
    expect(hiddenLook.observation?.players_here?.find((p) => p.player_id === a.player_id)?.public_practice_lines).toBeUndefined();
  });
});

describe("GC1-S6 WATCH", () => {
  it("projects the same public line only while the Player is in a public room", () => {
    const practice = recognize(SURVEYOR_TRACK, 5);
    const publicSnap = buildWatchLive({
      world_id: "test.hosted-canonical.gc1-s6",
      cycle: 0,
      sequence: 4,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Hub",
          description: "Grid.",
          exits: [],
          entities: [],
        },
        "room.vault": {
          room_id: "room.vault",
          name: "Vault",
          description: "Sealed.",
          hidden: true,
          exits: [],
          entities: [],
        },
      },
      players: [
        {
          player_id: "player.sable",
          handle: "sable",
          room_id: "room.hub",
          entered: true,
          last_seen_ms: 1_700_000_000_000,
          actor_kind: "live",
          practice,
        },
      ],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(publicSnap.public_title_lines).toEqual(["sable is known for survey work."]);
    const hub = (publicSnap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.hub");
    expect(hub?.public_title_lines).toEqual(["sable is known for survey work."]);
    expect(JSON.stringify(publicSnap.recent_events || [])).not.toMatch(/survey work/);

    const hiddenSnap = buildWatchLive({
      world_id: "test.hosted-canonical.gc1-s6",
      cycle: 0,
      sequence: 5,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Hub",
          description: "Grid.",
          exits: [],
          entities: [],
        },
        "room.vault": {
          room_id: "room.vault",
          name: "Vault",
          description: "Sealed.",
          hidden: true,
          exits: [],
          entities: [],
        },
      },
      players: [
        {
          player_id: "player.sable",
          handle: "sable",
          room_id: "room.vault",
          entered: true,
          last_seen_ms: 1_700_000_000_000,
          actor_kind: "live",
          practice,
        },
      ],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(hiddenSnap.public_title_lines).toBeUndefined();
  });
});
