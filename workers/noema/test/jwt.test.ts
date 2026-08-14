import { afterEach, describe, expect, it } from "vitest";
import {
  mintEs256,
  mintHs256,
  generateEs256Pair,
  verifyHs256,
  verifyJwt,
  JwtError,
  resetJwksCache,
  supabaseJwksUrl,
} from "../src/jwt";

afterEach(() => {
  resetJwksCache();
});

describe("jwt hs256", () => {
  it("roundtrips", async () => {
    const secret = "test-secret";
    const token = await mintHs256({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 60 }, secret);
    const claims = await verifyHs256(token, secret);
    expect(claims.sub).toBe("u1");
  });

  it("rejects bad signature", async () => {
    const token = await mintHs256({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 60 }, "a");
    await expect(verifyHs256(token, "b")).rejects.toBeInstanceOf(JwtError);
  });

  it("requires an exact audience when configured", async () => {
    const secret = "aud-secret";
    const exp = Math.floor(Date.now() / 1000) + 60;
    const ok = await mintHs256({ sub: "u1", aud: "authenticated", exp }, secret);
    const claims = await verifyHs256(ok, secret, { audience: "authenticated" });
    expect(claims.sub).toBe("u1");
    const wrong = await mintHs256({ sub: "u1", aud: "anon", exp }, secret);
    await expect(verifyHs256(wrong, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
    const multi = await mintHs256({ sub: "u1", aud: ["authenticated", "service"], exp }, secret);
    await expect(verifyHs256(multi, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
    const missing = await mintHs256({ sub: "u1", exp }, secret);
    await expect(verifyHs256(missing, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
  });

  it("verifyJwt still accepts HS256 when a legacy secret is present", async () => {
    const secret = "legacy-secret";
    const token = await mintHs256(
      { sub: "hs", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 60 },
      secret,
    );
    const claims = await verifyJwt(token, { hs256Secret: secret, audience: "authenticated" });
    expect(claims.sub).toBe("hs");
  });
});

describe("jwt es256 jwks", () => {
  async function minted(extra: Record<string, unknown> = {}) {
    const pair = await generateEs256Pair();
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await mintEs256(
      {
        sub: "user-es256",
        aud: "authenticated",
        iss: "https://example.supabase.co/auth/v1",
        email: "ada@example.com",
        role: "authenticated",
        exp,
        ...extra,
      },
      pair.privateKey,
      pair.kid,
    );
    return { token, pair };
  }

  it("accepts a valid ES256 token via preloaded JWKS", async () => {
    const { token, pair } = await minted();
    const claims = await verifyJwt(token, {
      jwks: { keys: [pair.publicJwk] },
      audience: "authenticated",
      issuer: "https://example.supabase.co/auth/v1",
    });
    expect(claims.sub).toBe("user-es256");
  });

  it("accepts a valid ES256 token via fetched JWKS and caches the set", async () => {
    const { token, pair } = await minted();
    const url = supabaseJwksUrl("https://example.supabase.co");
    let fetches = 0;
    const fetchImpl: typeof fetch = async (input) => {
      fetches += 1;
      expect(String(input)).toBe(url);
      return new Response(JSON.stringify({ keys: [pair.publicJwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const first = await verifyJwt(token, { jwksUrl: url, fetch: fetchImpl, audience: "authenticated" });
    const second = await verifyJwt(token, { jwksUrl: url, fetch: fetchImpl, audience: "authenticated" });
    expect(first.sub).toBe("user-es256");
    expect(second.sub).toBe("user-es256");
    expect(fetches).toBe(1);
  });

  it("does not emit unsupported alg ES256 for a valid token", async () => {
    const { token, pair } = await minted();
    await expect(
      verifyJwt(token, { jwks: { keys: [pair.publicJwk] }, audience: "authenticated" }),
    ).resolves.toMatchObject({ sub: "user-es256" });
    await expect(
      verifyHs256(token, "unused-secret"),
    ).rejects.toMatchObject({ message: "unsupported alg ES256" });
  });

  it("rejects a bad ES256 signature", async () => {
    const { token, pair } = await minted();
    const parts = token.split(".");
    const sig = parts[2].split("");
    sig[0] = sig[0] === "A" ? "B" : "A";
    parts[2] = sig.join("");
    await expect(
      verifyJwt(parts.join("."), { jwks: { keys: [pair.publicJwk] }, audience: "authenticated" }),
    ).rejects.toMatchObject({ name: "JwtError", message: "bad signature" });
  });

  it("rejects wrong alg including none and RS256", async () => {
    const secret = "x";
    const hs = await mintHs256({ sub: "u", exp: Math.floor(Date.now() / 1000) + 60 }, secret);
    const none = hs.replace(/^eyJ[^.]+/, btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
    await expect(verifyJwt(none, { hs256Secret: secret, jwks: { keys: [] } })).rejects.toMatchObject({
      message: "unsupported alg none",
    });
    const { token } = await minted();
    const rs = token.replace(
      /^eyJ[^.]+/,
      btoa(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "k" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, ""),
    );
    await expect(verifyJwt(rs, { jwks: { keys: [] } })).rejects.toMatchObject({
      message: "unsupported alg RS256",
    });
  });

  it("refetches JWKS once when the kid is unknown in cache", async () => {
    const { token, pair } = await minted();
    const url = supabaseJwksUrl("https://example.supabase.co");
    let fetches = 0;
    const fetchImpl: typeof fetch = async () => {
      fetches += 1;
      const keys = fetches === 1 ? [] : [pair.publicJwk];
      return new Response(JSON.stringify({ keys }), { status: 200 });
    };
    await expect(verifyJwt(token, { jwksUrl: url, fetch: fetchImpl })).rejects.toMatchObject({
      message: "unknown kid",
    });
    const claims = await verifyJwt(token, { jwksUrl: url, fetch: fetchImpl });
    expect(claims.sub).toBe("user-es256");
    expect(fetches).toBe(2);
  });
});
