import { describe, expect, it } from "vitest";
import { cloneBudgets } from "../src/actions";
import { canConsumeCargo } from "../src/cargo";
import { CHAMBER_MAP_ROOM_IDS } from "../src/chamber-map-graph";
import { previewGenesis, validateCycle0 } from "../src/genesis";
import { ensureSuccessorMaterialsCache } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { applyWorldCommand } from "../src/world-actions";
import { cycle0ToWorld } from "../src/world-do";

const SUCCESSOR = {
  world_name: "Perihelion Reach",
  world_seed: "perihelion-successor-rehearsal-01",
  profile_id: "FRACTURED_OLD_WORLD" as const,
  story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
  world_id: "world.perihelion-reach-2",
};

function agentPrincipal(id: string): PlayerPrincipal {
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

describe("genesis successor product path", () => {
  it("emits 10 CHAMBER-MAP rooms on world.perihelion-reach-2", async () => {
    const a = await previewGenesis(SUCCESSOR);
    expect(a.world_id).toBe("world.perihelion-reach-2");
    expect(a.genesis_id).not.toBe("genesis.ef578f4ffceeccd0");
    expect(a.world_name).toBe("Perihelion Reach");
    expect(a.cycle0.entry_room_id).toBe("room.civic-exchange");
    expect(Object.keys(a.cycle0.rooms).sort()).toEqual([...CHAMBER_MAP_ROOM_IDS].sort());
    expect(a.cycle0.rooms["room.civic-exchange"].name).toBe("Civic Exchange");
    expect(a.cycle0.rooms["room.infra-vault"]).toBeUndefined();
    expect(a.cycle0.rooms["room.ruin-shelf"]).toBeUndefined();
    expect(validateCycle0(a.cycle0).ok).toBe(true);
    expect(a.validation.ok).toBe(true);
  });

  it("rejects a 10-room graph that is not exactly CHAMBER-MAP", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const mutated = structuredClone(a.cycle0);
    const archive = mutated.rooms["room.archive"];
    delete mutated.rooms["room.archive"];
    mutated.rooms["room.foo"] = { ...archive, room_id: "room.foo" };
    const v = validateCycle0(mutated);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes("room.archive"))).toBe(true);
    expect(v.errors.some((e) => e.includes("room.foo"))).toBe(true);
  });

  it("same successor inputs are deterministic", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const b = await previewGenesis(SUCCESSOR);
    expect(a.genesis_id).toBe(b.genesis_id);
    expect(a.cycle0_digest).toBe(b.cycle0_digest);
  });

  it("refuses product-path hash collision with the frozen genesis", async () => {
    await expect(
      previewGenesis({
        ...SUCCESSOR,
        world_seed: "17011984",
      }),
    ).rejects.toMatchObject({ code: "INVALID_SEED" });
  });

  it("refuses unknown explicit world_id this campaign", async () => {
    await expect(
      previewGenesis({ ...SUCCESSOR, world_id: "world.other" }),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("previews EWM_ENHANCED on product world.perihelion-reach-3", async () => {
    const a = await previewGenesis({
      world_name: "Perihelion Reach",
      world_seed: "ewm-product-20260821",
      profile_id: "EWM_ENHANCED",
      story_seed_ids: ["OLD_TRADE_NETWORK", "RESOURCE_CRISIS"],
      world_id: "world.perihelion-reach-3",
    });
    expect(a.world_id).toBe("world.perihelion-reach-3");
    expect(a.genesis_profile_id).toBe("EWM_ENHANCED");
    expect(a.validation.ok).toBe(true);
    expect(a.cycle0.ewm_features).toBe(true);
    expect(a.genesis_id).not.toBe("genesis.ef578f4ffceeccd0");
    expect(a.cycle0.rooms["room.civic-exchange"].entities.some((e) => e.entity_id === "entity.salvage-cache")).toBe(true);
  });

  it("previews EWM_ENHANCED on isolated test.hosted-canonical.ewm-cutover", async () => {
    const a = await previewGenesis({
      world_name: "Perihelion Reach",
      world_seed: "ewm-cutover-test-fixture",
      profile_id: "EWM_ENHANCED",
      story_seed_ids: ["OLD_TRADE_NETWORK", "RESOURCE_CRISIS"],
      world_id: "test.hosted-canonical.ewm-cutover",
    });
    expect(a.world_id).toBe("test.hosted-canonical.ewm-cutover");
    expect(a.genesis_profile_id).toBe("EWM_ENHANCED");
    expect(a.validation.ok).toBe(true);
    expect(a.cycle0.ewm_features).toBe(true);
    const salvage = a.cycle0.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.salvage-cache");
    expect(salvage?.regen_rate).toBeGreaterThanOrEqual(1.15);
    expect(salvage?.max_stock).toBeGreaterThanOrEqual(18);
    expect(a.cycle0.rooms["room.civic-exchange"].entities.some((e) => e.entity_id === "entity.production-node-ewm")).toBe(
      true,
    );
    expect(a.cycle0.institutions.filter((i) => i.id.startsWith("archetype.")).length).toBeGreaterThanOrEqual(3);
    expect((a.cycle0.initial_co_evolution as { protocol_strength?: Record<string, number> })?.protocol_strength?.["room.civic-exchange"]).toBe(1);
    expect(a.cycle0.signaling_styles?.archivist).toBe("grounded-first");
  });

  it("lands overlays on chamber rooms", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const ids = (room: string) => a.cycle0.rooms[room].entities.map((e) => e.entity_id);
    expect(ids("room.relay-quarter")).toContain("entity.relay-7");
    expect(ids("room.civic-exchange")).toContain("entity.old-market-post");
    expect(ids("room.civic-exchange")).toContain("entity.salvage-cache");
    const salvage = a.cycle0.rooms["room.civic-exchange"].entities.find(
      (e) => e.entity_id === "entity.salvage-cache",
    );
    expect(salvage).toMatchObject({
      entity_type: "NODE",
      stock_resource: "materials",
      stock_amount: 4,
    });
    expect(ids("room.archive")).toContain("entity.archive-ledger");
    expect(a.cycle0.rooms["room.archive"].entities.find((e) => e.entity_id === "entity.archive-ledger")?.entity_type).toBe(
      "ARTIFACT",
    );
  });

  it("seed entity_id wins on overlay collision", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const n = a.cycle0.rooms["room.archive"].entities.filter((e) => e.entity_id === "entity.archive-ledger").length;
    expect(n).toBe(1);
  });

  // Human command 403 is agent-play-scope.test.ts; successor preview does not change that contract.
  it("agent ENTER on successor Cycle 0 body lands in civic-exchange", async () => {
    const preview = await previewGenesis(SUCCESSOR);
    const world = cycle0ToWorld(preview.cycle0);
    expect(world.world_id).toBe("world.perihelion-reach-2");
    expect(world.entry_room_id).toBe("room.civic-exchange");
    expect(Object.keys(world.rooms).sort()).toEqual([...CHAMBER_MAP_ROOM_IDS].sort());
    expect(world.players).toEqual({});

    const principal = agentPrincipal("player.tester");
    const envelope: CommandEnvelope = { request_id: "req.enter-successor", command: "ENTER_WORLD", arguments: {} };
    const result = await applyWorldCommand(world, principal, envelope, async () => true);
    expect(result.ok).toBe(true);
    expect(world.players["player.tester"].room_id).toBe("room.civic-exchange");
    expect(world.players["player.tester"].entered).toBe(true);
    expect(world.players["player.tester"]).not.toHaveProperty("cargo");
    expect(world.players["player.tester"]).not.toHaveProperty("works");
    expect(world.players["player.tester"].budgets).toEqual(cloneBudgets(null));
    expect(Object.keys(world.players)).toEqual(["player.tester"]);
  });

  it("fills salvage-cache on a live successor Civic Exchange without touching frozen worlds", () => {
    const world = cycle0ToWorld({
      world_id: "world.perihelion-reach-2",
      world_name: "Perihelion Reach",
      world_seed: "x",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.civic-exchange",
      rooms: {
        "room.civic-exchange": {
          room_id: "room.civic-exchange",
          name: "Civic Exchange",
          description: "hub",
          exits: [],
          entities: [{ entity_id: "entity.old-market-post", label: "market-post", entity_type: "INFRASTRUCTURE" }],
        },
      },
      institutions: [],
      artifacts: [],
      tensions: [],
      scars: [],
      resources: [],
      opportunities: [],
    });
    expect(ensureSuccessorMaterialsCache(world)).toBe(true);
    const salvage = world.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.salvage-cache");
    expect(salvage).toMatchObject({ stock_resource: "materials", stock_amount: 4, entity_type: "NODE" });
    expect(ensureSuccessorMaterialsCache(world)).toBe(false);

    world.world_id = "world-01";
    world.rooms["room.civic-exchange"].entities = [
      { entity_id: "entity.old-market-post", label: "market-post", entity_type: "INFRASTRUCTURE" },
    ];
    expect(ensureSuccessorMaterialsCache(world)).toBe(false);
  });

  it("HARVEST of salvage-cache fills hold as materials, not energy", async () => {
    const preview = await previewGenesis(SUCCESSOR);
    const world = cycle0ToWorld(preview.cycle0);
    const principal = agentPrincipal("player.harvester");
    expect((await applyWorldCommand(world, principal, { request_id: "e", command: "ENTER_WORLD", arguments: {} }, async () => true)).ok).toBe(true);
    const pl = world.players[principal.player_id];
    const energy0 = pl.budgets.energy;
    const storage0 = pl.budgets.storage;
    const node = world.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.salvage-cache");
    expect(node?.stock_resource).toBe("materials");
    expect(node?.stock_amount).toBe(4);

    const harvested = await applyWorldCommand(
      world,
      principal,
      {
        request_id: "h",
        command: "COMMIT",
        arguments: { operation: "HARVEST", entity_id: "entity.salvage-cache", amount: 1 },
      },
      async () => true,
    );
    expect(harvested.ok).toBe(true);
    expect(harvested.observation?.consequence).toMatch(/Harvested 1 materials/i);
    expect(harvested.observation?.consequence).not.toMatch(/energy/i);
    expect(pl.budgets.energy).toBe(energy0 - 2);
    expect(pl.budgets.storage).toBe(storage0 - 1);
    expect(canConsumeCargo(pl.budgets.storage ?? 0, 1)).toBe(true);
    expect(world.rooms["room.civic-exchange"].entities.find((e) => e.entity_id === "entity.salvage-cache")?.stock_amount).toBe(3);
    expect(harvested.events?.some((e) => e.event_type === "RESOURCE_TRANSFER" && e.payload?.resource === "materials")).toBe(true);
  });
});
