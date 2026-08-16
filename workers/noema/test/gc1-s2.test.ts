import { describe, expect, it } from "vitest";
import {
  applyPracticeCredits,
  emptyPractice,
  hasRepairedEntity,
  isRecognizedEngineer,
  repairConditionDelta,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { emptyTreasury } from "../src/offices";
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
    world_id: "test.hosted-canonical.gc1-s2",
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

describe("GC1-S2 mapper", () => {
  it("gives +20 only when recognized and the asset was already repaired by this player", () => {
    let p = emptyPractice();
    expect(repairConditionDelta(p, "entity.relay-a")).toEqual({ delta: 15, bonus: 0 });
    p = applyPracticeCredits(p, [
      { track_id: "track.engineer.01", unit: "e1", recognition_unit: "entity.relay-a" },
      { track_id: "track.engineer.01", unit: "e2", recognition_unit: "entity.relay-b" },
      { track_id: "track.engineer.01", unit: "e3", recognition_unit: "entity.relay-c" },
    ]);
    expect(isRecognizedEngineer(p)).toBe(true);
    expect(hasRepairedEntity(p, "entity.relay-a")).toBe(true);
    expect(repairConditionDelta(p, "entity.relay-a")).toEqual({ delta: 20, bonus: 5 });
    expect(repairConditionDelta(p, "entity.relay-d")).toEqual({ delta: 15, bonus: 0 });
  });
});

describe("GC1-S2 world path", () => {
  it("fourth repair on a new asset stays +15; repeat on a known asset is +20", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.energy = 40;
    w.players[a.player_id].budgets.storage = 20;
    for (const id of ["entity.relay-a", "entity.relay-b", "entity.relay-c"]) {
      const r = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: id });
      expect(r.ok).toBe(true);
      const e = w.rooms["room.hub"].entities.find((x) => x.entity_id === id)!;
      expect(e.condition).toBe(55);
    }
    const look = await run(w, a, "LOOK");
    expect(look.observation?.practice_lines).toContain("You are known for keeping infrastructure alive.");
    const lookB = await run(w, b, "LOOK");
    expect(lookB.observation?.practice_lines || []).not.toContain(
      "You are known for keeping infrastructure alive.",
    );

    const firstNew = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-d" });
    expect(firstNew.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((x) => x.entity_id === "entity.relay-d")!.condition).toBe(55);
    expect(firstNew.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(false);

    const repeat = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(repeat.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((x) => x.entity_id === "entity.relay-a")!.condition).toBe(75);
    expect(repeat.events?.some((e) => e.payload?.quality_bonus === 5)).toBe(true);
    expect(repeat.observation?.consequence).toMatch(/practiced hands/i);
  });

  it("acting_for uses the holder's repair history", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const tech = principal("player.vesper");
    await run(w, founder, "ENTER_WORLD");
    await run(w, tech, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[tech.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[tech.player_id].budgets.energy = 40;
    w.players[tech.player_id].budgets.storage = 20;
    for (const id of ["entity.relay-a", "entity.relay-b", "entity.relay-c"]) {
      expect((await run(w, tech, "COMMIT", { operation: "REPAIR", entity_id: id })).ok).toBe(true);
    }
    await run(w, founder, "COMMIT", {
      operation: "ORG_CREATE",
      name: "Line",
      charter: "grid",
      org_id: "org.line",
    });
    await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: "org.line",
      agent_id: tech.player_id,
      role: "member",
    });
    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_CREATE",
      org_id: "org.line",
      display_name: "Custodian",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    const officeId = Object.keys(w.organizations["org.line"].offices || {})[0];
    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_ASSIGN",
      office_id: officeId,
      agent_id: tech.player_id,
    });
    w.organizations["org.line"].treasury = {
      ...emptyTreasury(),
      energy: 20,
      compute: 20,
      storage: 10,
    };
    const before = w.rooms["room.hub"].entities.find((x) => x.entity_id === "entity.relay-a")!.condition;
    const officeRepair = await run(w, tech, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-a",
      acting_for: "org.line",
      office_id: officeId,
    });
    expect(officeRepair.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((x) => x.entity_id === "entity.relay-a")!.condition).toBe(
      (before ?? 0) + 20,
    );
  });
});
