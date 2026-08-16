import { describe, expect, it } from "vitest";
import {
  CONSTRUCT_COSTS,
  DISMANTLE_COST,
  SALVAGE_STORAGE,
  clampSalvage,
  infraClassOf,
  isHiddenRoom,
  liveClassInRoom,
  parseConstructibleClass,
} from "../src/construction";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  normalizeStructuredCommand,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC2-S0 hosted BUILD CONSTRUCT / DISMANTLE.
 * Authority: Noema-Specs docs/GC2-FIRST-SLICE.md / RFC-0006.
 */

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

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC2-S0 catalog mapper", () => {
  it("parses closed classes and aliases", () => {
    expect(parseConstructibleClass("relay")).toBe("relay");
    expect(parseConstructibleClass("storage bay")).toBe("storage_bay");
    expect(parseConstructibleClass("storage_bay")).toBe("storage_bay");
    expect(parseConstructibleClass("production-node")).toBe("production_node");
    expect(parseConstructibleClass("workshop")).toBeNull();
    expect(parseConstructibleClass("route_link")).toBe("route_link");
    expect(parseConstructibleClass("route link")).toBe("route_link");
  });

  it("classifies live infrastructure from id/label and ignores ruins", () => {
    expect(
      infraClassOf({
        entity_id: "entity.relay-7",
        label: "scarred-conduit",
        entity_type: "INFRASTRUCTURE",
      }),
    ).toBe("relay");
    expect(
      infraClassOf({
        entity_id: "entity.scar-conduit",
        label: "dead-route-mark",
        entity_type: "RUIN",
      }),
    ).toBeNull();
    expect(
      liveClassInRoom(
        [
          {
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          },
        ],
        "relay",
      ),
    ).toBe(true);
    expect(isHiddenRoom({ hidden: true })).toBe(true);
    expect(isHiddenRoom({ tags: ["hidden"] })).toBe(true);
    expect(isHiddenRoom({ tags: ["entry"] })).toBe(false);
  });

  it("pins catalog costs and salvage", () => {
    expect(CONSTRUCT_COSTS.relay).toEqual({ energy: 8, compute: 4, storage: 4, influence: 2 });
    expect(CONSTRUCT_COSTS.generator).toEqual({ energy: 8, compute: 3, storage: 5, influence: 0 });
    expect(CONSTRUCT_COSTS.storage_bay).toEqual({ energy: 5, compute: 2, storage: 6, influence: 0 });
    expect(CONSTRUCT_COSTS.production_node).toEqual({ energy: 7, compute: 3, storage: 4, influence: 0 });
    expect(CONSTRUCT_COSTS.route_link).toEqual({ energy: 8, compute: 4, storage: 4, influence: 2 });
    expect(DISMANTLE_COST).toEqual({ energy: 4, compute: 2 });
    expect(SALVAGE_STORAGE.storage_bay).toBe(3);
    expect(clampSalvage(15, 2)).toEqual({ added: 1, overflow: 1, next: 16 });
  });
});

describe("GC2-S0 parse", () => {
  it("maps construct/build/dismantle and rejects unknown classes", () => {
    const construct = parseHumanCommand("construct relay");
    expect(construct.ok).toBe(true);
    if (construct.ok) {
      expect(construct.action).toEqual({
        verb: "BUILD",
        arguments: { operation: "CONSTRUCT", class: "relay" },
      });
    }
    const alias = parseHumanCommand("build generator");
    expect(alias.ok).toBe(true);
    if (alias.ok) {
      expect(alias.action.verb).toBe("BUILD");
      if (alias.action.verb === "BUILD" && alias.action.arguments.operation === "CONSTRUCT") {
        expect(alias.action.arguments.class).toBe("generator");
      }
    }
    const dismantle = parseHumanCommand("dismantle entity.relay-7", {
      entities: [
        enrichEntity({
          entity_id: "entity.relay-7",
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
        }),
      ],
    });
    expect(dismantle.ok).toBe(true);
    if (dismantle.ok) {
      expect(dismantle.action).toEqual({
        verb: "BUILD",
        arguments: { operation: "DISMANTLE", entity_id: "entity.relay-7" },
      });
    }
    const bad = parseHumanCommand("construct workshop");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("CLASS_FORBIDDEN");
    const structured = normalizeStructuredCommand("BUILD", {
      operation: "CONSTRUCT",
      class: "storage_bay",
    });
    expect(structured.ok).toBe(true);
  });

  it("does not advertise BUILD in Chamber help", () => {
    const text = helpText();
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).not.toMatch(/\bconstruct\b/i);
    expect(text).not.toMatch(/\bdismantle\b/i);
    expect(text).not.toMatch(/\bbuild\b/i);
    expect(helpText("repair")).not.toMatch(/\bbuild\b/i);
  });
});

describe("GC2-S0 CONSTRUCT", () => {
  it("creates owned infrastructure and spends catalog costs", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "MOVE", { direction: "east" });
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = { ...w.players[p.player_id].budgets };
    const result = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(result.ok).toBe(true);
    expect(result.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_CREATE"]);
    expect(result.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    const created = result.events?.find((e) => e.event_type === "ENTITY_CREATE");
    const payload = created?.payload || {};
    expect(payload.entity_type).toBe("INFRASTRUCTURE");
    expect(payload.owner_id).toBe(p.player_id);
    expect(payload.location).toBe("room.east");
    expect((payload.properties as { infra_type?: string } | undefined)?.infra_type).toBe("relay");
    expect((payload.state as { condition?: number } | undefined)?.condition).toBe(100);
    const entity = w.rooms["room.east"].entities[0];
    expect(entity.entity_type).toBe("INFRASTRUCTURE");
    expect(entity.owner_id).toBe(p.player_id);
    expect(entity.infra_type).toBe("relay");
    expect(entity.condition).toBe(100);
    expect(`${entity.entity_id} ${entity.label}`.toLowerCase()).toMatch(/relay/);
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 8);
    expect(w.players[p.player_id].budgets.compute).toBe(before.compute - 4);
    expect(w.players[p.player_id].budgets.storage).toBe(before.storage - 4);
    expect(w.players[p.player_id].budgets.influence).toBe(before.influence - 2);
    expect(w.cycle).toBe(0);
  });

  it("refuses an occupied class without spending", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const energy = w.players[p.player_id].budgets.energy;
    const result = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("SLOT_OCCUPIED");
    expect(result.events || []).toEqual([]);
    expect(w.players[p.player_id].budgets.energy).toBe(energy);
    expect(w.rooms["room.hub"].entities).toHaveLength(1);
  });

  it("refuses over-budget construct without events", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "MOVE", { direction: "east" });
    w.players[p.player_id].budgets.energy = 2;
    const result = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.rooms["room.east"].entities).toHaveLength(0);
    expect(w.players[p.player_id].budgets.energy).toBe(2);
  });

  it("refuses hidden rooms and remote rooms", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "generator" });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
    w.players[p.player_id].room_id = "room.hub";
    const remote = await run(w, p, "BUILD", {
      operation: "CONSTRUCT",
      class: "generator",
      room_id: "room.east",
    });
    expect(remote.ok).toBe(false);
    expect(remote.error?.code).toBe("NOT_COLOCATED");
  });

  it("accepts human construct line in an empty room", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "MOVE", { direction: "east" });
    const result = await run(w, p, "construct generator", { line: "construct generator" });
    expect(result.ok).toBe(true);
    expect(w.rooms["room.east"].entities[0].infra_type).toBe("generator");
  });
});

describe("GC2-S0 DISMANTLE", () => {
  it("lets the owner dismantle and salvage under cap", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "MOVE", { direction: "east" });
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(built.ok).toBe(true);
    const entityId = w.rooms["room.east"].entities[0].entity_id;
    const before = { ...w.players[p.player_id].budgets };
    const result = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(result.ok).toBe(true);
    expect(result.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_DESTROY"]);
    expect(result.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    expect(result.events?.find((e) => e.event_type === "ENTITY_DESTROY")?.payload?.reason).toBe(
      "DISMANTLED",
    );
    expect(w.rooms["room.east"].entities).toHaveLength(0);
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 4);
    expect(w.players[p.player_id].budgets.compute).toBe(before.compute - 2);
    expect(w.players[p.player_id].budgets.storage).toBe(before.storage + 2);
  });

  it("rejects non-owner and genesis assets without spend", async () => {
    const w = fixtureWorld();
    const owner = principal("player.nacre");
    const other = principal("player.vesper");
    await run(w, owner, "ENTER_WORLD");
    await run(w, other, "ENTER_WORLD");
    await run(w, owner, "MOVE", { direction: "east" });
    await run(w, other, "MOVE", { direction: "east" });
    await run(w, owner, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    const entityId = w.rooms["room.east"].entities[0].entity_id;
    const energy = w.players[other.player_id].budgets.energy;
    const denied = await run(w, other, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("NOT_OWNER");
    expect(w.players[other.player_id].budgets.energy).toBe(energy);
    expect(w.rooms["room.east"].entities).toHaveLength(1);

    w.players[other.player_id].room_id = "room.hub";
    const genesisEnergy = w.players[other.player_id].budgets.energy;
    const genesis = await run(w, other, "BUILD", {
      operation: "DISMANTLE",
      entity_id: "entity.relay-7",
    });
    expect(genesis.ok).toBe(false);
    expect(genesis.error?.code).toBe("NOT_OWNER");
    expect(w.players[other.player_id].budgets.energy).toBe(genesisEnergy);
    expect(w.rooms["room.hub"].entities.some((e) => e.entity_id === "entity.relay-7")).toBe(true);
  });

  it("does not change COMMIT.REPAIR", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.rooms["room.hub"].entities[0].condition = 40;
    const before = w.players[p.player_id].budgets.energy;
    const repair = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(repair.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(55);
    expect(w.players[p.player_id].budgets.energy).toBe(before - 3);
    expect(repair.events?.map((e) => e.event_type)).toContain("ENTITY_UPDATE");
    expect(repair.events?.some((e) => e.event_type === "ENTITY_CREATE")).toBe(false);
  });
});
