/**
 * Cloudflare Access (Zero Trust) JWT verifier for Admin surfaces.
 *
 * Verifies `Cf-Access-Jwt-Assertion` using WebCrypto RS256 against the team's
 * `/cdn-cgi/access/certs` JWKS endpoint, validates `iss`, `aud`, and `exp`,
 * and cross-checks `email` against `ADMIN_ALLOWLIST_EMAILS` (fail-closed).
 */

export interface CfAccessEnv {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  ADMIN_ALLOWLIST_EMAILS?: string;
}

export interface VerifiedCfAccessAdmin {
  ok: true;
  email: string;
  sub: string;
  authEventId: string;
  iat: number;
  exp: number;
}

export interface CfAccessError {
  ok: false;
  status: number;
  code:
    | "CF_ACCESS_NOT_CONFIGURED"
    | "CF_ACCESS_TOKEN_MISSING"
    | "CF_ACCESS_TOKEN_INVALID"
    | "CF_ACCESS_TOKEN_EXPIRED"
    | "CF_ACCESS_TOKEN_NOT_YET_VALID"
    | "CF_ACCESS_AUD_MISMATCH"
    | "CF_ACCESS_ISS_MISMATCH"
    | "CF_ACCESS_NOT_ALLOWLISTED";
  message: string;
}

export type CfAccessResult = VerifiedCfAccessAdmin | CfAccessError;

interface JwkKey extends JsonWebKey {
  kid?: string;
  alg?: string;
}

interface JwksPayload {
  keys?: JwkKey[];
}

export interface VerifyCfAccessOptions {
  fetchJwks?: (url: string) => Promise<JwksPayload>;
  nowSec?: number;
}

function base64UrlToUint8Array(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function decodeJsonSegment<T>(segment: string): T | null {
  try {
    const bytes = base64UrlToUint8Array(segment);
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

function normalizeTeamOrigin(teamDomain: string): string {
  const trimmed = teamDomain.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function defaultFetchJwks(url: string): Promise<JwksPayload> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`JWKS fetch failed with HTTP ${res.status}`);
  }
  return (await res.json()) as JwksPayload;
}

export async function verifyCfAccessAdmin(
  request: Request,
  env: CfAccessEnv,
  options: VerifyCfAccessOptions = {},
): Promise<CfAccessResult> {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim();
  const expectedAud = env.CF_ACCESS_AUD?.trim();
  if (!teamDomain || !expectedAud) {
    return {
      ok: false,
      status: 503,
      code: "CF_ACCESS_NOT_CONFIGURED",
      message: "Cloudflare Access admin verification is not configured.",
    };
  }

  const token =
    request.headers.get("Cf-Access-Jwt-Assertion")?.trim() ||
    request.headers.get("cf-access-jwt-assertion")?.trim() ||
    "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_MISSING",
      message: "Missing Cf-Access-Jwt-Assertion header.",
    };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_INVALID",
      message: "Malformed Cloudflare Access JWT.",
    };
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodeJsonSegment<{ alg?: string; kid?: string }>(headerB64);
  const payload = decodeJsonSegment<{
    aud?: string | string[];
    iss?: string;
    email?: string;
    sub?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    jti?: string;
  }>(payloadB64);

  if (!header || !payload || header.alg !== "RS256" || !header.kid) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_INVALID",
      message: "Unsupported or invalid Cloudflare Access JWT header/payload.",
    };
  }

  const expectedIss = normalizeTeamOrigin(teamDomain);
  if (payload.iss !== expectedIss) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_ISS_MISMATCH",
      message: "Cloudflare Access JWT issuer mismatch.",
    };
  }

  const audList = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  if (!audList.includes(expectedAud)) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_AUD_MISMATCH",
      message: "Cloudflare Access JWT audience mismatch.",
    };
  }

  const nowSec = options.nowSec ?? Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === "number" && payload.nbf > nowSec) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_NOT_YET_VALID",
      message: "Cloudflare Access JWT is not yet valid (nbf in the future).",
    };
  }
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_EXPIRED",
      message: "Cloudflare Access JWT is expired.",
    };
  }

  const jwksUrl = `${expectedIss}/cdn-cgi/access/certs`;
  const fetchJwks = options.fetchJwks ?? defaultFetchJwks;
  let jwks: JwksPayload;
  try {
    jwks = await fetchJwks(jwksUrl);
  } catch {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_INVALID",
      message: "Unable to fetch Cloudflare Access JWKS.",
    };
  }

  const jwk = (jwks.keys ?? []).find((k) => k.kid === header.kid);
  if (!jwk) {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_INVALID",
      message: "Signing key not found in Cloudflare Access JWKS.",
    };
  }

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = base64UrlToUint8Array(sigB64);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
    if (!valid) {
      return {
        ok: false,
        status: 401,
        code: "CF_ACCESS_TOKEN_INVALID",
        message: "Cloudflare Access JWT signature verification failed.",
      };
    }
  } catch {
    return {
      ok: false,
      status: 401,
      code: "CF_ACCESS_TOKEN_INVALID",
      message: "Cloudflare Access JWT cryptographic verification error.",
    };
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const allowlist = parseAllowlist(env.ADMIN_ALLOWLIST_EMAILS);
  if (!email || !allowlist.has(email)) {
    return {
      ok: false,
      status: 403,
      code: "CF_ACCESS_NOT_ALLOWLISTED",
      message: "Verified Cloudflare Access identity is not in ADMIN_ALLOWLIST_EMAILS.",
    };
  }

  const iat = typeof payload.iat === "number" ? payload.iat : nowSec;
  const sub = payload.sub || email;
  const authEventId = payload.jti ? `cf-access:${payload.jti}` : `cf-access:${sub}:${iat}`;

  return {
    ok: true,
    email,
    sub,
    authEventId,
    iat,
    exp: payload.exp,
  };
}
