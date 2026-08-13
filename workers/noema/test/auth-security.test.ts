import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { mintHs256 } from "../src/jwt";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ...partial,
  } as Env;
}

describe("controller JWT fail-closed", () => {
  it("refuses to resolve a principal without TOKEN_SIGNING_SECRET", async () => {
    const token = await mintHs256(
      { typ: "access", player_id: "player.x", controller_id: "ctrl.x", exp: Math.floor(Date.now() / 1000) + 60 },
      "unused",
    );
    const res = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      env({ TOKEN_SIGNING_SECRET: "" }),
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(503);
  });

  it("refuses to mint without TOKEN_SIGNING_SECRET", async () => {
    await expect(
      mintControllerToken(env({ TOKEN_SIGNING_SECRET: "" }), { handle: "x" }),
    ).rejects.toThrow(/TOKEN_SIGNING_SECRET/);
  });

  it("rejects a Supabase JWT with the wrong audience", async () => {
    const secret = "supabase-secret";
    const token = await mintHs256(
      { sub: "user-1", aud: "anon", exp: Math.floor(Date.now() / 1000) + 60 },
      secret,
    );
    const res = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      env({ SUPABASE_JWT_SECRET: secret }),
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
  });
});
