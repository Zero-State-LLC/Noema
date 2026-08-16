import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../../src/world-actions";
import { buildWatchLive, type WatchRoomIn } from "../../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../../src/types";
import { adminToken, hit, hitWatchLive, playerToken, type DoCall } from "./harness";
import {
  MINI_DEADEND_ROOM_ID,
  MINI_ENTRY_ROOM_ID,
  MINI_HALL_ROOM_ID,
  miniChamberState,
} from "./mini-chamber";

function principal(id = "player.probe", session = "sess.hosted-h3"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: session,
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
  settle: (ev: { event_id: string }) => Promise<boolean> = async () => true,
) {
  const envl: CommandEnvelope = {
    request_id: key || `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, settle);
}

function blobOf(value: unknown): string {
  return JSON.stringify(value);
}

function plantHiddenOnPublic(w: WorldRuntime): void {
  w.rooms[MINI_ENTRY_ROOM_ID].entities.push({
    entity_id: "entity.hidden-cache",
    label: "Hidden cache",
    entity_type: "PROP",
    hidden: true,
  } as WorldRuntime["rooms"][string]["entities"][number] & { hidden: true });
  w.rooms[MINI_HALL_ROOM_ID].exits.push({
    direction: "down",
    to_room_id: MINI_DEADEND_ROOM_ID,
    hidden: true,
  } as WorldRuntime["rooms"][string]["exits"][number] & { hidden: true });
}

function leakRe(): RegExp {
  return /Hidden cache|Sealed Well|room\.deadend|entity\.hidden-cache|entity\.sealed-cache|sealed-cache/i;
}

describe("C05 observation no leak", () => {
  it("LOOK and INSPECT omit hidden entities and hidden rooms", async () => {
    const w = miniChamberState("test.hosted-canonical.c05");
    plantHiddenOnPublic(w);
    const p = principal();
    await run(w, "ENTER_WORLD", {}, "enter.c05", p);

    const look = await run(w, "LOOK", {}, "look.c05", p);
    expect(look.ok).toBe(true);
    const lookBlob = blobOf(look.observation);
    expect(lookBlob).not.toMatch(leakRe());
    expect(look.observation?.location.entities.map((e) => e.entity_id)).toEqual(["entity.way-lamp"]);
    expect(look.observation?.location.exits.map((e) => e.to_room_id)).toEqual([MINI_HALL_ROOM_ID]);

    const inspectHidden = await run(w, "INSPECT", { entity_id: "Hidden cache" }, "insp.hid", p);
    expect(inspectHidden.ok).toBe(false);
    expect(["INSPECT_FAILED", "NOT_OBSERVABLE"]).toContain(inspectHidden.error?.code);
    expect(blobOf(inspectHidden)).not.toMatch(/Sealed Well|room\.deadend/i);

    const inspectLamp = await run(w, "INSPECT", { entity_id: "way-lamp" }, "insp.lamp", p);
    expect(inspectLamp.ok).toBe(true);
    expect(blobOf(inspectLamp.observation)).not.toMatch(leakRe());
  });

  it("WATCH omits hidden rooms, hidden exits, and hidden entities", () => {
    const w = miniChamberState("test.hosted-canonical.c05-watch");
    plantHiddenOnPublic(w);
    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: 0,
      sequence: 3,
      rooms: w.rooms as Record<string, WatchRoomIn>,
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
          player_id: "player.ghost",
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
    const blob = blobOf(snap);
    expect(blob).not.toMatch(leakRe());
    expect(blob).not.toContain("Well-Ghost");
    expect((snap.rooms as Array<{ room_id: string }>).map((r) => r.room_id).sort()).toEqual(
      [MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID].sort(),
    );
  });
});

describe("C06 attention exhaustion", () => {
  it("repeated LOOK then MOVE hit BUDGET_EXCEEDED without extra debit or motion", async () => {
    const w = miniChamberState("test.hosted-canonical.c06");
    const p = principal();
    await run(w, "ENTER_WORLD", {}, "enter.c06", p);
    w.players[p.player_id].budgets.attention = 1;
    w.players[p.player_id].budgets.energy = 1;

    const lookOk = await run(w, "LOOK", {}, "look.ok", p);
    expect(lookOk.ok).toBe(true);
    expect(w.players[p.player_id].budgets.attention).toBe(0);

    const lookFail = await run(w, "LOOK", {}, "look.fail", p);
    expect(lookFail.ok).toBe(false);
    expect(lookFail.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.players[p.player_id].budgets.attention).toBe(0);

    const moveOk = await run(w, "MOVE", { direction: "east" }, "move.ok", p);
    expect(moveOk.ok).toBe(true);
    expect(w.players[p.player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    expect(w.players[p.player_id].budgets.energy).toBe(0);

    const moveFail = await run(w, "MOVE", { direction: "west" }, "move.fail", p);
    expect(moveFail.ok).toBe(false);
    expect(moveFail.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.players[p.player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    expect(w.players[p.player_id].budgets.energy).toBe(0);
  });
});

describe("C07 delivery retry no rollback", () => {
  it("a later settle failure does not undo an already committed ENTER", async () => {
    const w = miniChamberState("test.hosted-canonical.c07");
    const p = principal();
    const enter = await run(w, "ENTER_WORLD", {}, "enter.c07", p, async () => true);
    expect(enter.ok).toBe(true);
    const enterId = enter.events?.[0]?.event_id;
    expect(enterId).toBeTruthy();
    expect(w.players[p.player_id].entered).toBe(true);
    const seqAfterEnter = w.sequence;

    const move = await run(w, "MOVE", { direction: "east" }, "move.c07", p, async () => false);
    expect(move.ok).toBe(true);
    expect(w.players[p.player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    expect(w.unsettled.some((u) => u.event_type === "MOVE")).toBe(true);

    const replay = await run(w, "ENTER_WORLD", {}, "enter.c07", p, async () => true);
    expect(replay.events?.[0]?.event_id).toBe(enterId);
    expect(w.players[p.player_id].entered).toBe(true);
    expect(w.sequence).toBeGreaterThanOrEqual(seqAfterEnter);
    expect(w.seen_idempotency[`${p.player_id}::enter.c07`].events?.[0]?.event_id).toBe(enterId);
  });
});

describe("C08 tool sandbox deny-default", () => {
  it("unknown commands are rejected with no ledger or budget side effect", async () => {
    const w = miniChamberState("test.hosted-canonical.c08");
    const p = principal();
    await run(w, "ENTER_WORLD", {}, "enter.c08", p);
    const energy = w.players[p.player_id].budgets.energy;
    const seq = w.sequence;
    const room = w.players[p.player_id].room_id;

    for (const command of ["SHELL", "EVAL", "TOOL_EXEC", "EXPLODE", "not-a-verb"]) {
      const r = await run(w, command, { target: "world" }, `bad.${command}`, p);
      expect(r.ok).toBe(false);
      expect(["INVALID_REQUEST", "FORBIDDEN", "UNKNOWN_COMMAND"]).toContain(r.error?.code);
    }

    expect(w.players[p.player_id].budgets.energy).toBe(energy);
    expect(w.players[p.player_id].room_id).toBe(room);
    expect(w.sequence).toBe(seq);
  });
});

describe("C09 consent partition", () => {
  it("Player A cannot spend Player B budgets or spoof B's player_id", async () => {
    const w = miniChamberState("test.hosted-canonical.c09");
    const a = principal("player.a", "sess.a");
    const b = principal("player.b", "sess.b");
    await run(w, "ENTER_WORLD", {}, "enter.a", a);
    await run(w, "ENTER_WORLD", {}, "enter.b", b);
    const bBefore = { ...w.players[b.player_id].budgets };

    const look = await run(w, "LOOK", {}, "look.a", a);
    expect(look.ok).toBe(true);
    expect(w.players[b.player_id].budgets).toEqual(bBefore);

    const spoof: CommandEnvelope = {
      request_id: "req.spoof",
      idempotency_key: "idem.spoof",
      command: "LOOK",
      arguments: {},
      player_id: b.player_id,
    };
    const denied = await applyWorldCommand(w, a, spoof, async () => true);
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");
    expect(w.players[b.player_id].budgets).toEqual(bBefore);
    expect(w.players[b.player_id].controlling_session_id).not.toBe(a.session_id);
  });
});

describe("C10 no private cognition request", () => {
  it("applyWorldCommand rejects prompt/plan/cognition fields and does not echo them", async () => {
    const w = miniChamberState("test.hosted-canonical.c10");
    const p = principal();
    await run(w, "ENTER_WORLD", {}, "enter.c10", p);
    const seq = w.sequence;
    const envl: CommandEnvelope = {
      request_id: "req.cog",
      idempotency_key: "idem.cog",
      command: "LOOK",
      arguments: { prompt: "secret inner plan", plan: "exfil", cognition: "private" },
    };
    const r = await applyWorldCommand(w, p, envl, async () => true);
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("INVALID_REQUEST");
    expect(blobOf(r)).not.toMatch(/secret inner plan|exfil/);
    expect(w.sequence).toBe(seq);
  });

  it("isolated and PLAY command routes drop cognition before the DO", async () => {
    const isolatedCalls: DoCall[] = [];
    const isolated = await hit(
      "/v1/operator/test-world/command",
      {
        headers: {
          Authorization: `Bearer ${await playerToken()}`,
          "X-Noema-Admin-Token": await adminToken(),
        },
        body: {
          world_id: "test.hosted-canonical.c10-fwd",
          request_id: "req-c10",
          command: "LOOK",
          arguments: {},
          prompt: "do not forward",
          plan: "x",
          cognition: { thought: "no" },
        },
      },
      isolatedCalls,
    );
    expect(isolated.status).toBe(400);
    const j = (await isolated.json()) as { error?: { code?: string } };
    expect(j.error?.code).toBe("INVALID_REQUEST");
    expect(isolatedCalls.some((c) => c.op === "fetch")).toBe(false);

    const playCalls: DoCall[] = [];
    const play = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken()}` },
        body: {
          request_id: "req-c10-play",
          command: "LOOK",
          arguments: {},
          thought: "inner monologue",
        },
      },
      playCalls,
    );
    expect(play.status).toBe(400);
    expect(playCalls.some((c) => c.op === "fetch")).toBe(false);
  });

  it("WATCH live projection has no cognition fields", async () => {
    const calls: DoCall[] = [];
    const res = await hitWatchLive(calls, { method: "GET" }, { sequence: 94, watch_live: "watch-live/1.0" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("prompt");
    expect(body).not.toHaveProperty("plan");
    expect(body).not.toHaveProperty("cognition");
    expect(blobOf(body)).not.toMatch(/"prompt"|"cognition"|"inner_monologue"/);
  });
});
