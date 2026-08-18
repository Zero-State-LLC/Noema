import { mintAdminSession } from "../../src/admin-auth";
import { mintControllerToken } from "../../src/auth";
import worker from "../../src/index";
import { RATE_LIMIT_DO_NAME } from "../../src/rate-limit";
import type { Env } from "../../src/types";

export const SIGNING = "test-signing-secret-hosted-conformance";
export const OPERATOR = "operator-token-value-ok";

export type DoCall = { op: string; name?: string; url?: string; body?: Record<string, unknown> | null };

export function worldDoCalls(calls: DoCall[]): DoCall[] {
  return calls.filter((c) => c.name !== RATE_LIMIT_DO_NAME);
}

export function mockWorldDo(calls: DoCall[], watchBody?: Record<string, unknown>) {
  const devices = new Map<string, Record<string, unknown>>();
  return {
    idFromName(name: string) {
      calls.push({ op: "idFromName", name });
      return { name };
    },
    get(id: { name: string }) {
      return {
        fetch: async (url: string, init?: RequestInit) => {
          const path = String(url);
          const method = String(init?.method || "GET").toUpperCase();
          calls.push({
            op: "fetch",
            name: id.name,
            url: path,
            body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
          });
          if (path.includes("/device")) {
            const parsed = new URL(path, "https://do.local");
            if (method === "PUT" && init?.body) {
              const rec = JSON.parse(String(init.body)) as { device_code?: string };
              if (rec.device_code) devices.set(rec.device_code, rec as Record<string, unknown>);
              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
              });
            }
            const deviceCode = parsed.searchParams.get("device_code");
            const userCode = (parsed.searchParams.get("user_code") || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
            const rec = deviceCode
              ? devices.get(deviceCode)
              : [...devices.values()].find(
                  (row) => String(row.user_code || "").replace(/-/g, "").toUpperCase() === userCode,
                );
            if (!rec) return new Response("{}", { status: 404 });
            return new Response(JSON.stringify(rec), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          if (path.includes("/watch")) {
            return new Response(
              JSON.stringify(watchBody || { sequence: 94, world_id: id.name, watch_live: "watch-live/1.0" }),
              { status: 200, headers: { "content-type": "application/json" } },
            );
          }
          return new Response(JSON.stringify({ ok: true, world_id: id.name }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      };
    },
  };
}

const worldByCalls = new WeakMap<DoCall[], ReturnType<typeof mockWorldDo>>();

export function env(
  calls: DoCall[],
  defaultWorldId = "world-01",
  watchBody?: Record<string, unknown>,
): Env {
  let world = worldByCalls.get(calls);
  if (!world) {
    world = mockWorldDo(calls, watchBody);
    worldByCalls.set(calls, world);
  }
  return {
    TOKEN_SIGNING_SECRET: SIGNING,
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: defaultWorldId,
    ADMIN_OPERATOR_TOKEN: OPERATOR,
    WORLD_DO: world,
  } as unknown as Env;
}

export async function playerToken(calls: DoCall[] = []) {
  const minted = await mintControllerToken(env(calls), { handle: "probe", controllerType: "human" });
  return minted.access_token;
}

export async function adminToken(calls: DoCall[] = []) {
  const minted = await mintAdminSession(env(calls), OPERATOR);
  if (minted instanceof Response) throw new Error("failed to mint admin");
  return minted.access_token;
}

export async function hit(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> },
  calls: DoCall[],
  defaultWorldId?: string,
  watchBody?: Record<string, unknown>,
) {
  const req = new Request(`https://noema.local${path}`, {
    method: init.method || "POST",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return worker.fetch(req, env(calls, defaultWorldId, watchBody));
}

export async function hitWatchLive(
  calls: DoCall[],
  init: { method?: string } = {},
  watchBody?: Record<string, unknown>,
) {
  return hit("/v1/watch/live", { method: init.method || "GET" }, calls, undefined, watchBody);
}
