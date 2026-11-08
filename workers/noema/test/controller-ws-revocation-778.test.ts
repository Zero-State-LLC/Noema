import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import { handleProtocolFrame, type ProtocolState } from "../src/protocol-ws";
import { ACCEPTED_SEALS } from "../src/seal";
import { env, hit, type DoCall } from "./conformance/harness";

type Route = Parameters<typeof handleProtocolFrame>[4];
const ws = new Request("https://noema.local/protocol/v1/ws");
const blank = (): ProtocolState => ({ principal: null, adminToken: "" });
const act = (request_id: string) => ({
  type: "ACT", request_id, body: { action: { verb: "LOOK", parameters: {} } },
});
async function setup() {
  const calls: DoCall[] = [];
  const e = env(calls);
  const credential = await mintControllerToken(e, { handle: "revocation-probe", controllerType: "agent" });
  const routed: Array<{ world: string; command: string; principal: unknown }> = [];
  const route: Route = async (_env, world, principal, envelope) => {
    routed.push({ world, command: envelope.command, principal });
    return new Response(JSON.stringify({ ok: true, world_id: world, command: envelope.command }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  const auth = await handleProtocolFrame(e, ws, blank(), {
    type: "AUTH", request_id: "auth", body: {
      access_token: credential.access_token, prompt_version_hash: ACCEPTED_SEALS[0],
    },
  }, route);
  expect(auth.reply.type).toBe("AUTH_ACK");
  expect(auth.state.principal?.controller_id).toBe(credential.controller_id);
  const revoke = async () => {
    const response = await hit("/v1/auth/controller/revoke", {
      body: {}, headers: { Authorization: "Bearer " + credential.access_token },
    }, calls);
    expect(response.status).toBe(200);
    expect((await response.json() as { revoked?: boolean }).revoked).toBe(true);
    expect(calls.some(c => c.op === "fetch" && c.url === "https://do/revoke" &&
      c.body?.kind === "controller" && c.body?.id === credential.controller_id)).toBe(true);
  };
  return { calls, e, credential, routed, route, auth, revoke };
}

describe("#778 retained WS credential revocation (private local probe)", () => {
  it("fresh HTTP command refuses the revoked credential (store-binding control)", async () => {
    const f = await setup();
    await f.revoke();
    const response = await hit("/v1/command", {
      body: { request_id: "http-after-revoke", command: "LOOK", arguments: {} },
      headers: { Authorization: "Bearer " + f.credential.access_token },
    }, f.calls);
    expect(response.status).toBe(401);
    expect((await response.json() as { error?: { code?: string } }).error?.code).toBe("NOT_AUTHORIZED");
    expect(f.routed).toHaveLength(0);
    expect(f.calls.filter(c => c.op === "fetch" && c.url === "/command")).toHaveLength(0);
  });
  it("a post-AUTH ACT is routed while valid but refused after Controller revocation", async () => {
    const f = await setup();
    const before = await handleProtocolFrame(f.e, ws, f.auth.state, act("valid-act"), f.route);
    expect(before.reply.type).toBe("ACT_RESULT");
    expect(f.routed).toHaveLength(1);
    expect(f.routed[0]).toMatchObject({ world: "world-01", command: "LOOK" });
    await f.revoke();
    const after = await handleProtocolFrame(f.e, ws, before.state, act("revoked-act"), f.route);
    expect(f.routed.length, "No post-revocation command-route call").toBe(1);
    expect(after.reply.type).toBe("ERROR");
  });
  it("a resume cursor cannot re-authorize ACT after revocation", async () => {
    const f = await setup();
    const resume = (f.auth.reply.body as { resume_token?: string }).resume_token;
    expect(resume).toBeTruthy();
    const hello = async (request_id: string) => handleProtocolFrame(f.e, ws, blank(), {
      type: "HELLO", request_id, body: {
        resume_token: resume, supported_protocols: ["agent-protocol/v1"],
      },
    }, f.route);
    const valid = await hello("valid-hello");
    expect(valid.reply.type).toBe("HELLO_ACK");
    const positive = await handleProtocolFrame(f.e, ws, valid.state, act("valid-resume-act"), f.route);
    expect(positive.reply.type).toBe("ACT_RESULT");
    expect(f.routed).toHaveLength(1);
    await f.revoke();
    const revoked = await hello("revoked-hello");
    const after = await handleProtocolFrame(f.e, ws, revoked.state, act("revoked-resume-act"), f.route);
    expect(f.routed.length, "No post-revocation resumed command-route call").toBe(1);
    expect(after.reply.type).toBe("ERROR");
  });
  it("canonical revocation-store outage fails closed before a retained ACT routes", async () => {
    const f = await setup();
    const unavailable = new Proxy(f.e.WORLD_DO, {
      get(target, key, receiver) {
        if (key === "get") return (id: DurableObjectId) => new Proxy(target.get(id), {
          get(stub, field, r) {
            if (field === "fetch") return async () => new Response("offline", { status: 503 });
            return Reflect.get(stub, field, r);
          },
        });
        return Reflect.get(target, key, receiver);
      },
    });
    const after = await handleProtocolFrame(
      { ...f.e, WORLD_DO: unavailable }, ws, f.auth.state, act("store-unavailable"), f.route,
    );
    expect(f.routed, "No command routed on canonical lookup failure").toHaveLength(0);
    expect(after.reply.type).toBe("ERROR");
    expect((after.reply.error as { code?: string }).code).toBe("UNAVAILABLE");
    expect(after.reply._status).toBe(503);
  });
});
