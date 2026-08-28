import { mintAdminSession } from "../../src/admin-auth";
import { mintControllerToken } from "../../src/auth";
import worker from "../../src/index";
import { ENROLLMENT_DO_NAME } from "../../src/enrollment";
import { RATE_LIMIT_DO_NAME } from "../../src/rate-limit";
import { ACCEPTED_SEALS } from "../../src/seal";
import type { Env, CommandEnvelope } from "../../src/types";

export const SIGNING = "test-signing-secret-hosted-conformance";
export const OPERATOR = "operator-token-value-ok";

export type DoCall = { op: string; name?: string; url?: string; body?: Record<string, unknown> | null };

export function worldDoCalls(calls: DoCall[]): DoCall[] {
  return calls.filter((c) => c.name !== RATE_LIMIT_DO_NAME && c.name !== ENROLLMENT_DO_NAME);
}

export function mockWorldDo(calls: DoCall[], watchBody?: Record<string, unknown>, deadPlayers: Set<string> = new Set()) {
  const devices = new Map<string, Record<string, unknown>>();
  const revocations = new Map<string, Record<string, unknown>>();
  const players = new Map<string, Record<string, unknown>>(); // simulated world.players
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
          if (path.includes("/revoke")) {
            const parsed = new URL(path, "https://do.local");
            if (method === "PUT" && init?.body) {
              const rec = JSON.parse(String(init.body)) as { kind?: string; id?: string };
              if (rec.kind && rec.id) revocations.set(`${rec.kind}:${rec.id}`, rec as Record<string, unknown>);
              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
              });
            }
            const rec = revocations.get(`${parsed.searchParams.get("kind")}:${parsed.searchParams.get("id")}`);
            if (!rec) return new Response("{}", { status: 404 });
            return new Response(JSON.stringify(rec), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
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
                    if (path.includes("/command")) {
                      // Parse the body to get the envelope and principal
                      let body: any = {};
                      if (init?.body) {
                        try {
                          body = JSON.parse(String(init.body));
                        } catch {
                          body = {};
                        }
                      }
                      const principal = body.principal || {};
                      const playerId = principal.player_id || "";
                      const envelope = body.envelope as CommandEnvelope;
                      const command = envelope?.command || "LOOK";

                      const isExplicitDead = deadPlayers.has(playerId);
                      const isMissingMarker = playerId.includes(":missing");
                      // For missing player test: if ID not in known players and marked missing, reject
                      const isMissing = isMissingMarker || (!players.has(playerId) && deadPlayers.has(`${playerId}:missing`));
                      if (isExplicitDead || isMissingMarker || isMissing) {
                        return new Response(JSON.stringify({
                          ok: false,
                          request_id: envelope?.request_id || "unknown",
                          error: { code: "PLAYER_DEAD", message: "Player is dead, retired, or suspended and cannot perform inhabiting actions." }
                        }), {
                          status: 403,
                          headers: { "content-type": "application/json" },
                        });
                      }
                      // Ledger flesh-out: for non-dead, simulate active player record status (P1/P2 + lifecycle)
                      if (path === "/command" && envelope?.command) {
                        const playerId = String(principal.player_id || "");
                        if (playerId && !deadPlayers.has(playerId)) {
                          // Ensure players map has a live record (for future status queries)
                          if (!players.has(playerId)) {
                            players.set(playerId, { status: "active", actor_kind: "agent" });
                          } else {
                            const rec = players.get(playerId) || {};
                            rec.status = rec.status || "active";
                            players.set(playerId, rec);
                          }
                        }
                      }

                      // Simulate presence: record the player if not dead
                      if (playerId && !players.has(playerId)) {
                        players.set(playerId, { player_id: playerId, room_id: "room.entry", entered: true });
                      }

                      // P7/P8 observation contract stub for live agent
                      // Structured Affordance objects (P8: no human MUD parser strings)
                      const obs = {
                        cycle: 1,
                        sequence: 1,
                        player_id: playerId || "player.test",
                        in_world: true,
                        location: { room_id: "room.entry", name: "Entry" },
                        available_actions: [
                          { action: "LOOK", verb: "LOOK", label: "Look", target_id: null },
                          { action: "MOVE", verb: "MOVE", label: "Move North", target_id: "room.north" }
                        ],
                        status: { energy: 100 },
                      };
                      return new Response(JSON.stringify({ ok: true, world_id: id.name, command, observation: obs }), {
                        status: 200,
                        headers: { "content-type": "application/json" },
                      });
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
  deadPlayerIds: string[] = [],
): Env {
  const deadSet = new Set(deadPlayerIds);
  let world = worldByCalls.get(calls);
  if (!world) {
    world = mockWorldDo(calls, watchBody, deadSet);
    worldByCalls.set(calls, world);
  }
  return {
    TOKEN_SIGNING_SECRET: SIGNING,
    NOEMA_ENV: "test",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: defaultWorldId,
    ADMIN_OPERATOR_TOKEN: OPERATOR,
    WORLD_DO: world,
  } as unknown as Env;
}


export function envWithDeadPlayers(calls: DoCall[], deadPlayerIds: string[] = [], defaultWorldId = "world-01") {
  return env(calls, defaultWorldId, undefined, deadPlayerIds);
}

export async function playerToken(calls: DoCall[] = []) {
  const minted = await mintControllerToken(env(calls), { handle: "probe", controllerType: "agent" });
  return minted.access_token;
}

export async function humanToken(calls: DoCall[] = []) {
  const minted = await mintControllerToken(env(calls), { handle: "watcher", controllerType: "human" });
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
  deadPlayerIds: string[] = [],
) {
  const headers: Record<string, string> = { "content-type": "application/json", ...(init.headers || {}) };
  const liveSeal = ACCEPTED_SEALS[0];
  if (headers.Authorization && !headers["X-Noema-Seal"] && liveSeal) {
    headers["X-Noema-Seal"] = liveSeal;
  }
  const req = new Request(`https://noema.local${path}`, {
    method: init.method || "POST",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return worker.fetch(req, env(calls, defaultWorldId, watchBody, deadPlayerIds));
}

export async function hitWatchLive(
  calls: DoCall[],
  init: { method?: string } = {},
  watchBody?: Record<string, unknown>,
) {
  return hit("/v1/watch/live", { method: init.method || "GET" }, calls, undefined, watchBody);
}
