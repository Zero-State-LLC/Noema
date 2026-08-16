import { describe, expect, it } from "vitest";
import { BOARD_EXPIRE_AFTER_CYCLES } from "../src/communication";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
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
    world_id: "test.hosted-canonical.gc5-s10",
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
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [],
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

describe("GC5-S10 mapper", () => {
  it("expires after one cycle and stays silent", () => {
    expect(BOARD_EXPIRE_AFTER_CYCLES).toBe(1);
    expect(projectionIdForEvent("MESSAGE", { surface: "BOARD" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBOARD\b/);
    expect(helpText()).not.toMatch(/\bboard\b/i);
  });
});

describe("GC5-S10 world path", () => {
  it("keeps last 5 in the posting cycle, then drops them after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    for (const text of ["One.", "Two.", "Three.", "Four.", "Five.", "Six."]) {
      const posted = await run(w, p, "MESSAGE", { surface: "BOARD", text });
      expect(posted.ok).toBe(true);
    }
    const sixth = await run(w, p, "LOOK");
    expect(sixth.observation?.board_lines).toEqual([
      "A notice on the board: Two.",
      "A notice on the board: Three.",
      "A notice on the board: Four.",
      "A notice on the board: Five.",
      "A notice on the board: Six.",
    ]);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.rooms["room.hub"].board).toBeUndefined();
    expect(JSON.stringify(waited.events || [])).not.toMatch(/MESSAGE_EXPIRED|STRUCTURE_/);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.board_lines || []).toEqual([]);

    const again = await run(w, p, "MESSAGE", { surface: "BOARD", text: "After." });
    expect(again.ok).toBe(true);
    expect(again.observation?.board_lines).toEqual(["A notice on the board: After."]);
  });

  it("rejects hidden-room board", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "MESSAGE", { surface: "BOARD", text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(w.rooms["room.vault"].board).toBeUndefined();
  });
});
