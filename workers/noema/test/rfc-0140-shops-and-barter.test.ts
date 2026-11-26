import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { TREASURY_CONSTRUCT_CLASSES } from "../src/actions";
import { CONSTRUCTIBLE_CLASSES, CONSTRUCT_COSTS } from "../src/construction";
import { selectMatchingItem } from "../src/shops";
import type { PortableItem } from "../src/items";
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

function makeShopWorld(): WorldRuntime {
  return {
    world_id: "world-rfc0140-test",
    world_name: "Perihelion Reach",
    world_seed: "seed-rfc0140",
    cycle: 10,
    sequence: 20,
    entry_room_id: "room.civic-exchange",
    rooms: {
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        description: "Central trading plaza.",
        exits: [],
        entities: [
          {
            entity_id: "entity.salvage-cache",
            label: "salvage-cache",
            entity_type: "RESOURCE_NODE",
            condition: 80,
            stock_resource: "materials",
            stock_amount: 8,
            max_stock: 18,
            regen_rate: 1,
          },
          {
            entity_id: "entity.workshop-1",
            label: "workshop",
            entity_type: "INFRASTRUCTURE",
            infra_type: "workshop",
            condition: 100,
          },
          {
            entity_id: "entity.barter-stall-1",
            label: "barter-stall",
            entity_type: "INFRASTRUCTURE",
            infra_type: "barter_stall",
            condition: 100,
            owner_id: "player.shopkeep",
          },
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

describe("RFC-0140: barter_stall storefronts, full-reserve atomic barter, WS01 tape, and WS02 supersession", () => {
  it("registers barter_stall as 9th constructible class and allows treasury construction", () => {
    expect(CONSTRUCTIBLE_CLASSES).toContain("barter_stall");
    expect(CONSTRUCT_COSTS.barter_stall).toEqual({ energy: 6, compute: 3, storage: 4, influence: 2 });
    expect(TREASURY_CONSTRUCT_CLASSES.has("barter_stall")).toBe(true);
  });

  it("enforces deterministic ItemPredicate selection: unequipped -> lowest condition -> entity_id", () => {
    const items: PortableItem[] = [
      {
        item_id: "item.b",
        archetype: "arc_welder",
        label: "Arc Welder",
        category: "TOOL",
        equip_slot: "TOOL_SLOT",
        equipped_slot: "TOOL_SLOT",
        quality: "STANDARD",
        condition: 40,
        max_condition: 100,
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: "player.a" },
        owner_id: "player.a",
        creator_id: "player.a",
        forged_cycle: 1,
      },
      {
        item_id: "item.c",
        archetype: "arc_welder",
        label: "Arc Welder",
        category: "TOOL",
        equip_slot: "TOOL_SLOT",
        quality: "STANDARD",
        condition: 75,
        max_condition: 100,
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: "player.a" },
        owner_id: "player.a",
        creator_id: "player.a",
        forged_cycle: 1,
      },
      {
        item_id: "item.a",
        archetype: "arc_welder",
        label: "Arc Welder",
        category: "TOOL",
        equip_slot: "TOOL_SLOT",
        quality: "STANDARD",
        condition: 75,
        max_condition: 100,
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: "player.a" },
        owner_id: "player.a",
        creator_id: "player.a",
        forged_cycle: 1,
      },
    ];
    const picked = selectMatchingItem(items, { archetype: "arc_welder", min_condition: 30 });
    expect(picked?.item_id).toBe("item.a"); // unequipped beats equipped, tie broken lexicographically
  });

  it("executes WS02 cold-start swap while no stocked stall exists, then transitions WS02 to SUPERSEDED once a stall lists", async () => {
    const w = makeShopWorld();
    const keep = principalFor("shopkeep");
    const buyer = principalFor("buyer");
    await applyWorldCommand(w, keep, { request_id: "e1", command: "ENTER_WORLD" }, noopSettle);
    await applyWorldCommand(w, buyer, { request_id: "e2", command: "ENTER_WORLD" }, noopSettle);

    const pBuyer = w.players[buyer.player_id];
    pBuyer.budgets.energy = 20;
    pBuyer.budgets.storage = 11; // 5 cargo in hold
    pBuyer.material_lots = [{ material: "SALVAGE_COMPOSITE", grade: "SOUND", amount: 5 }];

    // Before stall has any open listing, WS02 is AVAILABLE and emergency_ration_charge succeeds
    const lookBefore = await applyWorldCommand(w, buyer, { request_id: "l1", command: "LOOK" }, noopSettle);
    const ws02Before = lookBefore.observation?.services?.find((s) => s.service_id === "service.quartermaster.01");
    expect(ws02Before?.status).toBe("AVAILABLE");

    const swapOk = await applyWorldCommand(
      w,
      buyer,
      { request_id: "sw1", command: "TRADE", arguments: { phase: "fulfill", swap_id: "emergency_ration_charge" } },
      noopSettle,
    );
    expect(swapOk.ok).toBe(true);
    expect(pBuyer.budgets.energy).toBe(25);
    expect(w.rooms["room.civic-exchange"].entities[0].stock_amount).toBe(7); // debited 1 node stock

    // Now shopkeep stocks 10 energy and lists SELL_OFFER (5 energy for 2 FERROUS_ORE, 2 fills)
    const pKeep = w.players[keep.player_id];
    pKeep.budgets.energy = 40;
    pKeep.budgets.compute = 20;

    // Listing without full reserve fails closed
    const badList = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-fail",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-1",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "RESOURCE", resource: "energy", amount: 5 },
          ask_asset: { kind: "LOT", material: "FERROUS_ORE", amount: 2 },
          max_fills: 2,
        },
      },
      noopSettle,
    );
    expect(badList.ok).toBe(false);
    expect(badList.error?.code).toBe("BUDGET_EXCEEDED");

    const stocked = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "stk-1",
        command: "TRADE",
        arguments: {
          phase: "stock",
          stall_id: "entity.barter-stall-1",
          asset: { kind: "RESOURCE", resource: "energy", amount: 10 },
        },
      },
      noopSettle,
    );
    expect(stocked.ok).toBe(true);

    const listed = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-ok",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-1",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "RESOURCE", resource: "energy", amount: 5 },
          ask_asset: { kind: "LOT", material: "FERROUS_ORE", amount: 2 },
          max_fills: 2,
        },
      },
      noopSettle,
    );
    expect(listed.ok).toBe(true);
    const listingId = listed.observation?.shop_listings?.[0]?.listing_id!;
    expect(listingId).toBeTruthy();

    // WS02 is now SUPERSEDED and rejects emergency swaps
    const ws02After = listed.observation?.services?.find((s) => s.service_id === "service.quartermaster.01");
    expect(ws02After?.status).toBe("SUPERSEDED");
    const swapBlocked = await applyWorldCommand(
      w,
      buyer,
      { request_id: "sw2", command: "TRADE", arguments: { phase: "fulfill", swap_id: "emergency_ration_charge" } },
      noopSettle,
    );
    expect(swapBlocked.ok).toBe(false);
    expect(swapBlocked.error?.code).toBe("FORBIDDEN");

    // Withdrawal that would violate 100% full reserve is blocked
    const badWithdraw = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "wd-fail",
        command: "TRADE",
        arguments: {
          phase: "withdraw",
          stall_id: "entity.barter-stall-1",
          asset: { kind: "RESOURCE", resource: "energy", amount: 5 },
        },
      },
      noopSettle,
    );
    expect(badWithdraw.ok).toBe(false);
    expect(badWithdraw.error?.code).toBe("FORBIDDEN");

    // Buyer fulfills listing in 1 atomic turn -> updates WS01 local clearing tape & social memory
    pBuyer.budgets.storage = 12;
    pBuyer.material_lots = [{ material: "FERROUS_ORE", grade: "SOUND", amount: 4 }];
    const fill = await applyWorldCommand(
      w,
      buyer,
      { request_id: "fill-1", command: "TRADE", arguments: { phase: "fulfill", listing_id: listingId } },
      noopSettle,
    );
    expect(fill.ok).toBe(true);
    expect(pBuyer.budgets.energy).toBe(30); // 25 + 5
    const ws01 = fill.observation?.services?.find((s) => s.service_id === "service.exchange.01");
    expect(ws01?.local_clearing_tape?.length).toBe(1);
    expect(pBuyer.trade_memory?.edges[keep.player_id]?.length).toBe(1);
    // Both buyer and personal seller earn broker practice credit with counterparty attribution.
    expect(pBuyer.practice?.tracks["track.broker.01"]?.length).toBe(1);
    expect(
      (pBuyer.practice as { counterparties?: Record<string, string[]> } | undefined)?.counterparties?.["track.broker.01"],
    ).toContain(keep.player_id);
    expect(pKeep.practice?.tracks["track.broker.01"]?.length).toBe(1);
    expect(
      (pKeep.practice as { counterparties?: Record<string, string[]> } | undefined)?.counterparties?.["track.broker.01"],
    ).toContain(buyer.player_id);
  });

  it("enforces atomic lot deposit caps, joint LOT/CARGO/predicate ITEM reserves, and exact auto-equip storage delta", async () => {
    const w = makeShopWorld();
    const keep = principalFor("keep2");
    const buyer = principalFor("buyer2");
    await applyWorldCommand(w, keep, { request_id: "e1", command: "ENTER" }, noopSettle);
    await applyWorldCommand(w, buyer, { request_id: "e2", command: "ENTER" }, noopSettle);

    w.rooms["room.civic-exchange"].entities.push({
      entity_id: "entity.barter-stall-2",
      entity_type: "INFRASTRUCTURE",
      label: "Exchange Stall 2",
      infra_type: "barter_stall",
      owner_id: keep.player_id,
      steward_id: keep.player_id,
      condition: 100,
    });
    w.stalls = {
      "entity.barter-stall-2": {
        stall_id: "entity.barter-stall-2",
        room_id: "room.civic-exchange",
        resources: { energy: 0, compute: 0, influence: 0 },
        material_lots: [{ material: "FERROUS_ORE", grade: "SOUND", amount: 29 }],
        item_ids: [],
        listings: [],
      },
    };
    const pKeep = w.players[keep.player_id];
    pKeep.budgets.energy = 60;
    pKeep.budgets.compute = 40;
    pKeep.budgets.storage = 16;
    pKeep.material_lots = [
      { material: "FERROUS_ORE", grade: "WORN", amount: 2 },
      { material: "FERROUS_ORE", grade: "SOUND", amount: 2 },
    ];

    // 1. Over-cap multi-grade lot deposit must reject WITHOUT partially mutating stall escrow
    const overCap = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "stk-over",
        command: "TRADE",
        arguments: {
          phase: "stock",
          stall_id: "entity.barter-stall-2",
          asset: { kind: "LOT", material: "FERROUS_ORE", amount: 4 },
        },
      },
      noopSettle,
    );
    expect(overCap.ok).toBe(false);
    expect(w.stalls["entity.barter-stall-2"].material_lots).toEqual([
      { material: "FERROUS_ORE", grade: "SOUND", amount: 29 },
    ]);

    // 2. Shared LOT + CARGO reserve: with 5 FERROUS_ORE escrowed, an open 5-CARGO listing blocks a 5-LOT listing
    w.stalls["entity.barter-stall-2"].material_lots = [{ material: "FERROUS_ORE", grade: "SOUND", amount: 5 }];
    const cargoList = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-cargo",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-2",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "CARGO", amount: 5 },
          ask_asset: { kind: "RESOURCE", resource: "energy", amount: 5 },
          max_fills: 1,
        },
      },
      noopSettle,
    );
    expect(cargoList.ok).toBe(true);
    const conflictLotList = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-lot-conflict",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-2",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "LOT", material: "FERROUS_ORE", amount: 5 },
          ask_asset: { kind: "RESOURCE", resource: "energy", amount: 5 },
          max_fills: 1,
        },
      },
      noopSettle,
    );
    expect(conflictLotList.ok).toBe(false);

    // 3. Predicate ITEM reserve: 1 escrowed arc_welder cannot back two open predicate listings
    w.items = {
      "item.welder.1": {
        item_id: "item.welder.1",
        archetype: "arc_welder",
        label: "Arc Welder",
        category: "TOOL",
        equip_slot: "TOOL_SLOT",
        condition: 100,
        max_condition: 100,
        quality: "STANDARD",
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: "entity.barter-stall-2" },
        owner_id: keep.player_id,
        creator_id: keep.player_id,
        steward_id: keep.player_id,
        forged_cycle: 1,
        contest_veterancy: 0,
        notable_history: [],
      },
    };
    w.stalls["entity.barter-stall-2"].item_ids = ["item.welder.1"];
    const pred1 = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-pred1",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-2",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "ITEM", predicate: { archetype: "arc_welder" } },
          ask_asset: { kind: "RESOURCE", resource: "energy", amount: 4 },
          max_fills: 1,
        },
      },
      noopSettle,
    );
    expect(pred1.ok).toBe(true);
    const pred2 = await applyWorldCommand(
      w,
      keep,
      {
        request_id: "lst-pred2",
        command: "TRADE",
        arguments: {
          phase: "list",
          stall_id: "entity.barter-stall-2",
          listing_kind: "SELL_OFFER",
          offer_asset: { kind: "ITEM", predicate: { archetype: "arc_welder" } },
          ask_asset: { kind: "RESOURCE", resource: "energy", amount: 4 },
          max_fills: 1,
        },
      },
      noopSettle,
    );
    expect(pred2.ok).toBe(false);

    // 4. Buyer with 1 free storage & empty TOOL_SLOT auto-equips arc_welder (bulk 2, equipped_bulk 1) -> exact 0 free storage
    const pBuyer = w.players[buyer.player_id];
    pBuyer.budgets.energy = 20;
    pBuyer.budgets.compute = 10;
    pBuyer.budgets.storage = 1;
    const itemListingId = pred1.observation?.shop_listings?.find(
      (l) => (l.offer_asset as { kind?: string } | undefined)?.kind === "ITEM",
    )?.listing_id!;
    const buyItem = await applyWorldCommand(
      w,
      buyer,
      { request_id: "fill-item", command: "TRADE", arguments: { phase: "fulfill", listing_id: itemListingId } },
      noopSettle,
    );
    expect(buyItem.ok).toBe(true);
    expect(w.items?.["item.welder.1"].equipped_slot).toBe("TOOL_SLOT");
    expect(pBuyer.budgets.storage).toBe(0);
  });
});
