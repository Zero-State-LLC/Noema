/**
 * Defect 7: repair and construction could not be exercised in the live world.
 *
 * Live materials were effectively zero, so both were legitimately blocked and
 * nothing proved the path works end to end. These tests drive the full path
 * with sufficient resources — advertised affordance cmd, parsed by the same
 * text adapter the command surface uses, validated and settled by the reducer,
 * then re-observed — and pin the blocked case to no debit and no mutation.
 *
 * No resources are injected into any live world and no cost is loosened; the
 * fixture simply starts with materials in hold.
 *
 * Note the cargo model: `budgets.storage` is FREE capacity, so occupied hold is
 * STORAGE_CAPACITY - storage. An empty hold is storage === STORAGE_CAPACITY,
 * and consuming cargo raises `storage` rather than lowering it.
 */
import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  parseHumanCommand,
} from "../src/actions";
import { CONSTRUCT_COSTS, STORAGE_CAPACITY } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const RELAY = "entity.relay-7";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.build",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.repair.construct",
    world_name: "Works Reach",
    cycle: 6,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A public relay anchor.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: RELAY,
            label: "relay-7",
            entity_type: "INFRASTRUCTURE",
            condition: 55,
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    agreements: {},
    contests: {},
    access_restrictions: [],
    seen_idempotency: {},
    unsettled: [],
  };
}

let seq = 0;
async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  seq += 1;
  const envl: CommandEnvelope = {
    request_id: `r.${seq}`,
    idempotency_key: `i.${seq}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

const AGENT = principal("player.forge");

async function seated(budgets: Record<string, number>) {
  const w = world();
  expect((await run(w, AGENT, "ENTER_WORLD")).ok).toBe(true);
  w.players[AGENT.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, ...budgets });
  return w;
}

async function affordanceFor(w: WorldRuntime, operation: string) {
  const looked = await run(w, AGENT, "LOOK");
  return (looked.observation?.affordances || []).find((a) => a.operation === operation || a.action === operation);
}

/** Drive the advertised text exactly as the command surface parses it. */
async function runAdvertised(w: WorldRuntime, cmd: string) {
  const entities = w.rooms["room.hub"].entities;
  const parsed = parseHumanCommand(cmd, { entities });
  expect(parsed.ok, `could not parse advertised cmd: ${cmd}`).toBe(true);
  if (!parsed.ok) throw new Error("unparsed");
  return run(w, AGENT, parsed.action.verb, parsed.action.arguments as Record<string, unknown>);
}

describe("repair and construct end to end", () => {
  it("repairs from the advertised command when materials are in hold", async () => {
    const w = await seated({ energy: 12, compute: 8, storage: 6 });
    const before = w.rooms["room.hub"].entities[0].condition ?? 0;
    const affordance = await affordanceFor(w, "REPAIR");
    expect(affordance?.available, JSON.stringify(affordance)).toBe(true);
    expect(affordance?.cmd).toBe("repair relay-7");

    const done = await runAdvertised(w, affordance!.cmd!);
    expect(done.ok, JSON.stringify(done.error)).toBe(true);

    const after = w.rooms["room.hub"].entities[0].condition ?? 0;
    expect(after).toBeGreaterThan(before);
    const looked = await run(w, AGENT, "LOOK");
    const seen = looked.observation?.location?.entities?.find((e) => e.entity_id === RELAY);
    expect(seen?.condition).toBe(after);
  });

  it("charges the repair cost exactly once", async () => {
    const w = await seated({ energy: 12, compute: 8, storage: 6 });
    const before = { ...w.players[AGENT.player_id].budgets };
    expect((await runAdvertised(w, "repair relay-7")).ok).toBe(true);
    const after = w.players[AGENT.player_id].budgets;
    expect(after.energy).toBe(before.energy - (COSTS.REPAIR.energy ?? 0));
    expect(after.compute).toBe(before.compute - (COSTS.REPAIR.compute ?? 0));
    // Consuming cargo frees hold space, so free storage rises by the cargo cost.
    expect(after.storage).toBe(before.storage + (COSTS.REPAIR.storage ?? 0));
  });

  it("blocks repair with no materials, names the missing resource, and mutates nothing", async () => {
    const w = await seated({ energy: 12, compute: 8, storage: STORAGE_CAPACITY });
    const affordance = await affordanceFor(w, "REPAIR");
    expect(affordance?.available).toBe(false);
    expect(affordance?.reason).toBe("You do not have materials in hold.");

    const before = { ...w.players[AGENT.player_id].budgets };
    const condition = w.rooms["room.hub"].entities[0].condition;
    const denied = await runAdvertised(w, "repair relay-7");
    expect(denied.ok).toBe(false);
    expect(w.players[AGENT.player_id].budgets).toEqual(before);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(condition);
  });

  it("blocks repair with materials but no fuel, and says so", async () => {
    const w = await seated({ energy: 0, compute: 0, storage: 6 });
    const affordance = await affordanceFor(w, "REPAIR");
    expect(affordance?.available).toBe(false);
    expect(affordance?.reason).toBe("You do not have enough energy or compute.");
  });

  it("constructs from the advertised command when resources suffice", async () => {
    // relay-7 already occupies the relay slot in this room.
    const cost = CONSTRUCT_COSTS.generator;
    const w = await seated({
      energy: (cost.energy ?? 0) + 4,
      compute: (cost.compute ?? 0) + 4,
      storage: 4, // hold holds STORAGE_CAPACITY - 4 materials
      influence: (cost.influence ?? 0) + 4,
    });
    const beforeCount = w.rooms["room.hub"].entities.length;
    const built = await runAdvertised(w, "construct generator");
    expect(built.ok, JSON.stringify(built.error)).toBe(true);
    expect(built.events?.map((e) => e.event_type)).toContain("ENTITY_CREATE");

    const entities = w.rooms["room.hub"].entities;
    expect(entities.length).toBe(beforeCount + 1);
    const generator = entities.find((e) => e.infra_type === "generator");
    expect(generator).toBeDefined();

    const looked = await run(w, AGENT, "LOOK");
    expect(
      looked.observation?.location?.entities?.some((e) => e.entity_id === generator!.entity_id),
    ).toBe(true);
  });

  it("charges the construct cost exactly once", async () => {
    const cost = CONSTRUCT_COSTS.generator;
    const w = await seated({
      energy: (cost.energy ?? 0) + 4,
      compute: (cost.compute ?? 0) + 4,
      storage: 4,
      influence: (cost.influence ?? 0) + 4,
    });
    const before = { ...w.players[AGENT.player_id].budgets };
    expect((await runAdvertised(w, "construct generator")).ok).toBe(true);
    const after = w.players[AGENT.player_id].budgets;
    expect(after.energy).toBe(before.energy - (cost.energy ?? 0));
    expect(after.compute).toBe(before.compute - (cost.compute ?? 0));
    expect(after.storage).toBe(before.storage + (cost.storage ?? 0));
    expect(after.influence).toBe(before.influence - (cost.influence ?? 0));
  });

  it("blocks construction without materials and mutates nothing", async () => {
    const w = await seated({ energy: 20, compute: 20, storage: STORAGE_CAPACITY, influence: 20 });
    const beforeCount = w.rooms["room.hub"].entities.length;
    const before = { ...w.players[AGENT.player_id].budgets };
    const denied = await runAdvertised(w, "construct generator");
    expect(denied.ok).toBe(false);
    expect(w.rooms["room.hub"].entities.length).toBe(beforeCount);
    expect(w.players[AGENT.player_id].budgets).toEqual(before);
  });
});
