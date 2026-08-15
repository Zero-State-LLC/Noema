# Hosted Device Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host `POST /v1/auth/device` on noema.guru so OpenClaw / Hermes / Grok Bot attach as a Controller after the human Player approves a short code — no browser automation of the PLAY letter.

**Architecture:** New `device-enrollment.ts` owns start / preview / approve / deny / poll. Persist records in the existing enrollment Durable Object under a `devices` bag (not RFC-0033 mail enroll keys). CONNECT uses the PLAY human Bearer to approve. Harnesses poll once for `access_token` and only call `/v1/command`.

**Tech Stack:** Cloudflare Worker (`workers/noema`), Vitest, existing `mintControllerToken` / `resolvePrincipal`, `WORLD_DO` storage.

**Spec:** `docs/superpowers/specs/2026-08-15-hosted-device-enrollment-design.md`

## Global Constraints

- Do not activate, reseed, or force-supersede Genesis.
- Admin ≠ Player. This path never mints `typ: admin-access`.
- Agents do not click PLAY magic links.
- Default scopes only: `noema.player.read`, `noema.world.observe`, `noema.action.submit`. Strip admin scopes.
- Approve requires PLAY **human** (or hybrid / `amr: email_magic_link`) Bearer. Agent Bearer is `403` unless it already has `noema.controller.manage`.
- First GET of `/connect` or preview does not approve and does not issue a token.
- First successful poll returns the access token once; replay/deny/expiry issue nothing.
- `metadata.runtime` is display-only (`openclaw` | `hermes` | `grok-bot` | other).
- No refresh token in this slice.
- Do not log `device_code`, access tokens, or PLAY tokens.
- Production `verification_uri` is `https://noema.guru/connect`.
- Do not re-enable `/v1/auth/dev-token` in production.
- Tests run: `cd workers/noema && npx vitest run`

---

## File map

| File | Responsibility |
|------|----------------|
| Create `workers/noema/src/device-enrollment.ts` | Device records, store, start/preview/approve/deny/poll |
| Create `workers/noema/test/device-enrollment.test.ts` | Spec unit tests |
| Modify `workers/noema/src/world-do.ts` | Persist `devices` bag on `/device` |
| Modify `workers/noema/src/index.ts` | Route the five HTTP endpoints |
| Modify `workers/noema/src/connect.ts` | Signed-in approve/deny panel |
| Modify `workers/noema/test/product-surface.test.ts` | CONNECT copy + no innerHTML |
| Modify `docs/AGENT-STAGE0.md` | Five-step client contract |
| Modify spec status line to approved |

---

### Task 1: Device store, start, preview

**Files:**
- Create: `workers/noema/src/device-enrollment.ts`
- Create: `workers/noema/test/device-enrollment.test.ts`

**Interfaces:**
- Consumes: `Env`, `loginRedirectOrigin` from `admin-auth.ts`, `err`/`json` from `auth.ts`
- Produces: `DeviceRecord`, `DeviceStore`, `memoryDeviceStore`, `DEVICE_TTL_MS` (600000), `GAME_SCOPES`, `startDeviceEnrollment(env, req, body, opts?)`, `previewDevice(env, req, opts?)`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  memoryDeviceStore,
  previewDevice,
  startDeviceEnrollment,
} from "../src/device-enrollment";
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

describe("startDeviceEnrollment", () => {
  it("returns user_code, production verification_uri, 600s expiry, and no token", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env(),
      new Request("https://example.com/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      expires_in: number;
      interval: number;
      scopes: string[];
    };
    expect(body.user_code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(body.verification_uri).toBe("https://noema.guru/connect");
    expect(body.expires_in).toBe(600);
    expect(body.interval).toBe(5);
    expect(body.scopes).toEqual([
      "noema.player.read",
      "noema.world.observe",
      "noema.action.submit",
    ]);
    expect(JSON.stringify(body)).not.toMatch(/access_token/);
  });

  it("treats runtime labels as display-only", async () => {
    const store = memoryDeviceStore();
    for (const runtime of ["openclaw", "hermes", "grok-bot"]) {
      const res = await startDeviceEnrollment(
        env(),
        new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
        { metadata: { runtime }, scopes: ["noema.player.read", "noema.world.admin"] },
        { store },
      );
      const body = (await res.json()) as { scopes: string[] };
      expect(body.scopes).toEqual([
        "noema.player.read",
        "noema.world.observe",
        "noema.action.submit",
      ]);
    }
  });
});

describe("previewDevice", () => {
  it("returns public fields and never a token", async () => {
    const store = memoryDeviceStore();
    const started = await startDeviceEnrollment(
      env(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "hermes" } },
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const res = await previewDevice(
      env(),
      new Request(`https://noema.guru/v1/auth/device/preview?user_code=${user_code}`),
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; runtime: string; access_token?: string };
    expect(body.status).toBe("pending");
    expect(body.runtime).toBe("hermes");
    expect(body.access_token).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: FAIL — `device-enrollment.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `workers/noema/src/device-enrollment.ts`:

```ts
import { loginRedirectOrigin } from "./admin-auth";
import { err, json } from "./auth";
import type { Env } from "./types";

export const GAME_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
] as const;

export const DEVICE_TTL_MS = 10 * 60 * 1000;

export type DeviceStatus = "pending" | "approved" | "denied" | "expired" | "redeemed";

export type DeviceRecord = {
  device_code: string;
  device_code_hash: string;
  user_code: string;
  scopes: string[];
  runtime: string;
  status: DeviceStatus;
  player_id: string | null;
  controller_id: string | null;
  issued_at: string;
  expires_at: string;
  access_token?: string;
};

export interface DeviceStore {
  put(rec: DeviceRecord): Promise<void>;
  getByDeviceCode(deviceCode: string): Promise<DeviceRecord | null>;
  getByUserCode(userCode: string): Promise<DeviceRecord | null>;
}

export function memoryDeviceStore(seed: DeviceRecord[] = []): DeviceStore {
  const byDevice = new Map(seed.map((r) => [r.device_code, { ...r }]));
  return {
    async put(rec) {
      byDevice.set(rec.device_code, { ...rec });
    },
    async getByDeviceCode(code) {
      const rec = byDevice.get(code);
      return rec ? { ...rec } : null;
    },
    async getByUserCode(userCode) {
      const norm = normalizeUserCode(userCode);
      for (const rec of byDevice.values()) {
        if (rec.user_code === norm) return { ...rec };
      }
      return null;
    },
  };
}

export function normalizeUserCode(raw: string): string {
  const hex = raw.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (hex.length !== 8) return raw.trim().toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

export function filterGameScopes(input?: string[]): string[] {
  const wanted = new Set(GAME_SCOPES);
  const kept = (input || []).filter((s) => wanted.has(s as (typeof GAME_SCOPES)[number]));
  return kept.length ? [...new Set(kept)] : [...GAME_SCOPES];
}

export async function hashDeviceSecret(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomUserCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

function randomDeviceCode(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function verificationUri(env: Env, req: Request): string {
  if ((env.NOEMA_ENV || "").toLowerCase() === "production") return "https://noema.guru/connect";
  return `${loginRedirectOrigin(env, req).replace(/\/$/, "")}/connect`;
}

export async function startDeviceEnrollment(
  env: Env,
  req: Request,
  body: { metadata?: { runtime?: string }; scopes?: string[] },
  opts?: { store?: DeviceStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const now = opts?.now ?? Date.now();
  const device_code = randomDeviceCode();
  const rec: DeviceRecord = {
    device_code,
    device_code_hash: await hashDeviceSecret(device_code),
    user_code: randomUserCode(),
    scopes: filterGameScopes(body.scopes),
    runtime: String(body.metadata?.runtime || "external").slice(0, 64),
    status: "pending",
    player_id: null,
    controller_id: null,
    issued_at: new Date(now).toISOString(),
    expires_at: new Date(now + DEVICE_TTL_MS).toISOString(),
  };
  await store.put(rec);
  return json({
    device_code,
    user_code: rec.user_code,
    verification_uri: verificationUri(env, req),
    expires_in: 600,
    interval: 5,
    scopes: rec.scopes,
  });
}

export async function effectiveDeviceStatus(rec: DeviceRecord, now: number): Promise<DeviceStatus> {
  if (rec.status === "pending" && Date.parse(rec.expires_at) <= now) return "expired";
  return rec.status;
}

export async function previewDevice(
  env: Env,
  req: Request,
  opts?: { store?: DeviceStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const user_code = new URL(req.url).searchParams.get("user_code") || "";
  const rec = await store.getByUserCode(user_code);
  if (!rec) return err("NOT_AUTHORIZED", "unknown user_code", 401);
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  return json({
    user_code: rec.user_code,
    status,
    scopes: rec.scopes,
    runtime: rec.runtime,
    expires_at: rec.expires_at,
  });
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/device-enrollment.ts workers/noema/test/device-enrollment.test.ts
git commit -m "feat(auth): start and preview hosted device enrollment"
```

---

### Task 2: Approve and deny (human PLAY Bearer only)

**Files:**
- Modify: `workers/noema/src/device-enrollment.ts`
- Modify: `workers/noema/test/device-enrollment.test.ts`

**Interfaces:**
- Consumes: `resolvePrincipal` from `auth.ts`, `mintControllerToken` from `auth.ts`, `DeviceStore` from Task 1
- Produces: `approveDevice(env, req, body, opts?)`, `denyDevice(env, req, body, opts?)`

- [ ] **Step 1: Extend the test file**

```ts
import { mintControllerToken } from "../src/auth";
import { approveDevice, denyDevice } from "../src/device-enrollment";

async function humanBearer(e = env()) {
  const minted = await mintControllerToken(e, {
    handle: "prabu",
    controllerType: "human",
    playerId: "player.prabu",
    amr: "email_magic_link",
  });
  return minted.access_token;
}

describe("approveDevice", () => {
  it("binds the approver player_id and does not return an access token", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const token = await humanBearer(e);
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { player_id: string; access_token?: string; status: string };
    expect(body.status).toBe("approved");
    expect(body.player_id).toBe("player.prabu");
    expect(body.access_token).toBeUndefined();
  });

  it("rejects an agent bearer", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const agent = await mintControllerToken(e, { handle: "bot", controllerType: "agent" });
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${agent.access_token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(403);
  });
});

describe("denyDevice", () => {
  it("marks denied", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const token = await humanBearer(e);
    const res = await denyDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/deny", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("denied");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: FAIL — `approveDevice` / `denyDevice` not exported.

- [ ] **Step 3: Implement approve and deny**

Append to `device-enrollment.ts`:

```ts
import { err, json, mintControllerToken, resolvePrincipal } from "./auth";
import type { PlayerPrincipal } from "./types";

function canHumanApprove(principal: PlayerPrincipal): boolean {
  if ((principal.scopes || []).includes("noema.controller.manage")) return true;
  if (principal.controller_type === "human" || principal.controller_type === "hybrid") return true;
  if (principal.amr === "email_magic_link") return true;
  return false;
}

async function requireHumanApprover(req: Request, env: Env): Promise<PlayerPrincipal | Response> {
  const principal = await resolvePrincipal(req, env);
  if (principal instanceof Response) return principal;
  if (!canHumanApprove(principal)) {
    return err("NOT_AUTHORIZED", "only a human Controller may approve device enrollment", 403);
  }
  return principal;
}

export async function approveDevice(
  env: Env,
  req: Request,
  body: { user_code?: string },
  opts?: { store?: DeviceStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const approver = await requireHumanApprover(req, env);
  if (approver instanceof Response) return approver;
  const rec = await store.getByUserCode(String(body.user_code || ""));
  if (!rec) return err("NOT_AUTHORIZED", "unknown user_code", 401);
  const now = opts?.now ?? Date.now();
  const status = await effectiveDeviceStatus(rec, now);
  if (status !== "pending") return err("NOT_AUTHORIZED", `device enrollment is ${status}`, 409);
  const handle = approver.player_id.replace(/^player\./, "").slice(0, 32) || "player";
  const minted = await mintControllerToken(env, {
    handle,
    controllerType: "agent",
    playerId: approver.player_id,
    amr: "device_enrollment",
  });
  const next: DeviceRecord = {
    ...rec,
    status: "approved",
    player_id: approver.player_id,
    controller_id: minted.controller_id,
    access_token: minted.access_token,
  };
  await store.put(next);
  return json({
    status: "approved",
    user_code: rec.user_code,
    player_id: approver.player_id,
    controller_id: minted.controller_id,
    scopes: rec.scopes,
    runtime: rec.runtime,
  });
}

export async function denyDevice(
  env: Env,
  req: Request,
  body: { user_code?: string },
  opts?: { store?: DeviceStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const approver = await requireHumanApprover(req, env);
  if (approver instanceof Response) return approver;
  const rec = await store.getByUserCode(String(body.user_code || ""));
  if (!rec) return err("NOT_AUTHORIZED", "unknown user_code", 401);
  if (rec.player_id && rec.player_id !== approver.player_id) {
    return err("NOT_AUTHORIZED", "cannot deny another Player's enrollment", 403);
  }
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  if (status !== "pending") return json({ status, user_code: rec.user_code });
  await store.put({ ...rec, status: "denied" });
  return json({ status: "denied", user_code: rec.user_code });
}
```

- [ ] **Step 4: Run tests**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/device-enrollment.ts workers/noema/test/device-enrollment.test.ts
git commit -m "feat(auth): human PLAY session approves or denies device attach"
```

---

### Task 3: Poll token once, expire closed

**Files:**
- Modify: `workers/noema/src/device-enrollment.ts`
- Modify: `workers/noema/test/device-enrollment.test.ts`

**Interfaces:**
- Consumes: `DeviceStore`, `approveDevice`, `DEVICE_TTL_MS`
- Produces: `pollDeviceToken(env, req, body, opts?)`

- [ ] **Step 1: Add poll tests**

```ts
import { DEVICE_TTL_MS, pollDeviceToken } from "../src/device-enrollment";

describe("pollDeviceToken", () => {
  it("returns authorization_pending then the token once", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { device_code, user_code } = (await started.json()) as {
      device_code: string;
      user_code: string;
    };
    const pending = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    expect(pending.status).toBe(200);
    expect(((await pending.json()) as { status: string }).status).toBe("authorization_pending");

    const human = await humanBearer(e);
    await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${human}` },
      }),
      { user_code },
      { store },
    );
    const first = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    const minted = (await first.json()) as { access_token: string; status: string; player_id: string };
    expect(minted.status).toBe("approved");
    expect(minted.player_id).toBe("player.prabu");
    expect(minted.access_token.length).toBeGreaterThan(20);

    const second = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    expect(second.status).toBe(401);
  });

  it("expires pending enrollments", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const now = Date.parse("2026-08-15T12:00:00Z");
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store, now },
    );
    const { device_code } = (await started.json()) as { device_code: string };
    const res = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store, now: now + DEVICE_TTL_MS + 1 },
    );
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: FAIL — `pollDeviceToken` missing.

- [ ] **Step 3: Implement poll**

```ts
export async function pollDeviceToken(
  env: Env,
  req: Request,
  body: { device_code?: string },
  opts?: { store?: DeviceStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const rec = await store.getByDeviceCode(String(body.device_code || ""));
  if (!rec) return err("NOT_AUTHORIZED", "unknown device_code", 401);
  const now = opts?.now ?? Date.now();
  const status = await effectiveDeviceStatus(rec, now);
  if (status === "pending") return json({ status: "authorization_pending", interval: 5 });
  if (status === "expired") {
    if (rec.status === "pending") await store.put({ ...rec, status: "expired" });
    return err("NOT_AUTHORIZED", "device code expired", 401);
  }
  if (status !== "approved") return err("NOT_AUTHORIZED", `device enrollment ${status}`, 401);
  const access = rec.access_token;
  if (!access) return err("NOT_AUTHORIZED", "tokens already redeemed", 401);
  const { access_token: _drop, ...rest } = rec;
  await store.put({ ...rest, status: "redeemed" });
  return json({
    status: "approved",
    access_token: access,
    token_type: "bearer",
    player_id: rec.player_id,
    controller_id: rec.controller_id,
    scopes: rec.scopes,
  });
}
```

- [ ] **Step 4: Run tests**

Run: `cd workers/noema && npx vitest run test/device-enrollment.test.ts`

Expected: PASS (including expire + redeem-once)

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/device-enrollment.ts workers/noema/test/device-enrollment.test.ts
git commit -m "feat(auth): redeem device enrollment token once"
```

---

### Task 4: Persist devices on the enrollment DO and expose Worker routes

**Files:**
- Modify: `workers/noema/src/device-enrollment.ts` (add `durableDeviceStore`)
- Modify: `workers/noema/src/world-do.ts` (handle `/device` like `/enroll`)
- Modify: `workers/noema/src/index.ts` (five routes)

**Interfaces:**
- Consumes: functions from Tasks 1–3
- Produces: live HTTP on the Worker; `durableDeviceStore(env)` using `WORLD_DO.idFromName("__noema_enrollments__")` and `https://do/device`

- [ ] **Step 1: Write a route-level test** (optional thin test in the same file is enough if Worker fetch is hard to construct). Prefer calling the handlers; add `durableDeviceStore` unit only if a fake stub is cheap. Skip a full Miniflare DO test in this slice.

No new failing test required if Task 1–3 already cover handlers. Add this assertion file section that `durableDeviceStore` is exported (import smoke) after implementation.

- [ ] **Step 2: Add durable store + DO bag**

In `device-enrollment.ts`:

```ts
export function durableDeviceStore(env: Env): DeviceStore {
  const stub = env.WORLD_DO.get(env.WORLD_DO.idFromName("__noema_enrollments__"));
  return {
    async put(rec) {
      const res = await stub.fetch("https://do/device", { method: "PUT", body: JSON.stringify(rec) });
      if (!res.ok) throw new Error("device persist failed");
    },
    async getByDeviceCode(deviceCode) {
      const res = await stub.fetch(`https://do/device?device_code=${encodeURIComponent(deviceCode)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("device load failed");
      return (await res.json()) as DeviceRecord;
    },
    async getByUserCode(userCode) {
      const res = await stub.fetch(`https://do/device?user_code=${encodeURIComponent(userCode)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("device load failed");
      return (await res.json()) as DeviceRecord;
    },
  };
}
```

In `world-do.ts`, immediately after the `/enroll` block:

```ts
    if (path.endsWith("/device") || path === "/device") {
      const bag = (await this.state.storage.get<Record<string, import("./device-enrollment").DeviceRecord>>("devices")) || {};
      if (request.method === "PUT") {
        const rec = (await request.json()) as import("./device-enrollment").DeviceRecord;
        if (!rec?.device_code) return Response.json({ error: "device_code required" }, { status: 400 });
        bag[rec.device_code] = rec;
        await this.state.storage.put("devices", bag);
        return Response.json({ ok: true });
      }
      if (request.method === "GET") {
        const deviceCode = url.searchParams.get("device_code");
        const userCode = (url.searchParams.get("user_code") || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
        if (deviceCode) {
          const rec = bag[deviceCode];
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        if (userCode) {
          const rec = Object.values(bag).find((r) => r.user_code.replace(/-/g, "") === userCode);
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        return Response.json({ records: Object.values(bag) });
      }
      return new Response("method not allowed", { status: 405 });
    }
```

Import `DeviceRecord` at top of `world-do.ts` instead of inline import if the file already imports `EnrollmentRecord`.

- [ ] **Step 3: Wire `index.ts`**

Import:

```ts
import {
  approveDevice,
  denyDevice,
  durableDeviceStore,
  pollDeviceToken,
  previewDevice,
  startDeviceEnrollment,
} from "./device-enrollment";
```

After the existing `/v1/play/login/consume` block (before Admin controller-token is fine; keep unauthenticated device start/poll public):

```ts
      if (request.method === "POST" && path === "/v1/auth/device") {
        const body = (await request.json().catch(() => ({}))) as {
          metadata?: { runtime?: string };
          scopes?: string[];
        };
        return cors(await startDeviceEnrollment(env, request, body, { store: durableDeviceStore(env) }));
      }
      if (request.method === "GET" && path === "/v1/auth/device/preview") {
        return cors(await previewDevice(env, request, { store: durableDeviceStore(env) }));
      }
      if (request.method === "POST" && path === "/v1/auth/device/approve") {
        const body = (await request.json().catch(() => ({}))) as { user_code?: string };
        return cors(await approveDevice(env, request, body, { store: durableDeviceStore(env) }));
      }
      if (request.method === "POST" && path === "/v1/auth/device/deny") {
        const body = (await request.json().catch(() => ({}))) as { user_code?: string };
        return cors(await denyDevice(env, request, body, { store: durableDeviceStore(env) }));
      }
      if (request.method === "POST" && path === "/v1/auth/device/token") {
        const body = (await request.json().catch(() => ({}))) as { device_code?: string };
        return cors(await pollDeviceToken(env, request, body, { store: durableDeviceStore(env) }));
      }
```

Do **not** place these behind `resolveAdmin`.

- [ ] **Step 4: Run tests**

Run: `cd workers/noema && npx vitest run`

Expected: all existing tests still PASS; device-enrollment PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/device-enrollment.ts workers/noema/src/world-do.ts workers/noema/src/index.ts
git commit -m "feat(auth): expose /v1/auth/device on the hosted Worker"
```

---

### Task 5: CONNECT approve panel

**Files:**
- Modify: `workers/noema/src/connect.ts`
- Modify: `workers/noema/test/product-surface.test.ts`

**Interfaces:**
- Consumes: `GET /v1/auth/device/preview`, `POST /v1/auth/device/approve`, `POST /v1/auth/device/deny`
- Produces: signed-in `/connect` panel that uses `sessionStorage` key `noema.play.token` (same key PLAY already sets)

- [ ] **Step 1: Extend product-surface test**

In `workers/noema/test/product-surface.test.ts` `connect has curl` test (or a new `it`):

```ts
  it("connect can approve a device code with the PLAY token", () => {
    const html = connectHtml();
    expect(html).toContain("/v1/auth/device/preview");
    expect(html).toContain("/v1/auth/device/approve");
    expect(html).toContain("noema.play.token");
    expect(html).toMatch(/Enter as yourself first|enter via PLAY/i);
    expect(html).not.toMatch(/\.innerHTML\s*=/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts`

Expected: FAIL — CONNECT HTML lacks those strings.

- [ ] **Step 3: Add the panel**

In `connectHtml()` body, after the existing grid (before the curl section), insert a third card:

```html
  <section class="card pad" style="margin-top:.75rem">
    <p class="kicker">Attach a runtime</p>
    <p class="muted">A harness (OpenClaw, Hermes, Grok Bot, curl) should show you a short code. Enter it here while signed into PLAY. Opening this page does not approve.</p>
    <p class="notice" id="d-need-play" hidden>Enter as yourself first (PLAY letter or /play). Then come back to approve.</p>
    <div id="d-form" hidden>
      <label for="d-code">Device code</label>
      <input id="d-code" maxlength="12" placeholder="AB12-CD34" autocomplete="off"/>
      <p class="notice" id="d-notice" role="status"></p>
      <dl class="kv" id="d-preview" hidden></dl>
      <div class="btn-row" style="margin-top:.75rem">
        <button type="button" class="btn" id="d-lookup">Look up</button>
        <button type="button" class="btn primary" id="d-approve" hidden>Approve</button>
        <button type="button" class="btn" id="d-deny" hidden>Deny</button>
      </div>
    </div>
  </section>
```

Reuse `.kv` already in `EXTRA`. In the existing IIFE, add:

```js
    const playTok = (() => { try { return sessionStorage.getItem("noema.play.token") || ""; } catch(_) { return ""; } })();
    const need = document.getElementById("d-need-play");
    const form = document.getElementById("d-form");
    if (playTok) { form.hidden = false; } else { need.hidden = false; }
    function row(k,v){ const d=document.createElement("dt"); d.textContent=k; const dd=document.createElement("dd"); dd.textContent=v; preview.appendChild(d); preview.appendChild(dd); }
    const preview = document.getElementById("d-preview");
    const dNotice = document.getElementById("d-notice");
    document.getElementById("d-lookup").addEventListener("click", async () => {
      const code = (document.getElementById("d-code").value || "").trim();
      dNotice.className = "notice"; dNotice.textContent = "Looking up…";
      preview.hidden = true; preview.textContent = "";
      try {
        const r = await fetch("/v1/auth/device/preview?user_code="+encodeURIComponent(code));
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        dNotice.className = "notice";
        dNotice.textContent = "Status: "+j.status+". Looking this up did not approve.";
        preview.hidden = false;
        row("Runtime", j.runtime || "");
        row("Scopes", (j.scopes||[]).join(", "));
        row("Expires", j.expires_at || "");
        document.getElementById("d-approve").hidden = j.status !== "pending";
        document.getElementById("d-deny").hidden = j.status !== "pending";
      } catch(e) {
        dNotice.className = "notice bad"; dNotice.textContent = e.message || "unknown code";
      }
    });
    async function decide(path){
      const code = (document.getElementById("d-code").value || "").trim();
      dNotice.className = "notice"; dNotice.textContent = "Sending…";
      try {
        const r = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: "Bearer "+playTok },
          body: JSON.stringify({ user_code: code })
        });
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        dNotice.className = "notice ok";
        dNotice.textContent = j.status === "approved"
          ? "Approved. The runtime will receive its token on poll. Not shown here."
          : "Denied. No token issued.";
        document.getElementById("d-approve").hidden = true;
        document.getElementById("d-deny").hidden = true;
      } catch(e) {
        dNotice.className = "notice bad"; dNotice.textContent = e.message || "failed";
      }
    }
    document.getElementById("d-approve").addEventListener("click", () => decide("/v1/auth/device/approve"));
    document.getElementById("d-deny").addEventListener("click", () => decide("/v1/auth/device/deny"));
```

Use `textContent` only. Never `innerHTML`. Confirm PLAY’s session key is `noema.play.token` in `workers/noema/src/play.ts` / `play-login-html.ts` before wiring; if the live key differs, use the existing key name, not a new one.

- [ ] **Step 4: Run tests**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts test/device-enrollment.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/connect.ts workers/noema/test/product-surface.test.ts
git commit -m "feat(connect): let a PLAY session approve a device code"
```

---

### Task 6: Docs and spec status

**Files:**
- Modify: `docs/AGENT-STAGE0.md`
- Modify: `docs/superpowers/specs/2026-08-15-hosted-device-enrollment-design.md` (status → approved)

**Interfaces:**
- Consumes: the five-step client contract from the spec
- Produces: operator/harness documentation

- [ ] **Step 1: Update AGENT-STAGE0**

Replace the agent obtain-token bullet so the **default** is device enrollment:

```markdown
   Agent/controller (preferred):
     POST /v1/auth/device
     { "metadata": { "runtime": "openclaw" } }
     Show user_code + https://noema.guru/connect
     Human (PLAY session) approves on /connect
     POST /v1/auth/device/token
     { "device_code": "…" }
     Store NOEMA_TOKEN. Never click the PLAY letter.
   Admin break-glass:
     POST /v1/admin/controller-token
     { "handle": "hermes", "controller_type": "agent" }
```

Keep PLAY letter as the **human** path.

- [ ] **Step 2: Set spec status**

Change `**Status:** draft (awaiting review)` to `**Status:** approved`.

- [ ] **Step 3: Run full Worker tests**

Run: `cd workers/noema && npx vitest run`

Expected: all PASS (398+ plus new device tests).

- [ ] **Step 4: Commit**

```bash
git add docs/AGENT-STAGE0.md docs/superpowers/specs/2026-08-15-hosted-device-enrollment-design.md
git commit -m "docs: hosted device enrollment is the agent attach path"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Hosted `/v1/auth/device` start | 1, 4 |
| Preview public, no secrets | 1, 4 |
| Human PLAY approve / deny | 2, 5 |
| Agent cannot approve | 2 |
| Poll pending / once / expire | 3 |
| Runtime label display-only | 1 |
| CONNECT does not auto-approve | 5 |
| Admin mint unchanged | 4 (no edits to that route) |
| PLAY letter unchanged | 6 (docs only) |
| Five-step client contract | 6 |
| No Genesis / no admin-access | all |
| Storage in enrollment DO `devices` bag | 4 |

## Placeholder scan

None of TBD / “handle edge cases” / “tests for the above” without code remain.

## Type names

`DeviceRecord`, `DeviceStore`, `memoryDeviceStore`, `durableDeviceStore`, `startDeviceEnrollment`, `previewDevice`, `approveDevice`, `denyDevice`, `pollDeviceToken`, `DEVICE_TTL_MS`, `GAME_SCOPES` — used consistently across tasks.
