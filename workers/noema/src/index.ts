/**
 * Noema Stage 0 Agent Gateway (Cloudflare Worker).
 * Spec: Noema-Specs docs/PLATFORM.md · AGENT-GATEWAY.md · GENESIS.md
 *
 * Product edge: auth → PlayerPrincipal → World Durable Object.
 * Operator plane: ADMIN session (separate principal) — admin ≠ player.
 * Static assets via ASSETS binding (public/).
 */

import { adminHtml, adminLoginHtml, adminCallbackHtml } from "./admin";
import { playReady } from "./ops";
import {
  adminTokenConfigured,
  consumeAdminMagicLink,
  mintAdminSession,
  requestAdminMagicLink,
  resolveAdmin,
  resolveSignedAdminHeader,
} from "./admin-auth";
import {
  err,
  json,
  mintControllerToken,
  mintDevControllerToken,
  requireScope,
  resolvePrincipal,
} from "./auth";
import { connectHtml } from "./connect";
import { catalog, GenesisError, previewGenesis } from "./genesis";
import { landingHtml, notFoundHtml } from "./landing";
import { consumePlayMagicLink, requestPlayMagicLink } from "./play-auth";
import { playCallbackHtml } from "./play-login-html";
import { playHtml } from "./play";
import { studyHtml } from "./study";
import type { CommandEnvelope, Env } from "./types";
import { watchHtml } from "./watch";
import { admitTestWorldId } from "./test-world";
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
  if (path === "/" || path === "/index.html" || path === "/memo" || path === "/memo.html") {
    // World door is landingHtml(), never the marketing splash
    return html(landingHtml(), 200, "public, max-age=30");
  } else if (path === "/404" || path === "/404.html") {
    return html(notFoundHtml(), 404, "no-store");
  } else {
    candidates.push(path);
    // try .html for extensionless marketing pages
    if (!path.includes(".") && !path.startsWith("/assets/")) {
      candidates.push(`${path}.html`);
    }
  }

  if (env.ASSETS) {
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
  }

  if (wantsHtml(request) || method === "GET" || method === "HEAD") {
    return html(notFoundHtml(), 404, "no-store");
  }
  return cors(err("NOT_FOUND", path, 404));
}

async function routeToWorld(
  env: Env,
  worldId: string,
  principal: unknown,
  envelope: CommandEnvelope,
  opts?: { allow_bootstrap?: boolean },
): Promise<Response> {
  const id = env.WORLD_DO.idFromName(worldId);
  const stub = env.WORLD_DO.get(id);
  return stub.fetch("https://do/command", {
    method: "POST",
    headers: { "content-type": "application/json", "x-noema-world-id": worldId },
    body: JSON.stringify({
      principal,
      envelope,
      world_id: worldId,
      allow_bootstrap: opts?.allow_bootstrap === true,
    }),
  });
}

export default {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
    const stub = env.WORLD_DO.get(id);
    await stub.fetch("https://do/digest-tick", { method: "POST" });
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      // Product entry (Specs EXPERIENCE): landing + PLAY / WATCH / STUDY / CONNECT
      if (
        request.method === "GET" &&
        (path === "/" || path === "/index.html" || path === "/memo" || path === "/memo.html")
      ) {
        return html(landingHtml(), 200, "public, max-age=30");
      }
      if (request.method === "GET" && path === "/play") {
        return html(playHtml());
      }
      if (request.method === "GET" && path === "/play/callback") {
        return html(playCallbackHtml());
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
      if (request.method === "GET" && path === "/admin/callback") {
        return html(adminCallbackHtml());
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
        const body = (await h.json().catch(() => ({}))) as {
          ok?: boolean;
          status?: string;
          settlement_health?: string;
        };
        if (!h.ok) {
          const pr = playReady("NOT_ACTIVE", "HEALTHY");
          return cors(
            json({
              ready: false,
              play_blocked: true,
              code: "WORLD_NOT_READY",
              status: pr.status,
              settlement_health: pr.settlement_health,
              world: body,
            }),
          );
        }
        const pr = playReady(body.status, body.settlement_health);
        return cors(
          json({
            ready: pr.ready,
            play_blocked: pr.play_blocked,
            code: pr.code,
            status: pr.status,
            settlement_health: pr.settlement_health,
            world: body,
          }),
        );
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
      if (request.method === "POST" && path === "/v1/admin/login/request") {
        const body = (await request.json().catch(() => ({}))) as { email?: string };
        return cors(await requestAdminMagicLink(env, request, body));
      }
      if (request.method === "POST" && path === "/v1/admin/login/consume") {
        const body = (await request.json().catch(() => ({}))) as {
          token_hash?: string;
          type?: string;
          code?: string;
        };
        const minted = await consumeAdminMagicLink(env, body);
        if (minted instanceof Response) return cors(minted);
        return cors(json({ ...minted, token_type: "bearer" }));
      }

      // Public PLAY email login (any mailbox → Player JWT; never admin-access)
      if (request.method === "POST" && path === "/v1/play/login/request") {
        const body = (await request.json().catch(() => ({}))) as { email?: string };
        return cors(await requestPlayMagicLink(env, request, body));
      }
      if (request.method === "POST" && path === "/v1/play/login/consume") {
        const body = (await request.json().catch(() => ({}))) as {
          token_hash?: string;
          type?: string;
          code?: string;
        };
        const minted = await consumePlayMagicLink(env, body);
        if (minted instanceof Response) return cors(minted);
        return cors(json({ ...minted, token_type: "bearer" }));
      }

      /**
       * Operator-minted Player controller tokens (production-safe entry).
       * ADMIN only. Never open public mint. Does not re-enable dev-token.
       */
      if (request.method === "POST" && path === "/v1/admin/controller-token") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as {
          handle?: string;
          controller_type?: "human" | "agent" | "hybrid";
          expires_in?: number;
        };
        const handle = (body.handle || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
        if (!handle || handle.length < 2) {
          return cors(err("INVALID_REQUEST", "handle required (2–32 chars [A-Za-z0-9_-])", 400));
        }
        const ctype = body.controller_type === "human" || body.controller_type === "hybrid"
          ? body.controller_type
          : "agent";
        const minted = await mintControllerToken(env, {
          handle,
          controllerType: ctype,
          expiresIn: body.expires_in,
          issuedByAdmin: true,
        });
        return cors(
          json({
            ...minted,
            issued_by: "admin",
            admin_session_id: admin.session_id,
            note:
              "Controller token for a Player. Paste into PLAY session card → Access token or use as Bearer for agents. Not an ADMIN session.",
          }),
        );
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
        const meta = (world.meta || {}) as Record<string, unknown>;
        const attention: Array<{ message: string; level: string }> = [];
        if (!adminTokenConfigured(env)) {
          attention.push({ message: "ADMIN_OPERATOR_TOKEN not configured.", level: "attention" });
        }
        if (meta.status === "ACTIVE") {
          attention.push({ message: "WORLD ACTIVE — Genesis configuration is frozen.", level: "ok" });
          if (meta.settlement_ok === false) {
            attention.push({
              message: "Settlement soft-failed or unset; verify SUPABASE_* and digest.",
              level: "attention",
            });
          }
        } else if (meta.status === "PAUSED") {
          attention.push({ message: "WORLD PAUSED — mutating PLAY rejected; WATCH may continue.", level: "attention" });
        } else if (meta.status === "INCIDENT") {
          attention.push({ message: "WORLD INCIDENT — mutation fail-closed until recovery.", level: "attention" });
        } else if (meta.status === "DEMO_SEED") {
          attention.push({
            message: "Demo chamber seed live. Run Genesis preview → activate for first real world.",
            level: "info",
          });
        }

        return cors(
          json({
            admin_plane: "hosted-genesis",
            ready: true,
            health,
            world,
            genesis: {
              status: meta.status,
              genesis_id: meta.genesis_id,
              profile_id: meta.profile_id,
              story_seed_ids: meta.story_seed_ids,
              world_seed: meta.world_seed,
              cycle0_digest: meta.cycle0_digest,
              config_frozen: meta.config_frozen,
              activated_at: meta.activated_at,
              settlement_id: meta.settlement_id,
              settlement_ok: meta.settlement_ok,
              do_digest: meta.do_digest,
              catalog: catalog(),
            },
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
              production_reseed_forbidden: true,
            },
          }),
        );
      }

      if (request.method === "GET" && path === "/v1/admin/genesis/catalog") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        return cors(json(catalog()));
      }

      // Preview — pure generate + store in DO; live world unchanged
      if (request.method === "POST" && path === "/v1/admin/genesis/preview") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        try {
          const body = (await request.json()) as {
            world_name?: string;
            world_seed?: string;
            profile_id?: string;
            story_seed_ids?: string[];
          };
          const result = await previewGenesis({
            world_name: body.world_name || "Perihelion Reach",
            world_seed: body.world_seed || "",
            profile_id: body.profile_id || "FRACTURED_OLD_WORLD",
            story_seed_ids: body.story_seed_ids,
          });
          const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
          const stub = env.WORLD_DO.get(id);
          // Capture live sequence before store
          const before = (await (await stub.fetch("https://do/health")).json()) as { sequence?: number };
          await stub.fetch("https://do/genesis-preview-store", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ result }),
          });
          const after = (await (await stub.fetch("https://do/health")).json()) as { sequence?: number };
          // Determinism self-check: re-preview same inputs
          const again = await previewGenesis({
            world_name: body.world_name || "Perihelion Reach",
            world_seed: body.world_seed || "",
            profile_id: body.profile_id || "FRACTURED_OLD_WORLD",
            story_seed_ids: body.story_seed_ids,
          });
          const deterministic =
            again.genesis_id === result.genesis_id && again.cycle0_digest === result.cycle0_digest;

          return cors(
            json({
              result,
              determinism: {
                ok: deterministic,
                genesis_id_match: again.genesis_id === result.genesis_id,
                cycle0_digest_match: again.cycle0_digest === result.cycle0_digest,
              },
              live_world_unchanged: {
                ok: before.sequence === after.sequence,
                sequence_before: before.sequence,
                sequence_after: after.sequence,
              },
              admin_session_id: admin.session_id,
            }),
          );
        } catch (e) {
          if (e instanceof GenesisError) return cors(err(e.code, e.message, 400));
          throw e;
        }
      }

      if (request.method === "POST" && path === "/v1/admin/genesis/activate") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as {
          genesis_id?: string;
          confirm?: boolean;
          force?: boolean;
        };
        if (!body.genesis_id) return cors(err("INVALID_REQUEST", "genesis_id required", 400));
        if (!body.confirm) {
          return cors(err("CONFIRMATION_REQUIRED", "confirm: true required for activation", 400));
        }
        const envName = (env.NOEMA_ENV || "local").toLowerCase();
        if (body.force && envName === "production") {
          return cors(err("POLICY_DENIED", "force supersede forbidden in production", 403));
        }
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/genesis-activate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            genesis_id: body.genesis_id,
            admin_session_id: admin.session_id,
            force: Boolean(body.force),
          }),
        });
        const data = await res.json();
        return cors(json(data, res.status));
      }

      if (request.method === "GET" && path === "/v1/admin/digests") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/digests");
        return cors(json(await res.json(), res.status));
      }

      if (request.method === "POST" && path === "/v1/admin/digest-config") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = await request.json().catch(() => ({}));
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/digest-config", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return cors(json(await res.json(), res.status));
      }

      if (request.method === "POST" && path === "/v1/admin/digest-tick") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/digest-tick", { method: "POST" });
        return cors(json(await res.json(), res.status));
      }

      if (request.method === "POST" && path === "/v1/admin/lifecycle") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/admin-lifecycle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: body.action, reason: body.reason, admin_session_id: admin.session_id }),
        });
        const payload = (await res.json()) as Record<string, unknown>;
        return cors(json({ ...payload, operator_session: admin.session_id }, res.status));
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

      // Isolated hosted canonical verification. Not a PLAY command path.
      if (request.method === "POST" && path === "/v1/operator/test-world/command") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const admin = await resolveSignedAdminHeader(request, env);
        if (admin instanceof Response) return cors(admin);
        const denied = requireScope(principal, "noema.action.submit");
        if (denied) return cors(denied);

        const body = (await request.json().catch(() => ({}))) as CommandEnvelope & { world_id?: string };
        const admitted = admitTestWorldId(body.world_id, env.DEFAULT_WORLD_ID);
        if (!admitted.ok) return cors(err(admitted.code, admitted.message, 403));
        if (!body.command || !body.request_id) {
          return cors(err("INVALID_REQUEST", "command and request_id required", 400));
        }

        const envelope: CommandEnvelope = {
          request_id: body.request_id,
          command: body.command,
          arguments: body.arguments,
          idempotency_key: body.idempotency_key,
          player_id: body.player_id,
        };
        const doRes = await routeToWorld(env, admitted.world_id, principal, envelope, { allow_bootstrap: true });
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

      // Static assets (/assets/*, 404). Product home aliases are landingHtml().
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
