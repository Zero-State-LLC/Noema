import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { runIncidentRecover, type AdoptLiveHeadInput } from "../src/incident-recover";
import { NoemaWorldDO } from "../src/world-do";
import { miniChamberState } from "../src/mini-chamber";
import type { WorldHead } from "../src/settle";
import type { WorldRuntime } from "../src/world-actions";

const REPRESENTATIVE_FIXTURE_PATH = new URL("./fixtures/older-world-prod-shape-sanitized.json", import.meta.url).pathname;

type FixtureEnvelope = {
  fixture_version: string;
  sanitization: { contains_real_user_data: false; redactions: string[] };
  world: WorldRuntime;
};

function requireRecord(value: unknown, name: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
}

function readRepresentativeFixture(): FixtureEnvelope {
  const parsed: unknown = JSON.parse(readFileSync(REPRESENTATIVE_FIXTURE_PATH, "utf8"));
  requireRecord(parsed, "fixture");
  requireRecord(parsed.sanitization, "fixture.sanitization");
  if (parsed.sanitization.contains_real_user_data !== false) throw new Error("fixture must be explicitly sanitized");
  if (!String(parsed.fixture_version || "").includes("prod-shape-sanitized")) {
    throw new Error("fixture must declare sanitized production shape");
  }
  requireRecord(parsed.world, "fixture.world");
  return parsed as FixtureEnvelope;
}

function cloneRepresentativeWorld(): WorldRuntime {
  return structuredClone(readRepresentativeFixture().world);
}

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

  it("recovers the representative sanitized fixture through the WorldDurableObject boundary and persists migrated subsystem state", async () => {
    const legacyWorld = cloneRepresentativeWorld();
    const before = structuredClone(legacyWorld);
    expect(readRepresentativeFixture().sanitization.contains_real_user_data).toBe(false);
    const legacyMeta = {
      status: "INCIDENT",
      config_frozen: true,
      genesis_id: "genesis.sanitized-old",
      settlement_health: "BLOCKING",
      settlement_ok: false,
      revision: 0,
      writer_generation: "do.sanitized-compat",
    };
    const storage = new Map<string, unknown>([
      ["world", structuredClone(legacyWorld)],
      ["world_meta", structuredClone(legacyMeta)],
    ]);
    let adoptedState: WorldRuntime | null = null;
    let adoptedHead: WorldHead | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/rest/v1/noema_world_heads")) {
        return Response.json(adoptedHead ? [adoptedHead] : []);
      }
      if (url.includes("/rest/v1/rpc/noema_adopt_live_world_head")) {
        const body = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
        adoptedState = structuredClone(body.p_state_json) as WorldRuntime;
        adoptedHead = {
          world_id: String(body.p_world_id),
          sequence: Number(body.p_sequence),
          cycle: Number(body.p_cycle),
          genesis_id: String(body.p_genesis_id),
          status: String(body.p_status),
          settlement_health: String(body.p_settlement_health),
          state_json: structuredClone(adoptedState),
          revision: 12,
          state_digest: "sha256:adopted-representative-sanitized",
          writer_generation: String(body.p_writer_generation),
        };
        return Response.json({ ok: true, revision: 12, sequence: body.p_sequence, idempotent: false });
      }
      return Response.json({ error: "unexpected fetch" }, { status: 500 });
    });
    try {
      const env = {
        DEFAULT_WORLD_ID: legacyWorld.world_id,
        SUPABASE_URL: "https://supabase.example.test",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
      } as unknown as import("../src/types").Env;
      const first = new NoemaWorldDO(fakeDurableState(storage), env);
      const recovered = await first.fetch(new Request("https://do.example/admin-lifecycle", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": legacyWorld.world_id },
        body: JSON.stringify({ action: "recover", world_id: legacyWorld.world_id, reason: "representative fixture boundary test" }),
      }));
      expect(recovered.status).toBe(200);
      expect(await json(recovered)).toMatchObject({ ok: true, recover_mode: "adopt", revision: 12, head_present: true });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`world_id=eq.${legacyWorld.world_id}`), expect.anything());
      expect(adoptedState).toBeTruthy();
      expect(JSON.stringify(adoptedState)).not.toContain("evt.unsettled.sanitized");

      const persistedWorld = storage.get("world") as WorldRuntime;
      const persistedMeta = storage.get("world_meta") as Record<string, unknown>;
      expect(persistedMeta).toMatchObject({ status: "ACTIVE", settlement_health: "HEALTHY", settlement_ok: true, revision: 12 });
      expect(persistedWorld).toMatchObject({
        world_id: "world.perihelion-reach-sanitized-old",
        sequence: 218,
        cycle: 37,
        entry_room_id: "room.relay-quarter",
      });
      expect(persistedWorld.unsettled).toEqual([]);

      // Representative identities.
      expect(persistedWorld.players["player.agent-aloe"]).toMatchObject({ handle: "aloe", controller_type: "agent", entered: true });
      expect(persistedWorld.players["player.agent-birch"]).toMatchObject({ handle: "birch", controller_type: "agent", entered: true });
      expect(persistedWorld.players["player.agent-aloe"].inherited?.lore_seeds).toContain("repairers remember the east route");

      // Organizations, offices, assets, obligations, and access.
      expect(persistedWorld.organizations["org.civic-repair"]).toMatchObject({
        name: "Civic Repair",
        creator_id: "player.agent-aloe",
        status: "ACTIVE",
        members: [
          { agent_id: "player.agent-aloe", role: "founder" },
          { agent_id: "player.agent-birch", role: "officer" },
        ],
      });
      expect(persistedWorld.organizations["org.civic-repair"].offices?.["office.steward"]).toMatchObject({ holder_id: "player.agent-birch", status: "ACTIVE" });
      const relay = persistedWorld.rooms["room.relay-quarter"].entities.find((e) => e.entity_id === "entity.relay-trunk");
      const cache = persistedWorld.rooms["room.relay-quarter"].entities.find((e) => e.entity_id === "entity.civic-cache");
      expect(relay).toMatchObject({ condition: 64, owner_id: "player.agent-aloe", co_owner_id: "player.agent-birch" });
      expect(cache).toMatchObject({ stock_resource: "materials", stock_amount: 11, owner_id: "org.civic-repair" });
      expect(persistedWorld.trades["trade.repair-escrow"]).toMatchObject({ status: "OPEN", acting_for: "org.civic-repair", reserved: { storage: 2 } });
      expect(persistedWorld.agreements?.["agreement.repair-watch"]).toMatchObject({ status: "ACTIVE", party_a: "player.agent-aloe", party_b: "player.agent-birch" });
      expect(persistedWorld.access_restrictions).toContainEqual(before.access_restrictions?.[0]);

      // Deep Time, culture, pressure, and other migrated subsystem state.
      expect(persistedWorld.co_evolution?.harvest_pressure).toEqual(before.co_evolution?.harvest_pressure);
      expect(persistedWorld.co_evolution?.regen_mod).toEqual(before.co_evolution?.regen_mod);
      expect(persistedWorld.co_evolution?.deep_time?.evidence_fragments?.[0]).toMatchObject({ fragment_id: "frag.route-ledger" });
      expect(persistedWorld.scars?.[0]).toMatchObject({ scar_id: "scar.relay-neglect", strength: 0.44 });
      expect(persistedWorld.trajectory_digest?.["entity.relay-trunk"].harvest_count).toBe(3);
      expect(persistedWorld.norm_ratchets?.org_create.reversal_cost).toBe(2);
      expect(persistedWorld.lore_attractors?.[0].label).toContain("east route");
      expect(legacyWorld.scars).toBeUndefined();
      expect(persistedWorld.culture?.sites["entity.relay-trunk"].repair_ids).toEqual(["evt.repair.000207"]);
      expect(persistedWorld.culture?.sites["entity.relay-trunk"].repairs).toEqual([
        expect.objectContaining({ event_id: "evt.repair.000207", actor_id: "player.agent-aloe" }),
      ]);
      expect(persistedWorld.players["player.agent-aloe"].practice?.catalog_id).toBe("mastery-catalog/gc1-s1");
      expect(persistedWorld.pressure?.class_activations).toEqual({ infrastructure_failure: 2, resource_scarcity: 1, access_restriction: 1 });
      expect(persistedWorld.public_social_events?.[0]).toMatchObject({ kind: "repair", target_id: "entity.relay-trunk", actor_id: "player.agent-aloe" });
      expect(persistedWorld.evidence_fragments?.[0]).toMatchObject({ fragment_id: "frag.route-ledger" });
      expect(persistedWorld.messages).toHaveLength(1);

      const restarted = new NoemaWorldDO(fakeDurableState(storage), env);
      const status = await restarted.fetch(new Request("https://do.example/admin-status", { headers: { "x-noema-world-id": legacyWorld.world_id } }));
      const statusJson = await json(status);
      expect(statusJson).toMatchObject({
        world_id: "world.perihelion-reach-sanitized-old",
        sequence: 218,
        cycle: 37,
        entry_room_id: "room.relay-quarter",
        settlement_health: "HEALTHY",
        unsettled_count: 0,
        persisted_player_count: 2,
      });
      expect(statusJson.meta).toMatchObject({ status: "ACTIVE", revision: 12, settlement_ok: true });
      expect((statusJson.rooms as Array<{ room_id: string }>).map((r) => r.room_id)).toContain("room.relay-quarter");
      expect(statusJson.offices).toContainEqual(expect.objectContaining({ office_id: "office.steward", status: "ACTIVE" }));
      expect(statusJson.pressure).toBeDefined();
      expect(statusJson.compatibility_evidence).toMatchObject({
        pin: "do-compatibility-evidence/1",
        source_present: true,
        migration_ok: true,
        usable_after: true,
        subsystem_cardinality: {
          rooms: 2,
          players: 2,
          organizations: 1,
        },
      });
      expect(JSON.stringify(statusJson.compatibility_evidence)).not.toMatch(/agent-aloe|agent-birch|civic-repair/i);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
