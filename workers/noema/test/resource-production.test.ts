import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { previewStockRegen, productionModifier } from "../src/resource-production";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.prod",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(stock: number): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.resource-production",
    world_name: "Test Reach",
    cycle: 21,
    sequence: 0,
    entry_room_id: "room.civic-exchange",
    rooms: {
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Contract Town",
        description: "Open boards.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.storage-cell-cache",
            label: "bond-board",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "energy",
            stock_amount: stock,
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
    request_id: `req.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `idem.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("RESOURCE-ECONOMY production mapper", () => {
  it("regens 1 on a bare node and stays put when production infra is broken", () => {
    expect(previewStockRegen(0, productionModifier([]))).toBe(1);
    expect(
      previewStockRegen(
        0,
        productionModifier([{ infra_type: "generator", condition: 20 }]),
      ),
    ).toBe(0);
    expect(previewStockRegen(24, 1)).toBe(24);
  });
});

describe("RESOURCE-ECONOMY production tick", () => {
  it("refills an empty harvest node on cycle commit so HARVEST can run again", async () => {
    const w = world(0);
    const p = principal("player.harvester");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const empty = await run(w, p, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-cache",
      amount: 1,
    });
    expect(empty.ok).toBe(false);
    expect(empty.error?.message).toBe("Not enough stock available.");

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(22);
    const node = w.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.storage-cell-cache");
    expect(node?.stock_amount).toBe(1);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.field === "stock_amount")).toBe(
      true,
    );

    const harvested = await run(w, p, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-cache",
      amount: 1,
    });
    expect(harvested.ok).toBe(true);
    expect(harvested.observation?.consequence).toMatch(/Harvested 1 energy/i);
  });

  it("does not invent stock on a trade board without authorized stock_resource", async () => {
    const w = world(0);
    w.rooms["room.civic-exchange"].entities.push(
      enrichEntity({
        entity_id: "entity.old-market-post",
        label: "market-post",
        entity_type: "INFRASTRUCTURE",
      }),
    );
    const p = principal("player.harvester");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    await run(w, p, "WAIT");
    const board = w.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.old-market-post");
    expect(board?.stock_resource).toBeUndefined();
    expect(board?.stock_amount).toBeUndefined();
  });

  it("does not refill leftover market-post stock on cycle commit", async () => {
    const w = world(1);
    w.rooms["room.civic-exchange"].entities.push(
      enrichEntity({
        entity_id: "entity.old-market-post",
        label: "market-post",
        entity_type: "INFRASTRUCTURE",
        stock_resource: "energy",
        stock_amount: 0,
      }),
    );
    const p = principal("player.harvester");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    await run(w, p, "WAIT");
    const board = w.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.old-market-post");
    expect(board?.stock_amount).toBe(0);
  });

  it("lists empty authorized harvest as unavailable and names stock, not storage", async () => {
    const w = world(0);
    const p = principal("player.harvester");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const looked = await run(w, p, "LOOK");
    const harvest = looked.observation?.affordances?.find(
      (a) => a.operation === "HARVEST" && a.target_id === "entity.storage-cell-cache",
    );
    expect(harvest?.available).toBe(false);
    expect(harvest?.reason).toBe("Not enough stock available.");
    expect(looked.observation?.affordances?.some((a) => a.action === "WAIT" && a.available)).toBe(true);
    const firstAvailable = looked.observation?.affordances?.find((a) => a.available);
    expect(firstAvailable?.action).toBe("WAIT");
    expect(looked.observation?.available_actions?.[0]).toBe("WAIT");
  });

  it("names free storage when the node has stock and the Player does not", async () => {
    const w = world(4);
    const p = principal("player.harvester");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, storage: 0 });
    const looked = await run(w, p, "LOOK");
    const harvest = looked.observation?.affordances?.find(
      (a) => a.operation === "HARVEST" && a.target_id === "entity.storage-cell-cache",
    );
    expect(harvest?.available).toBe(false);
    expect(harvest?.reason).toBe("You do not have enough free storage.");
  });
});
