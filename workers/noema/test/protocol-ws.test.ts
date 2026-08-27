import { describe, expect, it } from "vitest";
import { handleProtocolFrame, protocolHello, acceptProtocolWebSocket } from "../src/protocol-ws";
import { adminToken, env, hit, playerToken, worldDoCalls, type DoCall } from "./conformance/harness";
import { ACCEPTED_SEALS } from "../src/seal";
import type { CommandEnvelope, Env } from "../src/types";

async function dummyRoute(
  _env: Env,
  worldId: string,
  _principal: unknown,
  envelope: CommandEnvelope,
) {
  return new Response(JSON.stringify({ ok: true, world_id: worldId, command: envelope.command }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("protocol frames", () => {
  it("HELLO compatible", () => {
    const ack = protocolHello({
      type: "HELLO",
      request_id: "r1",
      body: { supported_protocols: ["agent-protocol/v1"] },
    });
    expect(ack.type).toBe("HELLO_ACK");
    expect((ack.body as { auth_methods: string[] }).auth_methods).toEqual(["controller-token"]);
  });

  it("HELLO advertises dev only for explicit local env", () => {
    const ack = protocolHello(
      { type: "HELLO", request_id: "r1b", body: { supported_protocols: ["agent-protocol/v1"] } },
      { NOEMA_ENV: "local" },
    );
    expect((ack.body as { auth_methods: string[] }).auth_methods).toEqual(["controller-token", "dev"]);
  });

  it("HELLO incompatible", () => {
    const ack = protocolHello({
      type: "HELLO",
      request_id: "r2",
      body: { supported_protocols: ["other/v0"] },
    });
    expect(ack.type).toBe("ERROR");
  });

  it("ACT before AUTH is NOT_AUTHORIZED", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const { reply } = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "ACT", request_id: "r3", body: { action: { verb: "LOOK" } } },
      dummyRoute,
    );
    expect(reply.type).toBe("ERROR");
    expect((reply.error as { code: string }).code).toBe("NOT_AUTHORIZED");
  });

  it("PING after setup", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const { reply } = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "PING", request_id: "r4", body: {} },
      dummyRoute,
    );
    expect(reply.type).toBe("PONG");
  });

  it("rejects private cognition after AUTH", async () => {
    const calls: DoCall[] = [];
    const token = await playerToken(calls);
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    const { reply } = await handleProtocolFrame(
      e,
      req,
      auth.state,
      { type: "ACT", request_id: "c", body: { action: { verb: "LOOK" }, prompt: "secret" } },
      dummyRoute,
    );
    expect(reply.type).toBe("ERROR");
    expect((reply.error as { code: string }).code).toBe("PRIVATE_COGNITION_FORBIDDEN");
  });

  it("isolated ACT without admin_token is denied", async () => {
    const calls: DoCall[] = [];
    const token = await playerToken(calls);
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    const { reply } = await handleProtocolFrame(
      e,
      req,
      auth.state,
      {
        type: "ACT",
        request_id: "c",
        world_id: "test.hosted-canonical.ack-s3",
        body: { action: { verb: "LOOK" } },
      },
      dummyRoute,
    );
    expect(reply.type).toBe("ERROR");
    expect((reply.error as { code: string }).code).toBe("NOT_AUTHORIZED");
  });

  it("isolated ACT with AUTH admin_token is admitted", async () => {
    const calls: DoCall[] = [];
    const token = await playerToken(calls);
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, admin_token: await adminToken(calls), prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    const { reply } = await handleProtocolFrame(
      e,
      req,
      auth.state,
      {
        type: "ACT",
        request_id: "c",
        world_id: "test.hosted-canonical.ack-s3",
        body: { action: { verb: "LOOK" } },
      },
      dummyRoute,
    );
    expect(reply.type).toBe("ACT_RESULT");
  });

  it("AUTH then LOOK routes to default world", async () => {
    const calls: DoCall[] = [];
    const token = await playerToken(calls);
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    expect(auth.reply.type).toBe("AUTH_ACK");
    const { reply } = await handleProtocolFrame(
      e,
      req,
      auth.state,
      { type: "ACT", request_id: "c", body: { action: { verb: "LOOK" } } },
      dummyRoute,
    );
    expect(reply.type).toBe("ACT_RESULT");
  });

  it("HELLO resume_token restores the Player principal", async () => {
    const calls: DoCall[] = [];
    const token = await playerToken(calls);
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    const resume = (auth.reply.body as { resume_token?: string }).resume_token;
    expect(resume).toBeTruthy();
    const hello = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "HELLO", request_id: "h", body: { resume_token: resume, supported_protocols: ["agent-protocol/v1"] } },
      dummyRoute,
    );
    expect(hello.reply.type).toBe("HELLO_ACK");
    expect(hello.state.principal?.player_id).toBeTruthy();
    const { reply } = await handleProtocolFrame(
      e,
      req,
      hello.state,
      { type: "ACT", request_id: "c", body: { action: { verb: "LOOK" } } },
      dummyRoute,
    );
    expect(reply.type).toBe("ACT_RESULT");
  });

  it("upgrade without websocket header is 426", () => {
    const calls: DoCall[] = [];
    const res = acceptProtocolWebSocket(
      new Request("https://noema.local/protocol/v1/ws"),
      env(calls),
      dummyRoute,
    );
    expect(res.status).toBe(426);
  });

  it("GET /protocol/v1/ws without upgrade is 426", async () => {
    const res = await hit("/protocol/v1/ws", { method: "GET" }, []);
    expect(res.status).toBe(426);
  });
});

describe("PLAY tenant routing on /v1/command", () => {
  it("omitted world_id stays on default", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken(calls)}` },
        body: { request_id: "r", command: "LOOK", arguments: {} },
      },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.op === "idFromName" && c.name === "world-01")).toBe(true);
  });

  it("isolated world_id without admin is denied", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken(calls)}` },
        body: {
          request_id: "r",
          command: "LOOK",
          arguments: {},
          world_id: "test.hosted-canonical.ack-s3",
        },
      },
      calls,
    );
    expect(res.status).toBe(401);
  });

  it("isolated world_id with dual-auth is admitted", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: {
          Authorization: `Bearer ${await playerToken(calls)}`,
          "X-Noema-Admin-Token": await adminToken(calls),
        },
        body: {
          request_id: "r",
          command: "LOOK",
          arguments: {},
          world_id: "test.hosted-canonical.ack-s3",
        },
      },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.op === "idFromName" && c.name === "test.hosted-canonical.ack-s3")).toBe(true);
  });

  it("perihelion world_id stays on default without admin", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken(calls)}` },
        body: { request_id: "r", command: "LOOK", arguments: {}, world_id: "world.perihelion-reach" },
      },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.op === "idFromName" && c.name === "world-01")).toBe(true);
  });

  it("arbitrary world_id is WORLD_FORBIDDEN", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken(calls)}` },
        body: { request_id: "r", command: "LOOK", arguments: {}, world_id: "world.other" },
      },
      calls,
    );
    expect(res.status).toBe(403);
    const j = (await res.json()) as { error: { code: string } };
    expect(j.error.code).toBe("WORLD_FORBIDDEN");
    expect(worldDoCalls(calls).some((c) => c.op === "idFromName")).toBe(false);
  });
});

describe("resume token boundary — agent-protocol-v1 §resume", () => {
  /**
   * The happy path above proves resume works. These pin why it is safe: the
   * spec says a resume token "proves delivery continuity only and MUST NOT
   * authorize mutation without the normal authenticated capability and
   * idempotency checks", and resume tokens "MUST expire". The Worker satisfies
   * the mutation clause by construction — applyPlayerCommand re-runs scope and
   * seal checks on every command — but none of that boundary was tested.
   */
  async function authedResume(calls: DoCall[], e: Env): Promise<string> {
    const token = await playerToken(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    const auth = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token, prompt_version_hash: ACCEPTED_SEALS[0] } },
      dummyRoute,
    );
    return (auth.reply.body as { resume_token?: string }).resume_token || "";
  }

  it("an expired resume token restores nothing and ACT stays NOT_AUTHORIZED", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const req = new Request("https://noema.local/protocol/v1/ws");
    // Mint with exp in the past by signing the same claims shape directly.
    const now = Math.floor(Date.now() / 1000);
    const { mintHs256 } = await import("../src/jwt");
    const expired = await mintHs256(
      {
        typ: "resume",
        player_id: "player.tester",
        controller_id: "ctrl.tester",
        controller_type: "agent",
        seal: ACCEPTED_SEALS[0],
        sid: "sess.old",
        iat: now - 7200,
        exp: now - 3600,
      },
      e.TOKEN_SIGNING_SECRET!,
    );
    const hello = await handleProtocolFrame(
      e,
      req,
      { principal: null, adminToken: "" },
      { type: "HELLO", request_id: "h", body: { resume_token: expired, supported_protocols: ["agent-protocol/v1"] } },
      dummyRoute,
    );
    expect(hello.reply.type).toBe("HELLO_ACK");
    expect(hello.state.principal).toBeNull();
    const { reply } = await handleProtocolFrame(
      e,
      req,
      hello.state,
      { type: "ACT", request_id: "c", body: { action: { verb: "LOOK" } } },
      dummyRoute,
    );
    expect((reply.error as { code?: string })?.code).toBe("NOT_AUTHORIZED");
  });

  it("a tampered resume token restores nothing", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const good = await authedResume(calls, e);
    expect(good).toBeTruthy();
    const tampered = good.slice(0, -4) + "AAAA";
    const hello = await handleProtocolFrame(
      e,
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      { type: "HELLO", request_id: "h", body: { resume_token: tampered, supported_protocols: ["agent-protocol/v1"] } },
      dummyRoute,
    );
    expect(hello.state.principal).toBeNull();
  });

  it("a resume token for a non-agent controller restores nothing (RFC-0120)", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const now = Math.floor(Date.now() / 1000);
    const { mintHs256 } = await import("../src/jwt");
    const humanish = await mintHs256(
      {
        typ: "resume",
        player_id: "player.tester",
        controller_id: "ctrl.tester",
        controller_type: "human",
        seal: ACCEPTED_SEALS[0],
        sid: "sess.h",
        iat: now,
        exp: now + 3600,
      },
      e.TOKEN_SIGNING_SECRET!,
    );
    const hello = await handleProtocolFrame(
      e,
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      { type: "HELLO", request_id: "h", body: { resume_token: humanish, supported_protocols: ["agent-protocol/v1"] } },
      dummyRoute,
    );
    expect(hello.state.principal).toBeNull();
  });

  it("a restored seal is re-validated on ACT, not trusted from the token", async () => {
    // The load-bearing property. HELLO+resume restores state.seal from claims;
    // if ACT trusted it, a token minted under a seal later rotated out of the
    // catalog would keep mutating for the token lifetime. It does not: every
    // command re-runs checkLiveAgentSeal against the CURRENT accepted set.
    const calls: DoCall[] = [];
    const e = env(calls);
    const now = Math.floor(Date.now() / 1000);
    const { mintHs256 } = await import("../src/jwt");
    const staleSeal = await mintHs256(
      {
        typ: "resume",
        player_id: "player.tester",
        controller_id: "ctrl.tester",
        controller_type: "agent",
        seal: "sha256:" + "0".repeat(64), // never in the accepted catalog
        sid: "sess.s",
        iat: now,
        exp: now + 3600,
      },
      e.TOKEN_SIGNING_SECRET!,
    );
    const hello = await handleProtocolFrame(
      e,
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      { type: "HELLO", request_id: "h", body: { resume_token: staleSeal, supported_protocols: ["agent-protocol/v1"] } },
      dummyRoute,
    );
    // The principal restores — continuity is what the token proves —
    expect(hello.state.principal?.player_id).toBe("player.tester");
    // — but mutation under the rotated-out seal is refused.
    const { reply } = await handleProtocolFrame(
      e,
      new Request("https://noema.local/protocol/v1/ws"),
      hello.state,
      { type: "ACT", request_id: "c", body: { action: { verb: "LOOK" } } },
      dummyRoute,
    );
    expect((reply.error as { code?: string })?.code).toBe("SEAL_MISMATCH");
  });
});
