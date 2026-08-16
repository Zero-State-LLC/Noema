import { describe, expect, it } from "vitest";
import {
  CONSTRUCTIBLE_CLASSES,
  MULTI_CYCLE_CLASS,
  isInProgress,
  isMultiCycleClass,
  liveClassInRoom,
  readyClassInRoom,
} from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s19",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [
          { direction: "east", to_room_id: "room.east" },
          { direction: "south", to_room_id: "room.south" },
        ],
        entities: [
          enrichEntity({
            entity_id: "entity.cell",
            label: "storage-cell",
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
        entities: [],
      },
      "room.south": {
        room_id: "room.south",
        name: "South Yard",
        description: "A public neighbor.",
        exits: [{ direction: "north", to_room_id: "room.hub" }],
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

describe("GC2-S19 mapper", () => {
  it("keeps relay as MULTI_CYCLE_CLASS, closes every constructible class, and stays silent", () => {
    expect(MULTI_CYCLE_CLASS).toBe("relay");
    for (const classId of CONSTRUCTIBLE_CLASSES) {
      expect(isMultiCycleClass(classId)).toBe(true);
    }
    expect(
      liveClassInRoom(
        [{ entity_id: "l", label: "link", entity_type: "INFRASTRUCTURE", infra_type: "route_link", in_progress: true }],
        "route_link",
      ),
    ).toBe(true);
    expect(
      readyClassInRoom(
        [{ entity_id: "l", label: "link", entity_type: "INFRASTRUCTURE", infra_type: "route_link", in_progress: true }],
        "route_link",
      ),
    ).toBe(false);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "PROMOTE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b/);
  });
});

describe("GC2-S19 world path", () => {
  it("constructs an IN_PROGRESS route link, then the same entity_id goes live after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/under construction/);
    expect(built.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_CREATE"]);
    expect(built.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    const created = w.rooms["room.hub"].entities.find((e) => e.infra_type === "route_link")!;
    expect(isInProgress(created)).toBe(true);
    expect(liveClassInRoom(w.rooms["room.hub"].entities, "route_link")).toBe(true);
    expect(readyClassInRoom(w.rooms["room.hub"].entities, "route_link")).toBe(false);
    const exitsBefore = JSON.stringify(w.rooms["room.hub"].exits);

    const again = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("SLOT_OCCUPIED");

    const connect = await run(w, p, "BUILD", {
      operation: "CONNECT",
      entity_id: created.entity_id,
      dest: "south",
    });
    expect(connect.ok).toBe(false);
    expect(connect.error?.code).toBe("FORBIDDEN");
    expect(JSON.stringify(w.rooms["room.hub"].exits)).toBe(exitsBefore);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const same = w.rooms["room.hub"].entities.find((e) => e.entity_id === created.entity_id)!;
    expect(isInProgress(same)).toBe(false);
    expect(readyClassInRoom(w.rooms["room.hub"].entities, "route_link")).toBe(true);
    expect(JSON.stringify(w.rooms["room.hub"].exits)).toBe(exitsBefore);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/STRUCTURE_/);
  });

  it("does not waive cargo MOVE until the same link is live", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 80, storage: 16 });
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    const harvested = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBeLessThan(16);

    const beforeShell = w.players[p.player_id].budgets.energy;
    const shelled = await run(w, p, "MOVE", { direction: "east" });
    expect(shelled.ok).toBe(true);
    expect(beforeShell - w.players[p.player_id].budgets.energy).toBe(2);
    expect(w.players[p.player_id].room_id).toBe("room.east");

    const back = await run(w, p, "MOVE", { direction: "west" });
    expect(back.ok).toBe(true);
    expect(w.players[p.player_id].room_id).toBe("room.hub");

    const opened = await run(w, p, "WAIT");
    expect(opened.ok).toBe(true);
    expect(isInProgress(w.rooms["room.hub"].entities.find((e) => e.infra_type === "route_link")!)).toBe(false);

    const beforeLive = w.players[p.player_id].budgets.energy;
    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(beforeLive - w.players[p.player_id].budgets.energy).toBe(1);
    expect(String(moved.observation?.consequence || "")).not.toMatch(/Carrying lots cost extra/);
  });

  it("salvages an in-progress route link with no scar and no live leftover", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    const entityId = w.rooms["room.hub"].entities.find((e) => e.infra_type === "route_link")!.entity_id;
    const storageBefore = w.players[p.player_id].budgets.storage;
    const torn = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(torn.ok).toBe(true);
    expect(torn.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === entityId)).toBeUndefined();
    expect(String(torn.observation?.consequence || "")).not.toMatch(/A scar remains/);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBefore + 2);

    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
