import { describe, expect, it } from "vitest";
import { TRADE_NOTICE_EXPIRE_AFTER_CYCLES } from "../src/communication";
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
    world_id: "test.hosted-canonical.gc5-s13",
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

describe("GC5-S13 mapper", () => {
  it("expires after one cycle and stays silent", () => {
    expect(TRADE_NOTICE_EXPIRE_AFTER_CYCLES).toBe(1);
    expect(projectionIdForEvent("MESSAGE", { surface: "TRADE_NOTICE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bmarket\b/i);
    expect(helpText()).not.toMatch(/\bTRADE_NOTICE\b/);
    expect(helpText("trade")).not.toMatch(/\bmarket\b/i);
    expect(helpText("message")).not.toMatch(/\bmarket\b/i);
  });
});

describe("GC5-S13 world path", () => {
  it("keeps last 1 in the posting cycle, then drops it after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const first = await run(w, p, "MESSAGE", { surface: "TRADE_NOTICE", text: "First." });
    expect(first.ok).toBe(true);
    expect(first.observation?.trade_notice_lines).toEqual(["A trade notice: First."]);
    expect(Object.keys(w.trades)).toHaveLength(0);
    const second = await run(w, p, "MESSAGE", { surface: "TRADE_NOTICE", text: "Second." });
    expect(second.ok).toBe(true);
    expect(second.observation?.trade_notice_lines).toEqual(["A trade notice: Second."]);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.rooms["room.hub"].trade_notice).toBeUndefined();
    expect(JSON.stringify(waited.events || [])).not.toMatch(/MESSAGE_EXPIRED|TRADE_/);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.trade_notice_lines || []).toEqual([]);
    expect(Object.keys(w.trades)).toHaveLength(0);

    const again = await run(w, p, "MESSAGE", { surface: "TRADE_NOTICE", text: "After." });
    expect(again.ok).toBe(true);
    expect(again.observation?.trade_notice_lines).toEqual(["A trade notice: After."]);
  });

  it("rejects hidden-room stall", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "MESSAGE", { surface: "TRADE_NOTICE", text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(w.rooms["room.vault"].trade_notice).toBeUndefined();
  });
});
