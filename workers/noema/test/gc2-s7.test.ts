import { describe, expect, it } from "vitest";
import { ABANDON_AFTER_CYCLES, shouldAbandon } from "../src/construction";
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
    world_id: "test.hosted-canonical.gc2-s7",
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

describe("GC2-S7 mapper", () => {
  it("abandons at 12 idle cycles and keeps help quiet", () => {
    expect(ABANDON_AFTER_CYCLES).toBe(12);
    expect(
      shouldAbandon(
        { entity_id: "w", label: "workshop", entity_type: "INFRASTRUCTURE", infra_type: "workshop", last_steward_cycle: 0 },
        12,
      ),
    ).toBe(true);
    expect(
      shouldAbandon(
        { entity_id: "w", label: "workshop", entity_type: "INFRASTRUCTURE", infra_type: "workshop", last_steward_cycle: 0 },
        11,
      ),
    ).toBe(false);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "ABANDON" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b|\bunclaimed\b|\babandon/i);
  });
});

describe("GC2-S7 world path", () => {
  it("marks a neglected workshop UNCLAIMED and lets a stranger dismantle it", async () => {
    const w = world();
    const owner = principal("player.nacre");
    const other = principal("player.vesper");
    await run(w, owner, "ENTER_WORLD");
    w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, owner, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    expect(shop.last_steward_cycle).toBe(0);
    expect(shop.unclaimed).toBeFalsy();

    w.cycle = 11;
    const waited = await run(w, owner, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(12);
    const left = w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)!;
    expect(left.unclaimed).toBe(true);
    expect(left.owner_id).toBe(owner.player_id);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/STRUCTURE_/);

    const look = await run(w, owner, "LOOK");
    expect(look.observation?.unclaimed_lines?.join(" ")).toMatch(/unclaimed/i);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-a")?.unclaimed).toBeFalsy();

    await run(w, other, "ENTER_WORLD");
    w.players[other.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const stolen = await run(w, other, "BUILD", { operation: "DISMANTLE", entity_id: shop.entity_id });
    expect(stolen.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)).toBeUndefined();
  });

  it("resets idle on owner REPAIR and never abandons hidden rooms", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    shop.condition = 40;
    const repaired = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: shop.entity_id });
    expect(repaired.ok).toBe(true);
    expect(shop.last_steward_cycle).toBe(0);
    w.cycle = 10;
    await run(w, p, "WAIT");
    expect(w.cycle).toBe(11);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)?.unclaimed).toBeFalsy();

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    hidden.rooms["room.vault"].entities = [
      enrichEntity({
        entity_id: "entity.workshop.hide",
        label: "workshop",
        entity_type: "INFRASTRUCTURE",
        infra_type: "workshop",
        owner_id: q.player_id,
        last_steward_cycle: 0,
      }),
    ];
    hidden.cycle = 11;
    await run(hidden, q, "WAIT");
    expect(hidden.rooms["room.vault"].entities[0].unclaimed).toBeFalsy();
  });
});
