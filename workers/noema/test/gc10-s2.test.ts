import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText, isRepairable } from "../src/actions";
import { scarFromDismantle } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
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
    world_id: "test.hosted-canonical.gc10-s2",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "Empty.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-hidden",
            label: "vault-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 80,
            owner_id: "player.nacre",
            infra_type: "relay",
          }),
        ],
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

describe("GC10-S2 mapper", () => {
  it("marks scars irreparable and keeps help quiet", () => {
    const scar = scarFromDismantle("relay");
    expect(scar.entity_type).toBe("RUIN");
    expect(scar.scar).toBe(true);
    expect(isRepairable(scar)).toBe(false);
    expect(scar.label).toBe("scarred-relay");
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bCONTEST\b|\bATTEST\b|\bWED\b/);
    expect(helpText()).not.toMatch(/\bWED\b/);
  });
});

describe("GC10-S2 world path", () => {
  it("leaves a public scar after dismantle and none in a hidden room", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, p, "MOVE", { direction: "east" });
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(built.ok).toBe(true);
    await run(w, p, "WAIT");
    const entityId = w.rooms["room.east"].entities[0].entity_id;
    const torn = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(torn.ok).toBe(true);
    expect(torn.observation?.consequence).toMatch(/A scar remains/);
    const leftover = w.rooms["room.east"].entities;
    expect(leftover).toHaveLength(1);
    expect(leftover[0].scar).toBe(true);
    expect(leftover[0].entity_type).toBe("RUIN");
    expect(JSON.stringify(leftover[0])).not.toContain("room.vault");
    const repair = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: leftover[0].entity_id });
    expect(repair.ok).toBe(false);
    expect(repair.error?.code).toBe("FORBIDDEN");

    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: "entity.relay-hidden" });
    expect(hidden.ok).toBe(true);
    expect(w.rooms["room.vault"].entities).toHaveLength(0);
    expect(String(hidden.observation?.consequence || "")).not.toMatch(/A scar remains/);
  });
});
