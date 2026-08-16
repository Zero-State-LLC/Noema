import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc5-s3",
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

describe("GC5-S3 mapper", () => {
  it("parses board notices and keeps help quiet", () => {
    const parsed = parseHumanCommand('board "Relay is down."');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.action).toEqual({
        verb: "MESSAGE",
        arguments: { surface: "BOARD", text: "Relay is down." },
      });
    }
    expect(helpText()).not.toMatch(/\bboard\b/i);
    expect(helpText()).not.toMatch(/\bSHOUT\b/);
    expect(helpText("message")).not.toMatch(/\bboard\b/i);
  });
});

describe("GC5-S3 world path", () => {
  it("posts to a public board, keeps the last 3, and rejects hidden rooms", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const first = await run(w, p, "MESSAGE", { surface: "BOARD", text: "First." });
    expect(first.ok).toBe(true);
    expect(first.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(first.observation?.board_lines).toContain("A notice on the board: First.");
    await run(w, p, "MESSAGE", { surface: "BOARD", text: "Second." });
    await run(w, p, "MESSAGE", { surface: "BOARD", text: "Third." });
    const fourth = await run(w, p, "MESSAGE", { surface: "BOARD", text: "Fourth." });
    expect(fourth.ok).toBe(true);
    const lines = fourth.observation?.board_lines || [];
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("A notice on the board: Second.");
    expect(lines[2]).toBe("A notice on the board: Fourth.");
    expect(JSON.stringify(fourth.events || [])).not.toContain("MESSAGE_DELIVERED");

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
