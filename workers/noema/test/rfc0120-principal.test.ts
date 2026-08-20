import { describe, expect, it } from "vitest";
import { HUMAN_WATCH_MESSAGE, resolvePrincipal } from "../src/auth";
import { mintAdminSession } from "../src/admin-auth";
import { mintHs256 as sign } from "../src/jwt";
import worker from "../src/index";
import { env, hit, OPERATOR, SIGNING, type DoCall } from "./conformance/harness";
import type { Env } from "../src/types";

describe("RFC-0120 principal split", () => {
  it("Supabase JWT is a HumanPrincipal without player_id or action.submit", async () => {
    const e = env([]) as Env;
    const token = await sign(
      {
        sub: "11111111-2222-3333-4444-555555555555",
        aud: "authenticated",
        email: "ada@x.io",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      SIGNING,
    );
    const p = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      { ...e, SUPABASE_JWT_SECRET: SIGNING },
    );
    expect(p).not.toBeInstanceOf(Response);
    const human = p as { kind: string; player_id?: string; scopes: string[] };
    expect(human.kind).toBe("human");
    expect(human.player_id).toBeUndefined();
    expect(human.scopes).not.toContain("noema.action.submit");
  });

  it("missing controller_type on an access token does not default to agent", async () => {
    const e = env([]);
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        typ: "access",
        player_id: "player.sneak",
        controller_id: "ctrl.sneak",
        scopes: ["noema.action.submit"],
        iat: now,
        exp: now + 3600,
      },
      SIGNING,
    );
    const p = await resolvePrincipal(
      new Request("https://noema.local/v1/command", { headers: { Authorization: `Bearer ${token}` } }),
      e,
    );
    expect(p).toBeInstanceOf(Response);
    expect((p as Response).status).toBe(401);
  });

  it("legacy human access JWT with player_id cannot inhabit", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        typ: "access",
        player_id: "player.legacy",
        controller_id: "ctrl.human.legacy",
        controller_type: "human",
        scopes: ["noema.action.submit", "noema.world.observe"],
        sid: "sess.legacy",
        iat: now,
        exp: now + 3600,
      },
      SIGNING,
    );
    const me = await worker.fetch(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      e,
    );
    expect(me.status).toBe(200);
    const body = (await me.json()) as { principal?: { kind?: string; player_id?: string } };
    expect(body.principal?.kind).toBe("human");
    expect(body.principal?.player_id).toBeUndefined();
    const cmd = await hit(
      "/v1/command",
      {
        body: { request_id: "x1", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${token}` },
      },
      calls,
    );
    expect(cmd.status).toBe(403);
    const errBody = (await cmd.json()) as { error?: { message?: string } };
    expect(errBody.error?.message).toBe(HUMAN_WATCH_MESSAGE);
  });

  it("admin mint refuses human and hybrid", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const admin = await mintAdminSession(e, OPERATOR);
    expect(admin).not.toBeInstanceOf(Response);
    const access = (admin as { access_token: string }).access_token;
    for (const controller_type of ["human", "hybrid"] as const) {
      const res = await hit(
        "/v1/admin/controller-token",
        {
          method: "POST",
          body: { handle: "nacre", controller_type },
          headers: { Authorization: `Bearer ${access}` },
        },
        calls,
      );
      expect(res.status, controller_type).toBe(403);
    }
  });
});
