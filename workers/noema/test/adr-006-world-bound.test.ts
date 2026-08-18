import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
import { isHiddenRoom } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { layoutPublicTopology, type PhosphorRoom } from "../src/watch-phosphor";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/** CHAMBER-MAP product set. Hosted first world is exactly these 10 rooms. */
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
  rooms["room.civic-exchange"].exits = [
    { direction: "north", to_room_id: "room.relay-quarter" },
    { direction: "west", to_room_id: "room.vault", hidden: true },
  ];
  rooms["room.relay-quarter"].exits = [{ direction: "south", to_room_id: "room.civic-exchange" }];
  rooms["room.vault"] = {
    room_id: "room.vault",
    name: "Sealed Vault",
    description: "Not for spectators.",
    hidden: true,
    tags: ["hidden"],
    exits: [{ direction: "east", to_room_id: "room.civic-exchange" }],
    entities: [],
  };
  return {
    world_id: "test.hosted-canonical.adr006",
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

describe("ADR-006 world bound and exit visibility", () => {
  it("pins the hosted product map at exactly 10 public rooms", () => {
    expect(PRODUCT_ROOMS).toHaveLength(10);
    expect(new Set(PRODUCT_ROOMS).size).toBe(10);
    const w = chamberWorld();
    const publicIds = Object.values(w.rooms)
      .filter((r) => !isHiddenRoom(r))
      .map((r) => r.room_id)
      .sort();
    expect(publicIds).toEqual([...PRODUCT_ROOMS].sort());
  });

  it("omits hidden exits from observation, AVAILABLE_ACTIONS, WATCH, and Phosphor", async () => {
    const w = chamberWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    const exits = look.observation?.location?.exits || [];
    expect(exits.map((x: { to_room_id?: string }) => x.to_room_id)).toEqual(["room.relay-quarter"]);
    expect(JSON.stringify(look.observation || {})).not.toMatch(/room\.vault|Sealed Vault|"hidden"/i);
    expect(JSON.stringify(look.observation?.available_actions || [])).not.toMatch(/vault|west/i);

    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms,
      players: [],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(JSON.stringify(snap)).not.toMatch(/room\.vault|Sealed Vault/i);
    const layout = layoutPublicTopology(snap.rooms as PhosphorRoom[]);
    expect(layout.nodes.map((n) => n.room_id).sort()).toEqual([...PRODUCT_ROOMS].sort());
    expect(JSON.stringify(layout)).not.toMatch(/room\.vault|Sealed Vault/i);
  });

  it("rejects MOVE on a hidden direction with the same code as a missing exit", async () => {
    const w = chamberWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const hidden = await run(w, p, "MOVE", { direction: "west" });
    const missing = await run(w, p, "MOVE", { direction: "up" });
    expect(hidden.ok).toBe(false);
    expect(missing.ok).toBe(false);
    expect(hidden.error?.code).toBe("MOVE_REJECTED");
    expect(missing.error?.code).toBe(hidden.error?.code);
    expect(hidden.error?.message).toBe("There is no exit west from here.");
    expect(missing.error?.message).toBe("There is no exit up from here.");
    expect(JSON.stringify(hidden)).not.toMatch(/hidden|secret|vault/i);
    expect(JSON.stringify(missing)).not.toMatch(/hidden|secret|vault/i);
  });

  it("does not add a hidden exit to a recipient after MESSAGE prose", async () => {
    const w = chamberWorld();
    const a = principal("player.alpha");
    const b = principal("player.beta");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const sent = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "Hidden west door to the Sealed Vault.",
    });
    expect(sent.ok).toBe(true);
    const look = await run(w, b, "LOOK");
    const exits = look.observation?.location?.exits || [];
    expect(exits.map((x: { to_room_id?: string }) => x.to_room_id)).toEqual(["room.relay-quarter"]);
    expect(JSON.stringify(look.observation?.location || {})).not.toMatch(/room\.vault|west/i);
  });

  it("keeps first LOOK local — no full graph dump", async () => {
    const w = chamberWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    const blob = JSON.stringify(look.observation || {});
    expect(look.observation?.location?.room_id).toBe("room.civic-exchange");
    expect(look.observation?.location?.exits || []).toHaveLength(1);
    for (const id of PRODUCT_ROOMS) {
      if (id === "room.civic-exchange" || id === "room.relay-quarter") continue;
      expect(blob).not.toContain(id);
    }
    expect(blob).not.toContain("room.vault");
  });
});
