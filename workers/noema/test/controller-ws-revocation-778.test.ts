import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import { acceptProtocolWebSocket, handleProtocolFrame, principalFromResume, type ProtocolState } from "../src/protocol-ws";
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
  const routed: Array<{ world: string; command: string; principal: unknown; arguments?: Record<string, unknown> }> = [];
  const route: Route = async (_env, world, principal, envelope) => {
    routed.push({ world, command: envelope.command, principal, arguments: envelope.arguments });
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
  it("strips a text carrier before routing and refuses it after revocation", async () => {
    const f = await setup();
    const frame = (request_id: string) => ({
      type: "ACT",
      request_id,
      body: { action: { verb: "LOOK", parameters: { line: "alias set ii look" } } },
    });
    const before = await handleProtocolFrame(f.e, ws, f.auth.state, frame("line-valid"), f.route);
    expect(before.reply.type).toBe("ACT_RESULT");
    expect(f.routed).toHaveLength(1);
    expect(f.routed[0].arguments).not.toHaveProperty("line");
    await f.revoke();
    const after = await handleProtocolFrame(f.e, ws, before.state, frame("line-revoked"), f.route);
    expect(after.reply.type).toBe("ERROR");
    expect(f.routed).toHaveLength(1);
  });

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

  it("#929 rotate retires WebSocket resume tokens minted from the rotated access token", async () => {
    const f = await setup();
    const resume = (f.auth.reply.body as { resume_token?: string }).resume_token;
    expect(resume).toBeTruthy();

    // Resume token carries the original jti so jti-only rotation applies.
    const restoredBefore = await principalFromResume(f.e, resume!);
    expect(restoredBefore?.principal.jti).toBeTruthy();
    expect(restoredBefore?.principal.jti).toBe(f.auth.state.principal?.jti);

    const rot = await hit("/v1/auth/controller/rotate", {
      body: {},
      headers: { Authorization: "Bearer " + f.credential.access_token },
    }, f.calls);
    expect(rot.status).toBe(200);

    // Old access token and retained session are refused.
    const authOld = await handleProtocolFrame(f.e, ws, blank(), {
      type: "AUTH",
      request_id: "auth-old",
      body: { access_token: f.credential.access_token, prompt_version_hash: ACCEPTED_SEALS[0] },
    }, f.route);
    expect(authOld.reply.type).toBe("ERROR");
    const retained = await handleProtocolFrame(f.e, ws, f.auth.state, act("retained"), f.route);
    expect(retained.reply.type).toBe("ERROR");

    // HELLO with the pre-rotation resume token does not restore a revoked principal, and ACT fails.
    const hello = await handleProtocolFrame(f.e, ws, blank(), {
      type: "HELLO",
      request_id: "hello-after-rotate",
      body: { resume_token: resume, supported_protocols: ["agent-protocol/v1"] },
    }, f.route);
    expect(hello.state.principal).toBeNull();
    const after = await handleProtocolFrame(f.e, ws, hello.state, act("after-rotate"), f.route);
    expect(after.reply.type).toBe("ERROR");
    expect(f.routed).toHaveLength(0);
  });

  it("#930 in-flight WebSocket ACT cannot roll back a later AUTH on the same socket", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const p1 = await mintControllerToken(e, { handle: "race-one", controllerType: "agent" });
    const p2 = await mintControllerToken(e, { handle: "race-two", controllerType: "agent" });

    let releaseFirstAct!: () => void;
    const firstActGate = new Promise<void>((resolve) => {
      releaseFirstAct = resolve;
    });
    const routedControllers: string[] = [];
    let actCount = 0;
    const route: Route = async (_env, world, principal, envelope) => {
      actCount += 1;
      routedControllers.push((principal as { controller_id: string }).controller_id);
      if (actCount === 1) await firstActGate;
      return new Response(JSON.stringify({ ok: true, world_id: world, command: envelope.command }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    let onMessage: ((evt: MessageEvent) => void) | null = null;
    const sent: Array<Record<string, unknown>> = [];
    const fakeServer = {
      accept() {},
      addEventListener(type: string, fn: (evt: MessageEvent) => void) {
        if (type === "message") onMessage = fn;
      },
      send(payload: string) {
        sent.push(JSON.parse(payload) as Record<string, unknown>);
      },
    };
    const fakeClient = {};
    const origPair = (globalThis as Record<string, unknown>).WebSocketPair;
    const origResponse = globalThis.Response;
    (globalThis as Record<string, unknown>).WebSocketPair = function FakeWebSocketPair() {
      return [fakeClient, fakeServer];
    };
    (globalThis as Record<string, unknown>).Response = class FakeResp {
      status: number;
      constructor(_body: unknown, init?: { status?: number }) {
        this.status = init?.status ?? 200;
      }
    };
    try {
      const upgradeReq = new Request("https://noema.local/protocol/v1/ws", {
        headers: { Upgrade: "websocket" },
      });
      acceptProtocolWebSocket(upgradeReq, e, route);
    } finally {
      (globalThis as Record<string, unknown>).WebSocketPair = origPair;
      globalThis.Response = origResponse;
    }

    expect(onMessage).not.toBeNull();
    const fire = (frame: Record<string, unknown>) =>
      onMessage!({ data: JSON.stringify(frame) } as MessageEvent);
    const waitForReplies = async (n: number) => {
      for (let i = 0; i < 50 && sent.length < n; i += 1) {
        await new Promise((r) => setTimeout(r, 5));
      }
      expect(sent.length).toBeGreaterThanOrEqual(n);
    };

    fire({ type: "AUTH", request_id: "a1", body: { access_token: p1.access_token, prompt_version_hash: ACCEPTED_SEALS[0] } });
    await waitForReplies(1);
    expect(sent[0].type).toBe("AUTH_ACK");

    // Start slow ACT as P1, immediately send AUTH(P2) and a second ACT while first is held.
    fire(act("slow"));
    fire({ type: "AUTH", request_id: "a2", body: { access_token: p2.access_token, prompt_version_hash: ACCEPTED_SEALS[0] } });
    fire(act("next"));

    // Release slow ACT; serialization guarantees AUTH(P2) runs after slow ACT and before "next".
    await new Promise((r) => setTimeout(r, 15));
    releaseFirstAct();
    await waitForReplies(4);

    expect(sent.map((m) => m.request_id)).toEqual(["a1", "slow", "a2", "next"]);
    expect(sent[2].type).toBe("AUTH_ACK");
    expect(sent[3].type).toBe("ACT_RESULT");
    expect(routedControllers).toEqual([p1.controller_id, p2.controller_id]);
  });
});
