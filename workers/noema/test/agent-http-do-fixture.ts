/** Local platform fixture shared by P2.3 transport tests. No network dispatch. */
import { mintControllerToken } from "../src/auth";
import worker from "../src/index";
import { ACCEPTED_SEALS } from "../src/seal";
import type { Env } from "../src/types";
import { NoemaWorldDO } from "../src/world-do";
import type { WorldRuntime } from "../src/world-actions";

export const WORLD = "test.hosted-canonical.transport-boundary";
export const ORIGIN = "https://noema.invalid";
export const SIGNING = "local-fixture-only-transport-signing";

export function fixtureWorld(): WorldRuntime {
  return {
    world_id: WORLD, world_name: "Transport fixture", cycle: 0, sequence: 0,
    entry_room_id: "room.a",
    rooms: {
      "room.a": { room_id: "room.a", name: "Arrival", description: "A public arrival room.",
        exits: [{ direction: "east", to_room_id: "room.b" }],
        entities: [{ entity_id: "entity.box", label: "Box", entity_type: "SITE", condition: 40 }] },
      "room.b": { room_id: "room.b", name: "East", description: "A public eastern room.",
        exits: [{ direction: "west", to_room_id: "room.a" }], entities: [] },
      "room.hidden": { room_id: "room.hidden", name: "PRIVATE_ROOM_SENTINEL", description: "Hidden.",
        exits: [], entities: [], hidden: true, tags: ["hidden"] },
    },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
}

export function harness(initialWorld: WorldRuntime = fixtureWorld()) {
  const calls: Array<{ name: string; path: string }> = [];
  const instances = new Map<string, NoemaWorldDO>();
  const stores = new Map<string, DurableObjectState>();
  // Deliberately partial Cloudflare platform fakes. All application handlers are real.
  const env = {
    NOEMA_ENV: "production", NOEMA_PROTOCOL_VERSION: "1", DEFAULT_WORLD_ID: WORLD,
    TOKEN_SIGNING_SECRET: SIGNING,
    WORLD_DO: {
      idFromName: (name: string) => ({ name }),
      get: ({ name }: { name: string }) => ({
        async fetch(input: string | Request, init?: RequestInit) {
          const request = input instanceof Request ? input : new Request(input, init);
          calls.push({ name, path: new URL(request.url).pathname });
          let instance = instances.get(name);
          if (!instance) {
            let state = stores.get(name);
            if (!state) {
              const bag = new Map<string, unknown>(name === WORLD ? [
                ["world", structuredClone(initialWorld)],
                ["world_meta", { status: "ACTIVE", genesis_id: "genesis.test.transport", config_frozen: true,
                  settlement_health: "HEALTHY" }],
              ] : []);
              state = { storage: {
                async get(key: string) { return structuredClone(bag.get(key)); },
                async put(key: string | Record<string, unknown>, value?: unknown) {
                  if (typeof key === "string") bag.set(key, structuredClone(value));
                  else for (const [k, v] of Object.entries(key)) bag.set(k, structuredClone(v));
                },
              } } as unknown as DurableObjectState;
              stores.set(name, state);
            }
            instance = new NoemaWorldDO(state, env);
            instances.set(name, instance);
          }
          return instance.fetch(request);
        },
      }),
    },
  } as unknown as Env;
  async function hit(path: string, body?: Record<string, unknown>, token?: string, seal = ACCEPTED_SEALS[0]) {
    const headers = new Headers({ "content-type": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (seal) headers.set("X-Noema-Seal", seal);
    return worker.fetch(new Request(`${ORIGIN}${path}`, {
      method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined,
    }), env);
  }
  let requestId = 0;
  const command = (token: string, command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
    hit("/v1/command", { request_id: `http.${++requestId}`, command, arguments: args, ...extra }, token);
  const agent = () => mintControllerToken(env, { handle: "Boundary", controllerType: "agent", playerId: "player.boundary" });
  return { env, calls, hit, command, agent, restart: () => instances.clear(),
    persistedWorld: async () => structuredClone(await stores.get(WORLD)?.storage.get<WorldRuntime>("world")) };
}
