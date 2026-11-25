import { describe, expect, it } from "vitest";
import { verifyCfAccessAdmin } from "./cf-access";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeJson(obj: unknown): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
}

async function makeSignedJwt(
  privateKey: CryptoKey,
  kid: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const headerB64 = encodeJson({ alg: "RS256", typ: "JWT", kid });
  const payloadB64 = encodeJson(payload);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, data));
  return `${headerB64}.${payloadB64}.${toBase64Url(sig)}`;
}

describe("Cloudflare Access Admin JWT verification (cf-access.ts)", () => {
  it("verifies a valid RS256 Access JWT for an allowlisted admin email", async () => {
    const pair = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;

    const publicJwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
    const kid = "test-kid-1";
    const nowSec = 1_700_000_000;
    const jwt = await makeSignedJwt(pair.privateKey, kid, {
      iss: "https://zero-state.cloudflareaccess.com",
      aud: ["aud-noema-admin-123"],
      email: "Admin@ZeroState.com",
      sub: "user-sub-1",
      iat: nowSec - 10,
      exp: nowSec + 300,
      jti: "evt-999",
    });

    const req = new Request("https://noema.guru/admin/studies", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });

    const res = await verifyCfAccessAdmin(
      req,
      {
        CF_ACCESS_TEAM_DOMAIN: "zero-state.cloudflareaccess.com",
        CF_ACCESS_AUD: "aud-noema-admin-123",
        ADMIN_ALLOWLIST_EMAILS: "admin@zerostate.com,ops@zerostate.com",
      },
      {
        nowSec,
        fetchJwks: async () => ({ keys: [{ ...publicJwk, kid }] }),
      },
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.email).toBe("admin@zerostate.com");
      expect(res.authEventId).toBe("cf-access:evt-999");
    }
  });

  it("rejects non-allowlisted emails with 403 CF_ACCESS_NOT_ALLOWLISTED", async () => {
    const pair = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;

    const publicJwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
    const kid = "test-kid-2";
    const nowSec = 1_700_000_000;
    const jwt = await makeSignedJwt(pair.privateKey, kid, {
      iss: "https://zero-state.cloudflareaccess.com",
      aud: ["aud-noema-admin-123"],
      email: "outsider@example.com",
      sub: "user-sub-2",
      iat: nowSec - 10,
      exp: nowSec + 300,
    });

    const req = new Request("https://noema.guru/admin/studies", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });

    const res = await verifyCfAccessAdmin(
      req,
      {
        CF_ACCESS_TEAM_DOMAIN: "zero-state.cloudflareaccess.com",
        CF_ACCESS_AUD: "aud-noema-admin-123",
        ADMIN_ALLOWLIST_EMAILS: "admin@zerostate.com",
      },
      {
        nowSec,
        fetchJwks: async () => ({ keys: [{ ...publicJwk, kid }] }),
      },
    );

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(403);
      expect(res.code).toBe("CF_ACCESS_NOT_ALLOWLISTED");
    }
  });

  it("fails closed when missing header or unconfigured", async () => {
    const req = new Request("https://noema.guru/admin/studies");
    const uncfg = await verifyCfAccessAdmin(req, {});
    expect(uncfg.ok).toBe(false);
    if (!uncfg.ok) expect(uncfg.code).toBe("CF_ACCESS_NOT_CONFIGURED");

    const missing = await verifyCfAccessAdmin(req, {
      CF_ACCESS_TEAM_DOMAIN: "zero-state.cloudflareaccess.com",
      CF_ACCESS_AUD: "aud-123",
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("CF_ACCESS_TOKEN_MISSING");
  });
});
