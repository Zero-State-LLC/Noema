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
  clientIp,
} from "./admin-auth";
import {
  err,
  json,
  mintControllerToken,
  mintDevControllerToken,
  requireScope,
  resolvePrincipal,
  requireAgentPlayer,
} from "./auth";
import { connectHtml, enrollHtml } from "./connect";
import { applyCors } from "./cors";
import { durableRevocationStore, isControllerRevoked } from "./controller-revocation";
import {
  approveDevice,
  denyDevice,
  durableDeviceStore,
  pollDeviceToken,
  previewDevice,
  startDeviceEnrollment,
} from "./device-enrollment";
import {
  bootstrapHttpsOrigin,
  decideAgentEnrollment,
  discoveryDocument,
  durableEnrollmentStore,
  getBootstrapDocument,
  previewAgentEnrollment,
  requestAgentEnrollment,
} from "./enrollment";
import { catalog, GenesisError, previewGenesis } from "./genesis";
import { landingHtml, notFoundHtml } from "./landing";
import { manifestoHtml } from "./manifesto";
import { consumePlayMagicLink, requestPlayMagicLink } from "./play-auth";
import { playCallbackHtml } from "./play-login-html";
import { providerOverview, verifyResend, verifySupabase } from "./provider-management";
import { studyHtml } from "./study";
import type { CommandEnvelope, Env } from "./types";
import { watchHtml } from "./watch";
import { admitTestWorldId } from "./test-world";
import { hasPrivateCognition } from "./cognition";
import { applyPlayerCommand } from "./protocol-ws";
import { acceptProtocolWebSocket, protocolHello } from "./protocol-ws";
import { checkLiveAgentSeal, parseSeal } from "./seal";
import {
  ADMIN_SESSION_LIMIT,
  ADMIN_SESSION_WINDOW_MS,
  adminSessionThrottle,
  allowThrottled,
  commandThrottle,
  deviceThrottle,
} from "./rate-limit";
import { getWorldHead, summarizeCanonicalHead } from "./settle";
import { NoemaWorldDO } from "./world-do";

export { NoemaWorldDO };

const HTML_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss: http://127.0.0.1:* http://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

function html(body: string, status = 200, cache = "no-store"): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      "content-security-policy": HTML_CSP,
      "strict-transport-security": "max-age=31536000; includeSubDomains",
    },
  });
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
        h.set("x-frame-options", "DENY");
        h.set("referrer-policy", "no-referrer");
        h.set("strict-transport-security", "max-age=31536000; includeSubDomains");
        const ctype = h.get("content-type") || "";
        if (ctype.includes("text/html") && !h.has("content-security-policy")) {
          h.set(
            "content-security-policy",
            HTML_CSP,
          );
        }
        return new Response(res.body, { status: 200, headers: h });
      }
    }
  }

  if (wantsHtml(request) || method === "GET" || method === "HEAD") {
    return html(notFoundHtml(), 404, "no-store");
  }
  return applyCors(err("NOT_FOUND", path, 404), request, env);
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
    const cors = (res: Response) => applyCors(res, request, env);
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (
      url.hostname === "www.noema.guru" &&
      request.method === "GET" &&
      wantsHtml(request)
    ) {
      url.hostname = "noema.guru";
      return Response.redirect(url.toString(), 308);
    }

    try {
      // Product entry (Specs EXPERIENCE): landing + manifesto + PLAY / WATCH / STUDY / CONNECT
      if (
        request.method === "GET" &&
        (path === "/" || path === "/index.html" || path === "/memo" || path === "/memo.html")
      ) {
        return html(landingHtml(), 200, "public, max-age=30");
      }
      if (request.method === "GET" && path === "/manifesto") {
        return html(manifestoHtml(), 200, "public, max-age=30");
      }
      if ((request.method === "GET" || request.method === "HEAD") && path === "/play") {
        const dest = new URL("/connect", url);
        dest.search = url.search;
        return Response.redirect(dest.toString(), 308);
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
        return html(connectHtml(env.NOEMA_ENV === "production"));
      }
      if (request.method === "GET" && path === "/connect/enroll") {
        return html(enrollHtml());
      }
      if (request.method === "GET" && path === "/.well-known/noema-agent.json") {
        return cors(json(discoveryDocument(bootstrapHttpsOrigin(env, request)), 200));
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
        // Typed play_blocked even when the DO is unreachable. PLAY reads this
        // field; a 500 INTERNAL would skip the fail-closed banner.
        const blocked = (world: unknown = {}) => {
          const pr = playReady("NOT_ACTIVE", "HEALTHY");
          return cors(
            json({
              ready: false,
              play_blocked: true,
              code: "WORLD_NOT_READY",
              status: pr.status,
              settlement_health: pr.settlement_health,
              world,
            }),
          );
        };
        try {
          const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
          const stub = env.WORLD_DO.get(id);
          const h = await stub.fetch("https://do/health");
          const body = (await h.json().catch(() => ({}))) as {
            ok?: boolean;
            status?: string;
            settlement_health?: string;
            playable?: boolean;
          };
          if (!h.ok) return blocked(body);
          const pr = playReady(body.status, body.settlement_health, body.playable !== false);
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
        } catch {
          return blocked({ ok: false });
        }
      }

      // Public WATCH projection (no auth — spectator)
      if (request.method === "GET" && (path === "/v1/watch/live" || path === "/watch/live")) {
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/watch");
        const body = await res.json();
        return cors(json(body, res.status));
      }
      if (path === "/v1/watch/stream" || path === "/watch/stream") {
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        return stub.fetch(new Request("https://do/watch-stream", request));
      }

      // ——— ADMIN API (operator token → admin-access JWT; never player tokens) ———
      if (request.method === "POST" && path === "/v1/admin/session") {
        const body = (await request.json().catch(() => ({}))) as { admin_token?: string };
        if (!body.admin_token) return cors(err("INVALID_REQUEST", "admin_token required", 400));
        if (
          !(await allowThrottled(
            adminSessionThrottle,
            env,
            `admin-session-ip:${clientIp(request)}`,
            ADMIN_SESSION_LIMIT,
            ADMIN_SESSION_WINDOW_MS,
          ))
        ) {
          return cors(err("RATE_LIMITED", "too many admin session requests", 429, true));
        }
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
        const body = (await request.json().catch(() => ({}))) as { email?: string; next?: string };
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

      if (request.method === "POST" && path === "/v1/auth/device") {
        if (!(await allowThrottled(deviceThrottle, env, `ip:${clientIp(request)}`, 20, 3_600_000))) {
          return cors(err("RATE_LIMITED", "too many device enrollments", 429, true));
        }
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
      if (request.method === "POST" && path === "/v1/auth/controller/revoke") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const agent = requireAgentPlayer(principal);
        if (agent instanceof Response) return cors(agent);
        const body = (await request.json().catch(() => ({}))) as { controller_id?: string };
        const controller_id = String(body.controller_id || agent.controller_id);
        if (controller_id !== agent.controller_id) {
          return cors(err("NOT_AUTHORIZED", "cannot revoke another Controller", 403));
        }
        const store = durableRevocationStore(env);
        const now = new Date().toISOString();
        await store.put({
          kind: "controller",
          id: controller_id,
          controller_id,
          revoked_at: now,
          revoked_by: agent.controller_id,
        });
        if (agent.jti) {
          await store.put({
            kind: "jti",
            id: agent.jti,
            controller_id,
            revoked_at: now,
            revoked_by: agent.controller_id,
          });
        }
        return cors(json({ revoked: true, controller_id }));
      }
      if (request.method === "POST" && path === "/v1/auth/controller/rotate") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const agent = requireAgentPlayer(principal);
        if (agent instanceof Response) return cors(agent);
        const store = durableRevocationStore(env);
        if (await isControllerRevoked(store, agent.controller_id, agent.jti)) {
          return cors(err("NOT_AUTHORIZED", "controller revoked", 401));
        }
        if (agent.jti) {
          await store.put({
            kind: "jti",
            id: agent.jti,
            controller_id: agent.controller_id,
            revoked_at: new Date().toISOString(),
            revoked_by: agent.controller_id,
          });
        }
        const handle = agent.player_id.replace(/^player\./, "").slice(0, 32) || "player";
        const minted = await mintControllerToken(env, {
          handle,
          controllerType: "agent",
          playerId: agent.player_id,
          controllerId: agent.controller_id,
          amr: "rotate",
        });
        return cors(json({ ...minted, rotated: true }));
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
        if (body.controller_type === "human" || body.controller_type === "hybrid") {
          return cors(err("NOT_AUTHORIZED", "live Controller issuance is agent-only", 403));
        }
        const minted = await mintControllerToken(env, {
          handle,
          controllerType: "agent",
          expiresIn: body.expires_in,
          issuedByAdmin: true,
          operatorId: admin.operator_id,
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

      if (request.method === "POST" && path === "/v1/admin/agent/enroll") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as { email?: string; handle?: string };
        return cors(
          await requestAgentEnrollment(env, request, body, {
            store: durableEnrollmentStore(env),
            operatorId: admin.operator_id,
          }),
        );
      }
      if (request.method === "GET" && path === "/v1/agent/enroll/preview") {
        return cors(await previewAgentEnrollment(env, request, { store: durableEnrollmentStore(env) }));
      }
      if (request.method === "POST" && path === "/v1/admin/agent/enroll/decide") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as {
          enrollment_id?: string;
          token?: string;
          decision?: string;
        };
        return cors(
          await decideAgentEnrollment(env, request, body, {
            store: durableEnrollmentStore(env),
            operatorId: admin.operator_id,
          }),
        );
      }
      if (request.method === "GET" && path.startsWith("/v1/agent/bootstrap/")) {
        const enrollmentId = path.slice("/v1/agent/bootstrap/".length);
        return cors(await getBootstrapDocument(env, request, enrollmentId, { store: durableEnrollmentStore(env) }));
      }

      if (request.method === "GET" && path === "/v1/admin/watch") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const id = env.WORLD_DO.idFromName(env.DEFAULT_WORLD_ID || "world-01");
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch(
          `https://do/admin-watch?operator_id=${encodeURIComponent(admin.operator_id)}`,
        );
        const body = await res.json();
        return cors(json(body, res.status));
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
        const worldId = String(world.world_id || env.DEFAULT_WORLD_ID || "world-01");
        const head = await getWorldHead(env, worldId);
        const canonical_head = summarizeCanonicalHead(head, {
          sequence: typeof world.sequence === "number" ? world.sequence : undefined,
          cycle: typeof world.cycle === "number" ? world.cycle : undefined,
          revision: typeof meta.revision === "number" ? meta.revision : null,
        });
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
            canonical_head,
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

      if (request.method === "GET" && path === "/v1/admin/providers") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        return cors(json(await providerOverview(env)));
      }

      if (request.method === "POST" && path === "/v1/admin/providers/verify") {
        const admin = await resolveAdmin(request, env);
        if (admin instanceof Response) return cors(admin);
        const body = (await request.json().catch(() => ({}))) as { provider?: string };
        if (body.provider === "supabase") return cors(json(await verifySupabase(env)));
        if (body.provider === "resend") return cors(json(await verifyResend(env)));
        return cors(err("INVALID_REQUEST", "provider must be supabase or resend", 400));
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

      // Explicit local/test/dev only: mint controller token for human or agent demos.
      // Missing, preview, and production modes fail closed.
      if (request.method === "POST" && path === "/v1/auth/dev-token") {
        const envName = (env.NOEMA_ENV || "").toLowerCase();
        if (!new Set(["local", "test", "dev"]).has(envName)) {
          return cors(err("NOT_AUTHORIZED", "dev-token disabled outside explicit local development", 403));
        }
        const body = (await request.json().catch(() => ({}))) as {
          handle?: string;
          controller_type?: "human" | "agent";
        };
        const handle = (body.handle || "demo").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "demo";
        if (body.controller_type === "human") {
          return cors(err("NOT_AUTHORIZED", "dev-token inhabit mint is agent-only", 403));
        }
        const minted = await mintDevControllerToken(env, handle, "agent");
        return cors(json({ ...minted, token_type: "bearer" }));
      }

      // Who am I
      if (request.method === "GET" && path === "/v1/me") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        return cors(json({ principal }));
      }

      // Command path (HTTP). Agents inhabit. Humans watch.
      if (request.method === "POST" && (path === "/v1/command" || path === "/protocol/v1/command")) {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const throttleKey = "player_id" in principal && principal.player_id
          ? `player:${principal.player_id}`
          : `human:${"identity_id" in principal ? principal.identity_id : "anon"}`;
        if (!(await allowThrottled(commandThrottle, env, throttleKey, 120, 60_000))) {
          return cors(err("RATE_LIMITED", "too many commands", 429, true));
        }

        const envelope = (await request.json()) as CommandEnvelope;
        const doRes = await applyPlayerCommand(env, request, principal, envelope, routeToWorld);
        const data = await doRes.json();
        return cors(json(data, doRes.status));
      }

      // Isolated hosted canonical verification. Not a PLAY command path.
      if (request.method === "POST" && path === "/v1/operator/test-world/command") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const agent = requireAgentPlayer(principal);
        if (agent instanceof Response) return cors(agent);
        const admin = await resolveSignedAdminHeader(request, env);
        if (admin instanceof Response) return cors(admin);
        const denied = requireScope(agent, "noema.action.submit");
        if (denied) return cors(denied);

        const body = (await request.json().catch(() => ({}))) as CommandEnvelope & { world_id?: string };
        const admitted = admitTestWorldId(body.world_id, env.DEFAULT_WORLD_ID);
        if (!admitted.ok) return cors(err(admitted.code, admitted.message, 403));
        if (!body.command || !body.request_id) {
          return cors(err("INVALID_REQUEST", "command and request_id required", 400));
        }
        if (hasPrivateCognition(body)) {
          return cors(err("INVALID_REQUEST", "private cognition fields are not accepted", 400));
        }

        const envelope: CommandEnvelope = {
          request_id: body.request_id,
          command: body.command,
          arguments: body.arguments,
          idempotency_key: body.idempotency_key,
          player_id: body.player_id,
        };
        const doRes = await routeToWorld(env, admitted.world_id, agent, envelope, { allow_bootstrap: true });
        const data = await doRes.json();
        return cors(json(data, doRes.status));
      }

      // Isolated recover/pause for test.hosted-canonical.* only.
      // Never use /v1/admin/lifecycle here — that path is DEFAULT_WORLD_ID (Perihelion).
      if (request.method === "POST" && path === "/v1/operator/test-world/lifecycle") {
        const principal = await resolvePrincipal(request, env);
        if (principal instanceof Response) return cors(principal);
        const agent = requireAgentPlayer(principal);
        if (agent instanceof Response) return cors(agent);
        const admin = await resolveSignedAdminHeader(request, env);
        if (admin instanceof Response) return cors(admin);
        const denied = requireScope(agent, "noema.action.submit");
        if (denied) return cors(denied);

        const body = (await request.json().catch(() => ({}))) as { world_id?: string; action?: string; reason?: string };
        const admitted = admitTestWorldId(body.world_id, env.DEFAULT_WORLD_ID);
        if (!admitted.ok) return cors(err(admitted.code, admitted.message, 403));
        const action = String(body.action || "").toLowerCase();
        if (action !== "recover") {
          return cors(err("INVALID_REQUEST", "action must be recover", 400));
        }
        const id = env.WORLD_DO.idFromName(admitted.world_id);
        const stub = env.WORLD_DO.get(id);
        const res = await stub.fetch("https://do/admin-lifecycle", {
          method: "POST",
          headers: { "content-type": "application/json", "x-noema-world-id": admitted.world_id },
          body: JSON.stringify({
            action: "recover",
            reason: body.reason || "isolated test-world recover",
            admin_session_id: admin.session_id,
            world_id: admitted.world_id,
          }),
        });
        const payload = (await res.json()) as Record<string, unknown>;
        return cors(json({ ...payload, world_id: admitted.world_id }, res.status));
      }

      // Minimal agent-protocol-shaped AUTH for adapters
      if (request.method === "POST" && path === "/protocol/v1") {
        const body = (await request.json()) as {
          type?: string;
          request_id?: string;
          body?: { access_token?: string; token?: string };
        };
        if (body.type === "HELLO") {
          const hello = protocolHello(body as { type?: string; request_id?: string; body?: Record<string, unknown> }, env);
          const status = hello.type === "ERROR" ? 400 : 200;
          return cors(json(hello, status));
        }
        if (body.type === "AUTH") {
          const token = body.body?.access_token || body.body?.token;
          if (!token) return cors(err("NOT_AUTHORIZED", "access_token required"));
          const fake = new Request(request.url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const principal = await resolvePrincipal(fake, env);
          if (principal instanceof Response) return cors(principal);
          const agent = requireAgentPlayer(principal);
          if (agent instanceof Response) return cors(agent);
          const sealed = checkLiveAgentSeal({
            controllerType: agent.controller_type,
            worldKind: "default",
            presented: parseSeal((body.body as { prompt_version_hash?: string } | undefined)?.prompt_version_hash),
          });
          if (!sealed.ok) return cors(err(sealed.code, sealed.message, 401));
          return cors(
            json({
              protocol: "agent-protocol/v1",
              type: "AUTH_ACK",
              request_id: body.request_id,
              agent_id: agent.agent_id,
              body: {
                session_id: agent.session_id,
                player_id: agent.player_id,
                controller_id: agent.controller_id,
                agent_id: agent.agent_id,
                scopes: agent.scopes,
              },
            }),
          );
        }
        return cors(err("INVALID_REQUEST", "use POST /v1/command or GET /protocol/v1/ws for ACT after AUTH", 400));
      }

      if (path === "/protocol/v1/ws") {
        return acceptProtocolWebSocket(request, env, routeToWorld);
      }

      // Static assets (/assets/*, 404). Product home aliases are landingHtml().
      if (request.method === "GET" || request.method === "HEAD") {
        return serveStatic(request, env, path);
      }

      return cors(err("NOT_FOUND", path, 404));
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      return cors(json({ error: { code: "INTERNAL", message: "internal error" } }, 500));
    }
  },
} satisfies ExportedHandler<Env>;
