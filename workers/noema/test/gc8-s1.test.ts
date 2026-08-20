import { describe, expect, it } from "vitest";
import { CONSTRUCT_COSTS } from "../src/construction";
import {
  constructStorageCost,
  harvestGrade,
  mixGrade,
} from "../src/lots";
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
    world_id: "test.hosted-canonical.gc8-s1",
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

describe("GC8-S1 mapper", () => {
  it("grades harvest and adds WORN construct storage", () => {
    expect(harvestGrade(40)).toBe("WORN");
    expect(harvestGrade(50)).toBe("SOUND");
    expect(harvestGrade(70)).toBe("SOUND");
    expect(mixGrade(5, "SOUND", 1, "WORN")).toBe("WORN");
    expect(constructStorageCost(4, "WORN")).toBe(5);
    expect(constructStorageCost(4, "SOUND")).toBe(4);
    expect(helpText()).not.toMatch(/\bcurrency\b/i);
  });
});

describe("GC8-S1 world path", () => {
  it("harvests WORN from a damaged node and SOUND from a sound node", async () => {
    const wornWorld = world(40);
    const soundWorld = world(70);
    const p = principal("player.nacre");
    await run(wornWorld, p, "ENTER_WORLD");
    wornWorld.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const worn = await run(wornWorld, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(worn.ok).toBe(true);
    expect(wornWorld.players[p.player_id].lot_grades?.energy).toBe("WORN");
    expect(worn.events?.some((e) => e.event_type === "RESOURCE_TRANSFER" && e.payload?.grade === "WORN")).toBe(
      true,
    );
    // WATCH §5: only real harvests may be narrated "Harvest at <site>".
    expect(
      worn.events?.some((e) => e.event_type === "RESOURCE_TRANSFER" && e.payload?.kind === "harvest"),
    ).toBe(true);
    expect(worn.observation?.lot_lines).toContain("Your energy is worn.");

    const q = principal("player.vesper");
    await run(soundWorld, q, "ENTER_WORLD");
    soundWorld.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const sound = await run(soundWorld, q, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(sound.ok).toBe(true);
    expect(soundWorld.players[q.player_id].lot_grades?.energy).toBe("SOUND");
  });

  it("charges +1 storage when constructing with WORN storage", async () => {
    const w = world(70);
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].lot_grades = { storage: "WORN" };
    const wornNeed = constructStorageCost(CONSTRUCT_COSTS.relay.storage || 0, "WORN");
    w.players[p.player_id].budgets.storage = 16 - wornNeed;
    const before = w.players[p.player_id].budgets.storage;
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(built.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(before + wornNeed);
    expect(w.players[p.player_id].lot_grades?.storage).toBeUndefined();
  });
});
