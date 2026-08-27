import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("p5-dt-08 bounded horizon", () => {
  it("scars persist across many HARVESTs then decay on cycle%5", async () => {
    const w: WorldRuntime = {
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
            {
              ...enrichEntity({
                entity_id: "entity.salvage-cache",
                label: "salvage",
                entity_type: "RESOURCE",
                stock_resource: "materials",
                stock_amount: 20,
              }),
              max_stock: 40,
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
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 80, compute: 80, storage: 40, attention: 20 });
    for (let i = 0; i < 8; i++) {
      expect((await run(w, p, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 })).ok).toBe(true);
    }
    expect((w.scars || []).length).toBeGreaterThanOrEqual(1);
    const peak = w.scars![0].strength;
    expect(peak).toBeGreaterThan(0.3);
    w.cycle = 5;
    const attest = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(attest.ok).toBe(true);
    expect(w.scars![0].strength).toBeLessThan(peak);
    expect((w.evidence_fragments || []).length).toBeGreaterThanOrEqual(8);
  });
});
