/**
 * Noema Stage 0 Agent Gateway (Cloudflare Worker).
 * Spec: Noema-Specs docs/PLATFORM.md · AGENT-GATEWAY.md · GENESIS.md
 *
 * Product edge: auth → PlayerPrincipal → World Durable Object.
 * Operator plane: ADMIN session (separate principal) — admin ≠ player.
 * Static assets via ASSETS binding (public/).
 */

import { adminHtml, adminLoginHtml } from "./admin";
import { adminTokenConfigured, mintAdminSession, resolveAdmin } from "./admin-auth";
import { err, json, mintDevControllerToken, requireScope, resolvePrincipal } from "./auth";
import { connectHtml } from "./connect";
import { landingHtml } from "./landing";
import { playHtml } from "./play";
import { studyHtml } from "./study";
import type { CommandEnvelope, Env } from "./types";
import { watchHtml } from "./watch";
import { NoemaWorldDO } from "./world-do";

export { NoemaWorldDO };

function html(body: string, status = 200, cache = "no-store"): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
}

function cors(res: Response): Response {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Noema-Access-Token, X-Noema-Admin-Token");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return new Response(res.body, { status: res.status, headers: h });
}

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function assetRequest(origin: string, assetPath: string, method: string): Request {
  return new Request(new URL(assetPath, origin).toString(), { method: method === "HEAD" ? "HEAD" : "GET" });
}

async function serveStatic(request: Request, env: Env, path: string): Promise<Response> {
  const origin = new URL(request.url).origin;
  const method = request.method;

  // Explicit path map — avoid Assets clean-URL redirect loops
  const candidates: string[] = [];
  if (path === "/" || path === "/index.html") {
    candidates.push("/index.html");
  } else if (path === "/memo" || path === "/memo.html") {
    candidates.push("/memo.html");
  } else if (path === "/404" || path === "/404.html") {
    candidates.push("/404.html");
  } else {
    candidates.push(path);
    // try .html for extensionless marketing pages
    if (!path.includes(".") && !path.startsWith("/assets/")) {
      candidates.push(`${path}.html`);
    }
  }

  for (const assetPath of candidates) {
    const res = await env.ASSETS.fetch(assetRequest(origin, assetPath, method));
    if (res.status === 200) {
      const h = new Headers(res.headers);
      if (assetPath.startsWith("/assets/")) {
        h.set("cache-control", "public, max-age=3600");
      } else {
        h.set("cache-control", "public, max-age=60");
      }
      h.set("x-content-type-options", "nosniff");
      return new Response(res.body, { status: 200, headers: h });
    }
  }

  // Friendly HTML 404 for browsers / GET navigations
  if (wantsHtml(request) || method === "GET" || method === "HEAD") {
    const nf = await env.ASSETS.fetch(assetRequest(origin, "/404.html", "GET"));
    if (nf.status === 200) {
      return new Response(nf.body, {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
  }
  return cors(err("NOT_FOUND", path, 404));
}

async function routeToWorld(env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope): Promise<Response> {
  const id = env.WORLD_DO.idFromName(worldId);
  const stub = env.WORLD_DO.get(id);
  return stub.fetch("https://do/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ principal, envelope }),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      // Product entry (Specs EXPERIENCE): landing + PLAY / WATCH / STUDY / CONNECT
      if (request.method === "GET" && path === "/") {
        return html(landingHtml(), 200, "public, max-age=30");
      }
      if (request.method === "GET" && path === "/play") {
        return html(playHtml());
      }
      if (request.method === "GET" && path === "/watch") {
        return html(watchHtml());
      }
      if (request.method === "GET" && path === "/study") {
        return html(studyHtml());
      }
      if (request.method === "GET" && path === "/connect") {
        return html(connectHtml());
      }

      // Operator plane — NOT in product primary nav (admin ≠ player)
      if (request.method === "GET" && path === "/admin/login") {
        return html(adminLoginHtml());
      }
      if (request.method === "GET" && path === "/admin") {
        return html(adminHtml());
      }

      if (request.method === "GET" && path === "/health") {
        return cors(
          json({
            status: "ok",
            service: "noema-gateway",
            stage: "0",
            env: env.NOEMA_ENV || "local",
            protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
            world_id: env.DEFAULT_WORLD_ID || "world-01",
          }),
        );
      }

      if (request.method === "GET" && path === "/ready") {
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const h = await stub.fetch("https://do/health");
        const body = await h.json();
        return cors(json({ ready: true, world: body }));
      }

      // Public WATCH projection (no auth — spectator)
      if (request.method === "GET" && (path === "/v1/watch/live" || path === "/watch/live")) {
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/watch");
        const body = await res.json();
        return cors(json(body, res.status));
      }

      // ——— ADMIN API (operator token → admin-access JWT; never player tokens) ———
      if (request.method === "POST" && path === "/v1/admin/session") {
        const body = (await request.json().catch(() => ({}))) as { admin_token?: string };
        if (!body.admin_token) return cors(err("INVALID_REQUEST", "admin_token required", 400));
        const minted = await mintAdminSession(env, body.admin_token);
        if (minted instanceof Response) return cors(minted);
        return cors(json({ ...minted, token_type: "bearer" }));
      }

      if (request.method === "GET" && path === "/v1/admin/overview") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);

        const health = {
          status: "ok",
          service: "noema-gateway",
          stage: "0",
          env: env.NOEMA_ENV || "local",
          protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
          world_id: env.DEFAULT_WORLD_ID || "world-01",
        };
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const worldRes = await stub.fetch("https://do/admin-status");
        const world = (await worldRes.json()) as Record<string, unknown>;
        const attention: Array<{ message: string; level: string }> = [];
        if (!adminTokenConfigured(env)) {
          attention.push({ message: "ADMIN_OPERATOR_TOKEN not configured.", level: "attention" });
        }
        attention.push({
          message: "Stage 0: full Genesis profile wizard remains on noema-serve /admin.",
          level: "info",
        });

        return cors(
          json({
            admin_plane: "stage0-worker",
            ready: true,
            health,
            world,
            genesis: (world as { genesis?: unknown }).genesis,
            admin: {
              session_id: admin.session_id,
              role: admin.role,
              scopes: admin.scopes,
            },
            attention,
            boundaries: {
              player_sessions_cannot_promote: true,
              genesis_player_surface: false,
              service_role_to_clients: false,
            },
          }),
        );
      }

      if (request.method === "POST" && path === "/v1/admin/reseed") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const envName = (env.NOEMA_ENV || "local").toLowerCase();
        if (envName === "production") {
          return cors(err("POLICY_DENIED", "reseed disabled in production", 403));
        }
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/admin-reseed", { method: "POST" });
        const body = (await res.json()) as Record<string, unknown>;
        return cors(json({ ...body, operator_session: admin.session_id }, res.status));
      }

      // Local/dev/preview: mint controller token for human or agent demos
      // Disabled when NOEMA_ENV=production
      if (request.method === "POST" && path === "/v1/auth/dev-token") {
        const envName = (env.NOEMA_ENV || "local").toLowerCase();
        if (envName === "production") {
          return cors(err("NOT_AUTHORIZED", "dev-token disabled in production", 403));
        }
        const body = (await request.json().catch(() => ({}))) as {
          handle?: string;
          controller_type?: "human" | "agent";
        };
        const handle = (body.handle || "demo").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "demo";
        const minted = await mintDevControllerToken(env, handle, body.controller_type || "agent");
        return cors(json({ ...minted, token_type: "bearer" }));
      }

      // Who am I
      if (request.method === "GET" && path === "/v1/me") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        return cors(json({ principal }));
      }

      // Command path (HTTP). Same envelope for human and agent Players.
      if (request.method === "POST" && (path === "/v1/command" || path === "/protocol/v1/command")) {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);

        const envelope = (await request.json()) as CommandEnvelope;
        if (!envelope?.command || !envelope?.request_id) {
          return cors(err("INVALID_REQUEST", "command and request_id required", 400));
        }

        const cmd = envelope.command.toUpperCase();
        if (cmd === "OBSERVE" || cmd === "LOOK") {
          const denied = requireScope(principal, "noema.world.observe");
          if (denied) return cors(denied);
        } else {
          const denied = requireScope(principal, "noema.action.submit");
          if (denied) return cors(denied);
        }

        const worldId = env.DEFAULT_WORLD_ID || "world-01";
        const doRes = await routeToWorld(env, worldId, principal, envelope);
        const data = await doRes.json();
        return cors(json(data, doRes.status));
      }

      // Minimal agent-protocol-shaped AUTH for adapters
      if (request.method === "POST" && path === "/protocol/v1") {
        const body = (await request.json()) as {
          type?: string;
          request_id?: string;
          body?: { access_token?: string; token?: string };
        };
        if (body.type === "HELLO") {
          return cors(
            json({
              protocol: "agent-protocol/v1",
              type: "HELLO_ACK",
              request_id: body.request_id,
              body: {
                selected_protocol: "agent-protocol/v1",
                auth_methods: ["controller-token", "dev"],
                stage: "0",
              },
            }),
          );
        }
        if (body.type === "AUTH") {
          const token = body.body?.access_token || body.body?.token;
          if (!token) return cors(err("NOT_AUTHORIZED", "access_token required"));
          // Re-build request with token for resolvePrincipal
          const fake = new Request(request.url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const principal = await resolvePrincipal(fake, env);
          if (principal instanceof Response) return cors(principal);
          return cors(
            json({
              protocol: "agent-protocol/v1",
              type: "AUTH_ACK",
              request_id: body.request_id,
              agent_id: principal.agent_id,
              body: {
                session_id: principal.session_id,
                player_id: principal.player_id,
                controller_id: principal.controller_id,
                agent_id: principal.agent_id,
                scopes: principal.scopes,
              },
            }),
          );
        }
        return cors(err("INVALID_REQUEST", "use POST /v1/command for ACT after AUTH", 400));
      }

      // Marketing splash + static assets (/, /index.html, /memo.html, /assets/*)
      if (request.method === "GET" || request.method === "HEAD") {
        return serveStatic(request, env, path);
      }

      return cors(err("NOT_FOUND", path, 404));
    } catch (e) {
      const message = e instanceof Error ? e.message : "internal error";
      return cors(json({ error: { code: "INTERNAL", message } }, 500));
    }
  },
} satisfies ExportedHandler<Env>;
