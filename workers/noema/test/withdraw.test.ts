import { describe, expect, it } from "vitest";
import { helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { creditsFromDangerEvent } from "../src/social-memory";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${controller_type}.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

const STAKE = { energy: 12, influence: 8, compute: 4 };

describe("GC7-S1 mapper", () => {
  it("parses withdraw without advertising it or HP", () => {
    const parsed = parseHumanCommand("withdraw contest.0001");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.action.arguments.operation).toBe("CONTEST_WITHDRAW");
    const text = helpText();
    expect(text).not.toMatch(/\bwithdraw\b|\bcontest\b|\bretreat\b|\bHP\b/i);
  });
});

describe("GC7-S1 world integration", () => {
  it("lets the declarer withdraw: stake consumed, defender released, no MOVE, no danger", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre", "human");
    const b = principal("player.vesper", "agent");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    const defended = await run(w, b, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: { energy: 10, influence: 14, compute: 4 },
    });
    expect(defended.ok).toBe(true);
    const energyA = w.players[a.player_id].budgets.energy;
    const energyB = w.players[b.player_id].budgets.energy;
    const roomA = w.players[a.player_id].room_id;
    const withdrawn = await run(w, a, "CONTEST_WITHDRAW", { contest_id: contestId });
    expect(withdrawn.ok).toBe(true);
    const resolved = withdrawn.events?.find((e) => e.event_type === "CONTEST_RESOLVED");
    expect(resolved?.payload?.outcome).toBe("ABORTED");
    expect(w.contests?.[contestId]?.status).toBe("CLOSED");
    expect(w.players[a.player_id].budgets.energy).toBe(energyA);
    expect(w.players[b.player_id].budgets.energy).toBe(energyB + 10);
    expect(w.players[a.player_id].room_id).toBe(roomA);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(70);
    expect(creditsFromDangerEvent(resolved as never)).toEqual([]);
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    expect(JSON.stringify(look.observation?.contests || [])).not.toMatch(/hidden|hp|coward/i);
  });

  it("rejects nonparticipant, settled, stale, and duplicate withdraw", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.oriole");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    const bystander = await run(w, c, "CONTEST_WITHDRAW", { contest_id: contestId });
    expect(bystander.ok).toBe(false);
    expect(bystander.error?.code).toBe("FORBIDDEN");
    const first = await run(w, a, "CONTEST_WITHDRAW", { contest_id: contestId }, "idem.wd.1");
    expect(first.ok).toBe(true);
    const replay = await run(w, a, "CONTEST_WITHDRAW", { contest_id: contestId }, "idem.wd.1");
    expect(replay.ok).toBe(true);
    const energyAfter = w.players[a.player_id].budgets.energy;
    const second = await run(w, a, "CONTEST_WITHDRAW", { contest_id: contestId });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("NOT_FOUND");
    expect(w.players[a.player_id].budgets.energy).toBe(energyAfter);
    const stale = await run(w, a, "CONTEST_WITHDRAW", {
      contest_id: contestId,
      expected_status: "OPEN",
    });
    expect(stale.ok).toBe(false);
    expect(stale.error?.code).toBe("STALE_HEAD");
    const missing = await run(w, a, "CONTEST_WITHDRAW", { contest_id: "contest.other-world" });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");
  });

  it("treats defender withdraw as SUCCESS for the declarer without HP", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre", "agent");
    const b = principal("player.vesper", "human");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
    });
    const contestId = Object.keys(w.contests || {})[0];
    await run(w, b, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: { energy: 10, influence: 14, compute: 4 },
    });
    const energyB = w.players[b.player_id].budgets.energy;
    const left = await run(w, b, "CONTEST_WITHDRAW", { contest_id: contestId });
    expect(left.ok).toBe(true);
    const resolved = left.events?.find((e) => e.event_type === "CONTEST_RESOLVED");
    expect(resolved?.payload?.outcome).toBe("SUCCESS");
    expect(w.players[b.player_id].budgets.energy).toBe(energyB);
    expect(w.rooms["room.hub"].entities[0].condition).toBeLessThan(70);
    expect(JSON.stringify(left.events)).not.toMatch(/HIT|DAMAGE|DEATH|HP/i);
  });
});
