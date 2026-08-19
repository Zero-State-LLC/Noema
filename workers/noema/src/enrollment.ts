import { composeAgentBootstrapMail, agentEnrollmentHref, AGENT_BOOTSTRAP_FROM } from "./agent-mail";
import { loginRedirectOrigin, normalizeEmail } from "./admin-auth";
import { err, json, mintControllerToken } from "./auth";
import { sendTransactionalEmail } from "./email-provider";
import { ACCEPTED_SEALS, SEAL_HEADER } from "./seal";
import type { Env } from "./types";

export const DEFAULT_AGENT_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
] as const;

export const ENROLLMENT_TTL_MS = 15 * 60 * 1000;

export type EnrollmentStatus = "pending" | "approved" | "denied" | "replaced" | "expired";

export type EnrollmentRecord = {
  enrollment_id: string;
  token_hash: string;
  account_id: string;
  player_id: string;
  handle: string;
  origin: string;
  world_id: string;
  issued_at: string;
  expires_at: string;
  status: EnrollmentStatus;
  operator_id?: string;
};

export interface EnrollmentStore {
  put(rec: EnrollmentRecord): Promise<void>;
  get(id: string): Promise<EnrollmentRecord | null>;
  list(): Promise<EnrollmentRecord[]>;
}

export function durableEnrollmentStore(env: Env): EnrollmentStore {
  const id = env.WORLD_DO.idFromName("__noema_enrollments__");
  const stub = env.WORLD_DO.get(id);
  return {
    async put(rec) {
      const res = await stub.fetch("https://do/enroll", { method: "PUT", body: JSON.stringify(rec) });
      if (!res.ok) throw new Error("enrollment persist failed");
    },
    async get(enrollmentId) {
      const res = await stub.fetch(`https://do/enroll?id=${encodeURIComponent(enrollmentId)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("enrollment load failed");
      return (await res.json()) as EnrollmentRecord;
    },
    async list() {
      const res = await stub.fetch("https://do/enroll");
      if (!res.ok) return [];
      const body = (await res.json()) as { records?: EnrollmentRecord[] };
      return body.records || [];
    },
  };
}

export function memoryEnrollmentStore(seed: EnrollmentRecord[] = []): EnrollmentStore {
  const map = new Map(seed.map((r) => [r.enrollment_id, { ...r }]));
  return {
    async put(rec) {
      map.set(rec.enrollment_id, { ...rec });
    },
    async get(id) {
      const rec = map.get(id);
      return rec ? { ...rec } : null;
    },
    async list() {
      return [...map.values()].map((r) => ({ ...r }));
    },
  };
}

export async function hashEnrollmentToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function bootstrapHttpsOrigin(env: Env, req: Request): string {
  const origin = loginRedirectOrigin(env, req);
  if (origin.startsWith("https://")) return origin;
  try {
    const u = new URL(origin);
    u.protocol = "https:";
    return u.origin;
  } catch {
    return "https://noema.guru";
  }
}

export function publicPreview(rec: EnrollmentRecord): {
  enrollment_id: string;
  player_id: string;
  handle: string;
  world_id: string;
  requested_scopes: string[];
  status: EnrollmentStatus;
  expires_at: string;
  issued_at: string;
} {
  return {
    enrollment_id: rec.enrollment_id,
    player_id: rec.player_id,
    handle: rec.handle,
    world_id: rec.world_id,
    requested_scopes: [...DEFAULT_AGENT_SCOPES],
    status: rec.status,
    expires_at: rec.expires_at,
    issued_at: rec.issued_at,
  };
}

export function bootstrapDocument(rec: EnrollmentRecord): Record<string, unknown> {
  return {
    schema_version: "noema-agent-bootstrap/1.0",
    enrollment_id: rec.enrollment_id,
    account_id: rec.account_id,
    player_id: rec.player_id,
    origin: rec.origin,
    issued_at: rec.issued_at,
    expires_at: rec.expires_at,
    verification_uri: `${rec.origin}/connect/enroll?eid=${encodeURIComponent(rec.enrollment_id)}`,
    discovery_uri: `${rec.origin}/.well-known/noema-agent.json`,
    protocol_version: "agent-protocol/v1",
    world_id: rec.world_id,
    requested_scopes: [...DEFAULT_AGENT_SCOPES],
    profile: {
      mode: "game-only",
      isolated: true,
      inherits_operator_session: false,
    },
  };
}

export function discoveryDocument(origin: string): Record<string, unknown> {
  const base = origin.replace(/\/$/, "");
  return {
    protocol: "agent-protocol/v1",
    origin: base,
    verification_uri: `${base}/connect`,
    command_uri: `${base}/v1/command`,
    websocket_uri: `${base}/protocol/v1/ws`,
    bootstrap_schema: "noema-agent-bootstrap/1.0",
    admission: "agents_only",
    watch_uri: `${base}/watch`,
    device_authorization_uri: `${base}/v1/auth/device`,
    token_uri: `${base}/v1/auth/device/token`,
    seal_header: SEAL_HEADER,
    accepted_seals: [...ACCEPTED_SEALS],
    command_required: ["command", "request_id"],
  };
}

function newEnrollmentId(): string {
  return `enroll.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function effectiveStatus(rec: EnrollmentRecord, now: number): Promise<EnrollmentStatus> {
  if (rec.status === "pending" && Date.parse(rec.expires_at) <= now) return "expired";
  return rec.status;
}

export async function assertEnrollmentToken(rec: EnrollmentRecord, token: string): Promise<boolean> {
  const got = await hashEnrollmentToken(token);
  return got === rec.token_hash;
}

export async function requestAgentEnrollment(
  env: Env,
  req: Request,
  body: { email?: string; handle?: string },
  opts?: {
    store?: EnrollmentStore;
    now?: number;
    sendMail?: (mail: { to: string; subject: string; html: string; text: string }) => Promise<void>;
    mailFetch?: typeof fetch;
    operatorId?: string;
  },
): Promise<Response> {
  const email = normalizeEmail(String(body.email || ""));
  if (!email) return err("INVALID_REQUEST", "email required", 400);
  const handle = String(body.handle || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  if (!handle || handle.length < 2) {
    return err("INVALID_REQUEST", "handle required (2–32 chars [A-Za-z0-9_-])", 400);
  }
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "enrollment store unavailable", 503);

  const now = opts?.now ?? Date.now();
  const origin = bootstrapHttpsOrigin(env, req);
  const token = newToken();
  const rec: EnrollmentRecord = {
    enrollment_id: newEnrollmentId(),
    token_hash: await hashEnrollmentToken(token),
    account_id: "account.operator",
    player_id: `player.${handle}`,
    handle,
    origin,
    world_id: env.DEFAULT_WORLD_ID || "world-01",
    issued_at: new Date(now).toISOString(),
    expires_at: new Date(now + ENROLLMENT_TTL_MS).toISOString(),
    status: "pending",
    operator_id: opts?.operatorId,
  };

  for (const prev of await store.list()) {
    if (prev.handle === handle && prev.status === "pending") {
      await store.put({ ...prev, status: "replaced" });
    }
  }
  await store.put(rec);

  const href = agentEnrollmentHref(origin, rec.enrollment_id, token);
  const mail = composeAgentBootstrapMail(email, href);
  const send =
    opts?.sendMail ||
    ((m) =>
      sendTransactionalEmail(
        env,
        {
          from: AGENT_BOOTSTRAP_FROM,
          to: m.to,
          subject: m.subject,
          html: m.html,
          text: m.text,
          tag: "agent-bootstrap",
        },
        opts?.mailFetch,
      ).then(() => undefined));
  await send(mail);

  return json({
    ok: true,
    enrollment_id: rec.enrollment_id,
    expires_at: rec.expires_at,
    player_id: rec.player_id,
  });
}

export async function previewAgentEnrollment(
  env: Env,
  req: Request,
  opts?: { store?: EnrollmentStore; now?: number },
): Promise<Response> {
  const url = new URL(req.url);
  const eid = url.searchParams.get("eid") || "";
  const token = url.searchParams.get("t") || "";
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "enrollment store unavailable", 503);
  const rec = await store.get(eid);
  if (!rec || !token || !(await assertEnrollmentToken(rec, token))) {
    return err("NOT_FOUND", "unknown enrollment", 404);
  }
  const status = await effectiveStatus(rec, opts?.now ?? Date.now());
  return json({ ...publicPreview(rec), status });
}

export async function decideAgentEnrollment(
  env: Env,
  req: Request,
  body: { enrollment_id?: string; token?: string; decision?: string },
  opts?: { store?: EnrollmentStore; now?: number; operatorId?: string },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "enrollment store unavailable", 503);
  const eid = String(body.enrollment_id || "");
  const token = String(body.token || "");
  const decision = String(body.decision || "");
  const rec = await store.get(eid);
  if (!rec || !token || !(await assertEnrollmentToken(rec, token))) {
    return err("NOT_FOUND", "unknown enrollment", 404);
  }
  const now = opts?.now ?? Date.now();
  const status = await effectiveStatus(rec, now);
  if (status !== "pending") {
    return err("NOT_AUTHORIZED", `enrollment is ${status}`, 409);
  }
  if (decision === "deny") {
    await store.put({ ...rec, status: "denied" });
    return json({ ok: true, status: "denied", enrollment_id: rec.enrollment_id });
  }
  if (decision !== "approve") {
    return err("INVALID_REQUEST", "decision must be approve or deny", 400);
  }
  const minted = await mintControllerToken(env, {
    handle: rec.handle,
    controllerType: "agent",
    issuedByAdmin: true,
    playerId: rec.player_id,
    amr: "agent_enrollment",
    operatorId: rec.operator_id || opts?.operatorId,
  });
  await store.put({ ...rec, status: "approved", operator_id: rec.operator_id || opts?.operatorId });
  return json({
    ok: true,
    status: "approved",
    enrollment_id: rec.enrollment_id,
    ...minted,
    note: "Controller token shown once. Not an ADMIN session. Not sent by email.",
  });
}

export async function getBootstrapDocument(
  env: Env,
  req: Request,
  enrollmentId: string,
  opts?: { store?: EnrollmentStore; now?: number },
): Promise<Response> {
  const store = opts?.store;
  if (!store) return err("UNAVAILABLE", "enrollment store unavailable", 503);
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const rec = await store.get(enrollmentId);
  if (!rec || !token || !(await assertEnrollmentToken(rec, token))) {
    return err("NOT_FOUND", "unknown enrollment", 404);
  }
  const status = await effectiveStatus(rec, opts?.now ?? Date.now());
  if (status === "expired") return err("NOT_AUTHORIZED", "enrollment is expired", 409);
  const doc = bootstrapDocument(rec);
  return json(doc);
}
