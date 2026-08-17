import { describe, expect, it } from "vitest";
import { WORLD_REPORT_CATALOG_ID } from "../src/world-reports";
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
    world_id: "test.hosted-canonical.wr-s3",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.civic" }],
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "Relay 7",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          },
        ],
      },
      "room.civic": {
        room_id: "room.civic",
        name: "Civic",
        description: "Trade.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
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
    access_restrictions: [],
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

describe("WR-S3 mapper", () => {
  it("extends S2 and keeps NEWS off help", () => {
    expect(WORLD_REPORT_CATALOG_ID).toBe("world-report-catalog/wr-s3");
    expect(helpText()).not.toMatch(/\bNEWS\b/);
    expect(helpText()).not.toMatch(/ACCESS_POLICY/);
  });
});

describe("WR-S3 world path", () => {
  it("lists live public restrictions after five WAITs and omits hidden and expired", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.access_restrictions = [
      {
        restriction_id: "restr.public",
        scope: "EXIT",
        mode: "DENY",
        applies_to: "*",
        room_id: "room.hub",
        exit_id: "east",
        expires_cycle: 99,
      },
      {
        restriction_id: "restr.hidden",
        scope: "ROOM",
        mode: "DENY",
        applies_to: "*",
        room_id: "room.vault",
        expires_cycle: 99,
      },
      {
        restriction_id: "restr.expired",
        scope: "EXIT",
        mode: "DENY",
        applies_to: "*",
        room_id: "room.civic",
        exit_id: "west",
        expires_cycle: 1,
      },
      {
        restriction_id: "restr.room-public",
        scope: "ROOM",
        mode: "DENY",
        applies_to: "*",
        room_id: "room.civic",
        expires_cycle: 99,
      },
    ];

    for (let i = 0; i < 4; i++) {
      expect((await run(w, p, "WAIT")).ok).toBe(true);
    }
    expect((await run(w, p, "LOOK")).observation?.report_lines || []).toEqual([]);

    const fifth = await run(w, p, "WAIT");
    expect(fifth.ok).toBe(true);
    const lines = fifth.observation?.report_lines || [];
    expect(lines).toContain("Hub east is restricted.");
    expect(lines).toContain("Civic is restricted.");
    expect(lines.join(" ")).not.toMatch(/Hidden Vault/);
    expect(lines.join(" ")).not.toMatch(/Civic west/);
    expect(JSON.stringify(fifth.events || [])).not.toMatch(/REPORT_/);
  });
});
