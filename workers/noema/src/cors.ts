/**
 * CORS for the hosted gateway.
 * Same-origin PLAY/WATCH/ADMIN do not need CORS. Mutating APIs reflect
 * an allowlist. Public GET spectator/health stays `*` so any origin can poll.
 */

export const CORS_ALLOW_HEADERS =
  "Authorization, Content-Type, X-Noema-Access-Token, X-Noema-Admin-Token, X-Noema-Seal";
export const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";

const PINNED_ORIGINS = new Set([
  "https://noema.guru",
  "https://www.noema.guru",
  "https://noema-gateway.zer0state-noema.workers.dev",
]);

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isPublicReadPath(path: string): boolean {
  const p = normalizePath(path);
  return (
    p === "/v1/watch/live" ||
    p === "/v1/watch/map" ||
    p === "/watch/map.json" ||
    p === "/v1/watch/stream" ||
    p === "/health" ||
    p === "/ready" ||
    p === "/watch" ||
    p === "/watch/map" ||
    p === "/protocol/v1"
  );
}

export function isAllowedOrigin(origin: string, env?: { NOEMA_ENV?: string }): boolean {
  if (!origin) return false;
  if (PINNED_ORIGINS.has(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.zer0state-noema\.workers\.dev$/i.test(origin)) return true;
  const envName = (env?.NOEMA_ENV || "").toLowerCase();
  if (envName && envName !== "production") {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  }
  return false;
}

export function allowOriginValue(
  request: Request,
  env?: { NOEMA_ENV?: string },
): string | null {
  const path = normalizePath(new URL(request.url).pathname);
  const method = request.method.toUpperCase();
  const publicRead = isPublicReadPath(path) && (method === "GET" || method === "HEAD" || method === "OPTIONS");
  if (publicRead) return "*";
  const origin = request.headers.get("Origin") || "";
  if (origin && isAllowedOrigin(origin, env)) return origin;
  return null;
}

export function applyCors(res: Response, request: Request, env?: { NOEMA_ENV?: string }): Response {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  h.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  h.append("Vary", "Origin");
  const allow = allowOriginValue(request, env);
  if (allow) h.set("Access-Control-Allow-Origin", allow);
  else h.delete("Access-Control-Allow-Origin");
  return new Response(res.body, { status: res.status, headers: h });
}
