/** JWT verify/mint: HS256 (shared secret) and ES256 (Supabase JWKS). */

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtError";
  }
}

export type JwtHeader = Record<string, unknown>;
export type JwtClaims = Record<string, unknown>;

export type EcJwk = {
  kty: string;
  crv?: string;
  kid?: string;
  alg?: string;
  x?: string;
  y?: string;
};

export type Jwks = { keys: EcJwk[] };

export type VerifyJwtOptions = {
  audience?: string;
  issuer?: string;
  /** Legacy Supabase / shared-secret HS256. */
  hs256Secret?: string;
  /** Official Supabase JWKS, e.g. https://<project>.supabase.co/auth/v1/.well-known/jwks.json */
  jwksUrl?: string;
  /** Preloaded JWKS (tests). Skips fetch when the kid is present. */
  jwks?: Jwks;
  fetch?: typeof fetch;
};

const JWKS_TTL_MS = 10 * 60 * 1000;

type JwksCacheEntry = { keys: EcJwk[]; fetchedAt: number };

const jwksCache = new Map<string, JwksCacheEntry>();

export function resetJwksCache(): void {
  jwksCache.clear();
}

export function supabaseJwksUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
}

export function supabaseIssuer(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}

function b64urlDecode(segment: string): Uint8Array {
  const pad = "=".repeat((4 - (segment.length % 4)) % 4);
  const b64 = (segment + pad).replace(/-/g, "+").replace(/_/g, "/");
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw new JwtError("malformed token encoding");
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseCompact(token: string): {
  headerB64: string;
  payloadB64: string;
  sigB64: string;
  header: JwtHeader;
  payload: JwtClaims;
} {
  const parts = token.split(".");
  if (parts.length !== 3) throw new JwtError("malformed token");
  const [headerB64, payloadB64, sigB64] = parts;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlDecode(headerB64))) as JwtHeader;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as JwtClaims;
    return { headerB64, payloadB64, sigB64, header, payload };
  } catch {
    throw new JwtError("malformed token encoding");
  }
}

function assertClaims(payload: JwtClaims, opts?: { audience?: string; issuer?: string }): void {
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) throw new JwtError("token expired");
  if (typeof payload.nbf === "number" && payload.nbf > now + 5) throw new JwtError("token not yet valid");
  if (opts?.audience != null) {
    if (payload.aud !== opts.audience) {
      throw new JwtError("audience mismatch");
    }
  }
  if (opts?.issuer != null) {
    if (payload.iss !== opts.issuer) {
      throw new JwtError("issuer mismatch");
    }
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function verifyHs256(
  token: string,
  secret: string,
  opts?: { audience?: string; issuer?: string },
): Promise<JwtClaims> {
  const { headerB64, payloadB64, sigB64, header, payload } = parseCompact(token);
  if (header.alg !== "HS256") throw new JwtError(`unsupported alg ${header.alg}`);

  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlDecode(sigB64);
  const ok = await crypto.subtle.verify("HMAC", key, sig, data);
  if (!ok) throw new JwtError("bad signature");
  assertClaims(payload, opts);
  return payload;
}

export async function mintHs256(
  claims: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${headerB64}.${payloadB64}.${b64urlEncode(sig)}`;
}

export async function mintEs256(
  claims: Record<string, unknown>,
  privateKey: CryptoKey,
  kid: string,
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT", kid };
  const headerB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, data);
  return `${headerB64}.${payloadB64}.${b64urlEncode(sig)}`;
}

export async function generateEs256Pair(): Promise<{
  privateKey: CryptoKey;
  publicJwk: EcJwk;
  kid: string;
}> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as EcJwk;
  const kid = `test-${crypto.randomUUID().slice(0, 8)}`;
  return {
    privateKey: pair.privateKey,
    publicJwk: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, kid, alg: "ES256" },
    kid,
  };
}

async function importEs256Jwk(jwk: EcJwk): Promise<CryptoKey> {
  if (jwk.kty !== "EC" || (jwk.crv && jwk.crv !== "P-256") || !jwk.x || !jwk.y) {
    throw new JwtError("jwks key is not ES256 P-256");
  }
  if (jwk.alg && jwk.alg !== "ES256") {
    throw new JwtError("jwks key is not ES256 P-256");
  }
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
}

async function verifyEs256WithJwk(
  headerB64: string,
  payloadB64: string,
  sigB64: string,
  jwk: EcJwk,
): Promise<boolean> {
  const key = await importEs256Jwk(jwk);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlDecode(sigB64);
  if (sig.byteLength !== 64) throw new JwtError("bad signature");
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, data);
}

async function fetchJwks(url: string, fetchImpl: typeof fetch): Promise<EcJwk[]> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new JwtError("jwks fetch failed");
  }
  if (!res.ok) throw new JwtError("jwks fetch failed");
  const body = (await res.json().catch(() => null)) as Jwks | null;
  if (!body || !Array.isArray(body.keys)) throw new JwtError("jwks fetch failed");
  return body.keys;
}

async function resolveJwk(
  kid: string,
  opts: VerifyJwtOptions,
): Promise<EcJwk> {
  if (opts.jwks) {
    const found = opts.jwks.keys.find((k) => k.kid === kid);
    if (found) return found;
  }
  const url = opts.jwksUrl;
  if (!url) throw new JwtError("unknown kid");

  const now = Date.now();
  const cached = jwksCache.get(url);
  if (cached && now - cached.fetchedAt < JWKS_TTL_MS) {
    const found = cached.keys.find((k) => k.kid === kid);
    if (found) return found;
  }

  const fetchImpl = opts.fetch || globalThis.fetch;
  const keys = await fetchJwks(url, fetchImpl);
  jwksCache.set(url, { keys, fetchedAt: now });
  const found = keys.find((k) => k.kid === kid);
  if (!found) throw new JwtError("unknown kid");
  return found;
}

/**
 * Verify a Supabase (or compatible) access token.
 * HS256 uses the legacy JWT secret; ES256 uses JWKS (cached 10 minutes, refetch on unknown kid).
 */
export async function verifyJwt(token: string, opts: VerifyJwtOptions = {}): Promise<JwtClaims> {
  const parsed = parseCompact(token);
  const alg = parsed.header.alg;
  if (alg === "HS256") {
    if (!opts.hs256Secret) throw new JwtError("hs256 secret not configured");
    return verifyHs256(token, opts.hs256Secret, { audience: opts.audience, issuer: opts.issuer });
  }
  if (alg === "ES256") {
    if (!opts.jwks && !opts.jwksUrl) {
      throw new JwtError("ES256 requires JWKS (SUPABASE_URL)");
    }
    const kid = typeof parsed.header.kid === "string" ? parsed.header.kid : "";
    if (!kid) throw new JwtError("missing kid");
    const jwk = await resolveJwk(kid, opts);
    const ok = await verifyEs256WithJwk(parsed.headerB64, parsed.payloadB64, parsed.sigB64, jwk);
    if (!ok) throw new JwtError("bad signature");
    assertClaims(parsed.payload, { audience: opts.audience, issuer: opts.issuer });
    return parsed.payload;
  }
  throw new JwtError(`unsupported alg ${alg}`);
}
