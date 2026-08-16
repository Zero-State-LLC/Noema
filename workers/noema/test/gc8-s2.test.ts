import { describe, expect, it } from "vitest";
import { mixOrigin, publicHarvestOrigin } from "../src/lots";
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

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc8-s2",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.cell-hub",
            label: "hub-cell",
            entity_type: "RESOURCE",
            condition: 80,
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A second node.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [
          enrichEntity({
            entity_id: "entity.cell-east",
            label: "east-cell",
            entity_type: "RESOURCE",
            condition: 80,
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.cell-vault",
            label: "vault-cell",
            entity_type: "RESOURCE",
            condition: 80,
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
        hidden: true,
        tags: ["hidden"],
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

describe("GC8-S2 mapper", () => {
  it("stamps public harvests, skips hidden rooms, and clears mixed rooms", () => {
    const hub = { room_id: "room.hub", name: "Hub" };
    const east = { room_id: "room.east", name: "Coldline" };
    const vault = { room_id: "room.vault", name: "Hidden Vault", hidden: true, tags: ["hidden"] };
    const stamped = publicHarvestOrigin(hub, "player.nacre");
    expect(stamped).toEqual({ room_id: "room.hub", room_name: "Hub", producer_id: "player.nacre" });
    expect(publicHarvestOrigin(vault, "player.nacre")).toBeUndefined();
    expect(publicHarvestOrigin({ ...vault, hidden: undefined, tags: ["hidden"] }, "player.nacre")).toBeUndefined();
    expect(mixOrigin(3, stamped, 1, { room_id: "room.hub", room_name: "Hub", producer_id: "player.vesper" })).toEqual(
      stamped,
    );
    expect(mixOrigin(3, stamped, 1, { room_id: east.room_id, room_name: east.name, producer_id: "player.nacre" })).toBeUndefined();
    expect(helpText()).not.toMatch(/\bcurrency\b/i);
    expect(helpText()).not.toMatch(/\bCONTEST\b|\bBUILD\b|\bATTEST\b|\bWED\b/);
  });
});

describe("GC8-S2 world path", () => {
  it("stamps a public harvest and names the room on PLAY", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const harvested = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell-hub", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(w.players[p.player_id].lot_origins?.energy).toEqual({
      room_id: "room.hub",
      room_name: "Hub",
      producer_id: p.player_id,
    });
    expect(harvested.observation?.lot_lines).toContain("Your energy is from Hub.");
    expect(JSON.stringify(harvested.events || [])).not.toMatch(/origin_room|lot_origins|Hidden Vault/);
  });

  it("leaves hidden harvests unstamped and never stores the vault id", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const harvested = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell-vault", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(w.players[p.player_id].lot_origins?.energy).toBeUndefined();
    expect(JSON.stringify(w.players[p.player_id].lot_origins || {})).not.toContain("room.vault");
    expect(JSON.stringify(w.players[p.player_id].lot_origins || {})).not.toContain("Hidden Vault");
    expect(harvested.observation?.lot_lines || []).not.toContain("Your energy is from Hidden Vault.");
    expect(JSON.stringify(harvested.events || [])).not.toContain("room.vault");
  });

  it("clears the stamp when two public rooms mix", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const first = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell-hub", amount: 1 });
    expect(first.ok).toBe(true);
    expect(w.players[p.player_id].lot_origins?.energy?.room_id).toBe("room.hub");
    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    const second = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell-east", amount: 1 });
    expect(second.ok).toBe(true);
    expect(w.players[p.player_id].lot_origins?.energy).toBeUndefined();
    expect(second.observation?.lot_lines || []).not.toContain("Your energy is from Hub.");
    expect(second.observation?.lot_lines || []).not.toContain("Your energy is from Coldline.");
  });

  it("carries a public origin across TRADE", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const harvested = await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell-hub", amount: 1 });
    expect(harvested.ok).toBe(true);
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 2 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];
    expect(w.trades[tradeId].offered_origins?.energy?.room_id).toBe("room.hub");
    const accepted = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(accepted.ok).toBe(true);
    expect(w.players[b.player_id].lot_origins?.energy).toEqual({
      room_id: "room.hub",
      room_name: "Hub",
      producer_id: a.player_id,
    });
    expect(accepted.observation?.lot_lines).toContain("Your energy is from Hub.");
  });
});
