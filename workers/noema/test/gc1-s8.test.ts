import { describe, expect, it } from "vitest";
import {
  ENGINEER_TRACK,
  applyPracticeCredits,
  canOverhaul,
  emptyPractice,
  isTrackLatent,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, parseHumanCommand } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function recognizedEngineer() {
  return applyPracticeCredits(
    emptyPractice(),
    [
      { track_id: ENGINEER_TRACK, unit: "e1", recognition_unit: "entity.relay-a" },
      { track_id: ENGINEER_TRACK, unit: "e2", recognition_unit: "entity.relay-b" },
      { track_id: ENGINEER_TRACK, unit: "e3", recognition_unit: "entity.relay-c" },
    ],
    0,
  );
}

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
    world_id: "test.hosted-canonical.gc1-s8",
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
          enrichEntity({
            entity_id: "entity.relay-a",
            label: "north-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          }),
        ],
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

describe("GC1-S8 mapper", () => {
  it("parses overhaul and names it on help repair without WED/ATTEST", () => {
    const parsed = parseHumanCommand("repair north-relay overhaul", {
      entities: [
        enrichEntity({
          entity_id: "entity.relay-a",
          label: "north-relay",
          entity_type: "INFRASTRUCTURE",
          condition: 40,
        }),
      ],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("REPAIR");
      expect(parsed.action.arguments.extent).toBe("overhaul");
    }
    expect(helpText("repair")).toMatch(/overhaul/);
    expect(helpText("repair")).not.toMatch(/\bATTEST\b|\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });

  it("locks overhaul unless recognized maintained engineer", () => {
    expect(canOverhaul(emptyPractice(), 0)).toBe(false);
    const rec = recognizedEngineer();
    expect(canOverhaul(rec, 0)).toBe(true);
    expect(isTrackLatent(rec, ENGINEER_TRACK, 13)).toBe(true);
    expect(canOverhaul(rec, 13)).toBe(false);
  });
});

describe("GC1-S8 world path", () => {
  it("standard REPAIR stays +15 for anyone; overhaul needs practiced Engineer", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.energy = 20;
    w.players[a.player_id].budgets.storage = 15;

    const locked = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-a",
      extent: "overhaul",
    });
    expect(locked.ok).toBe(false);
    expect(locked.error?.code).toBe("FORBIDDEN");
    expect(w.rooms["room.hub"].entities[0].condition).toBe(40);

    const ordinary = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(ordinary.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(55);
  });

  it("recognized Engineer overhaul costs +1 energy and adds +5 condition", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.energy = 20;
    w.players[a.player_id].budgets.storage = 15;
    w.players[a.player_id].practice = recognizedEngineer();

    const energyBefore = w.players[a.player_id].budgets.energy;
    const over = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-a",
      extent: "overhaul",
    });
    expect(over.ok).toBe(true);
    expect(over.observation?.consequence).toMatch(/You overhaul North Relay/);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(65);
    expect(energyBefore - w.players[a.player_id].budgets.energy).toBe(4);
  });

  it("LATENT and empty budget reject overhaul", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    w.cycle = 13;
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].practice = recognizedEngineer();

    const latent = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-a",
      extent: "overhaul",
    });
    expect(latent.ok).toBe(false);
    expect(latent.error?.code).toBe("FORBIDDEN");

    w.cycle = 0;
    w.players[a.player_id].budgets.energy = 0;
    const broke = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-a",
      extent: "overhaul",
    });
    expect(broke.ok).toBe(false);
    expect(broke.error?.code).toBe("BUDGET_EXCEEDED");
  });
});
