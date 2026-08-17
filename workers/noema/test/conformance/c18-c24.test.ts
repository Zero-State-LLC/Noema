import { describe, expect, it } from "vitest";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../../src/types";
import { MINI_ENTRY_ROOM_ID, miniChamberState } from "./mini-chamber";

const CACHE_ID = "entity.mini-cache";
const RELAY_ID = "entity.mini-relay";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function strategicChamber(world_id: string): WorldRuntime {
  const w = miniChamberState(world_id);
  w.rooms[MINI_ENTRY_ROOM_ID].entities.push(
    enrichEntity({
      entity_id: CACHE_ID,
      label: "mini-cache",
      entity_type: "INFRASTRUCTURE",
      stock_resource: "energy",
      stock_amount: 8,
    }),
    enrichEntity({
      entity_id: RELAY_ID,
      label: "mini-relay",
      entity_type: "INFRASTRUCTURE",
      condition: 70,
    }),
  );
  return w;
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function blob(value: unknown): string {
  return JSON.stringify(value);
}

describe("C18 resource accounting", () => {
  it("HARVEST debits cost, credits stock, and reduces the node", async () => {
    const w = strategicChamber("test.hosted-canonical.c18");
    const p = principal("player.a");
    await run(w, p, "ENTER_WORLD");
    const energy = w.players[p.player_id].budgets.energy;
    const storage = w.players[p.player_id].budgets.storage;
    const stock = w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === CACHE_ID)!.stock_amount!;

    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: CACHE_ID, amount: 1 });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(
      expect.arrayContaining(["RESOURCE_TRANSFER", "BUDGET_CONSUMED"]),
    );
    expect(w.players[p.player_id].budgets.energy).toBe(energy - 2 + 1);
    expect(w.players[p.player_id].budgets.storage).toBe(storage - 1);
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === CACHE_ID)!.stock_amount).toBe(stock - 1);
    expect(blob(w)).not.toMatch(/perihelion|civic-exchange/i);
  });
});

describe("C19 production / consumption", () => {
  it("REPAIR consumes energy/compute/storage and raises condition", async () => {
    const w = strategicChamber("test.hosted-canonical.c19");
    const p = principal("player.a");
    await run(w, p, "ENTER_WORLD");
    const before = { ...w.players[p.player_id].budgets };
    const cond = w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition!;

    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: RELAY_ID });
    expect(r.ok).toBe(true);
    expect(r.observation?.consequence).toMatch(/repaired/i);
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - (COSTS.REPAIR.energy || 0));
    expect(w.players[p.player_id].budgets.compute).toBe(before.compute - (COSTS.REPAIR.compute || 0));
    expect(w.players[p.player_id].budgets.storage).toBe(before.storage - (COSTS.REPAIR.storage || 0));
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition).toBe(
      Math.min(100, cond + 15),
    );
  });
});

describe("C20 trade atomicity", () => {
  it("accept transfers once; a second accept does not double-pay", async () => {
    const w = strategicChamber("test.hosted-canonical.c20");
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const energyA = w.players[a.player_id].budgets.energy;
    const energyB = w.players[b.player_id].budgets.energy;
    const computeB = w.players[b.player_id].budgets.compute;

    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 2 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];

    const first = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(first.ok).toBe(true);
    expect(w.trades[tradeId].status).toBe("SETTLED");
    expect(w.players[a.player_id].budgets.energy).toBe(energyA - 2);
    expect(w.players[b.player_id].budgets.energy).toBe(energyB + 2);
    // Accept pays TRADE compute cost and the requested compute transfer.
    expect(w.players[b.player_id].budgets.compute).toBe(computeB - 1 - (COSTS.TRADE.compute || 0));

    const second = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("TRADE_FAILED");
    expect(w.players[a.player_id].budgets.energy).toBe(energyA - 2);
    expect(w.players[b.player_id].budgets.energy).toBe(energyB + 2);
  });
});

describe("C21 organization / faction persistence", () => {
  it("creates an org and admits a member under founder authority", async () => {
    const w = strategicChamber("test.hosted-canonical.c21");
    const founder = principal("player.founder");
    const peer = principal("player.peer");
    await run(w, founder, "ENTER_WORLD");
    await run(w, peer, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[peer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const created = await run(w, founder, "COMMIT", {
      operation: "ORG_CREATE",
      name: "Anchor Compact",
      charter: "local coordination",
    });
    expect(created.ok).toBe(true);
    const org = Object.values(w.organizations)[0];
    expect(org.status).toBe("ACTIVE");
    expect(org.name).toBe("Anchor Compact");

    const denied = await run(w, peer, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: org.org_id,
      agent_id: peer.player_id,
      role: "member",
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");

    const invited = await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: org.org_id,
      agent_id: peer.player_id,
      role: "member",
    });
    expect(invited.ok).toBe(true);
    expect(w.organizations[org.org_id].members.some((m) => m.agent_id === peer.player_id)).toBe(true);
  });
});

describe("C22 infrastructure state", () => {
  it("REPAIR leaves the relay condition raised on the live world", async () => {
    const w = strategicChamber("test.hosted-canonical.c22");
    const p = principal("player.a");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: RELAY_ID });
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition).toBe(85);
    const look = await run(w, p, "LOOK");
    expect(look.ok).toBe(true);
    expect(look.observation?.location?.entities.find((e) => e.entity_id === RELAY_ID)?.condition).toBe(85);
  });
});

describe("C23 deterministic scheduler conflicts", () => {
  it("two present WAITs commit one cycle; a lone first WAIT does not", async () => {
    const w = strategicChamber("test.hosted-canonical.c23");
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const first = await run(w, a, "WAIT");
    expect(w.cycle).toBe(0);
    expect(first.events?.[0]?.payload?.cycle_committed).toBe(false);
    const second = await run(w, b, "WAIT");
    expect(second.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(second.events?.[0]?.payload?.cycle_committed).toBe(true);
    expect(second.events?.[0]?.event_type).toBe("WAIT");
  });
});

describe("C24 world event pressure", () => {
  it("drops the isolated mini-relay 70→55 on cycle 4 once", async () => {
    const w = strategicChamber("test.hosted-canonical.c24");
    const p = principal("player.a");
    await run(w, p, "ENTER_WORLD");
    while (w.cycle < 3) {
      const r = await run(w, p, "WAIT");
      expect(r.ok).toBe(true);
    }
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition).toBe(70);

    const fired = await run(w, p, "WAIT");
    expect(w.cycle).toBe(4);
    expect(fired.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition).toBe(55);
    expect(blob(fired.observation)).not.toMatch(/WED|infrastructure_failure|Event:/i);
    expect(blob(w)).not.toMatch(/perihelion|civic-exchange/i);

    await run(w, p, "WAIT");
    await run(w, p, "WAIT");
    expect(w.rooms[MINI_ENTRY_ROOM_ID].entities.find((e) => e.entity_id === RELAY_ID)!.condition).toBe(55);
  });
});
