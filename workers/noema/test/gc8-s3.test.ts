import { describe, expect, it } from "vitest";
import { spoilWornLots } from "../src/lots";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
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

function world(condition: number): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc8-s3",
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
            entity_id: "entity.cell",
            label: "storage-cell",
            entity_type: "RESOURCE",
            condition,
            stock_resource: "energy",
            stock_amount: 8,
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

describe("GC8-S3 mapper", () => {
  it("spoils WORN by 1, keeps SOUND, and clears an exhausted stack", () => {
    const worn = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 5 });
    const sound = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 5 });
    const exhaust = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 1 });
    const wornOut = spoilWornLots({ energy: "WORN" }, worn);
    expect(wornOut.losses).toEqual([{ resource: "energy", amount: 1 }]);
    expect(worn.energy).toBe(4);
    expect(wornOut.grades.energy).toBe("WORN");
    expect(wornOut.lines).toContain("Your worn energy spoiled.");
    const soundOut = spoilWornLots({ energy: "SOUND" }, sound);
    expect(soundOut.losses).toEqual([]);
    expect(sound.energy).toBe(5);
    const gone = spoilWornLots({ energy: "WORN" }, exhaust, {
      energy: { room_id: "room.hub", room_name: "Hub", producer_id: "player.nacre" },
    });
    expect(exhaust.energy).toBe(0);
    expect(gone.grades.energy).toBeUndefined();
    expect(gone.origins.energy).toBeUndefined();
    expect(helpText()).not.toMatch(/\bcurrency\b/i);
  });
});

describe("GC8-S3 world path", () => {
  it("spoils WORN energy on WAIT cycle commit and leaves SOUND alone", async () => {
    const wornWorld = world(40);
    const soundWorld = world(70);
    const p = principal("player.nacre");
    await run(wornWorld, p, "ENTER_WORLD");
    wornWorld.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const harvested = await run(wornWorld, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(wornWorld.players[p.player_id].lot_grades?.energy).toBe("WORN");
    const before = wornWorld.players[p.player_id].budgets.energy;
    const waited = await run(wornWorld, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(wornWorld.cycle).toBe(1);
    expect(wornWorld.players[p.player_id].budgets.energy).toBe(before - 1);
    expect(waited.observation?.lot_lines).toContain("Your worn energy spoiled.");
    expect(waited.events?.some((e) => e.event_type === "BUDGET_CONSUMED" && e.payload?.reason === "SPOILAGE")).toBe(
      true,
    );

    const q = principal("player.vesper");
    await run(soundWorld, q, "ENTER_WORLD");
    soundWorld.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const soundHarvest = await run(soundWorld, q, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(soundHarvest.ok).toBe(true);
    expect(soundWorld.players[q.player_id].lot_grades?.energy).toBe("SOUND");
    const soundBefore = soundWorld.players[q.player_id].budgets.energy;
    const soundWait = await run(soundWorld, q, "WAIT");
    expect(soundWait.ok).toBe(true);
    expect(soundWorld.players[q.player_id].budgets.energy).toBe(soundBefore);
    expect(soundWait.observation?.lot_lines || []).not.toContain("Your worn energy spoiled.");
  });
});
