import { mintAdminSession } from "../../src/admin-auth";
import { mintControllerToken } from "../../src/auth";
import worker from "../../src/index";
import type { Env } from "../../src/types";

export const SIGNING = "test-signing-secret-hosted-conformance";
export const OPERATOR = "operator-token-value-ok";

export type DoCall = { op: string; name?: string; body?: Record<string, unknown> | null };

export function mockWorldDo(calls: DoCall[]) {
  return {
    idFromName(name: string) {
      calls.push({ op: "idFromName", name });
      return { name };
    },
    get(id: { name: string }) {
      return {
        fetch: async (_url: string, init?: RequestInit) => {
          calls.push({
            op: "fetch",
            name: id.name,
            body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
          });
          return new Response(JSON.stringify({ ok: true, world_id: id.name }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      };
    },
  };
}

export function env(calls: DoCall[], defaultWorldId = "world-01"): Env {
  return {
    TOKEN_SIGNING_SECRET: SIGNING,
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: defaultWorldId,
    ADMIN_OPERATOR_TOKEN: OPERATOR,
    WORLD_DO: mockWorldDo(calls),
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
) {
  const req = new Request(`https://noema.local${path}`, {
    method: init.method || "POST",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return worker.fetch(req, env(calls, defaultWorldId));
}
