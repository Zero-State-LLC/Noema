import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { isHiddenRoom } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { layoutPublicTopology, type PhosphorRoom } from "../src/watch-phosphor";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const PRODUCT_ROOMS = [
  "room.civic-exchange",
  "room.relay-quarter",
  "room.foundry-corridor",
  "room.transit-ring",
  "room.infrastructure-vault",
  "room.archive",
  "room.outer-works",
  "room.storage-district",
  "room.generator-hall",
  "room.frontier-gate",
] as const;

function principal(id: string): PlayerPrincipal {
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

function chamberWorld(): WorldRuntime {
  const rooms: WorldRuntime["rooms"] = {};
  for (const id of PRODUCT_ROOMS) {
    rooms[id] = {
      room_id: id,
      name: id.replace("room.", "").replace(/-/g, " "),
      description: "Public floor.",
      exits: [],
      entities: [],
    };
  }
  rooms["room.civic-exchange"].exits = [{ direction: "north", to_room_id: "room.relay-quarter" }];
  rooms["room.civic-exchange"].entities = [
    enrichEntity({
      entity_id: "entity.desk",
      label: "public-desk",
      entity_type: "PROP",
    }),
  ];
  rooms["room.relay-quarter"].exits = [{ direction: "south", to_room_id: "room.civic-exchange" }];
  rooms["room.vault"] = {
    room_id: "room.vault",
    name: "Sealed Vault",
    description: "Not a public node.",
    hidden: true,
    tags: ["hidden"],
    exits: [{ direction: "east", to_room_id: "room.civic-exchange" }],
    entities: [],
  };
  return {
    world_id: "test.hosted-canonical.adr007",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.civic-exchange",
    rooms,
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

describe("ADR-007 atomic rooms", () => {
  it("rejects MOVE to an id that is not an exit destination", async () => {
    const w = chamberWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const missed = await run(w, p, "MOVE", { direction: "room.archive" });
    expect(missed.ok).toBe(false);
    expect(missed.error?.code).toBe("MOVE_REJECTED");
    expect(missed.error?.message).toBe("There is no exit room.archive from here.");
    expect(JSON.stringify(missed)).not.toMatch(/area\.|sub-room|nested/i);
    expect(w.players[p.player_id].room_id).toBe("room.civic-exchange");
  });

  it("rejects INSPECT of a nested area id and does not emit nested location", async () => {
    const w = chamberWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const bad = await run(w, p, "INSPECT", { entity_id: "area.archive-rear" });
    expect(bad.ok).toBe(false);
    expect(bad.error?.code).toBe("INSPECT_FAILED");
    expect(bad.observation).toBeUndefined();
    const look = await run(w, p, "LOOK");
    const loc = look.observation?.location as Record<string, unknown> | undefined;
    expect(loc?.room_id).toBe("room.civic-exchange");
    expect(loc).not.toHaveProperty("area_id");
    expect(loc).not.toHaveProperty("nested_room_id");
    expect(JSON.stringify(look.observation || {})).not.toMatch(/area\.|sub_room|nested_room/i);
  });

  it("WATCH Phosphor emits at most one node per public room", () => {
    const w = chamberWorld();
    const publicIds = Object.values(w.rooms)
      .filter((r) => !isHiddenRoom(r))
      .map((r) => r.room_id)
      .sort();
    expect(publicIds).toHaveLength(10);
    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: 0,
      sequence: 1,
      rooms: w.rooms,
      players: [],
      events: [],
      now: 1_700_000_000_000,
    });
    const layout = layoutPublicTopology(snap.rooms as PhosphorRoom[]);
    expect(layout.nodes).toHaveLength(publicIds.length);
    expect(layout.nodes.map((n) => n.room_id).sort()).toEqual(publicIds);
    expect(new Set(layout.nodes.map((n) => n.room_id)).size).toBe(publicIds.length);
    expect(JSON.stringify(layout)).not.toMatch(/room\.vault|area\./i);
  });
});
