import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import worker from "../src/index";
import { ACCEPTED_SEALS } from "../src/seal";
import type { Env, PlayerPrincipal } from "../src/types";
import { NoemaWorldDO } from "../src/world-do";

function memoryState(initial: Record<string, unknown> = {}): DurableObjectState {
  const bag = new Map<string, unknown>(Object.entries(initial));
  return {
    storage: {
      async get(key: string) {
        return bag.get(key);
      },
      async put(keyOrEntries: string | Record<string, unknown>, value?: unknown) {
        if (typeof keyOrEntries === "string") bag.set(keyOrEntries, value);
        else for (const [k, v] of Object.entries(keyOrEntries)) bag.set(k, v);
      },
    },
  } as unknown as DurableObjectState;
}

function perihelionStored() {
  return {
    world_id: "world.perihelion-reach",
    world_name: "Perihelion Reach",
    cycle: 139,
    sequence: 1002,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.transit-ring" }],
        entities: [{ entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE" }],
      },
      "room.transit-ring": {
        room_id: "room.transit-ring",
        name: "Coldline",
        description: "A ring corridor.",
        exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

describe("NoemaWorldDO command ENTER/LOOK after successor wiring", () => {
  it("ENTER then LOOK on stored Perihelion does not 500", async () => {
    const env = {
      TOKEN_SIGNING_SECRET: "test-signing-secret-enter-do",
      NOEMA_ENV: "production",
      NOEMA_PROTOCOL_VERSION: "1",
      DEFAULT_WORLD_ID: "world-01",
    } as Env;
    const doInst = new NoemaWorldDO(
      memoryState({
        world: perihelionStored(),
        world_meta: {
          status: "ACTIVE",
          genesis_id: "genesis.ef578f4ffceeccd0",
          config_frozen: true,
          settlement_health: "HEALTHY",
        },
      }),
      env,
    );
    const minted = await mintControllerToken(env, {
      handle: "maintc2",
      controllerType: "agent",
      playerId: "player.maintc2",
    });
    const principal: PlayerPrincipal = {
      player_id: minted.player_id,
      agent_id: `agent.${minted.player_id.replace(/^player\./, "")}`,
      session_id: "sess.enter-do",
      controller_id: minted.controller_id,
      controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "test",
    };
    const enter = await doInst.fetch(
      new Request("https://do/command", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world-01" },
        body: JSON.stringify({
          principal,
          envelope: { request_id: "e1", command: "ENTER_WORLD", arguments: {} },
          world_id: "world-01",
        }),
      }),
    );
    expect(enter.status).toBe(200);
    const enterBody = (await enter.json()) as { ok?: boolean; error?: { code?: string } };
    expect(enterBody.error?.code).not.toBe("INTERNAL");
    expect(enterBody.ok).toBe(true);

    const look = await doInst.fetch(
      new Request("https://do/command", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world-01" },
        body: JSON.stringify({
          principal,
          envelope: { request_id: "l1", command: "LOOK", arguments: {} },
          world_id: "world-01",
        }),
      }),
    );
    expect(look.status).toBe(200);
    const lookBody = (await look.json()) as { ok?: boolean; error?: { code?: string } };
    expect(lookBody.error?.code).not.toBe("INTERNAL");
    expect(lookBody.ok).toBe(true);
  });

  it("PLAY reloads stored world after a successor health bind on the same isolate", async () => {
    const env = {
      TOKEN_SIGNING_SECRET: "test-signing-secret-enter-do",
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world-01",
    } as Env;
    const doInst = new NoemaWorldDO(memoryState(), env);
    const health = await doInst.fetch(
      new Request("https://do/health", { headers: { "x-noema-world-id": "world.perihelion-reach-2" } }),
    );
    expect(health.status).toBe(200);
    expect(((await health.json()) as { world_id: string }).world_id).toBe("world.perihelion-reach-2");

    const minted = await mintControllerToken(env, { handle: "maintc2b", controllerType: "agent", playerId: "player.maintc2b" });
    const principal: PlayerPrincipal = {
      player_id: minted.player_id,
      agent_id: "agent.maintc2b",
      session_id: "sess.enter-do2",
      controller_id: minted.controller_id,
      controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "test",
    };
    const enter = await doInst.fetch(
      new Request("https://do/command", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world-01" },
        body: JSON.stringify({
          principal,
          envelope: { request_id: "e2", command: "ENTER_WORLD", arguments: {} },
          world_id: "world-01",
        }),
      }),
    );
    expect(enter.status).toBe(200);
    const enterBody = (await enter.json()) as { ok?: boolean; error?: { code?: string }; observation?: { world_name?: string } };
    expect(enterBody.error?.code).not.toBe("INTERNAL");
    expect(enterBody.ok).toBe(true);

    const after = await doInst.fetch(new Request("https://do/health"));
    const afterBody = (await after.json()) as { world_id: string };
    expect(afterBody.world_id).toBe("world-01");
  });

  it("ENTER survives SQLITE_TOOBIG by dropping disposable fuel actors", async () => {
    const env = {
      TOKEN_SIGNING_SECRET: "test-signing-secret-enter-do",
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world-01",
    } as Env;
    const stored = perihelionStored() as ReturnType<typeof perihelionStored> & {
      players: Record<string, { handle: string; entered: boolean; actor_kind: string; room_id: string }>;
    };
    stored.players = {
      "player.fuel1": { handle: "fuel1", entered: true, actor_kind: "system", room_id: "room.relay-quarter" },
      "player.fuel2": { handle: "fuel2", entered: true, actor_kind: "system", room_id: "room.relay-quarter" },
      "player.reach-maint3": { handle: "reach-maint3", entered: true, actor_kind: "system", room_id: "room.relay-quarter" },
    };
    let puts = 0;
    const bag = new Map<string, unknown>([
      ["world", stored],
      ["world_meta", { status: "ACTIVE", genesis_id: "genesis.ef578f4ffceeccd0", config_frozen: true, settlement_health: "HEALTHY" }],
    ]);
    const state = {
      storage: {
        async get(key: string) {
          return bag.get(key);
        },
        async put(keyOrEntries: string | Record<string, unknown>, value?: unknown) {
          const write = (k: string, v: unknown) => bag.set(k, v);
          if (typeof keyOrEntries === "string") {
            if (keyOrEntries === "world") {
              puts += 1;
              if (puts === 1) throw new Error("string or blob too big: SQLITE_TOOBIG");
            }
            write(keyOrEntries, value);
            return;
          }
          for (const [k, v] of Object.entries(keyOrEntries)) {
            if (k === "world") {
              puts += 1;
              if (puts === 1) throw new Error("string or blob too big: SQLITE_TOOBIG");
            }
            write(k, v);
          }
        },
      },
    } as unknown as DurableObjectState;
    const doInst = new NoemaWorldDO(state, env);
    const minted = await mintControllerToken(env, { handle: "reach-maint3", controllerType: "agent", playerId: "player.reach-maint3" });
    const principal: PlayerPrincipal = {
      player_id: minted.player_id,
      agent_id: "agent.reach-maint3",
      session_id: "sess.toobig",
      controller_id: minted.controller_id,
      controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "test",
    };
    const enter = await doInst.fetch(
      new Request("https://do/command", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world-01" },
        body: JSON.stringify({
          principal,
          envelope: { request_id: "tb1", command: "ENTER_WORLD", arguments: {} },
          world_id: "world-01",
        }),
      }),
    );
    const body = (await enter.json()) as { ok?: boolean; error?: { code?: string } };
    expect(enter.status, JSON.stringify(body)).toBe(200);
    expect(body.error?.code).not.toBe("COMMAND_FAILED");
    expect(body.ok).toBe(true);
    const saved = bag.get("world") as { players: Record<string, { handle: string }> };
    expect(saved.players["player.fuel1"]).toBeUndefined();
    expect(saved.players["player.reach-maint3"]).toBeTruthy();
  });

  it("ENTER survives SQLITE_TOOBIG by compacting messages, idempotency, and trades", async () => {
    const env = {
      TOKEN_SIGNING_SECRET: "test-signing-secret-enter-do",
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world-01",
    } as Env;
    const fat = "x".repeat(400);
    const stored = perihelionStored() as ReturnType<typeof perihelionStored> & {
      players: Record<string, { handle: string; entered: boolean; actor_kind: string; room_id: string }>;
      messages: Array<{ id: string; body: string }>;
      seen_idempotency: Record<string, { ok: boolean; observation: { available_here: string[] } }>;
      trades: Record<string, { status: string; note: string }>;
    };
    stored.players = {
      "player.fuel1": { handle: "fuel1", entered: true, actor_kind: "system", room_id: "room.relay-quarter" },
      "player.reach-maint3": { handle: "reach-maint3", entered: true, actor_kind: "system", room_id: "room.relay-quarter" },
    };
    Object.assign(stored, { messages: Array.from({ length: 60 }, (_, i) => ({ id: `m${i}`, body: fat })) });
    stored.seen_idempotency = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `player.fuel1::k${i}`,
        { ok: true, observation: { available_here: Array.from({ length: 40 }, () => fat) } },
      ]),
    );
    stored.trades = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`trade.${i}`, { status: "OPEN", note: fat }]),
    );
    const MAX = 20_000;
    const bag = new Map<string, unknown>([
      ["world", stored],
      ["world_meta", { status: "ACTIVE", genesis_id: "genesis.ef578f4ffceeccd0", config_frozen: true, settlement_health: "HEALTHY" }],
    ]);
    const state = {
      storage: {
        async get(key: string) {
          return bag.get(key);
        },
        async put(keyOrEntries: string | Record<string, unknown>, value?: unknown) {
          const write = (k: string, v: unknown) => {
            if (k === "world") {
              const n = JSON.stringify(v).length;
              if (n > MAX) throw new Error("string or blob too big: SQLITE_TOOBIG");
            }
            bag.set(k, v);
          };
          if (typeof keyOrEntries === "string") write(keyOrEntries, value);
          else for (const [k, v] of Object.entries(keyOrEntries)) write(k, v);
        },
      },
    } as unknown as DurableObjectState;
    expect(JSON.stringify(stored).length).toBeGreaterThan(MAX);
    const doInst = new NoemaWorldDO(state, env);
    const minted = await mintControllerToken(env, { handle: "reach-maint3", controllerType: "agent", playerId: "player.reach-maint3" });
    const principal: PlayerPrincipal = {
      player_id: minted.player_id,
      agent_id: "agent.reach-maint3",
      session_id: "sess.toobig-fat",
      controller_id: minted.controller_id,
      controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "test",
    };
    const enter = await doInst.fetch(
      new Request("https://do/command", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world-01" },
        body: JSON.stringify({
          principal,
          envelope: { request_id: "tb-fat", command: "ENTER_WORLD", arguments: {} },
          world_id: "world-01",
        }),
      }),
    );
    const body = (await enter.json()) as { ok?: boolean; error?: { code?: string; message?: string } };
    expect(enter.status, JSON.stringify(body)).toBe(200);
    expect(body.error?.code).not.toBe("COMMAND_FAILED");
    expect(body.ok).toBe(true);
    const saved = bag.get("world") as {
      players: Record<string, { handle: string }>;
      messages: unknown[];
      seen_idempotency: Record<string, unknown>;
      trades: Record<string, unknown>;
    };
    expect(saved.players["player.fuel1"]).toBeUndefined();
    expect(saved.players["player.reach-maint3"]).toBeTruthy();
    expect(saved.messages.length).toBeLessThanOrEqual(20);
    expect(Object.keys(saved.seen_idempotency).length).toBeLessThanOrEqual(2);
    expect(Object.keys(saved.trades).length).toBe(0);
  });

  it("worker /v1/command ENTER through real DO does not 500", async () => {
    const envBase = {
      TOKEN_SIGNING_SECRET: "test-signing-secret-enter-do",
      NOEMA_ENV: "production",
      NOEMA_PROTOCOL_VERSION: "1",
      DEFAULT_WORLD_ID: "world-01",
    } as Env;
    const doInst = new NoemaWorldDO(
      memoryState({
        world: perihelionStored(),
        world_meta: { status: "ACTIVE", genesis_id: "genesis.ef578f4ffceeccd0", config_frozen: true, settlement_health: "HEALTHY" },
      }),
      envBase,
    );
    const env = {
      ...envBase,
      WORLD_DO: {
        idFromName: (name: string) => ({ name }),
        get: () => ({
          fetch: (url: string, init?: RequestInit) => doInst.fetch(new Request(String(url), init)),
        }),
      },
    } as unknown as Env;
    const minted = await mintControllerToken(env, { handle: "maintc2c", controllerType: "agent", playerId: "player.maintc2c" });
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/command", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${minted.access_token}`,
          "X-Noema-Seal": ACCEPTED_SEALS[0] || "",
        },
        body: JSON.stringify({ request_id: "w1", command: "ENTER_WORLD", arguments: {} }),
      }),
      env,
    );
    const body = (await res.json()) as { ok?: boolean; error?: { code?: string; message?: string } };
    expect(res.status, JSON.stringify(body)).not.toBe(500);
    expect(body.error?.code).not.toBe("INTERNAL");
    expect(body.ok).toBe(true);
  });
});
