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
