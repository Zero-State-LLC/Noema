/**
 * P2.3: actual mounted Worker HTTP routes -> JWT admission -> NoemaWorldDO.fetch.
 * Only platform storage/namespace transport is faked, with serialized storage and
 * separate objects per DO name. No dummy command/projection response or reducer mock.
 * This is local fixture evidence, not workerd, deployment, settlement or Gate B proof.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mintControllerToken, mintHumanPlatformToken, HUMAN_WATCH_MESSAGE } from "../src/auth";
import { mintHs256 } from "../src/jwt";

import { harness, SIGNING, WORLD } from "./agent-http-do-fixture";

type Observation = {
  player_id: string;
  location: { room_id: string };
  available_actions: string[];
  affordances: Array<{ action: string; verb: string; target_id?: string; available: boolean }>;
};
type Result = { ok: boolean; error?: { code: string; message: string }; observation: Observation };

beforeEach(() => {
  // Unexpected settlement/email/network traffic must not silently become live activity.
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden in transport fixture"); }));
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

describe("Agent HTTP -> real World DO boundary", () => {
  it("discovers the mounted command URI and executes an advertised structured MOVE after ENTER and LOOK", async () => {
    const h = harness();
    const discovery = await h.hit("/.well-known/noema-agent.json");
    expect(discovery.status).toBe(200);
    const doc = await discovery.json() as { command_uri: string; admission: string; token_uri: string };
    expect(new URL(doc.command_uri).pathname).toBe("/v1/command");
    expect(doc.admission).toBe("agents_only");
    expect(new URL(doc.token_uri).pathname).toBe("/v1/auth/device/token");
    const token = (await h.agent()).access_token;
    const enter = await h.hit(new URL(doc.command_uri).pathname, { request_id: "enter", command: "ENTER_WORLD" }, token);
    expect(enter.status).toBe(200);
    expect((await enter.json() as Result).ok).toBe(true);
    const look = await h.command(token, "LOOK");
    expect(look.status).toBe(200);
    const observed = (await look.json() as Result).observation;
    expect(observed.location.room_id).toBe("room.a");
    expect(observed.available_actions).toContain("MOVE");
    expect(observed.available_actions.every(action => typeof action === "string")).toBe(true);
    expect(observed.affordances.length).toBeGreaterThan(0);
    const move = observed.affordances.find(a => a.verb === "MOVE" && a.available && a.target_id === "east");
    expect(move).toBeDefined();
    const moved = await h.command(token, move!.action, { target_id: move!.target_id });
    expect(moved.status).toBe(200);
    expect(await moved.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
    expect(h.calls.filter(c => c.path === "/command")).toEqual([
      { name: WORLD, path: "/command" }, { name: WORLD, path: "/command" }, { name: WORLD, path: "/command" },
    ]);
  });

  it.each(["human", "hybrid"])("denies legacy %s Player claims before World DO command dispatch", async (controllerType) => {
    const h = harness();
    const now = Math.floor(Date.now() / 1000);
    const token = await mintHs256({ typ: "access", player_id: "player.legacy", agent_id: "agent.legacy",
      controller_id: "ctrl.legacy", controller_type: controllerType, sid: "session.legacy",
      scopes: ["noema.action.submit", "noema.world.observe"], iat: now, exp: now + 3600 }, SIGNING);
    const me = await h.hit("/v1/me", undefined, token);
    expect(me.status).toBe(200);
    const identity = await me.json() as { principal: { kind: string; scopes: string[] } };
    expect(identity.principal.kind).toBe("human");
    expect(identity.principal).not.toHaveProperty("player_id");
    expect(identity.principal.scopes).not.toContain("noema.action.submit");
    const result = await h.command(token, "ENTER_WORLD");
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ error: { message: HUMAN_WATCH_MESSAGE } });
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
  });

  it("keeps platform humans and Admin credentials outside the inhabit path", async () => {
    const h = harness();
    const human = await mintHumanPlatformToken(h.env, { identityId: "human.boundary" });
    const denied = await h.command(human.access_token, "LOOK");
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ error: { message: HUMAN_WATCH_MESSAGE } });
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-admin-operator";
    const session = await h.hit("/v1/admin/session", { admin_token: h.env.ADMIN_OPERATOR_TOKEN });
    expect(session.status).toBe(200);
    const admin = await session.json() as { access_token: string };
    expect(admin.access_token).toBeTruthy();
    const result = await h.command(admin.access_token, "ENTER_WORLD");
    expect(result.status).toBe(401);
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
  });

  it.each(["expired", "missing-controller-type", "missing-action-scope"])("fails closed for %s credentials", async (kind) => {
    const h = harness();
    const now = Math.floor(Date.now() / 1000);
    const token = await mintHs256({ typ: "access", player_id: "player.boundary", agent_id: "agent.boundary",
      controller_id: "ctrl.boundary", ...(kind === "missing-controller-type" ? {} : { controller_type: "agent" }),
      sid: "session.boundary", scopes: kind === "missing-action-scope" ? ["noema.world.observe"] : ["noema.action.submit"],
      iat: now - 100, exp: kind === "expired" ? now - 1 : now + 3600 }, SIGNING);
    const result = await h.command(token, "ENTER_WORLD");
    expect(result.status).toBe(kind === "missing-action-scope" ? 403 : 401);
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
  });

  it("requires the accepted seal, rejects forbidden world overrides and strips human command lines", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    const unsealed = await h.hit("/v1/command", { request_id: "unsealed", command: "ENTER_WORLD" }, token, "");
    expect(unsealed.status).toBe(401);
    const forbidden = await h.command(token, "ENTER_WORLD", {}, { world_id: "world.forbidden" });
    expect(forbidden.status).toBe(403);
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const look = await h.command(token, "LOOK", { line: "move east" });
    expect(look.status).toBe(200);
    expect(await look.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.a" } } });
  });

  it("enforces room bounds and principal binding in the real World DO reducer", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const inspect = await h.command(token, "INSPECT", { target_id: "entity.box" });
    expect(inspect.status).toBe(200);
    expect((await inspect.json() as Result).ok).toBe(true);
    expect((await h.command(token, "MOVE", { target_id: "east" })).status).toBe(200);
    const remote = await h.command(token, "INSPECT", { target_id: "entity.box" });
    expect(remote.status).toBe(200); // Semantic refusal preserves the command-envelope HTTP contract.
    expect(await remote.json()).toMatchObject({ ok: false, error: { code: "INSPECT_FAILED" } });
    const hidden = await h.command(token, "MOVE", { target_id: "room.hidden" });
    expect(hidden.status).toBe(200);
    expect(await hidden.json()).toMatchObject({ ok: false, error: { code: "MOVE_REJECTED" } });
    const impersonation = await h.command(token, "LOOK", {}, { player_id: "player.someone-else" });
    expect(await impersonation.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    const look = await h.command(token, "LOOK");
    expect(await look.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
    expect(h.calls.filter(c => c.path === "/command")).toHaveLength(7);
  });


  it("rejects unknown and expired device codes through the advertised token route without issuing credentials", async () => {
    const h = harness();
    const discovery = await h.hit("/.well-known/noema-agent.json");
    const doc = await discovery.json() as { device_authorization_uri: string; token_uri: string };
    const tokenPath = new URL(doc.token_uri).pathname;
    const unknown = await h.hit(tokenPath, { device_code: "unsupported-fixture-code" });
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toMatchObject({ error: { code: "NOT_AUTHORIZED", message: "unknown device_code" } });
    const started = await h.hit(new URL(doc.device_authorization_uri).pathname, { metadata: { runtime: "boundary-fixture" } });
    expect(started.status).toBe(200);
    const device = await started.json() as { device_code: string; expires_in: number };
    expect(device.device_code).toBeTruthy();
    expect(device.expires_in).toBeGreaterThan(0);
    const pending = await h.hit(tokenPath, { device_code: device.device_code });
    expect(await pending.json()).toMatchObject({ status: "authorization_pending" });
    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + (device.expires_in + 1) * 1000);
    try {
      const expired = await h.hit(tokenPath, { device_code: device.device_code });
      expect(expired.status).toBe(401);
      const body = await expired.json();
      expect(body).toMatchObject({ error: { code: "NOT_AUTHORIZED", message: "device code expired" } });
      expect(body).not.toHaveProperty("access_token");
    } finally { clock.mockRestore(); }
    expect(h.calls.filter(c => c.path === "/device").length).toBeGreaterThan(0);
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
  });

  it("exposes public live/map projections without exposing a real private message or inhabit observations", async () => {
    const h = harness();
    const sender = await h.agent();
    const recipient = await mintControllerToken(h.env, { handle: "Receiver", controllerType: "agent", playerId: "player.receiver" });
    expect((await h.command(sender.access_token, "ENTER_WORLD")).status).toBe(200);
    expect((await h.command(recipient.access_token, "ENTER_WORLD")).status).toBe(200);
    const message = await h.command(sender.access_token, "MESSAGE", { recipient_id: recipient.player_id, text: "PRIVATE_MESSAGE_SENTINEL" });
    expect(message.status).toBe(200);
    expect((await message.json() as Result).ok).toBe(true);
    const look = await h.command(recipient.access_token, "LOOK");
    expect(look.status).toBe(200);
    expect(await look.text()).toContain("PRIVATE_MESSAGE_SENTINEL");
    for (const path of ["/v1/watch/live", "/v1/watch/map"]) {
      const response = await h.hit(path);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Arrival");
      for (const privateValue of ["PRIVATE_MESSAGE_SENTINEL", "PRIVATE_ROOM_SENTINEL", "player.receiver", "inbox", "affordances", "situation", sender.access_token]) {
        expect(text).not.toContain(privateValue);
      }
    }
    const unauthorized = await h.hit("/v1/command", { request_id: "anonymous", command: "LOOK" });
    expect(unauthorized.status).toBe(401);
    expect(h.calls).toContainEqual({ name: WORLD, path: "/watch" });
    expect(h.calls).toContainEqual({ name: WORLD, path: "/watch-map" });
  });

  it("rejects private cognition before command dispatch", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    const response = await h.command(token, "ENTER_WORLD", {}, { chain_of_thought: "PRIVATE_COGNITION_SENTINEL" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_REQUEST", message: "private cognition fields are not accepted" } });
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
  });


  it("replays an idempotent command and refreshes observation after a serialized fixture restart", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const body = { request_id: "move-once", idempotency_key: "move-once", command: "MOVE", arguments: { target_id: "east" } };
    const first = await h.hit("/v1/command", body, token);
    expect(first.status).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
    h.restart();
    const replay = await h.hit("/v1/command", body, token);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual(result);
    // HTTP recovery uses a new LOOK. This is not a WS sequence-gap/resume proof.
    const refreshed = await h.command(token, "LOOK");
    expect(refreshed.status).toBe(200);
    expect(await refreshed.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
  });

  it.each(["human", "hybrid"])("also rejects a forged legacy %s principal at the DO command boundary", async (controllerType) => {
    const h = harness();
    const stub = h.env.WORLD_DO.get(h.env.WORLD_DO.idFromName(WORLD));
    const response = await stub.fetch("https://do/command", { method: "POST", body: JSON.stringify({
      principal: { player_id: "player.legacy", controller_id: "ctrl.legacy", controller_type: controllerType,
        scopes: ["noema.action.submit", "noema.world.observe"], session_id: "session.legacy", agent_id: "agent.legacy" },
      envelope: { request_id: "direct-guard", command: "ENTER_WORLD" }, world_id: WORLD,
    }) });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { message: HUMAN_WATCH_MESSAGE } });
    const token = (await h.agent()).access_token;
    const beforeEntry = await h.command(token, "LOOK");
    expect(await beforeEntry.json()).toMatchObject({ ok: false, error: { code: "NOT_IN_WORLD" } });
  });

});
