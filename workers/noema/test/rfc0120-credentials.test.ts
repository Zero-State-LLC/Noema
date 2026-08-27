import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { startDeviceEnrollment, approveDevice, pollDeviceToken, memoryDeviceStore } from "../src/device-enrollment";
import { mintHs256 } from "../src/jwt";
import worker from "../src/index";
import { env, hit, type DoCall } from "./conformance/harness";

describe("RFC-0120 controller credential lifecycle", () => {
  it("revoked controller cannot inhabit", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const minted = await mintControllerToken(e, { handle: "hermes", controllerType: "agent" });
    const revoke = await hit(
      "/v1/auth/controller/revoke",
      { body: {}, headers: { Authorization: `Bearer ${minted.access_token}` } },
      calls,
    );
    expect(revoke.status).toBe(200);
    const cmd = await hit(
      "/v1/command",
      {
        body: { request_id: "r1", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(cmd.status).toBe(401);
    const body = (await cmd.json()) as { error?: { message?: string } };
    expect(body.error?.message).toBe("controller revoked");
  });

  it("cannot revoke a different controller_id", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const minted = await mintControllerToken(e, { handle: "hermes", controllerType: "agent" });
    const res = await hit(
      "/v1/auth/controller/revoke",
      {
        body: { controller_id: "ctrl.agent.other" },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(res.status).toBe(403);
  });

  it("rotate retires the old jti and issues a new agent token for the same Player", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const minted = await mintControllerToken(e, { handle: "nacre", controllerType: "agent" });
    const rotate = await hit(
      "/v1/auth/controller/rotate",
      { body: {}, headers: { Authorization: `Bearer ${minted.access_token}` } },
      calls,
    );
    expect(rotate.status).toBe(200);
    const next = (await rotate.json()) as { access_token: string; player_id: string; controller_id: string; rotated?: boolean };
    expect(next.rotated).toBe(true);
    expect(next.player_id).toBe(minted.player_id);
    expect(next.controller_id).toBe(minted.controller_id);
    expect(next.access_token).not.toBe(minted.access_token);
    const oldCmd = await hit(
      "/v1/command",
      {
        body: { request_id: "old", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(oldCmd.status).toBe(401);
    const newMe = await worker.fetch(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${next.access_token}` } }),
      env(calls),
    );
    expect(newMe.status).toBe(200);
    const me = (await newMe.json()) as { principal?: { kind?: string; player_id?: string } };
    expect(me.principal?.kind).toBe("agent_player");
    expect(me.principal?.player_id).toBe(minted.player_id);
  });

  it("expired access token cannot resolve", async () => {
    const e = env([]);
    const now = Math.floor(Date.now() / 1000);
    const token = await mintHs256(
      {
        typ: "access",
        player_id: "player.expired",
        agent_id: "agent.expired",
        controller_id: "ctrl.agent.expired",
        controller_type: "agent",
        scopes: ["noema.action.submit"],
        iat: now - 120,
        exp: now - 60,
        jti: "deadbeef",
      },
      e.TOKEN_SIGNING_SECRET as string,
    );
    const p = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      e,
    );
    expect(p).toBeInstanceOf(Response);
    expect((p as Response).status).toBe(401);
  });

  it("strips self-escalated scopes from an otherwise valid agent token", async () => {
    const e = env([]);
    const now = Math.floor(Date.now() / 1000);
    const token = await mintHs256(
      {
        typ: "access",
        player_id: "player.scope",
        agent_id: "agent.scope",
        controller_id: "ctrl.agent.scope",
        controller_type: "agent",
        scopes: ["noema.action.submit", "noema.world.admin", "noema.player.manage"],
        iat: now,
        exp: now + 3600,
        jti: "scope1",
      },
      e.TOKEN_SIGNING_SECRET as string,
    );
    const p = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      e,
    );
    expect(p).not.toBeInstanceOf(Response);
    const agent = p as { scopes: string[] };
    expect(agent.scopes).toContain("noema.action.submit");
    expect(agent.scopes).not.toContain("noema.world.admin");
    expect(agent.scopes).not.toContain("noema.player.manage");
  });

  it("legacy hybrid access token is a HumanPrincipal, not inhabit", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const now = Math.floor(Date.now() / 1000);
    const token = await mintHs256(
      {
        typ: "access",
        player_id: "player.hybrid",
        controller_id: "ctrl.hybrid.x",
        controller_type: "hybrid",
        scopes: ["noema.action.submit"],
        sid: "sess.hybrid",
        iat: now,
        exp: now + 3600,
      },
      e.TOKEN_SIGNING_SECRET as string,
    );
    const me = await worker.fetch(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      e,
    );
    const body = (await me.json()) as { principal?: { kind?: string; player_id?: string; controller_type?: string } };
    expect(body.principal?.kind).toBe("human");
    expect(body.principal?.controller_type).toBe("hybrid");
    expect(body.principal?.player_id).toBeUndefined();
    const cmd = await hit(
      "/v1/command",
      {
        body: { request_id: "h1", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${token}` },
      },
      calls,
    );
    expect(cmd.status).toBe(403);
  });
});

describe("RFC-0120 CONNECT binding", () => {
  it("approve ignores a client-supplied player_id rebind", async () => {
    const store = memoryDeviceStore();
    const e = env([]);
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code, controller_id } = (await started.json()) as { user_code: string; controller_id: string };
    const human = await mintControllerToken(e, { handle: "ada", controllerType: "human", identityId: "id.ada" });
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${human.access_token}` },
      }),
      { user_code, player_id: "player.stolen" } as { user_code: string },
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { player_id: string };
    expect(body.player_id).not.toBe("player.stolen");
    expect(body.player_id).toContain(controller_id.replace(/^ctrl\./, "").replace(/[^a-z0-9]/gi, "").slice(0, 24));
  });

  it("second approve cannot rebind an already approved Player", async () => {
    const store = memoryDeviceStore();
    const e = env([]);
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const human = await mintControllerToken(e, { handle: "ada", controllerType: "human", identityId: "id.ada" });
    const first = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${human.access_token}` },
      }),
      { user_code },
      { store },
    );
    expect(first.status).toBe(200);
    const second = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${human.access_token}` },
      }),
      { user_code },
      { store },
    );
    expect(second.status).toBe(409);
  });

  it("device start ignores requested admin scopes", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env([]),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { scopes: ["noema.world.admin", "noema.action.submit"] },
      { store },
    );
    const body = (await res.json()) as { scopes: string[] };
    expect(body.scopes).not.toContain("noema.world.admin");
    expect(body.scopes).toEqual(["noema.player.read", "noema.world.observe", "noema.action.submit"]);
  });
});
