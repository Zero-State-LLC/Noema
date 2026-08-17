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
    world_id: "test.hosted-canonical.wr-s2",
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
        entities: [],
        hidden: true,
        tags: ["hidden"],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
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

describe("WR-S2 mapper", () => {
  it("extends S1 and keeps CONTEST off help", () => {
    expect(WORLD_REPORT_CATALOG_ID).toBe("world-report-catalog/wr-s2");
    expect(helpText()).not.toMatch(/\bCONTEST\b/);
    expect(helpText()).not.toMatch(/\bNEWS\b/);
  });
});

describe("WR-S2 world path", () => {
  it("lists public OPEN contests after five WAITs and omits hidden rooms", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.contests = {
      "contest.public": {
        contest_id: "contest.public",
        declarer_id: p.player_id,
        contest_form: "INFRASTRUCTURE_DISRUPTION",
        target: { kind: "ENTITY", entity_id: "entity.relay-7" },
        room_id: "room.hub",
        stake: {},
        defender_stake: {},
        expires_cycle: 99,
        seed_stream_id: "stream.wr-s2",
        status: "OPEN",
      },
      "contest.hidden": {
        contest_id: "contest.hidden",
        declarer_id: p.player_id,
        contest_form: "PRESENCE_PRESSURE",
        target: { kind: "AGENT", agent_id: p.player_id },
        room_id: "room.vault",
        stake: {},
        defender_stake: {},
        expires_cycle: 99,
        seed_stream_id: "stream.wr-s2-h",
        status: "OPEN",
      },
    };

    for (let i = 0; i < 4; i++) {
      expect((await run(w, p, "WAIT")).ok).toBe(true);
    }
    expect((await run(w, p, "LOOK")).observation?.report_lines || []).toEqual([]);

    const fifth = await run(w, p, "WAIT");
    expect(fifth.ok).toBe(true);
    const lines = fifth.observation?.report_lines || [];
    expect(lines).toContain("infrastructure disruption is contested.");
    expect(lines.join(" ")).not.toMatch(/presence pressure/);
    expect(JSON.stringify(fifth.events || [])).not.toMatch(/REPORT_/);
  });
});
