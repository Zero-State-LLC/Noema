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

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc5-s5",
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

describe("GC5-S5 mapper", () => {
  it("keeps help quiet", () => {
    expect(helpText()).not.toMatch(/\bboard\b/i);
    expect(helpText()).not.toMatch(/\bSHOUT\b/);
    expect(helpText("message")).not.toMatch(/\bboard\b/i);
  });
});

describe("GC5-S5 world path", () => {
  it("keeps the last 5 public notices, leaves shout last-1, and rejects hidden rooms", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    for (const text of ["One.", "Two.", "Three.", "Four.", "Five."]) {
      const posted = await run(w, p, "MESSAGE", { surface: "BOARD", text });
      expect(posted.ok).toBe(true);
    }
    const sixth = await run(w, p, "MESSAGE", { surface: "BOARD", text: "Six." });
    expect(sixth.ok).toBe(true);
    const lines = sixth.observation?.board_lines || [];
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe("A notice on the board: Two.");
    expect(lines[4]).toBe("A notice on the board: Six.");
    expect(JSON.stringify(sixth.events || [])).not.toContain("MESSAGE_DELIVERED");

    const shoutA = await run(w, p, "MESSAGE", { surface: "SHOUT", text: "First shout." });
    expect(shoutA.ok).toBe(true);
    const shoutB = await run(w, p, "MESSAGE", { surface: "SHOUT", text: "Second shout." });
    expect(shoutB.observation?.shout_lines).toEqual(["A shout: Second shout."]);

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "MESSAGE", { surface: "BOARD", text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(hidden.rooms["room.vault"].board).toBeUndefined();
  });
});
