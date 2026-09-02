import { loginRedirectOrigin } from "./admin-auth";
import { err, json, mintControllerToken, resolvePrincipal } from "./auth";
import { sendTransactionalEmail } from "./email-provider";
import { isHumanPrincipal } from "./types";
import type { Principal } from "./types";
import type { Env } from "./types";

export const GAME_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
] as const;

// Async human approval is the normal case: an operator is rarely at the keyboard
// at the instant an agent mints a code. Ten minutes was too short to be workable
// and produced repeated expired-unapproved enrollments. Thirty minutes matches
// common device-flow TTLs and keeps the phishing window bounded.
export const DEVICE_TTL_MS = 30 * 60 * 1000;
export const DEVICE_TTL_SECONDS = Math.floor(DEVICE_TTL_MS / 1000);
export const DEVICE_POLL_INTERVAL_SECONDS = 5;

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
  approver_id?: string;
  owner_email?: string;
  review_token_hash?: string;
  review_token_expires_at?: string;
  review_world_id?: string;
  review_runtime?: string;
  review_scopes?: string[];
  review_owner_email?: string;
  issued_at: string;
  expires_at: string;
};

export interface DeviceStore {
  put(rec: DeviceRecord): Promise<void>;
  getByDeviceCode(deviceCode: string): Promise<DeviceRecord | null>;
  getByUserCode(userCode: string): Promise<DeviceRecord | null>;
  getByReviewTokenHash?(hash: string): Promise<DeviceRecord | null>;
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
    async getByReviewTokenHash(hash) {
      for (const rec of byDevice.values()) {
        if (rec.review_token_hash === hash) return { ...rec };
      }
      return null;
    },
  };
}

/** Accept DO JSON only when it looks like a single DeviceRecord (not a list bag). */
export function parseDeviceRecord(data: unknown): DeviceRecord | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.records)) return null;
  if (typeof o.device_code !== "string" || !o.device_code) return null;
  if (typeof o.user_code !== "string") return null;
  if (typeof o.status !== "string") return null;
  const rec = { ...o } as DeviceRecord & { access_token?: unknown };
  delete rec.access_token;
  return rec;
}

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
      return parseDeviceRecord(await res.json());
    },
    async getByUserCode(userCode) {
      const res = await stub.fetch(`https://do/device?user_code=${encodeURIComponent(userCode)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("device load failed");
      return parseDeviceRecord(await res.json());
    },
    async getByReviewTokenHash(hash) {
      const res = await stub.fetch(`https://do/device?review_token_hash=${encodeURIComponent(hash)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("device load failed");
      return parseDeviceRecord(await res.json());
    },
  };
}

export function normalizeOwnerEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizeUserCode(raw: string): string {
  const hex = raw.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (hex.length !== 8) return raw.trim().toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

/** Drop unknown/admin scopes from requests; always persist the full default set. */
export function filterGameScopes(_input?: string[]): string[] {
  // Consent echo and JWT mint both use all GAME_SCOPES; never store a subset.
  return [...GAME_SCOPES];
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

function randomReviewToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function reviewSecret(env: Env): string | null {
  return String((env as unknown as { DEVICE_REVIEW_TOKEN_SECRET?: string }).DEVICE_REVIEW_TOKEN_SECRET || "").trim() || null;
}

async function hashReviewToken(env: Env, token: string): Promise<string | null> {
  const secret = reviewSecret(env);
  if (!secret) return null;
  return hashDeviceSecret(`${secret}:${token}`);
}

export function verificationUri(env: Env, req: Request): string {
  if ((env.NOEMA_ENV || "").toLowerCase() === "production") return "https://noema.guru/connect";
  return `${loginRedirectOrigin(env, req).replace(/\/$/, "")}/connect`;
}

export function allocateDeviceControllerId(): string {
  return `ctrl.device.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** Canonical Agent Player id for a CONNECT device Controller. */
export function playerIdFromDeviceController(controllerId: string): string | null {
  if (!/^ctrl\.device\./i.test(controllerId)) return null;
  const slug = controllerId.replace(/^ctrl\./i, "").replace(/[^a-z0-9]/gi, "").slice(0, 24);
  return slug ? `player.${slug}` : null;
}

// ---------------------------------------------------------------------------
// Gate B: multi-controller enrollment support (3+ independent external controllers)
// ---------------------------------------------------------------------------

export type AgentEnrollmentRequest = {
  label: string;
  runtime?: string;
  scopes?: string[];
  owner_email?: string;
};

export type AgentEnrollmentReceipt = {
  label: string;
  controller_id: string;
  player_id: string | null;
  /** Opaque binding digest for Gate B evidence. sha256 of controller_id. */
  controller_binding_digest: string;
  status: "PENDING" | "DUPLICATE" | "CONTENTION";
};

export type BatchEnrollmentResult = {
  receipts: AgentEnrollmentReceipt[];
  /** Controllers that share a controller_id (should never happen; fail-closed). */
  contention: string[];
};

/**
 * Gate B: allocate enrollment receipts for a batch of 3+ independent external
 * Agent Controllers. Each controller must have a distinct label and receives a
 * distinct controller_id + player_id. Duplicate labels or colliding controller
 * ids are flagged as CONTENTION (fail-closed: the batch is still returned so
 * the caller can inspect and reject).
 *
 * This does NOT start device-flow or write to a store — use startDeviceEnrollment
 * for each receipt after human approval.
 */
export async function requestAgentEnrollment(
  requests: AgentEnrollmentRequest[],
): Promise<BatchEnrollmentResult> {
  const receipts: AgentEnrollmentReceipt[] = [];
  const contention: string[] = [];
  const seenLabels = new Set<string>();
  const seenControllerIds = new Set<string>();

  for (const req of requests) {
    const label = String(req.label || "").trim();
    const isDuplicateLabel = seenLabels.has(label);
    seenLabels.add(label);

    const controller_id = allocateDeviceControllerId();
    const isDuplicateController = seenControllerIds.has(controller_id);
    seenControllerIds.add(controller_id);

    const player_id = playerIdFromDeviceController(controller_id);
    const controller_binding_digest = await sha256Hex(controller_id);

    let status: AgentEnrollmentReceipt["status"] = "PENDING";
    if (isDuplicateLabel || isDuplicateController) {
      status = isDuplicateLabel ? "DUPLICATE" : "CONTENTION";
      contention.push(controller_id);
    }

    receipts.push({ label, controller_id, player_id, controller_binding_digest, status });
  }

  return { receipts, contention };
}

/** Verify that a batch enrollment result satisfies Gate B independence requirements:
 *  - exactly `count` receipts (default 3)
 *  - all PENDING (no DUPLICATE or CONTENTION)
 *  - all controller_ids, player_ids, and labels are distinct
 */
export function verifyEnrollmentIndependence(
  result: BatchEnrollmentResult,
  count = 3,
): { ok: boolean; reason?: string } {
  if (result.receipts.length < count) {
    return { ok: false, reason: `need ${count} receipts, got ${result.receipts.length}` };
  }
  if (result.contention.length > 0) {
    return { ok: false, reason: `contention detected: ${result.contention.join(", ")}` };
  }
  const labels = result.receipts.map((r) => r.label);
  const controllerIds = result.receipts.map((r) => r.controller_id);
  const playerIds = result.receipts.map((r) => r.player_id);
  if (new Set(labels).size !== labels.length) return { ok: false, reason: "duplicate labels" };
  if (new Set(controllerIds).size !== controllerIds.length) return { ok: false, reason: "duplicate controller_ids" };
  if (new Set(playerIds).size !== playerIds.length) return { ok: false, reason: "duplicate player_ids" };
  if (result.receipts.some((r) => r.status !== "PENDING")) {
    return { ok: false, reason: "non-pending receipt in batch" };
  }
  return { ok: true };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function startDeviceEnrollment(
  env: Env,
  req: Request,
  body: { metadata?: { runtime?: string }; scopes?: string[]; owner_email?: string },
  opts?: { store?: DeviceStore; now?: number; fetchImpl?: typeof fetch },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const now = opts?.now ?? Date.now();
  const device_code = randomDeviceCode();
  const owner_email = normalizeOwnerEmail(body.owner_email);
  const runtime = String(body.metadata?.runtime || "external").slice(0, 64);
  const scopes = filterGameScopes(body.scopes);
  const world = String(env.DEFAULT_WORLD_ID || "world-01");
  const rec: DeviceRecord = {
    device_code,
    device_code_hash: await hashDeviceSecret(device_code),
    user_code: randomUserCode(),
    scopes,
    runtime,
    status: "pending",
    player_id: null,
    controller_id: allocateDeviceControllerId(),
    issued_at: new Date(now).toISOString(),
    expires_at: new Date(now + DEVICE_TTL_MS).toISOString(),
  };
  let review_token: string | null = null;
  if (owner_email) {
    review_token = randomReviewToken();
    const review_token_hash = await hashReviewToken(env, review_token);
    if (review_token_hash) {
      rec.owner_email = owner_email;
      rec.review_token_hash = review_token_hash;
      rec.review_token_expires_at = rec.expires_at;
      rec.review_world_id = world;
      rec.review_runtime = runtime;
      rec.review_scopes = [...scopes];
      rec.review_owner_email = owner_email;
    }
  }
  await store.put(rec);
  let review_delivery: "not_requested" | "sent" | "failed" | "unconfigured" = owner_email ? "unconfigured" : "not_requested";
  if (owner_email && review_token && rec.review_token_hash) {
    const base = verificationUri(env, req).replace(/\/connect$/, "");
    const review = `${base}/v1/auth/device/review?token=${encodeURIComponent(review_token)}`;
    try {
      const sent = await sendTransactionalEmail(env, {
        from: "Noema <no-reply@noema.guru>",
        to: owner_email,
        subject: `Review Noema Controller connection for ${runtime}`,
        text: `Review: ${review}\n\nOne human click opens a review page. It does not approve until you press Approve on that page. Deny is available there too.\nWorld: ${world}\nRuntime: ${runtime}\nScopes: ${scopes.join(", ")}`,
        html: `<p>A Controller is requesting access to <strong>${world}</strong>.</p><p>Runtime: ${runtime}</p><p><a href="${review}">Review request</a></p><p>Opening the link only renders a review page; explicit Approve or Deny is required.</p>`,
        tag: "device-enrollment-review",
      }, opts?.fetchImpl || fetch);
      review_delivery = "sent";
      console.info("device_enrollment_review_email_sent", { provider: sent.provider, message_id: sent.messageId, world, runtime });
    } catch (e) {
      review_delivery = "failed";
      console.warn("device_enrollment_review_email_failed", { world, runtime, reason: e instanceof Error ? e.message : "error" });
    }
  } else if (owner_email && !reviewSecret(env)) {
    console.warn("device_enrollment_review_secret_absent", { world, runtime });
  }
  return json({
    device_code,
    user_code: rec.user_code,
    controller_id: rec.controller_id,
    verification_uri: verificationUri(env, req),
    expires_in: DEVICE_TTL_SECONDS,
    interval: DEVICE_POLL_INTERVAL_SECONDS,
    scopes: rec.scopes,
    review_delivery,
  });
}

async function reviewRecord(env: Env, store: DeviceStore, token?: string): Promise<DeviceRecord | Response> {
  const hash = token ? await hashReviewToken(env, token) : null;
  if (!hash || !store.getByReviewTokenHash) return err("NOT_AUTHORIZED", "invalid or expired review token", 401);
  const rec = await store.getByReviewTokenHash(hash);
  if (!rec) return err("NOT_AUTHORIZED", "invalid or expired review token", 401);
  const exact = rec.review_world_id === String(env.DEFAULT_WORLD_ID || "world-01") && rec.review_runtime === rec.runtime && JSON.stringify(rec.review_scopes || []) === JSON.stringify(rec.scopes || []) && Boolean(rec.owner_email) && rec.review_owner_email === rec.owner_email;
  if (!exact) return err("NOT_AUTHORIZED", "invalid or expired review token", 401);
  return rec;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c] || c);
}

export async function reviewDevicePage(env: Env, req: Request, opts?: { store?: DeviceStore; now?: number }): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const token = new URL(req.url).searchParams.get("token") || "";
  const rec = await reviewRecord(env, store, token || undefined);
  if (rec instanceof Response) return rec;
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  const disabled = status === "pending" ? "" : " disabled";
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>Review Noema agent connection</title></head><body>
    <main>
      <h1>Review agent connection</h1>
      <p>Opening this link does not approve or deny anything. Email scanners and previews only see this page.</p>
      <p>Humans approve; agents inhabit after approval. If approved, the agent automatically receives credentials through device polling. Credentials never appear in this email or browser page.</p>
      <dl>
        <dt>World</dt><dd>${escapeHtml(rec.review_world_id || "world-01")}</dd>
        <dt>Runtime</dt><dd>${escapeHtml(rec.runtime)}</dd>
        <dt>Status</dt><dd>${escapeHtml(status)}</dd>
        <dt>Expires</dt><dd>${escapeHtml(rec.expires_at)}</dd>
      </dl>
      <form method="post" action="/v1/auth/device/review/approve"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit"${disabled}>Approve</button></form>
      <form method="post" action="/v1/auth/device/review/deny"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit"${disabled}>Deny</button></form>
      <p>Denied or expired requests cannot be redeemed. Use the short-code approval or operator token fallback only if email approval is unavailable.</p>
    </main>
  </body></html>`;
  return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

async function reviewTokenFromRequest(req: Request): Promise<string | undefined> {
  const urlToken = new URL(req.url).searchParams.get("token");
  if (urlToken) return urlToken;
  if (req.method !== "POST") return undefined;
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const body = (await req.clone().json().catch(() => ({}))) as { token?: unknown };
    return typeof body.token === "string" ? body.token : undefined;
  }
  if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
    const form = await req.clone().formData().catch(() => null);
    const token = form?.get("token");
    return typeof token === "string" ? token : undefined;
  }
  return undefined;
}

export async function approveDeviceReview(env: Env, req: Request, opts?: { store?: DeviceStore; now?: number }): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const rec = await reviewRecord(env, store, await reviewTokenFromRequest(req));
  if (rec instanceof Response) return rec;
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  if (status !== "pending") return err("NOT_AUTHORIZED", `device enrollment is ${status}`, 409);
  const controller_id = rec.controller_id || allocateDeviceControllerId();
  const player_id = rec.player_id || playerIdFromDeviceController(controller_id) || `player.agent`;
  await store.put({ ...rec, status: "approved", player_id, controller_id, review_token_hash: undefined });
  console.info("device_enrollment_review_approved", { world: rec.review_world_id, runtime: rec.runtime, scopes: rec.scopes });
  return json({ status: "approved", user_code: rec.user_code, player_id, controller_id, scopes: rec.scopes, runtime: rec.runtime });
}

export async function denyDeviceReview(env: Env, req: Request, opts?: { store?: DeviceStore; now?: number }): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "device store unavailable", 503);
  const rec = await reviewRecord(env, store, await reviewTokenFromRequest(req));
  if (rec instanceof Response) return rec;
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  if (status !== "pending") return err("NOT_AUTHORIZED", `device enrollment is ${status}`, 409);
  await store.put({ ...rec, status: "denied", review_token_hash: undefined });
  console.info("device_enrollment_review_denied", { world: rec.review_world_id, runtime: rec.runtime, scopes: rec.scopes });
  return json({ status: "denied", user_code: rec.user_code });
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

function canHumanApprove(principal: Principal): boolean {
  if (isHumanPrincipal(principal)) return true;
  if ((principal.scopes || []).includes("noema.controller.manage")) return true;
  return false;
}

async function requireHumanApprover(req: Request, env: Env): Promise<Principal | Response> {
  const principal = await resolvePrincipal(req, env);
  if (principal instanceof Response) return principal;
  if (!canHumanApprove(principal)) {
    return err("NOT_AUTHORIZED", "only a human platform principal may approve device enrollment", 403);
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
  const controller_id = rec.controller_id || allocateDeviceControllerId();
  const player_id =
    rec.player_id || playerIdFromDeviceController(controller_id) || `player.agent`;
  const next: DeviceRecord = {
    ...rec,
    status: "approved",
    player_id,
    controller_id,
    approver_id: isHumanPrincipal(approver) ? approver.identity_id : undefined,
  };
  await store.put(next);
  return json({
    status: "approved",
    user_code: rec.user_code,
    player_id,
    controller_id,
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
  if (rec.approver_id && isHumanPrincipal(approver) && rec.approver_id !== approver.identity_id) {
    return err("NOT_AUTHORIZED", "cannot deny another account's enrollment", 403);
  }
  const status = await effectiveDeviceStatus(rec, opts?.now ?? Date.now());
  if (status !== "pending") return json({ status, user_code: rec.user_code });
  await store.put({ ...rec, status: "denied" });
  return json({ status: "denied", user_code: rec.user_code });
}

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
  if (status === "pending") return json({ status: "authorization_pending", interval: DEVICE_POLL_INTERVAL_SECONDS });
  if (status === "expired") {
    if (rec.status === "pending") await store.put({ ...rec, status: "expired" });
    return err("NOT_AUTHORIZED", "device code expired", 401);
  }
  if (status !== "approved") return err("NOT_AUTHORIZED", `device enrollment ${status}`, 401);
  if (!rec.player_id || !rec.controller_id) {
    return err("NOT_AUTHORIZED", "tokens already redeemed", 401);
  }
  const handle = rec.player_id.replace(/^player\./, "").slice(0, 32) || "player";
  const minted = await mintControllerToken(env, {
    handle,
    controllerType: "agent",
    playerId: rec.player_id,
    controllerId: rec.controller_id,
    amr: "device_enrollment",
  });
  const { player_id, controller_id, ...rest } = rec;
  await store.put({
    ...rest,
    player_id,
    controller_id,
    status: "redeemed",
  });
  return json({
    status: "approved",
    access_token: minted.access_token,
    token_type: "bearer",
    player_id: rec.player_id,
    controller_id: rec.controller_id,
    scopes: rec.scopes,
  });
}
