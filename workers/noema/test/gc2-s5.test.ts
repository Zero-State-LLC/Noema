import { describe, expect, it } from "vitest";
import { UPGRADE_COST, withWorkshopStorage, workshopStorageDiscount } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s5",
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

describe("GC2-S5 mapper", () => {
  it("parses upgrade and keeps help quiet", () => {
    const parsed = parseHumanCommand("upgrade workshop");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments.operation).toBe("UPGRADE");
    }
    expect(workshopStorageDiscount([{ entity_id: "w", label: "workshop", entity_type: "INFRASTRUCTURE", infra_type: "workshop", upgrade_tier: 1 }])).toBe(2);
    expect(withWorkshopStorage({ storage: 5 }, 2).storage).toBe(3);
    expect(UPGRADE_COST).toEqual({ energy: 4, compute: 2, storage: 2, influence: 1 });
    expect(helpText()).not.toMatch(/\bBUILD\b|\bupgrade\b/i);
  });
});

describe("GC2-S5 world path", () => {
  it("upgrades an owned workshop once and saves 2 storage", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const first = await run(w, p, "BUILD", { operation: "UPGRADE", entity_id: shop.entity_id });
    expect(first.ok).toBe(true);
    expect(first.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(first.events || [])).not.toMatch(/STRUCTURE_/);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)?.upgrade_tier).toBe(1);
    expect(first.observation?.consequence).toMatch(/upgraded/i);

    const again = await run(w, p, "BUILD", { operation: "UPGRADE", entity_id: shop.entity_id });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("FORBIDDEN");

    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const storageBefore = w.players[p.player_id].budgets.storage;
    const gen = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "generator" });
    expect(gen.ok).toBe(true);
    expect(storageBefore - w.players[p.player_id].budgets.storage).toBe(3);

    const relay = await run(w, p, "BUILD", { operation: "UPGRADE", entity_id: "entity.relay-a" });
    expect(relay.ok).toBe(false);
    expect(relay.error?.code).toBe("FORBIDDEN");
  });

  it("rejects hidden-room upgrade", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "BUILD", { operation: "UPGRADE", entity_id: "entity.workshop.x" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
