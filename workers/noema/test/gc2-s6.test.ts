import { describe, expect, it } from "vitest";
import {
  REPURPOSE_COST,
  REPURPOSE_FROM_CLASS,
  REPURPOSE_TO_CLASS,
  infraClassOf,
} from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s6",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-a",
            label: "north-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          }),
        ],
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

describe("GC2-S6 mapper", () => {
  it("parses repurpose and keeps help quiet", () => {
    const parsed = parseHumanCommand("repurpose workshop");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments.operation).toBe("REPURPOSE");
    }
    expect(REPURPOSE_FROM_CLASS).toBe("workshop");
    expect(REPURPOSE_TO_CLASS).toBe("storage_bay");
    expect(REPURPOSE_COST).toEqual({ energy: 4, compute: 2, storage: 2, influence: 1 });
    expect(helpText()).not.toMatch(/\bBUILD\b|\brepurpose\b/i);
    expect(helpText()).not.toMatch(/\bCONTEST\b|\bWED\b|\bATTEST\b/);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "REPURPOSE" })).toBeNull();
  });
});

describe("GC2-S6 world path", () => {
  it("repurposes an owned public workshop as a storage bay and keeps entity_id", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const opened = await run(w, p, "WAIT");
    expect(opened.ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets };

    const first = await run(w, p, "BUILD", { operation: "REPURPOSE", entity_id: shop.entity_id });
    expect(first.ok).toBe(true);
    expect(first.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(first.events || [])).not.toMatch(/STRUCTURE_/);
    expect(first.observation?.consequence).toBe("The workshop was repurposed as a storage bay.");

    const same = w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id);
    expect(same).toBeTruthy();
    expect(infraClassOf(same!)).toBe("storage_bay");
    expect(same?.infra_type).toBe("storage_bay");
    expect(w.rooms["room.hub"].entities.filter((e) => e.entity_id === shop.entity_id)).toHaveLength(1);

    expect(before.energy - w.players[p.player_id].budgets.energy).toBe(4);
    expect(before.compute - w.players[p.player_id].budgets.compute).toBe(2);
    expect(before.storage - w.players[p.player_id].budgets.storage).toBe(2);
    expect(before.influence - w.players[p.player_id].budgets.influence).toBe(1);

    const again = await run(w, p, "BUILD", { operation: "REPURPOSE", entity_id: shop.entity_id });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("FORBIDDEN");

    const bay = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "storage_bay" });
    expect(bay.ok).toBe(false);
    expect(bay.error?.code).toBe("SLOT_OCCUPIED");

    const relay = await run(w, p, "BUILD", { operation: "REPURPOSE", entity_id: "entity.relay-a" });
    expect(relay.ok).toBe(false);
    expect(relay.error?.code).toBe("FORBIDDEN");
  });

  it("rejects hidden-room and non-owner repurpose", async () => {
    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "BUILD", { operation: "REPURPOSE", entity_id: "entity.workshop.x" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");

    const w = world();
    const owner = principal("player.nacre");
    const other = principal("player.other");
    await run(w, owner, "ENTER_WORLD");
    w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, owner, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const opened = await run(w, owner, "WAIT");
    expect(opened.ok).toBe(true);
    await run(w, other, "ENTER_WORLD");
    w.players[other.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const stolen = await run(w, other, "BUILD", { operation: "REPURPOSE", entity_id: shop.entity_id });
    expect(stolen.ok).toBe(false);
    expect(stolen.error?.code).toBe("NOT_OWNER");
    expect(infraClassOf(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)!)).toBe("workshop");
  });
});
