import { describe, expect, it } from "vitest";
import {
  ENGINEER_LATENT_LINE,
  ENGINEER_TRACK,
  applyPracticeCredits,
  emptyPractice,
  isTrackLatent,
  practiceLines,
  repairConditionDelta,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC1-S3 isolated mastery decay.
 * Authority: Noema-Specs docs/GC1-S3-DECAY.md / RFC-0043.
 */

function recognizedEngineer() {
  return applyPracticeCredits(emptyPractice(), [
    { track_id: ENGINEER_TRACK, unit: "e1", recognition_unit: "entity.relay-a" },
    { track_id: ENGINEER_TRACK, unit: "e2", recognition_unit: "entity.relay-b" },
    { track_id: ENGINEER_TRACK, unit: "e3", recognition_unit: "entity.relay-c" },
  ], 0);
}

function principal(id: string) {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  } as PlayerPrincipal;
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc1-s3",
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
          enrichEntity({
            entity_id: "entity.relay-b",
            label: "east-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          }),
          enrichEntity({
            entity_id: "entity.relay-c",
            label: "west-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          }),
          enrichEntity({
            entity_id: "entity.relay-d",
            label: "south-relay",
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

async function recognize(w: WorldRuntime, p: PlayerPrincipal) {
  await run(w, p, "ENTER_WORLD");
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[p.player_id].budgets.energy = 80;
  w.players[p.player_id].budgets.storage = 8;
  for (const id of ["entity.relay-a", "entity.relay-b", "entity.relay-c"]) {
    expect((await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: id })).ok).toBe(true);
  }
}

describe("GC1-S3 mapper", () => {
  it("idle 12 LATENT withholds quality_bonus; idle 11 stays +20", () => {
    const p = recognizedEngineer();
    expect(isTrackLatent(p, ENGINEER_TRACK, 11)).toBe(false);
    expect(repairConditionDelta(p, "entity.relay-a", 11)).toEqual({ delta: 20, bonus: 5 });
    expect(isTrackLatent(p, ENGINEER_TRACK, 12)).toBe(true);
    expect(repairConditionDelta(p, "entity.relay-a", 12)).toEqual({ delta: 15, bonus: 0 });
    expect(practiceLines(p, 12)).toContain(ENGINEER_LATENT_LINE);
    expect(practiceLines(p, 12)).not.toContain("You are known for keeping infrastructure alive.");
  });

  it("restores MAINTAINED after 3 rehab works; does not wipe recognition", () => {
    let p = recognizedEngineer();
    p = applyPracticeCredits(p, [{ track_id: ENGINEER_TRACK, unit: "r1", recognition_unit: "entity.relay-a" }], 12);
    p = applyPracticeCredits(p, [{ track_id: ENGINEER_TRACK, unit: "r2", recognition_unit: "entity.relay-b" }], 12);
    expect(isTrackLatent(p, ENGINEER_TRACK, 12)).toBe(true);
    expect(repairConditionDelta(p, "entity.relay-a", 12)).toEqual({ delta: 15, bonus: 0 });
    p = applyPracticeCredits(p, [{ track_id: ENGINEER_TRACK, unit: "r3", recognition_unit: "entity.relay-c" }], 12);
    expect(isTrackLatent(p, ENGINEER_TRACK, 12)).toBe(false);
    expect(repairConditionDelta(p, "entity.relay-a", 12)).toEqual({ delta: 20, bonus: 5 });
    expect(p.recognition?.[ENGINEER_TRACK]).toEqual([
      "entity.relay-a",
      "entity.relay-b",
      "entity.relay-c",
    ]);
  });
});

describe("GC1-S3 world path", () => {
  it("idle 12 REPAIR stays +15 and PLAY says You were known for keeping infrastructure alive.", async () => {
    const w = world();
    const p = principal("player.nacre");
    await recognize(w, p);
    w.cycle = 12;
    const look = await run(w, p, "LOOK");
    expect(look.observation?.practice_lines).toContain(ENGINEER_LATENT_LINE);
    expect(JSON.stringify(look.observation || {})).not.toMatch(/Engineer|WATCH title/i);
    const before = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition;
    const repaired = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(repaired.ok).toBe(true);
    expect(repaired.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(false);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition).toBe((before ?? 0) + 15);
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });

  it("idle 11 still grants same-asset +20", async () => {
    const w = world();
    const p = principal("player.nacre");
    await recognize(w, p);
    w.cycle = 11;
    const before = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition;
    const repaired = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(repaired.ok).toBe(true);
    expect(repaired.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition).toBe((before ?? 0) + 20);
  });

  it("three rehab repairs restore +20 on the next known-asset repair", async () => {
    const w = world();
    const p = principal("player.nacre");
    await recognize(w, p);
    w.cycle = 12;
    for (const id of ["entity.relay-a", "entity.relay-b", "entity.relay-c"]) {
      const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: id });
      expect(r.ok).toBe(true);
      expect(r.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(false);
    }
    const before = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition;
    const restored = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(restored.ok).toBe(true);
    expect(restored.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")!.condition).toBe((before ?? 0) + 20);
  });
});
