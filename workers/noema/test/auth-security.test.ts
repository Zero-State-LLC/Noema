import { afterEach, describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { generateEs256Pair, mintEs256, mintHs256, resetJwksCache } from "../src/jwt";
import { resolveAdmin } from "../src/admin-auth";
import type { Env } from "../src/types";
import type { PlayerPrincipal } from "../src/types";

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

  it("still accepts a legacy HS256 Supabase access token", async () => {
    const secret = "supabase-secret";
    const token = await mintHs256(
      { sub: "11111111-2222-3333-4444-555555555555", aud: "authenticated", email: "ada@x.io", exp: Math.floor(Date.now() / 1000) + 60 },
      secret,
    );
    const p = await resolvePrincipal(
      new Request("https://noema.local/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
      env({ SUPABASE_JWT_SECRET: secret }),
    );
    expect(p).not.toBeInstanceOf(Response);
    expect((p as PlayerPrincipal).authentication_context).toBe("supabase_jwt");
    expect((p as PlayerPrincipal).player_id).toBe("player.111111112222");
    expect((p as PlayerPrincipal).controller_type).toBe("human");
  });
});

describe("supabase ES256 enter-world principal", () => {
  afterEach(() => {
    resetJwksCache();
  });

  async function es256Token(extra: Record<string, unknown> = {}) {
    const pair = await generateEs256Pair();
    const token = await mintEs256(
      {
        sub: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        aud: "authenticated",
        iss: "https://example.supabase.co/auth/v1",
        email: "player@example.com",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 60,
        ...extra,
      },
      pair.privateKey,
      pair.kid,
    );
    return { token, pair };
  }

  it("resolves a valid ES256 Supabase token via JWKS as a Player, not ADMIN", async () => {
    const { token, pair } = await es256Token();
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ keys: [pair.publicJwk] }), { status: 200 });
    const prev = globalThis.fetch;
    globalThis.fetch = fetchImpl;
    try {
      const p = await resolvePrincipal(
        new Request("https://noema.guru/v1/command", { headers: { Authorization: `Bearer ${token}` } }),
        env({
          SUPABASE_JWT_SECRET: "legacy-unused-for-es256",
          SUPABASE_URL: "https://example.supabase.co",
        }),
      );
      expect(p).not.toBeInstanceOf(Response);
      const principal = p as PlayerPrincipal;
      expect(principal.authentication_context).toBe("supabase_jwt");
      expect(principal.controller_type).toBe("human");
      expect(principal.player_id).toBe("player.aaaaaaaabbbb");
      expect(principal.identity_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
      expect(principal.scopes).toContain("noema.action.submit");
      expect(principal.scopes).not.toContain("noema.world.admin");

      const admin = await resolveAdmin(
        new Request("https://noema.guru/v1/admin/overview", { headers: { Authorization: `Bearer ${token}` } }),
        env(),
      );
      expect(admin).toBeInstanceOf(Response);
      expect((admin as Response).status).toBeGreaterThanOrEqual(401);
    } finally {
      globalThis.fetch = prev;
    }
  });

  it("does not return unsupported alg ES256 for a valid Supabase access token", async () => {
    const { token, pair } = await es256Token();
    const prev = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [pair.publicJwk] }), { status: 200 });
    try {
      const p = await resolvePrincipal(
        new Request("https://noema.guru/v1/me", { headers: { Authorization: `Bearer ${token}` } }),
        env({ SUPABASE_URL: "https://example.supabase.co" }),
      );
      expect(p).not.toBeInstanceOf(Response);
    } finally {
      globalThis.fetch = prev;
    }
  });

  it("rejects a bad ES256 signature on the enter-world path", async () => {
    const { token, pair } = await es256Token();
    const parts = token.split(".");
    const sig = parts[2].split("");
    sig[2] = sig[2] === "A" ? "B" : "A";
    parts[2] = sig.join("");
    const prev = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [pair.publicJwk] }), { status: 200 });
    try {
      const res = await resolvePrincipal(
        new Request("https://noema.guru/v1/command", { headers: { Authorization: `Bearer ${parts.join(".")}` } }),
        env({ SUPABASE_URL: "https://example.supabase.co" }),
      );
      expect(res).toBeInstanceOf(Response);
      expect((res as Response).status).toBe(401);
      const body = (await (res as Response).json()) as { error?: { message?: string } };
      expect(body.error?.message).toMatch(/bad signature/);
      expect(body.error?.message).not.toMatch(/unsupported alg ES256/);
    } finally {
      globalThis.fetch = prev;
    }
  });
});
