import { describe, expect, it } from "vitest";
import { MULTI_CYCLE_CLASS, isInProgress, isMultiCycleClass } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
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
    world_id: "test.hosted-canonical.gc2-s16",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.yard",
    rooms: {
      "room.yard": {
        room_id: "room.yard",
        name: "Yard",
        description: "Open ground.",
        exits: [],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC2-S16 mapper", () => {
  it("keeps relay as MULTI_CYCLE_CLASS, adds production_node, and stays silent", () => {
    expect(MULTI_CYCLE_CLASS).toBe("relay");
    expect(isMultiCycleClass("relay")).toBe(true);
    expect(isMultiCycleClass("workshop")).toBe(true);
    expect(isMultiCycleClass("generator")).toBe(true);
    expect(isMultiCycleClass("storage_bay")).toBe(true);
    expect(isMultiCycleClass("production_node")).toBe(true);
    expect(isMultiCycleClass("defensive_work")).toBe(false);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "PROMOTE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b/);
  });
});

describe("GC2-S16 world path", () => {
  it("constructs an IN_PROGRESS production node, then the same entity_id goes live after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "production_node" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/under construction/);
    expect(built.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_CREATE"]);
    expect(built.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    const created = w.rooms["room.yard"].entities[0];
    expect(created.infra_type).toBe("production_node");
    expect(isInProgress(created)).toBe(true);

    const again = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "production_node" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("SLOT_OCCUPIED");

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const same = w.rooms["room.yard"].entities.find((e) => e.entity_id === created.entity_id)!;
    expect(same).toBeTruthy();
    expect(isInProgress(same)).toBe(false);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/STRUCTURE_/);
  });

  it("salvages an in-progress production node with no scar and no live leftover", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "production_node" });
    expect(built.ok).toBe(true);
    const entityId = w.rooms["room.yard"].entities[0].entity_id;
    const storageBefore = w.players[p.player_id].budgets.storage;
    const torn = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(torn.ok).toBe(true);
    expect(torn.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    expect(w.rooms["room.yard"].entities).toHaveLength(0);
    expect(String(torn.observation?.consequence || "")).not.toMatch(/A scar remains/);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBefore + 2);

    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "production_node" });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
