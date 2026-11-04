/**
 * #733 follow-up to PR #762: mounted evidence that every hosted ingress and
 * tempo-resolution path dispatches structured Agent commands without developer
 * alias/macro/text interpretation. Local fixture evidence only — not workerd,
 * deployment, settlement, or browser acceptance.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { mintControllerToken } from "../src/auth";
import { pinPlayerTempo } from "../src/player-tempo";
import { ACCEPTED_SEALS } from "../src/seal";
import type { WorldRuntime } from "../src/world-actions";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

const SENTINEL = "PRIVATE_INGRESS_MACRO_SENTINEL";
const TARGET = "test.hosted-canonical.733-ingress-isolation";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden in ingress fixture"); }));
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
});

/** Enter player.boundary (plus optional extra Agents), then retain a colliding developer alias. */
async function retainedWorld(aliases: Record<string, string>, worldId = WORLD, extraPlayers: string[] = []): Promise<WorldRuntime> {
  const seed = harness();
  const token = (await seed.agent()).access_token;
  expect((await seed.command(token, "ENTER_WORLD")).status).toBe(200);
  for (const playerId of extraPlayers) {
    const other = await mintControllerToken(seed.env, { handle: "Second", controllerType: "agent", playerId });
    expect((await seed.command(other.access_token, "ENTER_WORLD")).status).toBe(200);
  }
  const world = (await seed.persistedWorld())!;
  world.world_id = worldId;
  world.players["player.boundary"].command_aliases = aliases;
  return world;
}

/** Fake only the platform socket pair and 101 response; the gateway/protocol handlers stay real. */
function protocolSocket() {
  const sent: Array<Record<string, unknown>> = [];
  let listener: ((evt: { data: string }) => void) | undefined;
  const server = {
    accept() {},
    addEventListener(type: string, fn: (evt: { data: string }) => void) { if (type === "message") listener = fn; },
    send(message: string) { sent.push(JSON.parse(message) as Record<string, unknown>); },
  };
  vi.stubGlobal("WebSocketPair", class { 0 = {}; 1 = server; });
  const NativeResponse = Response;
  vi.stubGlobal("Response", class extends NativeResponse {
    constructor(body: BodyInit | null, init?: ResponseInit & { webSocket?: unknown }) {
      super(body, { ...init, status: init?.status === 101 ? 200 : init?.status });
      if (init?.status === 101) Object.defineProperty(this, "status", { value: 101 });
    }
  });
  async function frame(msg: Record<string, unknown>) {
    if (!listener) throw new Error("protocol socket not accepted");
    const before = sent.length;
    listener({ data: JSON.stringify(msg) });
    for (let i = 0; i < 200 && sent.length === before; i++) await new Promise((r) => setTimeout(r, 0));
    expect(sent.length).toBe(before + 1);
    return sent[sent.length - 1];
  }
  return { frame };
}

describe("hosted ingress isolation from developer text tooling", () => {
  it("keeps WS ACT JOIN canonical despite a retained alias and rejects a WS text alias carrier", async () => {
    const seeded = await retainedWorld({ join: `do look; wait ${SENTINEL}` });
    const h = harness(seeded);
    const token = (await h.agent()).access_token;
    const ws = protocolSocket();
    const upgraded = await h.hit("/protocol/v1/ws", undefined, undefined, "", { Upgrade: "websocket" });
    expect(upgraded.status).toBe(101);
    const auth = await ws.frame({ type: "AUTH", request_id: "ws.auth",
      body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } });
    expect(auth.type).toBe("AUTH_ACK");
    // Fixture storage is created lazily on first DO fetch; AUTH never reaches the DO, so compare to the seed.
    const before = seeded;

    const join = await ws.frame({ type: "ACT", request_id: "ws.join", body: { action: { verb: "JOIN" } } });
    expect(JSON.stringify(join)).not.toContain(SENTINEL);
    expect(join).toMatchObject({ type: "ACT_RESULT", request_id: "ws.join", body: { ok: true, request_id: "ws.join" } });
    expect((join.body as { events?: unknown[] }).events || []).toEqual([]);

    const writes = h.writes.length;
    const text = await ws.frame({ type: "ACT", request_id: "ws.alias", body: { command: `alias set ii look ${SENTINEL}` } });
    expect(JSON.stringify(text)).not.toContain(SENTINEL);
    expect(text).toMatchObject({ type: "ERROR", request_id: "ws.alias", error: { code: "INVALID_REQUEST" } });
    expect(h.writes.length).toBe(writes);

    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.players["player.boundary"].command_aliases).toEqual(before.players["player.boundary"].command_aliases);
  });

  it("keeps operator test-world JOIN canonical and rejects operator text carriers before target writes", async () => {
    const retained = await retainedWorld({ join: `do look; wait ${SENTINEL}` }, TARGET);
    const h = harness(fixtureWorld(), TARGET, retained);
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const minted = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (minted instanceof Response) throw new Error("fixture admin session failed");
    const token = (await h.agent()).access_token;
    const op = (request_id: string, command: string) => h.hit("/v1/operator/test-world/command",
      { request_id, command, arguments: {}, world_id: TARGET }, token, undefined,
      { "X-Noema-Admin-Token": minted.access_token });

    const join = await op("op.join", "JOIN");
    expect(join.status).toBe(200);
    const joinText = await join.text();
    expect(joinText).not.toContain(SENTINEL);
    expect(JSON.parse(joinText)).toMatchObject({ ok: true, request_id: "op.join" });

    const targetWrites = h.writes.filter((w) => w.name === TARGET).length;
    for (const [request_id, command] of [["op.alias", `alias set ii look ${SENTINEL}`], ["op.macro", `do look; wait ${SENTINEL}`]]) {
      const res = await op(request_id, command);
      expect(res.status).toBe(400);
      const text = await res.text();
      expect(text).not.toContain(SENTINEL);
      expect(JSON.parse(text)).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    }
    expect(h.writes.filter((w) => w.name === TARGET).length).toBe(targetWrites);
    const after = (await h.persistedWorld(TARGET))!;
    expect(after.sequence).toBe(retained.sequence);
    expect(after.players["player.boundary"].command_aliases).toEqual(retained.players["player.boundary"].command_aliases);
    expect(h.calls.filter((c) => c.name === WORLD)).toEqual([]);
  });

  it("refuses Agent tokens on /v1/admin/tempo and resolves an admin-stepped pinned MOVE canonically despite a retained move alias", async () => {
    const retained = await retainedWorld({ move: `do look; wait ${SENTINEL}` });
    expect(pinPlayerTempo(retained, { mode: "STEP_TEST", now: Date.now(), reason: "ingress isolation step" }).ok).toBe(true);
    const h = harness(retained);
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const admin = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (admin instanceof Response) throw new Error("fixture admin session failed");
    const token = (await h.agent()).access_token;
    const accepted = await h.command(token, "MOVE", { direction: "east" }, { request_id: "tempo.step.move" });
    expect(accepted.status).toBe(200);
    const acceptedText = await accepted.text();
    expect(acceptedText).not.toContain(SENTINEL);
    expect(JSON.parse(acceptedText)).toMatchObject({ ok: true, request_id: "tempo.step.move" });
    const queued = (await h.persistedWorld())!;
    expect(queued.players["player.boundary"].room_id).toBe("room.a");
    expect(queued.player_tempo?.accepted).toHaveLength(1);

    const denied = await h.hit("/v1/admin/tempo", { action: "step", reason: "agent must not step" }, token, "");
    expect([401, 403]).toContain(denied.status);
    const afterDenied = (await h.persistedWorld())!;
    expect(afterDenied.cycle).toBe(queued.cycle);
    expect(afterDenied.player_tempo?.accepted).toHaveLength(1);
    expect(afterDenied.players["player.boundary"].room_id).toBe("room.a");

    const stepped = await h.hit("/v1/admin/tempo", { action: "step", reason: "ingress isolation" }, admin.access_token, "");
    expect(stepped.status).toBe(200);
    expect(await stepped.text()).not.toContain(SENTINEL);
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.b");
    expect(after.cycle).toBe(retained.cycle + 1);
    expect(after.players["player.boundary"].command_aliases).toEqual({ move: `do look; wait ${SENTINEL}` });
  });

  it("schedules and resolves an alarm-deadline pinned MOVE canonically despite a retained move alias", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const t0 = 1_800_000_000_000;
    vi.setSystemTime(t0);
    const retained = await retainedWorld({ move: `do look; wait ${SENTINEL}` }, WORLD, ["player.second"]);
    expect(pinPlayerTempo(retained, { mode: "OBSERVED_LIVE", now: t0, reason: "ingress isolation alarm" }).ok).toBe(true);
    expect(retained.player_tempo?.active_participant_ids).toEqual(["player.boundary", "player.second"]);
    const h = harness(retained);
    const token = (await h.agent()).access_token;
    const accepted = await h.command(token, "MOVE", { direction: "east" }, { request_id: "tempo.alarm.move" });
    expect(accepted.status).toBe(200);
    expect(await accepted.text()).not.toContain(SENTINEL);
    expect((await h.persistedWorld())!.players["player.boundary"].room_id).toBe("room.a");
    expect(h.alarms.some((a) => a.name === WORLD && typeof a.at === "number")).toBe(true);

    vi.setSystemTime(t0 + 25_000); // past OBSERVED_LIVE collect_window_ms 20000
    await h.runAlarm();
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.b");
    expect(after.cycle).toBe(retained.cycle + 1);
  });

  it("resolves an inline-quorum pinned MOVE canonically despite a retained move alias", async () => {
    const retained = await retainedWorld({ move: `do look; wait ${SENTINEL}` });
    expect(pinPlayerTempo(retained, { mode: "FAST_TEST", now: Date.now(), reason: "ingress isolation quorum" }).ok).toBe(true);
    const h = harness(retained);
    const token = (await h.agent()).access_token;
    const moved = await h.command(token, "MOVE", { direction: "east" }, { request_id: "tempo.quorum.move" });
    expect(moved.status).toBe(200);
    const text = await moved.text();
    expect(text).not.toContain(SENTINEL);
    expect(JSON.parse(text)).toMatchObject({ ok: true, request_id: "tempo.quorum.move" });
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.b");
    expect(after.cycle).toBe(retained.cycle + 1);
  });

  it("keeps WS OBSERVE and LOOK canonical despite retained aliases on those verbs", async () => {
    const seeded = await retainedWorld({ observe: `do look; wait ${SENTINEL}`, look: `do look; wait ${SENTINEL}` });
    const h = harness(seeded);
    const token = (await h.agent()).access_token;
    const ws = protocolSocket();
    expect((await h.hit("/protocol/v1/ws", undefined, undefined, "", { Upgrade: "websocket" })).status).toBe(101);
    expect((await ws.frame({ type: "AUTH", request_id: "ws.auth",
      body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } })).type).toBe("AUTH_ACK");

    const observe = await ws.frame({ type: "OBSERVE", request_id: "ws.observe" });
    expect(JSON.stringify(observe)).not.toContain(SENTINEL);
    expect(observe).toMatchObject({ type: "OBSERVE", request_id: "ws.observe",
      body: { ok: true, request_id: "ws.observe", observation: { location: { room_id: "room.a" } } } });
    const look = await ws.frame({ type: "ACT", request_id: "ws.look", body: { action: { verb: "LOOK" } } });
    expect(JSON.stringify(look)).not.toContain(SENTINEL);
    expect(look).toMatchObject({ type: "ACT_RESULT", request_id: "ws.look",
      body: { ok: true, request_id: "ws.look", observation: { location: { room_id: "room.a" } } } });

    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(seeded.sequence);
    expect(after.players["player.boundary"].command_aliases).toEqual(seeded.players["player.boundary"].command_aliases);
  });

  it("resolves an admin batch_close of a pinned FAST_TEST MOVE canonically despite a retained move alias", async () => {
    const retained = await retainedWorld({ move: `do look; wait ${SENTINEL}` }, WORLD, ["player.second"]);
    expect(pinPlayerTempo(retained, { mode: "FAST_TEST", now: Date.now(), reason: "ingress isolation batch close" }).ok).toBe(true);
    expect(retained.player_tempo?.active_participant_ids).toEqual(["player.boundary", "player.second"]);
    const h = harness(retained);
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const admin = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (admin instanceof Response) throw new Error("fixture admin session failed");
    const token = (await h.agent()).access_token;
    const accepted = await h.command(token, "MOVE", { direction: "east" }, { request_id: "tempo.batch.move" });
    expect(accepted.status).toBe(200);
    expect(await accepted.text()).not.toContain(SENTINEL);
    expect((await h.persistedWorld())!.players["player.boundary"].room_id).toBe("room.a");

    const closed = await h.hit("/v1/admin/tempo", { action: "batch_close", reason: "ingress isolation" }, admin.access_token, "");
    expect(closed.status).toBe(200);
    expect(await closed.text()).not.toContain(SENTINEL);
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.b");
    expect(after.cycle).toBe(retained.cycle + 1);
  });
});
