# Player Email Magic-Link Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Any email can request a magic link from `/` and `/play`; the Worker mints a Player `typ: access` JWT; ADMIN stays allowlisted at `/admin/login`.

**Architecture:** New `play-auth.ts` (separate `LoginThrottle` from admin). `POST /v1/play/login/request` always sends Supabase otp (no allowlist) with `email_redirect_to` `{origin}/play/callback`. Consume verifies, then `mintControllerToken` with `playerId` from Supabase `user.id`. Homepage and PLAY share `noema.play.token`.

**Tech Stack:** Cloudflare Worker, TypeScript, vitest, existing `normalizeEmail`, `LoginThrottle`, `mintControllerToken`, `loginRedirectOrigin` (or a shared origin helper).

## Global Constraints

- Do not activate, reseed, or force-supersede Genesis (`genesis.ef578f4ffceeccd0` stays live).
- Admin ≠ Player. PLAY consume MUST mint `typ: access` only. That token MUST fail `resolveAdmin`.
- No allowlist on PLAY. Generic body: `{ "ok": true, "message": "If that mailbox can play, a link is on the way." }`
- Separate `LoginThrottle` instance from ADMIN (`playLoginThrottle`). 5 hits / 3600s per `ip:` and `email:`.
- `player_id` = `player.` + first 12 hex chars of Supabase user id with hyphens removed. Handle = email local-part sanitized.
- `issued_by` must not be `admin`. `amr` = `email_magic_link`.
- Production otp origin `https://noema.guru`. Redirect `/play/callback`.
- Never store Supabase `access_token` / `refresh_token`. Token paste is advanced-only on `/play`.
- Tests: `cd workers/noema && npm test` (nvm npm). Symlink `node_modules` from `/home/scrimshawlife/Noema/workers/noema/node_modules` if needed.
- Work in `/home/scrimshawlife/work/Noema-player-email-spec` on `docs/player-email-login-spec`.

## File map

| File | Responsibility |
|------|----------------|
| `workers/noema/src/auth.ts` | optional `playerId`, `identityId`, `amr` on mint |
| `workers/noema/src/play-auth.ts` | request/consume + play throttle |
| `workers/noema/src/play-login-html.ts` | callback HTML + reusable email form snippet |
| `workers/noema/src/index.ts` | routes |
| `workers/noema/src/play.ts` | email gate + advanced token |
| `workers/noema/src/landing.ts` | homepage email + operator link |
| `workers/noema/test/play-email-login.test.ts` | new |
| `docs/OPERATOR-SMOKE.md` | PLAY vs ADMIN email |

---

### Task 1: `mintControllerToken` identity overrides

**Files:**
- Modify: `workers/noema/src/auth.ts`
- Create: `workers/noema/test/play-email-login.test.ts`

**Interfaces:**
- Consumes: existing `mintControllerToken`
- Produces:

```ts
export type MintControllerOptions = {
  handle: string;
  controllerType?: ControllerType;
  expiresIn?: number;
  issuedByAdmin?: boolean;
  playerId?: string;
  identityId?: string;
  amr?: string;
};
```

When `playerId` set, use it as `player_id` (must already start with `player.` or prefix it). When `identityId` set, add claim `identity_id`. When `amr` set, add claim `amr`. `issuedByAdmin` still sets `issued_by: "admin"` only.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { verifyHs256 } from "../src/jwt";
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

describe("mintControllerToken identity overrides", () => {
  it("uses playerId, identityId, amr and does not set issued_by", async () => {
    const m = await mintControllerToken(env(), {
      handle: "alice",
      controllerType: "human",
      expiresIn: 86400,
      playerId: "player.abc123def456",
      identityId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      amr: "email_magic_link",
    });
    expect(m.player_id).toBe("player.abc123def456");
    expect(m.controller_type).toBe("human");
    expect(m.expires_in).toBe(86400);
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.typ).toBe("access");
    expect(claims.player_id).toBe("player.abc123def456");
    expect(claims.identity_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
  });

  it("admin mint still handle-based with issued_by admin", async () => {
    const m = await mintControllerToken(env(), {
      handle: "bob",
      issuedByAdmin: true,
    });
    expect(m.player_id).toBe("player.bob");
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.issued_by).toBe("admin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npm test -- play-email-login`

Expected: FAIL — `player_id` is `player.alice` not override.

- [ ] **Step 3: Write minimal implementation**

In `MintControllerOptions` add `playerId?: string; identityId?: string; amr?: string`.

After computing default `player_id`:

```ts
  const player_id = opts.playerId
    ? (opts.playerId.startsWith("player.") ? opts.playerId : `player.${opts.playerId}`)
    : `player.${handle}`;
```

Add to claims if present: `identity_id`, `amr`. Do not set `issued_by` unless `issuedByAdmin`.

- [ ] **Step 4: Run tests**

`cd workers/noema && npm test -- play-email-login && npm test`

Expected: PASS (existing operator-token tests still pass).

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/auth.ts workers/noema/test/play-email-login.test.ts
git commit -m "feat(auth): allow playerId override on controller mint"
```

---

### Task 2: `requestPlayMagicLink`

**Files:**
- Create: `workers/noema/src/play-auth.ts`
- Modify: `workers/noema/test/play-email-login.test.ts`

**Interfaces:**
- Consumes: `normalizeEmail`, `clientIp`, `LoginThrottle`, `loginRedirectOrigin` from `admin-auth.ts` (origin helper only — do not use admin allowlist)
- Produces:

```ts
export const GENERIC_PLAY_LOGIN_MESSAGE =
  "If that mailbox can play, a link is on the way.";
export const playLoginThrottle = new LoginThrottle();

export async function requestPlayMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle },
): Promise<Response>;
```

Import `AdminFetch` from `admin-auth.ts` (export it if not already exported).

- [ ] **Step 1: Write the failing tests**

```ts
import { LoginThrottle } from "../src/admin-auth";
import { requestPlayMagicLink, GENERIC_PLAY_LOGIN_MESSAGE } from "../src/play-auth";

describe("requestPlayMagicLink", () => {
  it("400s on bad email", async () => {
    const res = await requestPlayMagicLink(env(), new Request("https://noema.guru/x"), { email: "nope" });
    expect(res.status).toBe(400);
  });

  it("calls otp for any valid email with /play/callback redirect", async () => {
    let body = "";
    const fetchImpl = async (url: string, init?: RequestInit) => {
      expect(url).toContain("/auth/v1/otp");
      body = String(init?.body || "");
      return new Response("{}", { status: 200 });
    };
    const res = await requestPlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      new Request("https://noema.guru/x"),
      { email: "anyone@x.io" },
      { fetch: fetchImpl, throttle: new LoginThrottle() },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: GENERIC_PLAY_LOGIN_MESSAGE });
    const parsed = JSON.parse(body);
    expect(parsed.email).toBe("anyone@x.io");
    expect(parsed.options.email_redirect_to).toBe("https://noema.guru/play/callback");
  });

  it("429s on sixth request from same IP", async () => {
    const throttle = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    const e = env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" });
    for (let i = 0; i < 5; i++) {
      expect(
        (await requestPlayMagicLink(e, new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }), { email: `n${i}@x.io` }, { fetch: fetchImpl, throttle })).status,
      ).toBe(200);
    }
    const sixth = await requestPlayMagicLink(
      e,
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }),
      { email: "last@x.io" },
      { fetch: fetchImpl, throttle },
    );
    expect(sixth.status).toBe(429);
  });

  it("PLAY throttle does not increment an admin throttle instance", async () => {
    const adminT = new LoginThrottle();
    const playT = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    const e = env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" });
    await requestPlayMagicLink(e, new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "2.2.2.2" } }), { email: "a@x.io" }, { fetch: fetchImpl, throttle: playT });
    expect(adminT.hit("ip:2.2.2.2")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`play-auth` missing)

- [ ] **Step 3: Implement `requestPlayMagicLink`**

Mirror admin request **without** allowlist. Always otp if `SUPABASE_URL` + service role set. `email_redirect_to` = `${loginRedirectOrigin(env, req)}/play/callback`. On `!res.ok` or throw: `console.error("play magic-link send failed")`. Default throttle = module `playLoginThrottle`. 429 via `err(..., 429, true)`.

If supabase unset, still return generic 200 (do not call fetch).

- [ ] **Step 4: `npm test -- play-email-login && npm test`** — PASS

- [ ] **Step 5: Commit** `feat(play): request public magic link`

---

### Task 3: `consumePlayMagicLink`

**Files:**
- Modify: `workers/noema/src/play-auth.ts`
- Modify: `workers/noema/test/play-email-login.test.ts`

**Interfaces:**
- Produces:

```ts
export async function consumePlayMagicLink(
  env: Env,
  body: { token_hash?: string; type?: string; code?: string },
  opts?: { fetch?: AdminFetch },
): Promise<
  | { access_token: string; player_id: string; controller_type: "human"; expires_in: number }
  | Response
>;
```

- [ ] **Step 1: Failing tests**

```ts
import { consumePlayMagicLink } from "../src/play-auth";
import { resolvePrincipal } from "../src/auth";
import { resolveAdmin } from "../src/admin-auth";
import { verifyHs256 } from "../src/jwt";

const USER = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "Ada.Lovelace@Example.COM",
};

describe("consumePlayMagicLink", () => {
  it("503s without supabase", async () => {
    const res = await consumePlayMagicLink(env(), { token_hash: "h", type: "magiclink" });
    expect((res as Response).status).toBe(503);
  });

  it("400s without hash or code", async () => {
    const res = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      {},
    );
    expect((res as Response).status).toBe(400);
  });

  it("401s on verify 400", async () => {
    const res = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response("bad", { status: 400 }) },
    );
    expect((res as Response).status).toBe(401);
    expect((await (res as Response).json()).access_token).toBeUndefined();
  });

  it("mints typ access with compact sub player_id", async () => {
    const minted = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "email" },
      { fetch: async () => new Response(JSON.stringify({ user: USER }), { status: 200 }) },
    );
    expect(minted).not.toBeInstanceOf(Response);
    const ok = minted as { access_token: string; player_id: string; controller_type: string };
    expect(ok.player_id).toBe("player.111111112222");
    expect(ok.controller_type).toBe("human");
    expect("refresh_token" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, "test-signing-secret");
    expect(claims.typ).toBe("access");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
    expect(claims.identity_id).toBe(USER.id);
  });
});
```

Handle from `Ada.Lovelace` → sanitized `AdaLovelace` or `adalovelace` — sanitizer already strips non `[A-Za-z0-9_-]`. Do not assert handle spelling beyond mint succeeding.

- [ ] **Step 2: FAIL** — consume missing

- [ ] **Step 3: Implement consume**

Copy admin verify/exchange structure from `consumeAdminMagicLink` (do not call admin consume). Require supabase url+key else 503. 400 if no hash/code. 4xx → 401, 5xx/throw → 502. Read `user.id` or `user.sub`. Compact: `id.replace(/-/g, "").slice(0, 12)`. Handle: `normalizeEmail(email)!.split("@")[0]` through same sanitize as mint. `mintControllerToken(env, { handle, controllerType: "human", expiresIn: 86400, playerId: \`player.${compact}\`, identityId: id, amr: "email_magic_link" })`. Return `{ access_token, player_id, controller_type: "human", expires_in }` only.

- [ ] **Step 4: tests PASS** including full `npm test`

- [ ] **Step 5: Commit** `feat(play): consume magic link into Player JWT`

---

### Task 4: Isolation

**Files:**
- Modify: `workers/noema/test/play-email-login.test.ts`

- [ ] **Step 1: Tests**

```ts
describe("play vs admin isolation", () => {
  it("play token resolves as Player and fails resolveAdmin", async () => {
    const minted = (await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response(JSON.stringify({ user: USER }), { status: 200 }) },
    )) as { access_token: string };
    const p = await resolvePrincipal(
      new Request("https://noema.guru/v1/me", { headers: { Authorization: `Bearer ${minted.access_token}` } }),
      env(),
    );
    expect(p).not.toBeInstanceOf(Response);
    expect((p as { player_id: string }).player_id).toBe("player.111111112222");
    const a = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", { headers: { Authorization: `Bearer ${minted.access_token}` } }),
      env({ TOKEN_SIGNING_SECRET: "test-signing-secret" }),
    );
    expect(a).toBeInstanceOf(Response);
    expect((a as Response).status).toBeGreaterThanOrEqual(401);
  });
});
```

- [ ] **Step 2: Run** — should PASS if Task 3 mint is correct. If FAIL, do not change resolveAdmin to accept access tokens. Fix mint/claims only.

- [ ] **Step 3: Commit** only if new test file changes: `test(play): email login cannot open admin`

---

### Task 5: Routes + HTML

**Files:**
- Create: `workers/noema/src/play-login-html.ts` — `playCallbackHtml()`, `playEmailGateMarkup()` (email field `id="play-email"` on landing to avoid clashing with admin `id="email"` **or** use `id="email"` on both isolated pages — spec says homepage + play have `id="email"`. PLAY page may already have other ids. Use `id="email"` on landing and play gate as spec tests require.)
- Modify: `workers/noema/src/index.ts`
- Modify: `workers/noema/src/play.ts` — primary email; move Access token to `#advanced` only; show `?error=1`; auto-enter if `noema.play.token` present
- Modify: `workers/noema/src/landing.ts` — email form posts `/v1/play/login/request`; small “Operator login” → `/admin/login`; copy Player not ADMIN
- Modify: `workers/noema/test/play-email-login.test.ts`

**Interfaces:**
- `GET /play/callback` → `playCallbackHtml()`
- `POST /v1/play/login/request` → `requestPlayMagicLink`
- `POST /v1/play/login/consume` → `consumePlayMagicLink` + `{ token_type: "bearer" }`

Callback script: same as admin callback but store `noema.play.token`, redirect `/play`, fail `/play?error=1`. Read search+hash `token_hash`/`type`/`code`. Never `refresh_token`.

Landing: if `sessionStorage.noema.play.token`, button “Continue to PLAY” → `/play`.

Play client: on boot, if `noema.play.token` set `state.token` and proceed to session-in / enter as today does with stored token.

- [ ] **Step 1: HTML tests**

```ts
import { playCallbackHtml, playEmailGateMarkup } from "../src/play-login-html";
import { landingHtml } from "../src/landing";
import { playHtml } from "../src/play";

describe("play login HTML", () => {
  it("gate posts play login request", () => {
    const html = playEmailGateMarkup();
    expect(html).toContain('id="email"');
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("Send play link");
  });
  it("callback reads hash and does not store refresh_token", () => {
    const html = playCallbackHtml();
    expect(html).toContain("/v1/play/login/consume");
    expect(html).toContain("location.hash");
    expect(html).toContain("noema.play.token");
    expect(html).not.toContain("refresh_token");
  });
  it("homepage and play include email gate; homepage is not admin token", () => {
    expect(landingHtml()).toContain("/v1/play/login/request");
    expect(landingHtml()).toContain("/admin/login");
    expect(landingHtml()).not.toMatch(/Operator token/);
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).toContain("Access token");
  });
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement markup + wire index + play/landing**

Keep play “Enter world” for users who already have `noema.play.token` or pasted advanced token. Production: email is visible in `#session-out` above Enter. Hide `#token-primary` (already hidden). Advanced keeps paste.

- [ ] **Step 4: `npm test && npm run typecheck`**

- [ ] **Step 5: Commit** `feat(play): email gate on homepage and PLAY`

---

### Task 6: Docs

**Files:**
- Modify: `docs/OPERATOR-SMOKE.md` — PLAY email is public Player path; ADMIN email remains allowlisted; do not mix sessions
- Modify: spec status already `approved — implementing` → `approved`

- [ ] **Step 1–3: Write the note, no mailboxes**

- [ ] **Step 4: Commit** `docs(play): distinguish player vs admin email login`

**Deploy is not in this plan.** After merge: add Supabase redirect `/play/callback`, `NOEMA_ENV=production npm run deploy`.

---

## Spec coverage

| Spec | Task |
|------|------|
| mint playerId / identity / amr | 1 |
| Public request, generic body, /play/callback redirect | 2 |
| Separate throttle | 2 |
| Consume typ access, compact sub | 3 |
| Isolation vs admin | 4 |
| Homepage + play HTML + callback | 5 |
| Docs | 6 |
| No Genesis | global |
