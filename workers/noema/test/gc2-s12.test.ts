import { describe, expect, it } from "vitest";
import { CONNECT_COST } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s12",
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
          { direction: "south", to_room_id: "room.south" },
          { direction: "east", to_room_id: "room.oneway" },
          { direction: "down", to_room_id: "room.vault", hidden: true },
        ],
        entities: [],
      },
      "room.south": {
        room_id: "room.south",
        name: "South Court",
        description: "Open.",
        exits: [{ direction: "north", to_room_id: "room.hub" }],
        entities: [],
      },
      "room.oneway": {
        room_id: "room.oneway",
        name: "Dead End",
        description: "No way back.",
        exits: [],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [{ direction: "up", to_room_id: "room.hub" }],
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

describe("GC2-S12 mapper", () => {
  it("parses connect and keeps help quiet", () => {
    const parsed = parseHumanCommand("connect route-link to south");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments).toEqual({
        operation: "CONNECT",
        entity_id: "route-link",
        dest: "south",
      });
    }
    expect(CONNECT_COST).toEqual({ compute: 1 });
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "CONNECT" })).toBeNull();
    expect(helpText()).not.toMatch(/\bCONNECT\b|\bconnect\b/i);
  });
});

describe("GC2-S12 world path", () => {
  it("pins a public two-way dest and rejects hidden, one-way, and strangers", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    const opened = await run(w, a, "WAIT");
    expect(opened.ok).toBe(true);
    await run(w, b, "ENTER_WORLD");
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const link = w.rooms["room.hub"].entities.find((e) => e.infra_type === "route_link")!;
    const exitsBefore = JSON.stringify(w.rooms["room.hub"].exits);

    const stranger = await run(w, b, "BUILD", {
      operation: "CONNECT",
      entity_id: link.entity_id,
      dest: "south",
    });
    expect(stranger.ok).toBe(false);
    expect(stranger.error?.code).toBe("NOT_OWNER");

    const hidden = await run(w, a, "BUILD", {
      operation: "CONNECT",
      entity_id: link.entity_id,
      dest: "room.vault",
    });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
    expect(hidden.error?.message).toBe("That way is not a public route.");

    const oneWay = await run(w, a, "BUILD", {
      operation: "CONNECT",
      entity_id: link.entity_id,
      dest: "east",
    });
    expect(oneWay.ok).toBe(false);
    expect(oneWay.error?.code).toBe(hidden.error?.code);
    expect(oneWay.error?.message).toBe(hidden.error?.message);

    const pinned = await run(w, a, "BUILD", {
      operation: "CONNECT",
      entity_id: link.entity_id,
      dest: "south",
    });
    expect(pinned.ok).toBe(true);
    expect(pinned.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(pinned.events || [])).not.toMatch(/STRUCTURE_/);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === link.entity_id)?.dest_room_id).toBe(
      "room.south",
    );
    expect(JSON.stringify(w.rooms["room.hub"].exits)).toBe(exitsBefore);
    expect(pinned.observation?.consequence).toMatch(/faces South Court/);
  });
});
