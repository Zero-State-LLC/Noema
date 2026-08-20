import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { enrichEntity, helpText } from "../src/actions";
import { CONSTRUCT_COSTS } from "../src/construction";
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
    world_id: "test.hosted-canonical.gc8-s6",
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
            entity_id: "entity.cell",
            label: "storage-cell",
            entity_type: "RESOURCE",
            condition: 80,
            stock_resource: "energy",
            stock_amount: 8,
          }),
          enrichEntity({
            entity_id: "entity.relay",
            label: "relay-trunk",
            entity_type: "INFRASTRUCTURE",
            infra_type: "relay",
            condition: 40,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A second node.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC8-S6 world path", () => {
  it("empty hold REPAIR fails materials in hold", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 16;
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toBe("You do not have materials in hold.");
    expect(w.players[p.player_id].budgets.storage).toBe(16);
  });

  it("one cargo REPAIR frees storage", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 15;
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
    expect(r.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(16);
  });

  it("full hold REPAIR opens hold 0→1", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 0;
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
    expect(r.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(1);
  });

  it("empty hold REPAIR affordance names materials in hold", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 16;
    const looked = await run(w, p, "LOOK");
    const repair = looked.observation?.affordances?.find(
      (a) => a.action === "REPAIR" && a.target_id === "entity.relay",
    );
    expect(repair?.available).toBe(false);
    expect(repair?.reason).toBe("You do not have materials in hold.");
  });

  it("REPAIR affordance falls back to energy or compute when cargo is present", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 15;
    w.players[p.player_id].budgets.energy = 0;
    const looked = await run(w, p, "LOOK");
    const repair = looked.observation?.affordances?.find(
      (a) => a.action === "REPAIR" && a.target_id === "entity.relay",
    );
    expect(repair?.available).toBe(false);
    expect(repair?.reason).toBe("You do not have enough energy or compute.");
  });

  it("empty hold CONSTRUCT fails materials in hold", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.storage = 16;
    const r = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "generator" });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toBe("You do not have materials in hold.");
    expect(w.players[p.player_id].budgets.storage).toBe(16);
  });

  it("CONSTRUCT consumes cargo", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const need = CONSTRUCT_COSTS.generator.storage || 0;
    w.players[p.player_id].budgets.storage = 16 - need;
    const r = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "generator" });
    expect(r.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(16);
  });

  it("TRADE storage is cargo 15→16 / 16→15", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets.storage = 15;
    w.players[b.player_id].budgets.storage = 16;
    const energyA = w.players[a.player_id].budgets.energy;
    const energyB = w.players[b.player_id].budgets.energy;
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { storage: 1 },
      requested: { energy: 1 },
    });
    expect(proposed.ok).toBe(true);
    expect(w.players[a.player_id].budgets.storage).toBe(15);
    const tradeId = Object.keys(w.trades)[0];
    const accepted = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(accepted.ok).toBe(true);
    expect(w.players[a.player_id].budgets.storage).toBe(16);
    expect(w.players[b.player_id].budgets.storage).toBe(15);
    expect(w.players[a.player_id].budgets.energy).toBe(energyA + 1);
    expect(w.players[b.player_id].budgets.energy).toBe(energyB - 1);
  });

  it("TRADE rejects giver not carrying", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets.storage = 16;
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { storage: 1 },
      requested: { energy: 1 },
    });
    expect(proposed.ok).toBe(false);
    expect(proposed.error?.message).toBe("You are not carrying that.");
    expect(Object.keys(w.trades)).toHaveLength(0);
    expect(w.players[a.player_id].budgets.storage).toBe(16);
  });

  it("TRADE rejects receiver pack full", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets.storage = 15;
    w.players[b.player_id].budgets.storage = 0;
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { storage: 1 },
      requested: { energy: 1 },
    });
    expect(proposed.ok).toBe(true);
    expect(w.players[a.player_id].budgets.storage).toBe(15);
    const tradeId = Object.keys(w.trades)[0];
    const accepted = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(accepted.ok).toBe(false);
    expect(accepted.error?.message).toBe("They do not have enough free storage.");
    expect(w.trades[tradeId].status).toBe("OPEN");
    expect(w.players[a.player_id].budgets.storage).toBe(15);
    expect(w.players[b.player_id].budgets.storage).toBe(0);
  });

  it("reserved cargo cannot REPAIR", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets.storage = 15;
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { storage: 1 },
      requested: { energy: 1 },
    });
    expect(proposed.ok).toBe(true);
    expect(w.players[a.player_id].budgets.storage).toBe(15);
    const r = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toBe("You do not have materials in hold.");
    expect(w.players[a.player_id].budgets.storage).toBe(15);
  });

  it("help names cargo hold for work and TRADE", () => {
    expect(helpText("harvest")).toMatch(/fills hold/);
    expect(helpText("repair")).toMatch(/cargo 1 \(frees storage\)/);
    expect(helpText("trade")).toMatch(/storage:.*cargo/i);
    expect(helpText()).not.toMatch(/storage capped/i);
    expect(helpText()).not.toMatch(/\bcrypto\b/i);
  });
});
