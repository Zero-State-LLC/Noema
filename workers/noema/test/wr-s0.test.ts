import { describe, expect, it } from "vitest";
import { REPORT_EVERY_CYCLES, shouldWriteWorldReport } from "../src/world-reports";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
import { statusFromObservation } from "../src/play-ui";
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
    world_id: "test.hosted-canonical.wr-s0",
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
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "Relay 7",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          },
        ],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [
          {
            entity_id: "entity.hidden-relay",
            label: "Hidden Relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          },
        ],
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

describe("WR-S0 mapper", () => {
  it("rebuilds every five cycles and stays silent", () => {
    expect(REPORT_EVERY_CYCLES).toBe(5);
    expect(shouldWriteWorldReport(0)).toBe(false);
    expect(shouldWriteWorldReport(4)).toBe(false);
    expect(shouldWriteWorldReport(5)).toBe(true);
    expect(projectionIdForEvent("MESSAGE", { surface: "REPORT" })).toBeNull();
    expect(helpText()).not.toMatch(/\bnews\b/i);
    expect(helpText()).not.toMatch(/\bREPORT\b/);
  });
});

describe("WR-S0 world path", () => {
  it("writes last-1 public infra lines after five WAITs and omits hidden rooms", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    for (let i = 0; i < 4; i++) {
      const waited = await run(w, p, "WAIT");
      expect(waited.ok).toBe(true);
    }
    expect(w.cycle).toBe(4);
    expect(w.last_report).toBeUndefined();
    const early = await run(w, p, "LOOK");
    expect(early.observation?.report_lines || []).toEqual([]);

    const fifth = await run(w, p, "WAIT");
    expect(fifth.ok).toBe(true);
    expect(w.cycle).toBe(5);
    const live = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-7");
    const expected = `Relay 7 condition ${live?.condition}.`;
    expect(w.last_report?.lines).toEqual([expected]);
    expect(JSON.stringify(fifth.events || [])).not.toMatch(/REPORT_/);
    expect(fifth.observation?.report_lines).toEqual([expected]);
    const rows = statusFromObservation(fifth.observation ?? null);
    expect(rows.some((r) => r.label === "World" && r.value === expected)).toBe(true);
    expect((fifth.observation?.report_lines || []).join(" ")).not.toMatch(/Hidden Relay/);

    const look = await run(w, p, "LOOK");
    expect(look.observation?.report_lines).toEqual([expected]);
  });
});
