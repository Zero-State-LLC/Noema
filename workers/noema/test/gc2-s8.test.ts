import { describe, expect, it } from "vitest";
import { CONSTRUCT_COSTS, RESTORE_CONDITION_CAP } from "../src/construction";
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
    world_id: "test.hosted-canonical.gc2-s8",
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

describe("GC2-S8 mapper", () => {
  it("parses restore and keeps help quiet", () => {
    const parsed = parseHumanCommand("restore workshop");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments.operation).toBe("RESTORE");
    }
    expect(RESTORE_CONDITION_CAP).toBe(50);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "RESTORE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b|\brestore\b/i);
  });
});

describe("GC2-S8 world path", () => {
  it("lets the owner restore UNCLAIMED and rejects scars and strangers", async () => {
    const w = world();
    const owner = principal("player.nacre");
    const other = principal("player.vesper");
    await run(w, owner, "ENTER_WORLD");
    w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, owner, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const opened = await run(w, owner, "WAIT");
    expect(opened.ok).toBe(true);
    w.cycle = 12;
    await run(w, owner, "WAIT");
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)?.unclaimed).toBe(true);

    await run(w, other, "ENTER_WORLD");
    w.players[other.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const stolen = await run(w, other, "BUILD", { operation: "RESTORE", entity_id: shop.entity_id });
    expect(stolen.ok).toBe(false);
    expect(stolen.error?.code).toBe("NOT_OWNER");

    w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const storageBefore = w.players[owner.player_id].budgets.storage;
    const restored = await run(w, owner, "BUILD", { operation: "RESTORE", entity_id: shop.entity_id });
    expect(restored.ok).toBe(true);
    expect(restored.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(restored.events || [])).not.toMatch(/STRUCTURE_/);
    expect(restored.observation?.consequence).toMatch(/restored/i);
    const same = w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)!;
    expect(same.unclaimed).toBeFalsy();
    expect(same.infra_type).toBe("workshop");
    expect(same.condition).toBe(50);
    expect(storageBefore - w.players[owner.player_id].budgets.storage).toBe(CONSTRUCT_COSTS.workshop.storage);

    const again = await run(w, owner, "BUILD", { operation: "RESTORE", entity_id: shop.entity_id });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("FORBIDDEN");

    const look = await run(w, owner, "LOOK");
    expect(look.observation?.unclaimed_lines || []).toHaveLength(0);

    w.rooms["room.hub"].entities.push(
      enrichEntity({
        entity_id: "entity.scar.x",
        label: "scarred-workshop",
        entity_type: "RUIN",
        scar: true,
        condition: 0,
      }),
    );
    const scarred = await run(w, owner, "BUILD", { operation: "RESTORE", entity_id: "entity.scar.x" });
    expect(scarred.ok).toBe(false);
    expect(scarred.error?.code).toBe("FORBIDDEN");
  });

  it("rejects hidden-room restore", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "BUILD", { operation: "RESTORE", entity_id: "entity.workshop.x" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
