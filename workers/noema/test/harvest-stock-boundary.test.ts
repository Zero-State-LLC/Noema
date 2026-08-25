/**
 * Defect 3: fractional stock was advertised as an executable one-unit harvest.
 *
 * Live observation exposed ~0.03241497048623045 materials while the Worker
 * advertised `available: true` with `cmd: "harvest salvage-cache 1"`, and the
 * reducer then returned FORBIDDEN "Not enough stock available."
 *
 * These tests pin the whole boundary, not one sample: an amount-1 affordance
 * is offered only when stock >= 1, the advertised reason is truthful, and what
 * `available` claims matches what the reducer actually does.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const NODE = "entity.salvage-cache";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.harvest",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(stock: number): WorldRuntime {
  return {
    world_id: "test.harvest.boundary",
    world_name: "Boundary Reach",
    cycle: 3,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A public anchor.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: NODE,
            label: "salvage-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "materials",
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

let seq = 0;
async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  seq += 1;
  const envl: CommandEnvelope = {
    request_id: `req.${command}.${seq}`,
    idempotency_key: `idem.${command}.${seq}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function seated(stock: number, budgets = DEFAULT_BUDGETS) {
  const w = world(stock);
  const p = principal("player.harvester");
  expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(budgets);
  return { w, p };
}

async function harvestAffordance(w: WorldRuntime, p: PlayerPrincipal) {
  const looked = await run(w, p, "LOOK");
  return {
    affordance: looked.observation?.affordances?.find(
      (a) => a.operation === "HARVEST" && a.target_id === NODE,
    ),
    observation: looked.observation,
  };
}

describe("harvest stock boundary", () => {
  // 0.032 is the exact live value that produced the impossible affordance.
  const belowOne = [0, 0.032, 0.03241497048623045, 0.5, 0.999];
  const atOrAboveOne = [1, 1.5, 8];

  it.each(belowOne)("stock %s advertises HARVEST as unavailable with a truthful reason", async (stock) => {
    const { w, p } = await seated(stock);
    const { affordance, observation } = await harvestAffordance(w, p);
    expect(affordance).toBeDefined();
    expect(affordance?.available).toBe(false);
    expect(affordance?.reason).toBe("Not enough stock available.");
    expect(observation?.available_actions).not.toContain("HARVEST");
  });

  it.each(atOrAboveOne)("stock %s advertises an executable HARVEST", async (stock) => {
    const { w, p } = await seated(stock);
    const { affordance, observation } = await harvestAffordance(w, p);
    expect(affordance?.available).toBe(true);
    expect(affordance?.reason).toBeUndefined();
    expect(affordance?.cmd).toBe("harvest salvage-cache 1");
    expect(observation?.available_actions).toContain("HARVEST");
  });

  it.each(belowOne)("stock %s: the advertised state matches what the reducer does", async (stock) => {
    const { w, p } = await seated(stock);
    const { affordance } = await harvestAffordance(w, p);
    const attempt = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: NODE, amount: 1 });
    expect(affordance?.available).toBe(false);
    expect(attempt.ok).toBe(false);
    expect(attempt.error?.code).toBe("FORBIDDEN");
  });

  it.each(atOrAboveOne)("stock %s: an available affordance actually executes", async (stock) => {
    const { w, p } = await seated(stock);
    const { affordance } = await harvestAffordance(w, p);
    const attempt = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: NODE, amount: 1 });
    expect(affordance?.available).toBe(true);
    expect(attempt.ok, JSON.stringify(attempt.error)).toBe(true);
  });

  it("does not spend budget when a fractional harvest is refused", async () => {
    const { w, p } = await seated(0.032);
    const before = { ...w.players[p.player_id].budgets };
    const attempt = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: NODE, amount: 1 });
    expect(attempt.ok).toBe(false);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(0.032);
  });

  it("names free storage, not stock, when storage is the real blocker", async () => {
    const { w, p } = await seated(8, { ...DEFAULT_BUDGETS, storage: 0 });
    const { affordance } = await harvestAffordance(w, p);
    expect(affordance?.available).toBe(false);
    expect(affordance?.reason).toBe("You do not have enough free storage.");
  });

  it("names fuel, not stock, when energy and compute are the real blocker", async () => {
    const { w, p } = await seated(8, { ...DEFAULT_BUDGETS, energy: 0, compute: 0 });
    const { affordance } = await harvestAffordance(w, p);
    expect(affordance?.available).toBe(false);
    expect(affordance?.reason).toBe("You need energy 2 and compute 1 to harvest.");
  });

  it("depletion after observation is a race, refused without mutation", async () => {
    const { w, p } = await seated(1);
    const { affordance } = await harvestAffordance(w, p);
    expect(affordance?.available).toBe(true);
    // A concurrent actor drains the node between observation and execution.
    w.rooms["room.hub"].entities[0].stock_amount = 0.25;
    const budgetsBefore = { ...w.players[p.player_id].budgets };
    const attempt = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: NODE, amount: 1 });
    expect(attempt.ok).toBe(false);
    expect(attempt.error?.code).toBe("FORBIDDEN");
    expect(w.players[p.player_id].budgets).toEqual(budgetsBefore);
  });
});
