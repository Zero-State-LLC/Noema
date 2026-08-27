import { describe, expect, it } from "vitest";
import { CONSTRUCT_COSTS, parseConstructibleClass } from "../src/construction";
import { scoreContest } from "../src/contest";
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
    world_id: "test.hosted-canonical.gc2-s3",
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

const SCORE_INPUT = {
  form: "INFRASTRUCTURE_DISRUPTION" as const,
  declarer_stake: { energy: 12, influence: 8, compute: 4 },
  defender_stake: { energy: 10, influence: 14, compute: 4 },
  infra_condition: 70,
  seed_perturbation: 17,
};

describe("GC2-S3 mapper", () => {
  it("parses defensive_work and adds 50 defense without changing S0 arithmetic", () => {
    expect(parseConstructibleClass("defensive_work")).toBe("defensive_work");
    expect(parseConstructibleClass("defensive work")).toBe("defensive_work");
    const plain = scoreContest(SCORE_INPUT);
    expect(plain.score).toBe(-38);
    const walled = scoreContest({ ...SCORE_INPUT, defensive_work: true });
    expect(walled.score).toBe(-88);
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
    expect(helpText()).not.toMatch(/\bWED\b|\bATTEST\b/);
  });
});

describe("GC2-S3 world path", () => {
  it("opens a defensive_work and rejects hidden construct", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].budgets.storage = 16 - (CONSTRUCT_COSTS.defensive_work.storage || 0);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/defensive work is under construction/i);
    expect(w.rooms["room.hub"].entities[0].infra_type).toBe("defensive_work");

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].budgets.storage = 16 - (CONSTRUCT_COSTS.defensive_work.storage || 0);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
