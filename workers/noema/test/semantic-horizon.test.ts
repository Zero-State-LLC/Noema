import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { buildWatchLive } from "../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.horizon",
    world_name: "Horizon",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Hub.",
        exits: [],
        entities: [
          enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE", condition: 90 }),
          enrichEntity({ entity_id: "entity.archive-ledger", label: "ledger", entity_type: "ARTIFACT" }),
          enrichEntity({ entity_id: "entity.archive-ledger-2", label: "ledger-2", entity_type: "ARTIFACT" }),
          {
            ...enrichEntity({
              entity_id: "entity.salvage-cache",
              label: "salvage",
              entity_type: "RESOURCE",
              stock_resource: "materials",
              stock_amount: 12,
            }),
            max_stock: 18,
            regen_rate: 1,
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
    co_evolution: { harvest_pressure: { "room.hub": 0 }, regen_mod: {} },
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("p5-06 bounded cultural-evolution harness", () => {
  it("grounded G outranks hearsay H; pressure C does not leak WATCH scores", async () => {
    const w = world();
    const g = principal("player.g");
    const h = principal("player.h");
    const c = principal("player.c");
    await run(w, g, "ENTER_WORLD");
    await run(w, h, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    for (const id of [g.player_id, h.player_id, c.player_id]) {
      w.players[id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 40, compute: 40, attention: 40, storage: 16 });
    }

    const okAttest = await run(w, g, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(okAttest.ok).toBe(true);

    const hearsayAttest = await run(w, h, "ATTEST", {
      entity_id: "entity.archive-ledger-2",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "hearsay" },
    });
    expect(hearsayAttest.ok).toBe(false);
    expect(w.rooms["room.hub"].entities[2].archive_claim).toBeUndefined();

    const proposed = await run(w, g, "TRADE", {
      phase: "propose",
      counterparty_id: h.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];
    const hearsayAccept = await run(w, h, "TRADE", {
      phase: "accept",
      trade_id: tradeId,
      signal: { grounding: "hearsay" },
    });
    expect(hearsayAccept.ok).toBe(false);
    expect(w.trades[tradeId].status).toBe("OPEN");

    for (let i = 0; i < 6; i++) {
      const harv = await run(w, c, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 });
      expect(harv.ok).toBe(true);
    }

    expect((w.players[g.player_id].image_score || 0) > (w.players[h.player_id].image_score || 0)).toBe(true);
    expect((w.co_evolution?.protocol_strength || {})["room.hub"]).toBeGreaterThanOrEqual(1);
    expect(okAttest.observation?.reputation_summary).toBeDefined();
    expect(okAttest.observation?.cascading_risk).toBeDefined();
    const watch = JSON.stringify(
      buildWatchLive({
        world_id: w.world_id,
        cycle: w.cycle,
        sequence: w.sequence,
        rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] } },
        players: [{ player_id: g.player_id, handle: "g", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
        events: [],
      }),
    );
    expect(watch).not.toMatch(/reputation_summary/);
    expect(watch).not.toMatch(/image_score/);
  });
});
