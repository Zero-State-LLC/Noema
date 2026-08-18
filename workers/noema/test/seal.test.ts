import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import { applyPlayerCommand, handleProtocolFrame, protocolHello } from "../src/protocol-ws";
import { ACCEPTED_SEALS, checkLiveAgentSeal, parseSeal, sealHelloFields } from "../src/seal";
import { env, type DoCall } from "./conformance/harness";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";

const LIVE_SEAL = ACCEPTED_SEALS[0];

function agentPrincipal(): PlayerPrincipal {
  return {
    player_id: "player.seal-agent",
    agent_id: "agent.seal-agent",
    controller_id: "ctrl.agent.seal",
    controller_type: "agent",
    session_id: "sess.seal",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function humanPrincipal(): PlayerPrincipal {
  return { ...agentPrincipal(), controller_type: "human", player_id: "player.seal-human" };
}

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

describe("sealed live attach", () => {
  it("accepts the published hash for a live agent", () => {
    const got = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: parseSeal(LIVE_SEAL),
    });
    expect(got).toEqual({ ok: true, seal: LIVE_SEAL });
  });

  it("refuses a live agent with no hash", () => {
    const got = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: null,
    });
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe("SEAL_REQUIRED");
  });

  it("refuses a live agent with an unknown hash", () => {
    const got = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: parseSeal("sha256:0000000000000000000000000000000000000000000000000000000000000000"),
    });
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe("SEAL_MISMATCH");
  });

  it("skips isolated agents and humans", () => {
    expect(
      checkLiveAgentSeal({ controllerType: "agent", worldKind: "isolated", presented: null }).ok,
    ).toBe(true);
    expect(
      checkLiveAgentSeal({ controllerType: "human", worldKind: "default", presented: null }).ok,
    ).toBe(true);
  });

  it("fails closed when the catalog is empty", () => {
    const got = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: parseSeal(LIVE_SEAL),
      catalog: [],
    });
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe("SEAL_MISMATCH");
  });

  it("HELLO advertises seal_required on live and not on isolated", () => {
    const live = protocolHello({
      type: "HELLO",
      request_id: "h1",
      body: { supported_protocols: ["agent-protocol/v1"] },
    });
    expect((live.body as { seal_required: boolean }).seal_required).toBe(true);
    expect((live.body as { accepted_seals: string[] }).accepted_seals).toContain(LIVE_SEAL);
    const isolated = protocolHello({
      type: "HELLO",
      request_id: "h2",
      world_id: "test.hosted-canonical.ack-s3",
      body: { supported_protocols: ["agent-protocol/v1"] },
    });
    expect((isolated.body as { seal_required: boolean }).seal_required).toBe(false);
    expect(sealHelloFields("test.hosted-canonical.ack-s3").seal_required).toBe(false);
  });

  it("does not route a live agent command without the seal header", async () => {
    let routed = false;
    const res = await applyPlayerCommand(
      env([]),
      new Request("https://noema.local/v1/command"),
      agentPrincipal(),
      { request_id: "r1", command: "LOOK" },
      async () => {
        routed = true;
        return dummyRoute(env([]), "world-01", null, { request_id: "r1", command: "LOOK" });
      },
    );
    expect(routed).toBe(false);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SEAL_REQUIRED");
  });

  it("routes a live agent command with the published seal header", async () => {
    let routed = false;
    const res = await applyPlayerCommand(
      env([]),
      new Request("https://noema.local/v1/command", { headers: { "X-Noema-Seal": LIVE_SEAL } }),
      agentPrincipal(),
      { request_id: "r1", command: "LOOK" },
      async () => {
        routed = true;
        return dummyRoute(env([]), "world-01", null, { request_id: "r1", command: "LOOK" });
      },
    );
    expect(res.status).toBe(200);
    expect(routed).toBe(true);
  });

  it("refuses a human live command (humans watch)", async () => {
    const res = await applyPlayerCommand(
      env([]),
      new Request("https://noema.local/v1/command"),
      humanPrincipal(),
      { request_id: "r1", command: "LOOK" },
      dummyRoute,
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("NOT_AUTHORIZED");
    expect(body.error.message).toMatch(/Agents play this world/i);
  });

  it("AUTH refuses a live agent without a hash", async () => {
    const calls: DoCall[] = [];
    const token = (
      await mintControllerToken(env(calls), { handle: "seal-agent", controllerType: "agent" })
    ).access_token;
    const { reply } = await handleProtocolFrame(
      env(calls),
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token } },
      dummyRoute,
    );
    expect(reply.type).toBe("ERROR");
    expect((reply.error as { code: string }).code).toBe("SEAL_REQUIRED");
  });

  it("AUTH accepts a live agent with the published hash", async () => {
    const calls: DoCall[] = [];
    const token = (
      await mintControllerToken(env(calls), { handle: "seal-agent", controllerType: "agent" })
    ).access_token;
    const { reply, state } = await handleProtocolFrame(
      env(calls),
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      {
        type: "AUTH",
        request_id: "a",
        body: { access_token: token, prompt_version_hash: LIVE_SEAL },
      },
      dummyRoute,
    );
    expect(reply.type).toBe("AUTH_ACK");
    expect(state.seal).toBe(LIVE_SEAL);
  });

  it("human AUTH is refused (humans watch)", async () => {
    const calls: DoCall[] = [];
    const token = (
      await mintControllerToken(env(calls), { handle: "seal-human", controllerType: "human" })
    ).access_token;
    const { reply } = await handleProtocolFrame(
      env(calls),
      new Request("https://noema.local/protocol/v1/ws"),
      { principal: null, adminToken: "" },
      { type: "AUTH", request_id: "a", body: { access_token: token } },
      dummyRoute,
    );
    expect(reply.type).toBe("ERROR");
    expect((reply.error as { code: string }).code).toBe("NOT_AUTHORIZED");
  });
});
