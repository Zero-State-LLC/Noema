import { describe, expect, it } from "vitest";
import { enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { buildWatchLive } from "../src/watch-live";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.mp",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  const node = enrichEntity({
    entity_id: "entity.cell",
    label: "cell",
    entity_type: "INFRASTRUCTURE",
    stock_resource: "energy",
    stock_amount: 1,
  });
  return {
    world_id: "test.hosted-canonical.mp-s0",
    world_name: "Test Reach",
    cycle: 4,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [],
        entities: [node],
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
    request_id: `req.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `idem.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("hosted-mp S0 first-accepted harvest", () => {
  it("second harvest on stock 1 is FORBIDDEN with no debit", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    const first = await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(first.ok).toBe(true);
    const energyBefore = w.players[b.player_id].budgets.energy;
    const computeBefore = w.players[b.player_id].budgets.compute;
    const second = await run(w, b, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("FORBIDDEN");
    expect(second.error?.message).toBe("Not enough stock available.");
    expect(w.players[b.player_id].budgets.energy).toBe(energyBefore);
    expect(w.players[b.player_id].budgets.compute).toBe(computeBefore);
    const cell = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.cell");
    expect(cell?.stock_amount).toBe(0);
  });

  it("LOOK after the race shows stock 0 and the other Player", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    const look = await run(w, b, "LOOK");
    expect(look.ok).toBe(true);
    const cell = look.observation?.location?.entities?.find((e) => e.entity_id === "entity.cell");
    expect(cell?.stock_amount ?? 0).toBe(0);
    expect(cell?.harvestable).toBeFalsy();
    const here = look.observation?.players_here || [];
    expect(here.some((p: { player_id?: string }) => p.player_id === "player.nacre")).toBe(true);
  });

  it("WATCH harvest line has no amounts", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    const first = await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(first.ok).toBe(true);
    const eventsBlob = JSON.stringify(first.events || []);
    expect(eventsBlob).not.toMatch(/"capacity"\s*:/);
    const live = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms,
      players: Object.entries(w.players).map(([player_id, p]) => ({
        player_id,
        handle: p.handle,
        room_id: p.room_id,
        entered: p.entered,
        last_seen_ms: p.last_seen_ms,
        actor_kind: "live",
      })),
      events: (first.events || []).map((ev) => ({
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        handle: w.players[a.player_id]?.handle,
        player_id: a.player_id,
        actor_kind: "live" as const,
        payload: ev.payload,
      })),
    });
    const blob = JSON.stringify(live);
    expect(blob).not.toMatch(/harvested from[\s\S]{0,80}\b\d+\b/i);
    expect(blob).not.toMatch(/"stock_amount"\s*:\s*\d+/);
    const harvestLine = ((live.recent_events as Array<{ line?: string }> | undefined) || [])
      .concat((live.events as Array<{ line?: string }> | undefined) || [])
      .map((e) => e.line || "")
      .find((line) => /harvest/i.test(line));
    if (harvestLine) {
      expect(harvestLine).not.toMatch(/\b\d+\b/);
    }
  });
});
