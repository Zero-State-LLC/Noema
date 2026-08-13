# Admin Email Magic-Link Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allowlisted operators log into `/admin` with a Supabase magic link; the Worker mints the existing `typ: admin-access` JWT; the operator-token field leaves the login page.

**Architecture:** Public `POST /v1/admin/login/request` checks `ADMIN_ALLOWLIST_EMAILS` then calls Supabase `/auth/v1/otp`. `/admin/callback` posts `token_hash` to `POST /v1/admin/login/consume`, which verifies with Supabase, re-checks the allowlist, and mints a Worker-signed admin JWT. CLI `POST /v1/admin/session` stays. PLAY never receives the Supabase token.

**Tech Stack:** Cloudflare Worker (`workers/noema`), TypeScript, vitest, existing `mintHs256` / `resolveAdmin`, live Supabase Auth (no new npm packages).

## Global Constraints

- Do not activate, reseed, or force-supersede Genesis (`genesis.ef578f4ffceeccd0` stays live).
- Admin ≠ Player. Consume MUST NOT return Supabase `access_token`, `refresh_token`, or `provider_token`.
- `ADMIN_ALLOWLIST_EMAILS` is a wrangler secret, never `[vars]`, never `/health`.
- Login HTML has no operator-token field. `POST /v1/admin/session` remains for CLI.
- Generic request body: `{ "ok": true, "message": "If that mailbox is authorized, a link is on the way." }`
- Throttle: 5 hits / 3600s per `ip:<addr>` and per `email:<normalized>`. Over → 429 `RATE_LIMITED`.
- `NOEMA_ENV=production` redirect origin is `https://noema.guru`. No new dependencies.
- Tests: `cd workers/noema && npm test` (nvm npm). If a worktree lacks `node_modules`, `ln -sfn /home/scrimshawlife/Noema/workers/noema/node_modules workers/noema/node_modules`.
- Work in `/home/scrimshawlife/work/Noema-admin-email-spec` on `docs/admin-email-login-spec` (rename to `feat/admin-email-login` only if you prefer; do not commit secrets).

## File map

| File | Responsibility |
|------|----------------|
| `workers/noema/src/types.ts` | `ADMIN_ALLOWLIST_EMAILS`; `AdminPrincipal.authentication_context` union |
| `workers/noema/src/admin-auth.ts` | allowlist, throttle, request, consume, `amr` on mint/resolve |
| `workers/noema/src/admin.ts` | email login HTML + callback HTML |
| `workers/noema/src/index.ts` | `/admin/callback`, `/v1/admin/login/request`, `/v1/admin/login/consume` |
| `workers/noema/test/admin-email-login.test.ts` | new vitest file |
| `workers/noema/wrangler.toml` | comment the new secret name |
| `docs/OPERATOR-SMOKE.md` | email login primary; CLI token emergency |

---

### Task 1: Allowlist, email normalize, throttle

**Files:**
- Modify: `workers/noema/src/types.ts`
- Modify: `workers/noema/src/admin-auth.ts`
- Create: `workers/noema/test/admin-email-login.test.ts`

**Interfaces:**
- Consumes: existing `Env`
- Produces: `parseAllowlist(raw?: string): string[]`; `normalizeEmail(raw: string): string | null`; `clientIp(req: Request): string`; `class LoginThrottle { hit(key: string, now?: number): boolean }`; `GENERIC_LOGIN_MESSAGE`

- [ ] **Step 1: Write the failing test**

Create `workers/noema/test/admin-email-login.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  GENERIC_LOGIN_MESSAGE,
  LoginThrottle,
  clientIp,
  normalizeEmail,
  parseAllowlist,
} from "../src/admin-auth";

describe("allowlist + throttle", () => {
  it("parses comma-separated mailboxes, trim + lowercase", () => {
    expect(parseAllowlist("  Ops@Example.COM, backup@x.io ")).toEqual([
      "ops@example.com",
      "backup@x.io",
    ]);
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("")).toEqual([]);
  });

  it("normalizes valid email and rejects bad shape", () => {
    expect(normalizeEmail("  Ops@Example.COM ")).toBe("ops@example.com");
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("no-at-sign")).toBeNull();
  });

  it("reads CF-Connecting-IP", () => {
    const req = new Request("https://noema.guru/v1/admin/login/request", {
      headers: { "CF-Connecting-IP": "203.0.113.9" },
    });
    expect(clientIp(req)).toBe("203.0.113.9");
    expect(clientIp(new Request("https://noema.guru/x"))).toBe("0.0.0.0");
  });

  it("allows 5 hits per key per hour then denies", () => {
    const t = new LoginThrottle();
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) expect(t.hit("ip:1.1.1.1", now)).toBe(true);
    expect(t.hit("ip:1.1.1.1", now + 1000)).toBe(false);
    expect(t.hit("ip:9.9.9.9", now)).toBe(true);
    expect(t.hit("ip:1.1.1.1", now + 3_600_001)).toBe(true);
  });

  it("exports the generic message", () => {
    expect(GENERIC_LOGIN_MESSAGE).toBe(
      "If that mailbox is authorized, a link is on the way.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: FAIL — `GENERIC_LOGIN_MESSAGE` / `parseAllowlist` not exported.

- [ ] **Step 3: Write minimal implementation**

In `workers/noema/src/types.ts`, add to `Env`:

```ts
  /** Comma-separated operator mailboxes. Secret — never [vars] or /health. */
  ADMIN_ALLOWLIST_EMAILS?: string;
```

Change `AdminPrincipal.authentication_context` to:

```ts
  authentication_context: "operator_token" | "email_magic_link";
```

In `workers/noema/src/admin-auth.ts` add (keep existing mint/resolve):

```ts
export const GENERIC_LOGIN_MESSAGE =
  "If that mailbox is authorized, a link is on the way.";

export function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return null;
  }
  return email;
}

export function clientIp(req: Request): string {
  return req.headers.get("CF-Connecting-IP")?.trim() || "0.0.0.0";
}

export class LoginThrottle {
  private hits = new Map<string, number[]>();
  constructor(
    private limit = 5,
    private windowMs = 3_600_000,
  ) {}
  hit(key: string, now = Date.now()): boolean {
    const cut = now - this.windowMs;
    const prev = (this.hits.get(key) || []).filter((t) => t > cut);
    if (prev.length >= this.limit) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: PASS (allowlist + throttle only).

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/types.ts workers/noema/src/admin-auth.ts workers/noema/test/admin-email-login.test.ts
git commit -m "feat(admin): allowlist parse and login throttle"
```

---

### Task 2: `requestAdminMagicLink`

**Files:**
- Modify: `workers/noema/src/admin-auth.ts`
- Modify: `workers/noema/test/admin-email-login.test.ts`

**Interfaces:**
- Consumes: `parseAllowlist`, `normalizeEmail`, `clientIp`, `LoginThrottle`, `GENERIC_LOGIN_MESSAGE`, `Env.ADMIN_ALLOWLIST_EMAILS`, `Env.SUPABASE_URL`, `Env.SUPABASE_SERVICE_ROLE_KEY`, `Env.NOEMA_ENV`
- Produces: `requestAdminMagicLink(env, req, body, opts?): Promise<Response>`

```ts
export type AdminFetch = (input: string, init?: RequestInit) => Promise<Response>;

export async function requestAdminMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle },
): Promise<Response>;
```

- [ ] **Step 1: Write the failing tests** (append to the test file)

```ts
import { requestAdminMagicLink, LoginThrottle } from "../src/admin-auth";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ADMIN_ALLOWLIST_EMAILS: "ops@example.com",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    ...partial,
  } as Env;
}

describe("requestAdminMagicLink", () => {
  it("400s on bad email", async () => {
    const res = await requestAdminMagicLink(env(), new Request("https://noema.guru/x"), {
      email: "nope",
    });
    expect(res.status).toBe(400);
  });

  it("returns the same 200 for unknown and allowlisted; only allowlisted calls otp", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      return new Response("{}", { status: 200 });
    };
    const throttle = new LoginThrottle();
    const unknown = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }),
      { email: "stranger@x.io" },
      { fetch: fetchImpl, throttle },
    );
    const known = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.2" } }),
      { email: "Ops@Example.com" },
      { fetch: fetchImpl, throttle },
    );
    expect(unknown.status).toBe(200);
    expect(known.status).toBe(200);
    expect(await unknown.json()).toEqual(await known.json());
    expect(await known.json()).toEqual({
      ok: true,
      message: "If that mailbox is authorized, a link is on the way.",
    });
    expect(calls).toEqual(["https://example.supabase.co/auth/v1/otp"]);
  });

  it("does not call Supabase when allowlist is empty", async () => {
    let called = false;
    await requestAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      new Request("https://noema.guru/x"),
      { email: "ops@example.com" },
      { fetch: async () => { called = true; return new Response("{}"); } },
    );
    expect(called).toBe(false);
  });

  it("429s on the sixth request from the same IP", async () => {
    const throttle = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    for (let i = 0; i < 5; i++) {
      const res = await requestAdminMagicLink(
        env(),
        new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "8.8.8.8" } }),
        { email: `n${i}@x.io` },
        { fetch: fetchImpl, throttle },
      );
      expect(res.status).toBe(200);
    }
    const sixth = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "8.8.8.8" } }),
      { email: "last@x.io" },
      { fetch: fetchImpl, throttle },
    );
    expect(sixth.status).toBe(429);
    const body = await sixth.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.retryable).toBe(true);
  });

  it("still 200 if otp send fails", async () => {
    const res = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x"),
      { email: "ops@example.com" },
      { fetch: async () => new Response("nope", { status: 500 }) },
    );
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: FAIL — `requestAdminMagicLink` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `workers/noema/src/admin-auth.ts`:

```ts
export type AdminFetch = (input: string, init?: RequestInit) => Promise<Response>;

const defaultThrottle = new LoginThrottle();

export function loginRedirectOrigin(env: Env, req: Request): string {
  if ((env.NOEMA_ENV || "").toLowerCase() === "production") return "https://noema.guru";
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://127.0.0.1:8787";
  }
}

export async function requestAdminMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle },
): Promise<Response> {
  const email = normalizeEmail(String(body.email || ""));
  if (!email) return err("INVALID_REQUEST", "email required", 400);

  const throttle = opts?.throttle || defaultThrottle;
  const ip = clientIp(req);
  if (!throttle.hit(`ip:${ip}`) || !throttle.hit(`email:${email}`)) {
    return err("RATE_LIMITED", "too many login requests", 429);
  }

  const allow = parseAllowlist(env.ADMIN_ALLOWLIST_EMAILS);
  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  if (allow.includes(email) && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const origin = loginRedirectOrigin(env, req);
      await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/otp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          create_user: true,
          options: {
            email_redirect_to: `${origin}/admin/callback`,
            should_create_user: true,
          },
        }),
      });
    } catch {
      // send failures stay generic 200
    }
  }

  return json({ ok: true, message: GENERIC_LOGIN_MESSAGE });
}
```

Fix `err()` so 429 is retryable. Today `err` hardcodes `retryable: false`. Add an optional argument **only if** the 429 test requires it:

In `workers/noema/src/auth.ts` change:

```ts
export function err(code: string, message: string, status = 401, retryable = false): Response {
  return json({ error: { code, message, retryable } }, status);
}
```

Call `err("RATE_LIMITED", "too many login requests", 429, true)`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npm test -- admin-email-login && npm test`

Expected: all existing tests still pass; new request tests PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/admin-auth.ts workers/noema/src/auth.ts workers/noema/test/admin-email-login.test.ts
git commit -m "feat(admin): request magic link for allowlisted email"
```

---

### Task 3: `consumeAdminMagicLink`

**Files:**
- Modify: `workers/noema/src/admin-auth.ts`
- Modify: `workers/noema/test/admin-email-login.test.ts`

**Interfaces:**
- Consumes: `parseAllowlist`, `mintHs256`, `signingSecret`
- Produces:

```ts
export async function consumeAdminMagicLink(
  env: Env,
  body: { token_hash?: string; type?: string; code?: string },
  opts?: { fetch?: AdminFetch },
): Promise<
  | { access_token: string; session_id: string; role: "ADMIN"; expires_in: number }
  | Response
>;
```

Mint claims include `amr: "email_magic_link"`. Response object has no Supabase fields.

- [ ] **Step 1: Write the failing tests**

```ts
import { consumeAdminMagicLink, mintAdminSession, resolveAdmin } from "../src/admin-auth";
import { resolvePrincipal } from "../src/auth";
import { verifyHs256 } from "../src/jwt";

describe("consumeAdminMagicLink", () => {
  it("503s when allowlist is empty", async () => {
    const res = await consumeAdminMagicLink(env({ ADMIN_ALLOWLIST_EMAILS: "" }), {
      token_hash: "abc",
      type: "magiclink",
    });
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(503);
  });

  it("400s without token_hash or code", async () => {
    const res = await consumeAdminMagicLink(env(), {});
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(400);
  });

  it("401s when verified email is not allowlisted and returns no access_token", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "stranger@x.io" } }), { status: 200 });
    const res = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
    const body = await (res as Response).json();
    expect(body.access_token).toBeUndefined();
    expect(body.refresh_token).toBeUndefined();
  });

  it("mints admin-access for allowlisted verify and omits supabase tokens", async () => {
    const fetchImpl: AdminFetch = async (url) => {
      expect(url).toContain("/auth/v1/verify");
      return new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    };
    const minted = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "email" },
      { fetch: fetchImpl },
    );
    expect(minted).not.toBeInstanceOf(Response);
    const ok = minted as { access_token: string; role: string; session_id: string };
    expect(ok.role).toBe("ADMIN");
    expect(ok.session_id.startsWith("asess.")).toBe(true);
    expect("refresh_token" in ok).toBe(false);
    expect("provider_token" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, "test-signing-secret");
    expect(claims.typ).toBe("admin-access");
    expect(claims.amr).toBe("email_magic_link");
  });

  it("502s when supabase verify fails upstream", async () => {
    const res = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response("down", { status: 500 }) },
    );
    expect((res as Response).status).toBe(502);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: FAIL — `consumeAdminMagicLink` is not exported.

- [ ] **Step 3: Write minimal implementation**

Extract a private `mintAdminAccess(env, amr)` used by consume and (Task 4) CLI mint:

```ts
async function mintAdminAccess(
  env: Env,
  amr: "operator_token" | "email_magic_link",
): Promise<{ access_token: string; session_id: string; role: "ADMIN"; expires_in: number } | Response> {
  let signing: string;
  try {
    signing = signingSecret(env);
  } catch {
    return err("NOT_AUTHORIZED", "TOKEN_SIGNING_SECRET is not configured", 503);
  }
  const session_id = `asess.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = Math.floor(Date.now() / 1000);
  const expires_in = 3600;
  const access_token = await mintHs256(
    {
      typ: "admin-access",
      role: "ADMIN",
      session_id,
      scopes: ADMIN_SCOPES,
      amr,
      iat: now,
      exp: now + expires_in,
      jti: crypto.randomUUID(),
    },
    signing,
  );
  return { access_token, session_id, role: "ADMIN", expires_in };
}

export async function consumeAdminMagicLink(
  env: Env,
  body: { token_hash?: string; type?: string; code?: string },
  opts?: { fetch?: AdminFetch },
): Promise<{ access_token: string; session_id: string; role: "ADMIN"; expires_in: number } | Response> {
  if (!parseAllowlist(env.ADMIN_ALLOWLIST_EMAILS).length) {
    return err("NOT_CONFIGURED", "ADMIN_ALLOWLIST_EMAILS not set on this host", 503);
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return err("NOT_CONFIGURED", "Supabase auth is not configured", 503);
  }
  const token_hash = (body.token_hash || "").trim();
  const code = (body.code || "").trim();
  if (!token_hash && !code) return err("INVALID_REQUEST", "token_hash or code required", 400);

  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const headers = {
    "content-type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  let upstream: Response;
  try {
    if (token_hash) {
      const typ = body.type === "email" ? "email" : "magiclink";
      upstream = await fetchImpl(`${base}/auth/v1/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: typ, token_hash }),
      });
    } else {
      upstream = await fetchImpl(`${base}/auth/v1/token?grant_type=authorization_code`, {
        method: "POST",
        headers,
        body: JSON.stringify({ auth_code: code, code }),
      });
    }
  } catch {
    return err("UPSTREAM", "auth provider unavailable", 502);
  }
  if (!upstream.ok) return err("UPSTREAM", "auth provider rejected the link", 502);

  const payload = (await upstream.json().catch(() => ({}))) as {
    user?: { email?: string };
    email?: string;
  };
  const email = normalizeEmail(String(payload.user?.email || payload.email || ""));
  if (!email) return err("NOT_AUTHORIZED", "invalid operator token", 401);
  if (!parseAllowlist(env.ADMIN_ALLOWLIST_EMAILS).includes(email)) {
    return err("NOT_AUTHORIZED", "invalid operator token", 401);
  }
  return mintAdminAccess(env, "email_magic_link");
}
```

Refactor `mintAdminSession` to call `mintAdminAccess(env, "operator_token")` after the token compare (keep the compare logic).

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npm test -- admin-email-login && npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/admin-auth.ts workers/noema/test/admin-email-login.test.ts
git commit -m "feat(admin): consume magic link into admin-access JWT"
```

---

### Task 4: `resolveAdmin` reads `amr`; isolation vs Player

**Files:**
- Modify: `workers/noema/src/admin-auth.ts` (`resolveAdmin` `authentication_context`)
- Modify: `workers/noema/test/admin-email-login.test.ts`

**Interfaces:**
- Consumes: JWT claim `amr`
- Produces: `AdminPrincipal.authentication_context` is `"email_magic_link"` or `"operator_token"`

- [ ] **Step 1: Write the failing tests**

```ts
describe("admin isolation", () => {
  it("resolveAdmin accepts email-minted token and labels amr", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    const minted = (await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    )) as { access_token: string; session_id: string };
    const admin = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${minted.access_token}` },
      }),
      env(),
    );
    expect(admin).not.toBeInstanceOf(Response);
    expect((admin as { authentication_context: string }).authentication_context).toBe(
      "email_magic_link",
    );
  });

  it("GET /v1/me path rejects admin-access (resolvePrincipal 401)", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    const minted = (await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    )) as { access_token: string };
    const me = await resolvePrincipal(
      new Request("https://noema.guru/v1/me", {
        headers: { Authorization: `Bearer ${minted.access_token}` },
      }),
      env(),
    );
    expect(me).toBeInstanceOf(Response);
    expect((me as Response).status).toBe(401);
  });

  it("CLI mint still works and resolveAdmin reports operator_token", async () => {
    const minted = await mintAdminSession(env({ ADMIN_OPERATOR_TOKEN: "op-secret-token" }), "op-secret-token");
    expect(minted).not.toBeInstanceOf(Response);
    const tok = (minted as { access_token: string }).access_token;
    const admin = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${tok}` },
      }),
      env(),
    );
    expect((admin as { authentication_context: string }).authentication_context).toBe(
      "operator_token",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: FAIL — `authentication_context` is still hardcoded `"operator_token"`.

- [ ] **Step 3: Write minimal implementation**

In `resolveAdmin`, replace the hardcoded context:

```ts
    const amr = claims.amr === "email_magic_link" ? "email_magic_link" : "operator_token";
    return {
      role: "ADMIN",
      session_id: String(claims.session_id || "asess.unknown"),
      scopes,
      authentication_context: amr,
    };
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npm test -- admin-email-login && npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/admin-auth.ts workers/noema/test/admin-email-login.test.ts
git commit -m "feat(admin): label email vs operator admin sessions"
```

---

### Task 5: Routes + login/callback HTML

**Files:**
- Modify: `workers/noema/src/index.ts` (import + three routes)
- Modify: `workers/noema/src/admin.ts` (`adminLoginHtml`; add `adminCallbackHtml`)
- Modify: `workers/noema/test/admin-email-login.test.ts` (HTML assertions)

**Interfaces:**
- Consumes: `requestAdminMagicLink`, `consumeAdminMagicLink`, `adminLoginHtml`, `adminCallbackHtml`
- Produces: `GET /admin/login`, `GET /admin/callback`, `POST /v1/admin/login/request`, `POST /v1/admin/login/consume`

- [ ] **Step 1: Write the failing HTML test**

```ts
import { adminLoginHtml, adminCallbackHtml } from "../src/admin";

describe("admin login HTML", () => {
  it("is email-only", () => {
    const html = adminLoginHtml();
    expect(html).toContain('id="email"');
    expect(html).toContain("/v1/admin/login/request");
    expect(html).not.toContain("admin_token");
    expect(html).not.toContain("Operator token");
    expect(html.toLowerCase()).toContain("not a player");
  });

  it("callback posts token_hash to consume", () => {
    const html = adminCallbackHtml();
    expect(html).toContain("/v1/admin/login/consume");
    expect(html).toContain("token_hash");
    expect(html).toContain("noema.admin.token");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- admin-email-login`

Expected: FAIL — login HTML still has Operator token; `adminCallbackHtml` missing.

- [ ] **Step 3: Write minimal implementation**

Replace `adminLoginHtml` form in `workers/noema/src/admin.ts`:

- Input `id="email"` `type="email"` `autocomplete="username"`.
- POST `/v1/admin/login/request` with `{ email }`.
- Status text uses `data.message`.
- Copy: “ADMIN is not a player login.”
- No `admin_token`, no “Operator token”.

Add `adminCallbackHtml()`: script reads `token_hash`, `type`, `code` from `location.search`; POST `/v1/admin/login/consume`; on ok set `sessionStorage` `noema.admin.token` / `noema.admin.session`; `location.href = "/admin"`; on fail `location.href = "/admin/login"`.

In `workers/noema/src/index.ts`:

```ts
import { adminHtml, adminLoginHtml, adminCallbackHtml } from "./admin";
import {
  adminTokenConfigured,
  consumeAdminMagicLink,
  mintAdminSession,
  requestAdminMagicLink,
  resolveAdmin,
} from "./admin-auth";
```

After `/admin/login`:

```ts
      if (request.method === "GET" && path === "/admin/callback") {
        return html(adminCallbackHtml());
      }
```

After `/v1/admin/session`:

```ts
      if (request.method === "POST" && path === "/v1/admin/login/request") {
        const body = (await request.json().catch(() => ({}))) as { email?: string };
        return cors(await requestAdminMagicLink(env, request, body));
      }
      if (request.method === "POST" && path === "/v1/admin/login/consume") {
        const body = (await request.json().catch(() => ({}))) as {
          token_hash?: string;
          type?: string;
          code?: string;
        };
        const minted = await consumeAdminMagicLink(env, body);
        if (minted instanceof Response) return cors(minted);
        return cors(json({ ...minted, token_type: "bearer" }));
      }
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npm test && npm run typecheck`

Expected: all tests PASS; typecheck clean. Login HTML has no operator-token field.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/admin.ts workers/noema/src/index.ts workers/noema/test/admin-email-login.test.ts
git commit -m "feat(admin): email login page and magic-link callback"
```

---

### Task 6: Operator docs + secret comment

**Files:**
- Modify: `workers/noema/wrangler.toml` (comment only)
- Modify: `docs/OPERATOR-SMOKE.md`
- Modify: `docs/superpowers/specs/2026-08-13-admin-email-login-design.md` (status → approved)

**Interfaces:**
- Consumes: none
- Produces: operator instructions; no secret values

- [ ] **Step 1: Update wrangler comment**

Under the secrets comment list add:

```
# ADMIN_ALLOWLIST_EMAILS  (comma-separated operator mailboxes; never [vars])
```

- [ ] **Step 2: Rewrite the token section of `docs/OPERATOR-SMOKE.md`**

Primary: open `https://noema.guru/admin/login`, submit allowlisted email, follow magic link.

Emergency CLI (not the UI):

```bash
export BASE=https://noema.guru
export ADMIN_TOKEN='…'   # ADMIN_OPERATOR_TOKEN; operator-only
curl -sS -X POST "$BASE/v1/admin/session" \
  -H 'content-type: application/json' \
  -d "{\"admin_token\":\"$ADMIN_TOKEN\"}"
```

Keep unauthenticated probe table. Do not write mailbox addresses.

- [ ] **Step 3: Set spec status to `approved — ready to implement`** (or `approved — implementing` if executing immediately)

- [ ] **Step 4: Commit**

```bash
git add workers/noema/wrangler.toml docs/OPERATOR-SMOKE.md docs/superpowers/specs/2026-08-13-admin-email-login-design.md
git commit -m "docs(admin): email login smoke path and allowlist secret"
```

**Deploy is not part of this plan.** After merge: operator runs `npx wrangler secret put ADMIN_ALLOWLIST_EMAILS`, adds Supabase redirect URLs, then `NOEMA_ENV=production npm run deploy`. Do not activate Genesis.

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Magic link + allowlist | 1–2 |
| Same 200 body / no enumeration | 2 |
| Throttle 5/hour IP+email | 1–2 |
| Consume + re-check allowlist | 3 |
| Mint `typ: admin-access`, `amr` | 3–4 |
| No Supabase tokens in consume | 3 |
| `/v1/me` 401 on admin JWT | 4 |
| CLI session remains | 4 |
| Email-only login UI + callback | 5 |
| Routes | 5 |
| Secret not in `[vars]` | 6 |
| Smoke docs | 6 |
| No Genesis / activate | global — no task touches it |

## Placeholder scan

No TBD, no “handle edge cases”, no “similar to Task N”. `err()` retryable flag is specified in Task 2.
