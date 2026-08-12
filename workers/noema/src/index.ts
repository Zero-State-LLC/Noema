/**
 * Noema Stage 0 Agent Gateway (Cloudflare Worker).
 * Spec: Noema-Specs docs/PLATFORM.md · AGENT-GATEWAY.md
 *
 * Thin edge only: auth → PlayerPrincipal → World Durable Object.
 */

import { err, json, mintDevControllerToken, requireScope, resolvePrincipal } from "./auth";
import type { CommandEnvelope, Env } from "./types";
import { NoemaWorldDO } from "./world-do";

export { NoemaWorldDO };

function cors(res: Response): Response {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Noema-Access-Token");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return new Response(res.body, { status: res.status, headers: h });
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
      if (request.method === "GET" && (path === "/health" || path === "/")) {
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

      return cors(err("NOT_FOUND", path, 404));
    } catch (e) {
      const message = e instanceof Error ? e.message : "internal error";
      return cors(json({ error: { code: "INTERNAL", message } }, 500));
    }
  },
} satisfies ExportedHandler<Env>;
