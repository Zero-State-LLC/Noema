import { describe, expect, it } from "vitest";
import { HUMAN_WATCH_MESSAGE, mintControllerToken } from "../src/auth";
import worker from "../src/index";
import { applyPlayerCommand } from "../src/protocol-ws";
import { ACCEPTED_SEALS } from "../src/seal";
import { env, hit, type DoCall } from "./conformance/harness";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";

const LIVE_SEAL = ACCEPTED_SEALS[0];

function principal(controller_type: PlayerPrincipal["controller_type"]): PlayerPrincipal {
  return {
    player_id: `player.scope-${controller_type}`,
    agent_id: `agent.scope-${controller_type}`,
    controller_id: `ctrl.${controller_type}.scope`,
    controller_type,
    session_id: "sess.scope",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

async function dummyRoute(_env: Env, worldId: string, _principal: unknown, envelope: CommandEnvelope) {
  return new Response(JSON.stringify({ ok: true, world_id: worldId, command: envelope.command }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("agents inhabit — humans watch", () => {
  it("applyPlayerCommand refuses human and hybrid", async () => {
    for (const kind of ["human", "hybrid"] as const) {
      let routed = false;
      const res = await applyPlayerCommand(
        env([]),
        new Request("https://noema.local/v1/command", { headers: { "X-Noema-Seal": LIVE_SEAL || "" } }),
        principal(kind),
        { request_id: "r1", command: "LOOK" },
        async () => {
          routed = true;
          return dummyRoute(env([]), "world-01", null, { request_id: "r1", command: "LOOK" });
        },
      );
      expect(routed, kind).toBe(false);
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("NOT_AUTHORIZED");
      expect(body.error.message).toBe(HUMAN_WATCH_MESSAGE);
    }
  });

  it("applyPlayerCommand routes an agent with the live seal", async () => {
    let routed = false;
    const res = await applyPlayerCommand(
      env([]),
      new Request("https://noema.local/v1/command", { headers: { "X-Noema-Seal": LIVE_SEAL || "" } }),
      principal("agent"),
      { request_id: "r1", command: "LOOK" },
      async () => {
        routed = true;
        return dummyRoute(env([]), "world-01", null, { request_id: "r1", command: "LOOK" });
      },
    );
    expect(res.status).toBe(200);
    expect(routed).toBe(true);
  });

  it("HTTP /v1/command refuses a human token", async () => {
    const calls: DoCall[] = [];
    const minted = await mintControllerToken(env(calls), { handle: "watcher", controllerType: "human" });
    const res = await hit(
      "/v1/command",
      {
        body: { request_id: "h1", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("NOT_AUTHORIZED");
    expect(body.error.message).toBe(HUMAN_WATCH_MESSAGE);
    expect(calls.filter((c) => c.op === "fetch" && String(c.url || "").includes("/command"))).toEqual([]);
  });

  it("HTTP /v1/command accepts an agent token with the live seal", async () => {
    const calls: DoCall[] = [];
    const minted = await mintControllerToken(env(calls), { handle: "hermes", controllerType: "agent" });
    const res = await hit(
      "/v1/command",
      {
        body: { request_id: "a1", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(res.status).toBe(200);
  });

  it("magic-link identity is human and cannot inhabit", async () => {
    const calls: DoCall[] = [];
    const minted = await mintControllerToken(env(calls), {
      handle: "ada",
      controllerType: "human",
      amr: "email_magic_link",
    });
    expect(minted.controller_type).toBe("human");
    expect(minted.player_id).toBe("");
    const me = await worker.fetch(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${minted.access_token}` } }),
      env(calls),
    );
    expect(me.status).toBe(200);
    const identity = (await me.json()) as { principal?: { kind?: string; controller_type?: string; player_id?: string } };
    expect(identity.principal?.kind).toBe("human");
    expect(identity.principal?.controller_type).toBe("human");
    expect(identity.principal?.player_id).toBeUndefined();
    const cmd = await hit(
      "/v1/command",
      {
        body: { request_id: "m1", command: "ENTER_WORLD", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(cmd.status).toBe(403);
  });
});
