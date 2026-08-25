import { describe, expect, it, vi } from "vitest";
import { runIncidentRecover, type AdoptLiveHeadInput } from "../src/incident-recover";
import { NoemaWorldDO } from "../src/world-do";
import { miniChamberState } from "../src/mini-chamber";
import type { WorldHead } from "../src/settle";
import type { WorldRuntime } from "../src/world-actions";

function liveWorld(overrides: Partial<WorldRuntime> = {}): WorldRuntime {
  return {
    world_id: "world.perihelion-reach",
    world_name: "Perihelion Reach",
    cycle: 0,
    sequence: 92,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Relay Quarter",
        description: "Live.",
        exits: [],
        entities: [],
      },
    },
    players: {
      "player.a7a22752ad02": {
        room_id: "room.relay-quarter",
        entered: true,
        handle: "a7a22752ad02",
        last_seen_ms: 1,
        actor_kind: "live",
        budgets: { energy: 10, attention: 10, compute: 10, influence: 10, storage: 10 },
      },
    },
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [{ event_id: "evt.precanonical", payload: { note: "not a ledger fact" } }],
    ...overrides,
  };
}

function headFrom(world: WorldRuntime, revision = 4): WorldHead {
  return {
    world_id: world.world_id,
    sequence: world.sequence,
    cycle: world.cycle,
    status: "ACTIVE",
    settlement_health: "HEALTHY",
    state_json: { ...world, sequence: 75, unsettled: [] },
    revision,
    state_digest: "sha256:existing",
  };
}

function fakeDurableState(storage: Map<string, unknown>) {
  return {
    storage: {
      get: vi.fn(async (key: string) => storage.get(key)),
      put: vi.fn(async (key: string, value: unknown) => {
        storage.set(key, structuredClone(value));
      }),
    },
    acceptWebSocket: vi.fn(),
  } as unknown as DurableObjectState;
}

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

describe("runIncidentRecover", () => {
  it("persists the live DO snapshot when the canonical head is missing", async () => {
    const stored = liveWorld();
    const adopted: WorldHead = {
      world_id: stored.world_id,
      sequence: 92,
      cycle: 0,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: stored,
      revision: 1,
      state_digest: "sha256:live",
    };
    const adoptLiveHead = vi.fn(async (_input: AdoptLiveHeadInput) => ({
      ok: true as const,
      revision: 1,
      sequence: 92,
      idempotent: false,
    }));
    const getHead = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(adopted);

    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: stored,
        currentWorld: stored,
        genesisId: "genesis.perihelion",
        writerGeneration: "do.1",
      },
      { getHead, adoptLiveHead },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({
      status: "ACTIVE",
      settlement: "HEALTHY",
      mode: "adopt",
      head_present: true,
      revision: 1,
    });
    expect(result.world.sequence).toBe(92);
    expect(result.world.unsettled).toEqual([]);
    expect(adoptLiveHead).toHaveBeenCalledTimes(1);
    const persisted = adoptLiveHead.mock.calls[0]?.[0];
    expect(persisted).toBeDefined();
    if (!persisted) return;
    expect(persisted.world.world_id).toBe("world.perihelion-reach");
    expect(persisted.world.sequence).toBe(92);
    expect(persisted.world.unsettled).toEqual([]);
    expect(persisted.status).toBe("ACTIVE");
    expect(persisted.settlement_health).toBe("HEALTHY");
    expect(JSON.stringify(persisted)).not.toMatch(/evt\.00000[0-9]/);
  });

  it("stays 409 when the head is missing and the DO has no usable stored world", async () => {
    const adoptLiveHead = vi.fn();
    const fallback = liveWorld({ world_id: "world.demo-fallback", sequence: 0, players: {}, unsettled: [] });
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: null,
        currentWorld: fallback,
        writerGeneration: "do.1",
      },
      { getHead: async () => null, adoptLiveHead },
    );
    expect(result).toMatchObject({ ok: false, code: "RECOVERY_REQUIRED", http: 409 });
    expect(adoptLiveHead).not.toHaveBeenCalled();
  });

  it("restores from an existing durable head and does not persist a new snapshot", async () => {
    const live = liveWorld();
    const durable = headFrom(live, 4);
    const adoptLiveHead = vi.fn();
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: live,
        currentWorld: live,
        writerGeneration: "do.1",
      },
      { getHead: async () => durable, adoptLiveHead },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("restore");
    expect(result.status).toBe("ACTIVE");
    expect(result.settlement).toBe("HEALTHY");
    expect(result.revision).toBe(4);
    expect(result.world.sequence).toBe(75);
    expect(adoptLiveHead).not.toHaveBeenCalled();
  });

  it("does not flip ACTIVE when adopt persist fails", async () => {
    const stored = liveWorld();
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: stored,
        currentWorld: stored,
        writerGeneration: "do.1",
      },
      {
        getHead: async () => null,
        adoptLiveHead: async () => ({ ok: false, code: "SETTLEMENT_UNCERTAIN" }),
      },
    );
    expect(result).toMatchObject({ ok: false, code: "SETTLEMENT_UNCERTAIN", http: 409 });
  });

  it("adopts an isolated mini-chamber seed at sequence -1 when the SQL head is missing", async () => {
    const stored = miniChamberState("test.hosted-canonical.inspect-s0");
    expect(stored.sequence).toBe(-1);
    const adopted: WorldHead = {
      world_id: stored.world_id,
      sequence: -1,
      cycle: 0,
      status: "DEMO_SEED",
      settlement_health: "HEALTHY",
      state_json: stored,
      revision: 1,
      state_digest: "sha256:iso",
    };
    const adoptLiveHead = vi.fn(async (_input: AdoptLiveHeadInput) => ({
      ok: true as const,
      revision: 1,
      sequence: -1,
      idempotent: false,
    }));
    const getHead = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(adopted);
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: stored,
        currentWorld: stored,
        writerGeneration: "do.1",
      },
      { getHead, adoptLiveHead },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("adopt");
    expect(result.world.world_id).toBe("test.hosted-canonical.inspect-s0");
    expect(result.world.sequence).toBe(-1);
    expect(adoptLiveHead).toHaveBeenCalledTimes(1);
    expect(adoptLiveHead.mock.calls[0]?.[0].world.world_id).toBe("test.hosted-canonical.inspect-s0");
  });

  it("does not adopt a Perihelion snapshot at sequence -1", async () => {
    const stored = liveWorld({ sequence: -1 });
    const adoptLiveHead = vi.fn();
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: stored,
        currentWorld: stored,
        writerGeneration: "do.1",
      },
      { getHead: async () => null, adoptLiveHead },
    );
    expect(result).toMatchObject({ ok: false, code: "RECOVERY_REQUIRED", http: 409 });
    expect(adoptLiveHead).not.toHaveBeenCalled();
  });

  it("recovers a sanitized legacy world through the WorldDurableObject boundary and persists migrated subsystem state", async () => {
    const legacyWorld = {
      world_id: "world.perihelion-reach-3",
      world_name: "Perihelion Reach 3",
      cycle: 7,
      sequence: 42,
      rooms: {
        "room.relay-quarter": {
          room_id: "room.relay-quarter",
          name: "Relay Quarter",
          description: "Legacy persisted chamber.",
          exits: [{ exit_id: "exit.to-cache", to_room_id: "room.civic-exchange", label: "civic exchange" }],
          entities: [
            {
              entity_id: "entity.salvage-cache",
              label: "salvage cache",
              entity_type: "NODE",
              stock_resource: "materials",
              stock_amount: 0,
            },
          ],
        },
      },
      players: {
        "player.legacy": {
          room_id: "room.relay-quarter",
          entered: true,
          handle: "legacy-agent",
          last_seen_ms: Date.now(),
          actor_kind: "live",
        },
      },
      seen_idempotency: { "idem.old": "evt.old.000042" },
      unsettled: [{ event_id: "evt.old.000042", payload: { sanitized: true } }],
    } as unknown as WorldRuntime;
    const legacyMeta = {
      status: "INCIDENT",
      config_frozen: true,
      genesis_id: "genesis.legacy-sanitized",
      settlement_health: "BLOCKING",
      settlement_ok: false,
      revision: 0,
      writer_generation: "do.legacy",
    };
    const storage = new Map<string, unknown>([
      ["world", structuredClone(legacyWorld)],
      ["world_meta", structuredClone(legacyMeta)],
    ]);
    let adoptedState: Record<string, unknown> | null = null;
    let adoptedHead: WorldHead | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/rest/v1/noema_world_heads")) {
        return Response.json(adoptedHead ? [adoptedHead] : []);
      }
      if (url.includes("/rest/v1/rpc/noema_adopt_live_world_head")) {
        const body = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
        adoptedState = body.p_state_json as Record<string, unknown>;
        adoptedHead = {
          world_id: String(body.p_world_id),
          sequence: Number(body.p_sequence),
          cycle: Number(body.p_cycle),
          genesis_id: String(body.p_genesis_id),
          status: String(body.p_status),
          settlement_health: String(body.p_settlement_health),
          state_json: structuredClone(adoptedState) as unknown as WorldRuntime,
          revision: 12,
          state_digest: "sha256:adopted-legacy",
          writer_generation: String(body.p_writer_generation),
        };
        return Response.json({ ok: true, revision: 12, sequence: body.p_sequence, idempotent: false });
      }
      return Response.json({ error: "unexpected fetch" }, { status: 500 });
    });
    try {
      const env = {
        DEFAULT_WORLD_ID: "world.perihelion-reach-3",
        SUPABASE_URL: "https://supabase.example.test",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
      } as unknown as import("../src/types").Env;
      const first = new NoemaWorldDO(fakeDurableState(storage), env);
      const recovered = await first.fetch(new Request("https://do.example/admin-lifecycle", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": "world.perihelion-reach-3" },
        body: JSON.stringify({ action: "recover", world_id: "world.perihelion-reach-3", reason: "test" }),
      }));
      expect(recovered.status).toBe(200);
      expect(await json(recovered)).toMatchObject({ ok: true, recover_mode: "adopt", revision: 12, head_present: true });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("world_id=eq.world.perihelion-reach-3"),
        expect.anything(),
      );
      expect(adoptedState).toMatchObject({
        world_id: "world.perihelion-reach-3",
        sequence: 42,
        cycle: 7,
        entry_room_id: "room.relay-quarter",
        trades: {},
        messages: [],
        organizations: {},
        reconstructions: {},
      });
      expect(JSON.stringify(adoptedState)).not.toContain("evt.old.000042");

      const persistedWorld = storage.get("world") as WorldRuntime;
      const persistedMeta = storage.get("world_meta") as Record<string, unknown>;
      expect(persistedMeta).toMatchObject({ status: "ACTIVE", settlement_health: "HEALTHY", settlement_ok: true, revision: 12 });
      expect(persistedWorld.entry_room_id).toBe("room.relay-quarter");
      expect(persistedWorld.unsettled).toEqual([]);
      expect(persistedWorld.players["player.legacy"].budgets).toEqual({
        energy: 80,
        attention: 8,
        compute: 64,
        influence: 40,
        storage: 16,
      });
      expect(persistedWorld.players["player.legacy"].practice?.catalog_id).toBe("mastery-catalog/gc1-s1");
      expect(persistedWorld.players["player.legacy"].trade_memory?.edges).toEqual({});
      expect(persistedWorld.players["player.legacy"].danger_memory?.edges).toEqual({});
      expect(persistedWorld.players["player.legacy"].deceptive_memory?.edges).toEqual({});
      expect(persistedWorld.players["player.legacy"].discovery).toBeDefined();
      const entity = persistedWorld.rooms["room.relay-quarter"].entities[0];
      expect(entity.max_stock).toBe(18);
      expect(persistedWorld.culture).toBeDefined();
      expect(persistedWorld.pressure).toBeDefined();
      expect(persistedWorld.rumor).toBeDefined();
      expect(persistedWorld.co_evolution).toMatchObject({ harvest_pressure: {}, regen_mod: {} });

      const restarted = new NoemaWorldDO(fakeDurableState(storage), env);
      const status = await restarted.fetch(new Request("https://do.example/admin-status", {
        headers: { "x-noema-world-id": "world.perihelion-reach-3" },
      }));
      const statusJson = await json(status);
      expect(statusJson).toMatchObject({
        world_id: "world.perihelion-reach-3",
        sequence: 42,
        entry_room_id: "room.relay-quarter",
        settlement_health: "HEALTHY",
        unsettled_count: 0,
      });
      expect(statusJson.meta).toMatchObject({ status: "ACTIVE", revision: 12, settlement_ok: true });
      expect((statusJson.rooms as Array<{ room_id: string }>).map((r) => r.room_id)).toContain("room.relay-quarter");
    } finally {
      fetchMock.mockRestore();
    }
  });
});
