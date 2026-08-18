import { describe, expect, it } from "vitest";
import { handleProtocolFrame, protocolHello, acceptProtocolWebSocket } from "../src/protocol-ws";
import { adminToken, env, hit, playerToken, type DoCall } from "./conformance/harness";
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
      { type: "AUTH", request_id: "a", body: { access_token: token } },
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
      { type: "AUTH", request_id: "a", body: { access_token: token } },
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
      { type: "AUTH", request_id: "a", body: { access_token: token, admin_token: await adminToken(calls) } },
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
      { type: "AUTH", request_id: "a", body: { access_token: token } },
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
      { type: "AUTH", request_id: "a", body: { access_token: token } },
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
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });
});
