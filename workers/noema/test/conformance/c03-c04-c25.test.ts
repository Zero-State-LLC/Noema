import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../../src/world-actions";
import { bootstrapWorldState } from "../../src/world-do";
import { buildWatchLive, type WatchRoomIn } from "../../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../../src/types";
import { adminToken, hit, hitWatchLive, playerToken, worldDoCalls, type DoCall } from "./harness";
import {
  MINI_DEADEND_ROOM_ID,
  MINI_ENTRY_ROOM_ID,
  MINI_HALL_ROOM_ID,
  miniChamberState,
} from "./mini-chamber";

function principal(id = "player.probe"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.hosted-h2",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

async function run(
  w: WorldRuntime,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
  p: PlayerPrincipal = principal(),
) {
  const envl: CommandEnvelope = {
    request_id: key || `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function blobOf(value: unknown): string {
  return JSON.stringify(value);
}

describe("mini chamber seed", () => {
  it("uses isolated rooms and never names Perihelion", () => {
    const w = miniChamberState("test.hosted-canonical.c04");
    expect(w.entry_room_id).toBe(MINI_ENTRY_ROOM_ID);
    expect(Object.keys(w.rooms).sort()).toEqual(
      [MINI_DEADEND_ROOM_ID, MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID].sort(),
    );
    const blob = blobOf(w);
    expect(blob).not.toMatch(/perihelion|civic-exchange|relay-quarter|transit-ring|infra-vault/i);
    expect(w.rooms[MINI_DEADEND_ROOM_ID].hidden).toBe(true);
  });

  it("bootstraps admitted test worlds onto the mini chamber, not the demo", () => {
    const isolated = bootstrapWorldState("test.hosted-canonical.h2-seed");
    expect(isolated.entry_room_id).toBe(MINI_ENTRY_ROOM_ID);
    expect(isolated.world_name).toBe("Mini Chamber");
    expect(blobOf(isolated)).not.toMatch(/relay-quarter|perihelion/i);

    const demo = bootstrapWorldState("world-01");
    expect(demo.entry_room_id).toBe("room.relay-quarter");
  });
});

describe("C03 idempotent action replay", () => {
  it("replays ENTER + MOVE with the same key as one ledger event", async () => {
    const w = miniChamberState("test.hosted-canonical.c03");
    const enterKey = "idem.enter.1";
    const moveKey = "idem.move.1";

    const enter1 = await run(w, "ENTER_WORLD", {}, enterKey);
    const enter2 = await run(w, "ENTER_WORLD", {}, enterKey);
    expect(enter1.ok).toBe(true);
    expect(enter2.ok).toBe(true);
    expect(enter1.events?.map((e) => e.event_id)).toEqual(enter2.events?.map((e) => e.event_id));
    expect(enter1.events?.map((e) => e.event_type)).toEqual(["AGENT_ENTERED_WORLD"]);
    expect(enter1.events?.[0]?.sequence).toBe(0);
    expect(enter1.events?.[0]?.event_id).toBe("evt.tw.c03.000000");

    const move1 = await run(w, "MOVE", { direction: "east" }, moveKey);
    const seqAfterFirst = w.sequence;
    const roomAfterFirst = w.players[principal().player_id].room_id;
    const move2 = await run(w, "MOVE", { direction: "east" }, moveKey);

    expect(move1.ok).toBe(true);
    expect(move2.ok).toBe(true);
    expect(move1.events?.map((e) => e.event_id)).toEqual(move2.events?.map((e) => e.event_id));
    expect(move1.events?.map((e) => e.event_type)).toEqual(["MOVE"]);
    expect(w.sequence).toBe(seqAfterFirst);
    expect(w.players[principal().player_id].room_id).toBe(roomAfterFirst);
    expect(roomAfterFirst).toBe(MINI_HALL_ROOM_ID);
  });

  it("a different key commits a second MOVE", async () => {
    const w = miniChamberState("test.hosted-canonical.c03-b");
    await run(w, "ENTER_WORLD", {}, "enter.a");
    const first = await run(w, "MOVE", { direction: "east" }, "move.a");
    const second = await run(w, "MOVE", { direction: "west" }, "move.b");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.events?.[0]?.event_id).not.toBe(second.events?.[0]?.event_id);
    expect(first.events?.map((e) => e.event_type)).toEqual(["MOVE"]);
    expect(second.events?.map((e) => e.event_type)).toEqual(["MOVE"]);
    expect(w.players[principal().player_id].room_id).toBe(MINI_ENTRY_ROOM_ID);
  });

  it("isolated command forwards idempotency_key onto the test DO", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      {
        headers: {
          Authorization: `Bearer ${await playerToken()}`,
          "X-Noema-Admin-Token": await adminToken(),
        },
        body: {
          world_id: "test.hosted-canonical.c03-fwd",
          request_id: "req-c03-1",
          idempotency_key: "idem.c03.shared",
          command: "ENTER_WORLD",
          arguments: {},
        },
      },
      calls,
    );
    expect(res.status).toBe(200);
    const posted = worldDoCalls(calls).find((c) => c.op === "fetch");
    expect(posted?.name).toBe("test.hosted-canonical.c03-fwd");
    expect(posted?.body?.allow_bootstrap).toBe(true);
    const envelope = posted?.body?.envelope as { idempotency_key?: string; command?: string };
    expect(envelope.command).toBe("ENTER_WORLD");
    expect(envelope.idempotency_key).toBe("idem.c03.shared");
    expect(calls.some((c) => String(c.name || "").includes("perihelion"))).toBe(false);
  });
});

describe("C04 deterministic MOVE ordering", () => {
  it("rejects down then commits east into the public hall", async () => {
    const w = miniChamberState("test.hosted-canonical.c04");
    await run(w, "ENTER_WORLD", {}, "enter.c04");
    expect(w.players[principal().player_id].room_id).toBe(MINI_ENTRY_ROOM_ID);

    const rejected = await run(w, "MOVE", { direction: "down" }, "move.down");
    expect(rejected.ok).toBe(false);
    expect(rejected.error?.code).toBe("MOVE_REJECTED");
    expect(w.players[principal().player_id].room_id).toBe(MINI_ENTRY_ROOM_ID);

    const east = await run(w, "MOVE", { direction: "east" }, "move.east");
    expect(east.ok).toBe(true);
    expect(east.events?.map((e) => e.event_type)).toEqual(["MOVE"]);
    expect(w.players[principal().player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    expect(east.observation?.location?.room_id || east.observation?.location?.name).toBeDefined();
    expect(east.observation?.location?.name).toBe("Hall");

    const ordered = [rejected.error?.code, ...(east.events || []).map((e) => e.event_type)];
    expect(ordered).toEqual(["MOVE_REJECTED", "MOVE"]);
    expect(blobOf(w)).not.toMatch(/civic-exchange|perihelion/i);
  });
});

describe("C25 spectator projection integrity", () => {
  it("GET /v1/watch/live hits do/watch and does not increment sequence", async () => {
    const calls: DoCall[] = [];
    const watchBody = { sequence: 94, world_id: "world-01", watch_live: "watch-live/1.0" };
    const a = await hitWatchLive(calls, { method: "GET" }, watchBody);
    const b = await hitWatchLive(calls, { method: "GET" }, watchBody);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const ja = (await a.json()) as { sequence: number };
    const jb = (await b.json()) as { sequence: number };
    expect(ja.sequence).toBe(94);
    expect(jb.sequence).toBe(94);

    const fetches = calls.filter((c) => c.op === "fetch");
    expect(fetches.length).toBe(2);
    expect(fetches.every((c) => String(c.url || "").includes("/watch"))).toBe(true);
    expect(fetches.some((c) => String(c.url || "").includes("command"))).toBe(false);
    expect(fetches.every((c) => c.body === null)).toBe(true);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual(["world-01", "world-01"]);
  });

  it("POST /v1/watch/live is not a mutator", async () => {
    const calls: DoCall[] = [];
    const res = await hitWatchLive(calls, { method: "POST" });
    expect([404, 405]).toContain(res.status);
    expect(calls.some((c) => c.op === "fetch")).toBe(false);
  });

  it("buildWatchLive hides the sealed well, hidden exits, and hidden players", () => {
    const w = miniChamberState("test.hosted-canonical.c25");
    const rooms = w.rooms as Record<string, WatchRoomIn>;
    rooms[MINI_ENTRY_ROOM_ID].entities = [
      ...(rooms[MINI_ENTRY_ROOM_ID].entities || []),
      {
        entity_id: "entity.hidden-cache",
        label: "Hidden cache",
        entity_type: "PROP",
        hidden: true,
      },
    ];
    rooms[MINI_HALL_ROOM_ID].exits = [
      ...(rooms[MINI_HALL_ROOM_ID].exits || []),
      { direction: "down", to_room_id: MINI_DEADEND_ROOM_ID, hidden: true },
    ];

    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: 7,
      rooms,
      players: [
        {
          player_id: "player.public",
          handle: "Anchor-1",
          room_id: MINI_ENTRY_ROOM_ID,
          entered: true,
          last_seen_ms: 1_700_000_000_000,
          actor_kind: "live",
        },
        {
          player_id: "player.hidden",
          handle: "Well-Ghost",
          room_id: MINI_DEADEND_ROOM_ID,
          entered: true,
          last_seen_ms: 1_700_000_000_000,
          actor_kind: "live",
        },
      ],
      events: [],
      now: 1_700_000_000_000,
    });

    const ids = (snap.rooms as Array<{ room_id: string }>).map((r) => r.room_id).sort();
    expect(ids).toEqual([MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID].sort());
    const blob = blobOf(snap);
    expect(blob).not.toContain("Sealed Well");
    expect(blob).not.toContain(MINI_DEADEND_ROOM_ID);
    expect(blob).not.toContain("Hidden cache");
    expect(blob).not.toContain("Well-Ghost");
    expect(blob).not.toMatch(/player\./);
    expect(blob).not.toMatch(/perihelion|civic-exchange/i);
  });
});
