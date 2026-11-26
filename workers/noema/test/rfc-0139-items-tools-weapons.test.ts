import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { fillsActionSlot } from "../src/player-tempo";
import { roomMaterialArchetype, harvestGrade } from "../src/lots";
import { scoreContest } from "../src/contest";
import type { PlayerPrincipal } from "../src/types";

const noopSettle = async () => true;

function principalFor(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "agent-token",
  };
}

function makeItemWorld(id: string): WorldRuntime {
  return {
    world_id: id,
    world_name: "Perihelion Reach",
    world_seed: "seed-rfc0139",
    cycle: 5,
    sequence: 10,
    entry_room_id: "room.foundry-corridor",
    rooms: {
      "room.foundry-corridor": {
        room_id: "room.foundry-corridor",
        name: "Foundry Corridor",
        description: "Heavy ore smelting bays.",
        exits: [{ direction: "east", to_room_id: "room.civic-exchange" }],
        entities: [
          {
            entity_id: "entity.ore-vein-1",
            label: "ore-vein-1",
            entity_type: "RESOURCE_NODE",
            condition: 90,
            stock_resource: "materials",
            stock_amount: 12,
            max_stock: 18,
            regen_rate: 1,
          },
          {
            entity_id: "entity.workshop-test",
            label: "workshop",
            entity_type: "INFRASTRUCTURE",
            infra_type: "workshop",
            condition: 100,
          },
          {
            entity_id: "entity.generator-test",
            label: "generator",
            entity_type: "INFRASTRUCTURE",
            infra_type: "generator",
            condition: 90,
          },
        ],
      },
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        description: "Central barter deck.",
        exits: [{ direction: "west", to_room_id: "room.foundry-corridor" }],
        entities: [],
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

describe("RFC-0139: regional material lots, portable items, tools, rigs, and contest weapons", () => {
  it("maps Perihelion rooms to regional material archetypes and applies plasma_cutter REFINED harvest grade", () => {
    expect(roomMaterialArchetype("room.foundry-corridor")).toBe("FERROUS_ORE");
    expect(roomMaterialArchetype("room.generator-hall")).toBe("SILICA_CELL");
    expect(roomMaterialArchetype("room.civic-exchange")).toBe("SALVAGE_COMPOSITE");
    expect(harvestGrade(40, false)).toBe("WORN");
    expect(harvestGrade(90, false)).toBe("SOUND");
    expect(harvestGrade(90, true)).toBe("REFINED");
  });

  it("crafts arc_welder with auto-equip, enforces non-slot EQUIP/UNEQUIP max 2/cycle, and applies repair bonuses", async () => {
    const w = makeItemWorld("world-rfc0139-1");
    const p = principalFor("artificer");
    await applyWorldCommand(w, p, { request_id: "r-enter", command: "ENTER_WORLD" }, noopSettle);
    const room = w.rooms["room.foundry-corridor"];
    const pl = w.players[p.player_id];
    pl.budgets.energy = 40;
    pl.budgets.compute = 20;
    pl.budgets.storage = 13; // 3 occupied
    pl.material_lots = [
      { material: "FERROUS_ORE", grade: "SOUND", amount: 2 },
      { material: "SILICA_CELL", grade: "SOUND", amount: 1 },
    ];

    expect(fillsActionSlot("COMMIT", "EQUIP")).toBe(false);
    expect(fillsActionSlot("COMMIT", "UNEQUIP")).toBe(false);
    expect(fillsActionSlot("COMMIT", "CRAFT")).toBe(true);

    const craft = await applyWorldCommand(
      w,
      p,
      { request_id: "r-craft", command: "CRAFT", arguments: { recipe_id: "arc_welder" } },
      noopSettle,
    );
    expect(craft.ok).toBe(true);
    const inv = craft.observation?.inventory || [];
    expect(inv.length).toBe(1);
    expect(inv[0].archetype_id).toBe("arc_welder");
    expect(inv[0].equipped_slot).toBe("TOOL_SLOT");
    expect(craft.observation?.equipment?.TOOL_SLOT?.archetype_id).toBe("arc_welder");

    const itemId = inv[0].item_id;
    const u1 = await applyWorldCommand(
      w,
      p,
      { request_id: "r-u1", command: "UNEQUIP", arguments: { item_id: itemId } },
      noopSettle,
    );
    expect(u1.ok).toBe(true);
    const e1 = await applyWorldCommand(
      w,
      p,
      { request_id: "r-e1", command: "EQUIP", arguments: { item_id: itemId } },
      noopSettle,
    );
    expect(e1.ok).toBe(true);
    const u2 = await applyWorldCommand(
      w,
      p,
      { request_id: "r-u2", command: "UNEQUIP", arguments: { item_id: itemId } },
      noopSettle,
    );
    expect(u2.ok).toBe(false);
    expect(u2.error?.code).toBe("FORBIDDEN");

    room.entities.push({
      entity_id: "entity.relay-wear",
      label: "relay-wear",
      entity_type: "INFRASTRUCTURE",
      infra_type: "relay",
      condition: 50,
    });
    pl.budgets.storage = 13;
    pl.material_lots = [{ material: "SALVAGE_COMPOSITE", grade: "SOUND", amount: 2 }];
    const energyBefore = pl.budgets.energy;
    const rep = await applyWorldCommand(
      w,
      p,
      { request_id: "r-rep", command: "COMMIT", arguments: { operation: "REPAIR", entity_id: "entity.relay-wear" } },
      noopSettle,
    );
    expect(rep.ok).toBe(true);
    expect(energyBefore - pl.budgets.energy).toBe(2);
    const relayAfter = room.entities.find((e) => e.entity_id === "entity.relay-wear");
    expect(relayAfter?.condition).toBe(75);
    expect(w.items?.[itemId]?.condition).toBe(96);
  });

  it("refines 2 SOUND lots into 1 REFINED lot and crafts TEMPERED condition 120 items", async () => {
    const w = makeItemWorld("world-rfc0139-2");
    const p = principalFor("refiner");
    await applyWorldCommand(w, p, { request_id: "r-enter", command: "ENTER_WORLD" }, noopSettle);
    const pl = w.players[p.player_id];
    pl.budgets.energy = 50;
    pl.budgets.compute = 30;
    pl.budgets.storage = 10;
    pl.material_lots = [
      { material: "FERROUS_ORE", grade: "SOUND", amount: 4 },
      { material: "SILICA_CELL", grade: "SOUND", amount: 2 },
    ];

    const r1 = await applyWorldCommand(
      w,
      p,
      { request_id: "ref-1", command: "REFINE", arguments: { material: "FERROUS_ORE" } },
      noopSettle,
    );
    const r2 = await applyWorldCommand(
      w,
      p,
      { request_id: "ref-2", command: "REFINE", arguments: { material: "FERROUS_ORE" } },
      noopSettle,
    );
    const r3 = await applyWorldCommand(
      w,
      p,
      { request_id: "ref-3", command: "REFINE", arguments: { material: "SILICA_CELL" } },
      noopSettle,
    );
    expect(r1.ok && r2.ok && r3.ok).toBe(true);

    const craft = await applyWorldCommand(
      w,
      p,
      { request_id: "craft-temp", command: "CRAFT", arguments: { recipe_id: "arc_welder", prefer_refined: true } },
      noopSettle,
    );
    expect(craft.ok).toBe(true);
    const welded = craft.observation?.inventory?.[0];
    expect(welded?.quality).toBe("TEMPERED");
    expect(welded?.condition).toBe(120);
    expect(welded?.max_condition).toBe(120);
  });

  it("handles power_cell discharge -> depleted_cell -> generator RECHARGE lifecycle and cargo_rig move waiver", async () => {
    const w = makeItemWorld("world-rfc0139-3");
    const p = principalFor("hauler");
    await applyWorldCommand(w, p, { request_id: "r-enter", command: "ENTER_WORLD" }, noopSettle);
    const pl = w.players[p.player_id];
    pl.budgets.energy = 20;
    pl.budgets.compute = 20;
    pl.budgets.storage = 10;
    pl.material_lots = [
      { material: "SILICA_CELL", grade: "SOUND", amount: 1 },
      { material: "SALVAGE_COMPOSITE", grade: "SOUND", amount: 3 },
      { material: "FERROUS_ORE", grade: "SOUND", amount: 2 },
    ];

    const cCell = await applyWorldCommand(
      w,
      p,
      { request_id: "c-cell", command: "CRAFT", arguments: { recipe_id: "power_cell" } },
      noopSettle,
    );
    expect(cCell.ok).toBe(true);
    const cellId = cCell.observation?.inventory?.find((i) => i.archetype_id === "power_cell")?.item_id!;
    const eBeforeUse = pl.budgets.energy;
    const used = await applyWorldCommand(
      w,
      p,
      { request_id: "u-cell", command: "USE_ITEM", arguments: { item_id: cellId } },
      noopSettle,
    );
    expect(used.ok).toBe(true);
    expect(pl.budgets.energy).toBe(eBeforeUse + 12);
    expect(w.items?.[cellId]?.archetype).toBe("depleted_cell");

    const rech = await applyWorldCommand(
      w,
      p,
      { request_id: "rc-cell", command: "RECHARGE", arguments: { item_id: cellId } },
      noopSettle,
    );
    expect(rech.ok).toBe(true);
    expect(w.items?.[cellId]?.archetype).toBe("power_cell");
    expect(w.items?.[cellId]?.condition).toBe(100);

    const cRig = await applyWorldCommand(
      w,
      p,
      { request_id: "c-rig", command: "CRAFT", arguments: { recipe_id: "cargo_rig" } },
      noopSettle,
    );
    expect(cRig.ok).toBe(true);
    expect(cRig.observation?.equipment?.RIG_SLOT?.archetype_id).toBe("cargo_rig");
    expect(pl.budgets.storage).toBeGreaterThan(16);

    // Move while carrying cargo with cargo_rig equipped: energy cost is 1 (cargo extra waived)
    const eBeforeMove = pl.budgets.energy;
    const mv = await applyWorldCommand(
      w,
      p,
      { request_id: "mv-1", command: "MOVE", arguments: { direction: "east" } },
      noopSettle,
    );
    expect(mv.ok).toBe(true);
    expect(eBeforeMove - pl.budgets.energy).toBe(1);
  });

  it("scores contest-rules/0.2.1 equipment modifiers in pure integer millipoints", () => {
    const base = scoreContest({
      form: "INFRASTRUCTURE_DISRUPTION",
      declarer_stake: { energy: 10, influence: 6, compute: 2 },
      defender_stake: { energy: 6, influence: 4 },
      infra_condition: 80,
      seed_perturbation: 0,
    });
    const armed = scoreContest({
      form: "INFRASTRUCTURE_DISRUPTION",
      declarer_stake: { energy: 10, influence: 6, compute: 2 },
      defender_stake: { energy: 6, influence: 4 },
      infra_condition: 80,
      attacker_weapon_bonus_mp: 140,
      defender_gear_bonus_mp: 100,
      seed_perturbation: 0,
    });
    expect(armed.score - base.score).toBe(40);
  });
});
