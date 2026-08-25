import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import worker from "../src/index";
import { WATCH_INFRA_PULSE } from "../src/pressure";
import { ACCEPTED_SEALS } from "../src/seal";
import type { Env } from "../src/types";
import { enrichEntity } from "../src/actions";
import { NoemaWorldDO } from "../src/world-do";
import type { WorldRuntime } from "../src/world-actions";

function memoryState(initial: Record<string, unknown> = {}) {
  const bag = new Map<string, unknown>(Object.entries(initial));
  const state = {
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
  return { state, bag };
}

function lcaWorld(): WorldRuntime {
  return {
    world_id: "test.lca1.acceptance",
    world_name: "LCA-1 Acceptance Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A public relay anchor under pressure.",
        exits: [{ direction: "east", to_room_id: "room.spoke" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.spoke": {
        room_id: "room.spoke",
        name: "East Spoke",
        description: "A public work corridor with a cache.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [
          enrichEntity({
            entity_id: "entity.storage-cell-cache",
            label: "storage-cell-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "materials",
            stock_amount: 8,
          }),
        ],
      },
      "room.hidden": {
        room_id: "room.hidden",
        name: "Hidden Vault",
        description: "Not public.",
        exits: [],
        entities: [{ entity_id: "entity.secret", label: "Secret", entity_type: "ARTIFACT" }],
        hidden: true,
        tags: ["hidden"],
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

type Token = Awaited<ReturnType<typeof mintControllerToken>>;

function envWith(doInst: NoemaWorldDO): Env {
  const base = {
    TOKEN_SIGNING_SECRET: "test-signing-secret-lca1",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "test.lca1.acceptance",
  } as Env;
  return {
    ...base,
    WORLD_DO: {
      idFromName: (name: string) => ({ name }),
      get: () => ({
        fetch: (url: string | Request, init?: RequestInit) =>
          doInst.fetch(url instanceof Request ? url : new Request(String(url), init)),
      }),
    },
  } as unknown as Env;
}

async function act(env: Env, token: Token, requestId: string, command: string, args: Record<string, unknown> = {}) {
  const res = await worker.fetch(
    new Request("https://noema.guru/v1/command", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token.access_token}`,
        "X-Noema-Seal": ACCEPTED_SEALS[0] || "",
      },
      body: JSON.stringify({ request_id: requestId, command, arguments: args }),
    }),
    env,
  );
  const body = (await res.json()) as {
    ok?: boolean;
    events?: Array<{ event_type: string }>;
    error?: { code?: string; message?: string };
    observation?: Record<string, unknown>;
  };
  expect(res.status, `${requestId}: ${JSON.stringify(body)}`).toBeLessThan(500);
  return { res, body };
}

async function watch(env: Env) {
  const res = await worker.fetch(new Request("https://noema.guru/v1/watch/live"), env);
  const body = (await res.json()) as Record<string, unknown>;
  expect(res.status, JSON.stringify(body)).toBe(200);
  return body;
}

describe("LCA-1 integrated existing-system acceptance", () => {
  it("spans admission, pressure, trade, construction, org authority, social memory, communication, WATCH, and restart recovery", async () => {
    const store = memoryState({
      world: lcaWorld(),
      world_meta: {
        status: "ACTIVE",
        genesis_id: "genesis.test.lca1",
        config_frozen: true,
        settlement_health: "HEALTHY",
      },
    });
    let doInst = new NoemaWorldDO(store.state, {} as Env);
    let env = envWith(doInst);
    const nacre = await mintControllerToken(env, {
      handle: "Nacre",
      controllerType: "agent",
      playerId: "player.nacre",
    });
    const vesper = await mintControllerToken(env, {
      handle: "Vesper",
      controllerType: "agent",
      playerId: "player.vesper",
    });
    const spectator = await mintControllerToken(env, {
      handle: "Watcher",
      controllerType: "human",
      playerId: "player.watcher",
    });

    const denied = await act(env, spectator, "lca1.human-command-denied", "ENTER_WORLD");
    expect(denied.res.status).toBe(403);
    expect(denied.body.error?.message).toMatch(/Humans watch/i);

    expect((await act(env, nacre, "lca1.enter.nacre", "ENTER_WORLD")).body.ok).toBe(true);
    for (let i = 1; i <= 4; i += 1) {
      expect((await act(env, nacre, `lca1.wait.${i}`, "WAIT")).body.ok).toBe(true);
    }
    let persisted = store.bag.get("world") as WorldRuntime;
    expect(persisted.cycle).toBe(4);
    expect(persisted.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-7")?.condition).toBe(55);
    expect(persisted.pressure?.schedule_activations).toBe(1);

    expect((await act(env, vesper, "lca1.enter.vesper", "ENTER_WORLD")).body.ok).toBe(true);
    expect((await act(env, nacre, "lca1.move.east", "MOVE", { direction: "east" })).body.ok).toBe(true);
    const harvested = await act(env, nacre, "lca1.harvest.materials", "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-cache",
      amount: 1,
    });
    expect(harvested.body.ok, JSON.stringify(harvested.body)).toBe(true);

    const proposed = await act(env, nacre, "lca1.trade.propose", "TRADE", {
      phase: "propose",
      counterparty_id: vesper.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(proposed.body.ok, JSON.stringify(proposed.body)).toBe(true);
    persisted = store.bag.get("world") as WorldRuntime;
    const tradeId = Object.keys(persisted.trades)[0];
    expect(tradeId).toBeTruthy();
    expect((await act(env, vesper, "lca1.trade.accept", "TRADE", { phase: "accept", trade_id: tradeId })).body.ok).toBe(true);

    expect((await act(env, nacre, "lca1.org.create", "ORG_CREATE", { name: "Compact", charter: "repair and trade" })).body.ok).toBe(true);
    persisted = store.bag.get("world") as WorldRuntime;
    const orgId = Object.keys(persisted.organizations)[0];
    expect(orgId).toBeTruthy();
    expect(
      (await act(env, nacre, "lca1.org.office", "ORG_OFFICE_CREATE", {
        org_id: orgId,
        display_name: "Works",
        authority_profile: "OPERATE_NAMED_ASSET",
      })).body.ok,
    ).toBe(true);
    expect(
      (await act(env, nacre, "lca1.org.member", "ORG_MEMBER_ADD", {
        org_id: orgId,
        agent_id: vesper.player_id,
        role: "member",
      })).body.ok,
    ).toBe(true);

    persisted = store.bag.get("world") as WorldRuntime;
    expect(persisted.players[nacre.player_id].budgets.storage).toBeGreaterThanOrEqual(4);

    const built = await act(env, nacre, "lca1.build.relay", "BUILD", { operation: "CONSTRUCT", class: "relay" });
    expect(built.body.ok, JSON.stringify(built.body)).toBe(true);
    expect(built.body.events?.map((e) => e.event_type)).toContain("ENTITY_CREATE");

    const msg = await act(env, nacre, "lca1.message", "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Repair compact formed.",
    });
    expect(msg.body.ok).toBe(true);
    expect(msg.body.events?.map((e) => e.event_type)).toContain("MESSAGE_DELIVERED");
    const vesperLook = await act(env, vesper, "lca1.look.vesper", "LOOK");
    expect(JSON.stringify(vesperLook.body.observation)).toContain("Repair compact formed.");
    expect(JSON.stringify(vesperLook.body.observation)).toContain("You have traded with Nacre");

    const live = await watch(env);
    expect(live.watch_live).toBe("watch-live/1.0");
    expect(live.players_present).toBe(2);
    expect(live.public_pulses).toEqual(expect.arrayContaining([WATCH_INFRA_PULSE]));
    expect(JSON.stringify(live)).toContain("An organization acted");
    expect(JSON.stringify(live)).toContain("Vesper settled a trade");
    expect(JSON.stringify(live)).not.toContain("Repair compact formed.");
    expect(JSON.stringify(live)).not.toContain("Hidden Vault");
    expect(JSON.stringify(live)).not.toContain("player.nacre");

    const beforeRestart = store.bag.get("world") as WorldRuntime;
    const durableSpine = {
      cycle: beforeRestart.cycle,
      sequence: beforeRestart.sequence,
      relayCondition: beforeRestart.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-7")?.condition,
      builtRelays: beforeRestart.rooms["room.spoke"].entities.filter((e) => e.infra_type === "relay").length,
      tradeStatuses: Object.values(beforeRestart.trades).map((t) => t.status),
      orgCount: Object.keys(beforeRestart.organizations).length,
      messageCount: beforeRestart.messages.length,
      pressureActivations: beforeRestart.pressure?.schedule_activations,
      nacreEntered: beforeRestart.players[nacre.player_id].entered,
      nacreRoomId: beforeRestart.players[nacre.player_id].room_id,
      nacreTradeMemory: beforeRestart.players[nacre.player_id].trade_memory,
      organization: beforeRestart.organizations[orgId],
    };

    doInst = new NoemaWorldDO(store.state, {} as Env);
    env = envWith(doInst);
    const recoveredReady = await worker.fetch(new Request("https://noema.guru/ready"), env);
    const readyBody = (await recoveredReady.json()) as {
      ready?: boolean;
      status?: string;
      settlement_health?: string;
      world?: { cycle?: number; sequence?: number; world_id?: string };
    };
    expect(recoveredReady.status).toBe(200);
    expect(readyBody).toMatchObject({
      ready: true,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      world: {
        cycle: durableSpine.cycle,
        sequence: durableSpine.sequence,
        world_id: "test.lca1.acceptance",
      },
    });
    const afterRestart = store.bag.get("world") as WorldRuntime;
    expect({
      cycle: afterRestart.cycle,
      sequence: afterRestart.sequence,
      relayCondition: afterRestart.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-7")?.condition,
      builtRelays: afterRestart.rooms["room.spoke"].entities.filter((e) => e.infra_type === "relay").length,
      tradeStatuses: Object.values(afterRestart.trades).map((t) => t.status),
      orgCount: Object.keys(afterRestart.organizations).length,
      messageCount: afterRestart.messages.length,
      pressureActivations: afterRestart.pressure?.schedule_activations,
      nacreEntered: afterRestart.players[nacre.player_id].entered,
      nacreRoomId: afterRestart.players[nacre.player_id].room_id,
      nacreTradeMemory: afterRestart.players[nacre.player_id].trade_memory,
      organization: afterRestart.organizations[orgId],
    }).toEqual(durableSpine);
    const recoveredWatch = await watch(env);
    expect(recoveredWatch.sequence).toBe(durableSpine.sequence);
    expect(recoveredWatch.players_present).toBe(2);
  });
});
