import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
import { isHiddenRoom } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { layoutPublicTopology, type PhosphorRoom } from "../src/watch-phosphor";
import type { CommandEnvelope, Observation, PlayerPrincipal } from "../src/types";

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

const HIDDEN_DEST = "room.vault";
const HIDDEN_DIR = "west";
const MISSING_DIR = "up";
const SECRET_PROSE = "Hidden west door to the Sealed Vault.";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAMBER_ROOM_IDS = JSON.parse(
  readFileSync(join(HERE, "fixtures/adr-006-chamber-rooms.json"), "utf8"),
) as string[];
const V01_SEED = join(HERE, "../../../fixtures/v01-seed/world-seed.json");

type SeedRoom = { room_id?: string; hidden?: boolean; tags?: string[] };

function loadJson(path: string): { rooms?: SeedRoom[] } {
  return JSON.parse(readFileSync(path, "utf8")) as { rooms?: SeedRoom[] };
}

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

function isolatedWorld(): WorldRuntime {
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
    { direction: HIDDEN_DIR, to_room_id: HIDDEN_DEST, hidden: true },
  ];
  rooms["room.civic-exchange"].entities = [
    {
      entity_id: "entity.scrap-note",
      label: "scrap note",
      entity_type: "ARTIFACT",
    },
  ];
  rooms["room.relay-quarter"].exits = [{ direction: "south", to_room_id: "room.civic-exchange" }];
  rooms[HIDDEN_DEST] = {
    room_id: HIDDEN_DEST,
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function publicRoomIds(w: WorldRuntime): string[] {
  return Object.values(w.rooms)
    .filter((r) => !isHiddenRoom(r))
    .map((r) => r.room_id)
    .sort();
}

function listedDests(obs: Observation | undefined): string[] {
  return (obs?.location?.exits || []).map((x) => String(x.to_room_id || "")).filter(Boolean);
}

function listedDirs(obs: Observation | undefined): string[] {
  return (obs?.location?.exits || []).map((x) => String(x.direction || "").toLowerCase()).filter(Boolean);
}

function moveAffordances(obs: Observation | undefined): string {
  return (obs?.affordances || [])
    .filter((a) => a.action === "MOVE" || a.verb === "MOVE")
    .map((a) => `${a.cmd || ""} ${a.label || ""} ${a.target_id || ""}`)
    .join(" ");
}

function assertNoHiddenRoute(obs: Observation | undefined) {
  expect(listedDests(obs)).not.toContain(HIDDEN_DEST);
  expect(listedDirs(obs)).not.toContain(HIDDEN_DIR);
  expect(moveAffordances(obs)).not.toMatch(/west|vault/i);
  const actions = JSON.stringify(obs?.available_actions || []);
  expect(actions).not.toMatch(/vault|west/i);
  const blob = JSON.stringify({
    exits: obs?.location?.exits || [],
    available_actions: obs?.available_actions || [],
    affordances: obs?.affordances || [],
  });
  expect(blob).not.toMatch(/room\.vault|"hidden"|Sealed Vault/i);
}

describe("ADR-006 world bound and exit visibility", () => {
  it("pins hosted chamber-world public rooms at exactly 10", () => {
    expect(PRODUCT_ROOMS).toHaveLength(10);
    expect(new Set(PRODUCT_ROOMS).size).toBe(10);

    expect(CHAMBER_ROOM_IDS).toHaveLength(10);
    expect([...CHAMBER_ROOM_IDS].sort()).toEqual([...PRODUCT_ROOMS].sort());

    const v01 = loadJson(V01_SEED);
    expect((v01.rooms || []).length).toBe(4);

    const w = isolatedWorld();
    expect(publicRoomIds(w)).toEqual([...PRODUCT_ROOMS].sort());
    expect(w.world_id.startsWith("test.hosted-canonical.")).toBe(true);
  });

  it("omits hidden exits from observation, AVAILABLE_ACTIONS, WATCH, and Phosphor", async () => {
    const w = isolatedWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    expect(listedDests(look.observation)).toEqual(["room.relay-quarter"]);
    assertNoHiddenRoute(look.observation);

    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms,
      players: [],
      events: [],
      now: 1_700_000_000_000,
    });
    expect(JSON.stringify(snap)).not.toMatch(/room\.vault|Sealed Vault|"hidden"/i);
    const watchExits = (snap.rooms || []).flatMap(
      (r: { exits?: Array<{ direction?: string; to_room_id?: string }> }) => r.exits || [],
    );
    expect(watchExits.map((x) => x.to_room_id)).not.toContain(HIDDEN_DEST);
    expect(watchExits.map((x) => String(x.direction || "").toLowerCase())).not.toContain(HIDDEN_DIR);

    const layout = layoutPublicTopology(snap.rooms as PhosphorRoom[]);
    expect(layout.nodes.map((n) => n.room_id).sort()).toEqual([...PRODUCT_ROOMS].sort());
    expect(layout.edges.some((e) => e.to === HIDDEN_DEST || e.from === HIDDEN_DEST)).toBe(false);
    expect(JSON.stringify(layout)).not.toMatch(/room\.vault|Sealed Vault|"hidden"/i);
    expect(layout.edges.some((e) => e.dashed)).toBe(false);
  });

  it("rejects MOVE on a hidden direction with the same code as a missing exit", async () => {
    const w = isolatedWorld();
    const p = principal("player.sable");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const hidden = await run(w, p, "MOVE", { direction: HIDDEN_DIR });
    const missing = await run(w, p, "MOVE", { direction: MISSING_DIR });
    expect(hidden.ok).toBe(false);
    expect(missing.ok).toBe(false);
    expect(hidden.error?.code).toBe("MOVE_REJECTED");
    expect(missing.error?.code).toBe(hidden.error?.code);
    expect(hidden.error?.message).toBe(`There is no exit ${HIDDEN_DIR} from here.`);
    expect(missing.error?.message).toBe(`There is no exit ${MISSING_DIR} from here.`);
    expect(JSON.stringify(hidden)).not.toMatch(/hidden|secret|vault/i);
    expect(JSON.stringify(missing)).not.toMatch(/hidden|secret|vault/i);
    expect(hidden.error?.code).toBe(missing.error?.code);
    expect(Object.keys(hidden.error || {}).sort()).toEqual(Object.keys(missing.error || {}).sort());
  });

  it("does not add a hidden exit after MESSAGE, board, or artifact prose", async () => {
    const w = isolatedWorld();
    const a = principal("player.alpha");
    const b = principal("player.beta");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const sent = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: SECRET_PROSE,
    });
    expect(sent.ok).toBe(true);
    const afterMsg = await run(w, b, "OBSERVE");
    expect(listedDests(afterMsg.observation)).toEqual(["room.relay-quarter"]);
    assertNoHiddenRoute(afterMsg.observation);

    const posted = await run(w, a, "MESSAGE", { surface: "BOARD", text: SECRET_PROSE });
    expect(posted.ok).toBe(true);
    const afterBoard = await run(w, b, "OBSERVE");
    expect(listedDests(afterBoard.observation)).toEqual(["room.relay-quarter"]);
    assertNoHiddenRoute(afterBoard.observation);

    const inspected = await run(w, b, "INSPECT", { entity_id: "entity.scrap-note" });
    expect(inspected.ok).toBe(true);
    const afterInspect = await run(w, b, "OBSERVE");
    expect(listedDests(afterInspect.observation)).toEqual(["room.relay-quarter"]);
    assertNoHiddenRoute(afterInspect.observation);
  });

  it("keeps first agent OBSERVE local — no full room or exit graph", async () => {
    const w = isolatedWorld();
    const p = principal("player.sable");
    const joined = await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const first = await run(w, p, "OBSERVE");
    expect(first.ok).toBe(true);
    expect(first.observation?.location?.room_id).toBe("room.civic-exchange");
    expect(first.observation?.location?.exits || []).toHaveLength(1);
    expect(listedDests(first.observation)).toEqual(["room.relay-quarter"]);
    assertNoHiddenRoute(first.observation);
    assertNoHiddenRoute(joined.observation);

    const blobs = [JSON.stringify(joined.observation || {}), JSON.stringify(first.observation || {})];
    for (const blob of blobs) {
      for (const id of PRODUCT_ROOMS) {
        if (id === "room.civic-exchange" || id === "room.relay-quarter") continue;
        expect(blob).not.toContain(id);
      }
      expect(blob).not.toContain(HIDDEN_DEST);
      expect(blob).not.toMatch(/full.?graph|all rooms|world map/i);
    }
    const moveCmds = (first.observation?.affordances || [])
      .filter((a) => a.action === "MOVE" && a.available !== false)
      .map((a) => a.cmd);
    expect(moveCmds).toEqual(["move north"]);
  });
});
