import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { canonicalStateMaterial } from "../src/canonical-state";
import { runIncidentRecover, type AdoptLiveHeadInput } from "../src/incident-recover";
import { type WorldHead } from "../src/settle";
import { migrateWorldRuntime, type WorldRuntime } from "../src/world-actions";

const FIXTURE_PATH = new URL("./fixtures/older-world-prod-shape-sanitized.json", import.meta.url).pathname;

type FixtureEnvelope = {
  fixture_version: string;
  sanitization: { contains_real_user_data: false; redactions: string[] };
  world: WorldRuntime;
};

function requireRecord(value: unknown, name: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
}

function readFixture(text = readFileSync(FIXTURE_PATH, "utf8")): FixtureEnvelope {
  const parsed: unknown = JSON.parse(text);
  requireRecord(parsed, "fixture");
  requireRecord(parsed.sanitization, "fixture.sanitization");
  if (parsed.sanitization.contains_real_user_data !== false) throw new Error("fixture must be explicitly sanitized");
  if (!String(parsed.fixture_version || "").includes("prod-shape-sanitized")) {
    throw new Error("fixture must declare sanitized production shape");
  }
  if (!String(parsed.fixture_version || "").includes("legacy-nested-deep-time")) {
    throw new Error("fixture must declare the nested Deep Time older-blob shape");
  }
  requireRecord(parsed.world, "fixture.world");
  const world = parsed.world;
  if (typeof world.world_id !== "string" || !world.world_id.startsWith("world.")) throw new Error("world_id is required");
  const sequence = world.sequence;
  if (typeof sequence !== "number" || !Number.isFinite(sequence) || sequence < 0) throw new Error("non-negative sequence is required");
  requireRecord(world.rooms, "world.rooms");
  if (Object.keys(world.rooms).length === 0) throw new Error("world.rooms must not be empty");
  requireRecord(world.players, "world.players");
  requireRecord(world.organizations, "world.organizations");
  return parsed as FixtureEnvelope;
}

function cloneWorld(): WorldRuntime {
  return structuredClone(readFixture().world);
}

describe("LCA-2 older Durable Object compatibility fixture", () => {
  it("stores Deep Time only under co_evolution.deep_time, the older blob location", () => {
    const raw = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as {
      world: Record<string, unknown>;
    };
    const world = raw.world;
    expect(world).not.toHaveProperty("scars");
    expect(world).not.toHaveProperty("evidence_fragments");
    expect(world).not.toHaveProperty("trajectory_digest");
    expect(world).not.toHaveProperty("norm_ratchets");
    expect(world).not.toHaveProperty("lore_attractors");
    const org = (world.organizations as Record<string, Record<string, unknown>>)["org.civic-repair"];
    expect(org).not.toHaveProperty("treasury");
    const nested = (world.co_evolution as { deep_time: { scars: Array<{ scar_id: string }> } }).deep_time;
    expect(nested.scars[0]).toEqual(expect.objectContaining({ scar_id: "scar.relay-neglect" }));
    const repairs = (world.culture as { sites: Record<string, { repairs?: unknown[] }> }).sites["entity.relay-trunk"].repairs;
    expect(repairs).toEqual([expect.objectContaining({ event_id: "evt.repair.000207", actor_id: "player.agent-aloe" })]);
  });

  it("loads the sanitized production-shape older world through migration and recovery without dropping public state", async () => {
    const world = cloneWorld();
    const before = structuredClone(world);
    expect(before.scars).toBeUndefined();
    expect(before.organizations["org.civic-repair"].treasury).toBeUndefined();
    migrateWorldRuntime(world);

    let persistedHead: WorldHead | null = null;
    const adoptLiveHead = vi.fn(async (input: AdoptLiveHeadInput) => {
      const material = await canonicalStateMaterial(input.world);
      persistedHead = {
        world_id: input.world.world_id,
        sequence: input.world.sequence,
        cycle: input.world.cycle,
        genesis_id: input.genesis_id,
        status: input.status,
        settlement_health: input.settlement_health,
        state_json: input.world,
        revision: 1,
        state_digest: material.state_digest,
        writer_generation: input.writer_generation,
      };
      return { ok: true as const, revision: 1, sequence: input.world.sequence, idempotent: false };
    });
    const getHead = vi.fn(async () => persistedHead);

    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: world,
        currentWorld: world,
        genesisId: "genesis.sanitized-old",
        writerGeneration: "do.sanitized-compat",
        settlementId: "settlement.sanitized-old-adopt",
      },
      { getHead, adoptLiveHead },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const recovered = result.world;
    expect(result).toMatchObject({ mode: "adopt", status: "ACTIVE", settlement: "HEALTHY", head_present: true, revision: 1 });
    expect(adoptLiveHead).toHaveBeenCalledTimes(1);
    expect(getHead).toHaveBeenCalledTimes(2);

    // Identities.
    expect(recovered.players["player.agent-aloe"]).toMatchObject({ handle: "aloe", controller_type: "agent", entered: true });
    expect(recovered.players["player.agent-birch"]).toMatchObject({ handle: "birch", controller_type: "agent", entered: true });
    expect(recovered.players["player.agent-aloe"].inherited?.lore_seeds).toContain("repairers remember the east route");

    // Organizations and offices.
    expect(recovered.organizations["org.civic-repair"]).toMatchObject({
      name: "Civic Repair",
      creator_id: "player.agent-aloe",
      status: "ACTIVE",
      members: [
        { agent_id: "player.agent-aloe", role: "founder" },
        { agent_id: "player.agent-birch", role: "officer" },
      ],
    });
    expect(recovered.organizations["org.civic-repair"].offices?.["office.steward"]).toMatchObject({
      holder_id: "player.agent-birch",
      status: "ACTIVE",
    });

    // Assets.
    const relay = recovered.rooms["room.relay-quarter"].entities.find((e) => e.entity_id === "entity.relay-trunk");
    const cache = recovered.rooms["room.relay-quarter"].entities.find((e) => e.entity_id === "entity.civic-cache");
    expect(relay).toMatchObject({ condition: 64, owner_id: "player.agent-aloe", co_owner_id: "player.agent-birch" });
    expect(cache).toMatchObject({ stock_resource: "materials", stock_amount: 11, owner_id: "org.civic-repair" });
    expect(recovered.players["player.agent-aloe"].lot_grades?.storage).toBe("SOUND");

    // Obligations, access, and settlement health.
    expect(recovered.trades["trade.repair-escrow"]).toMatchObject({
      status: "OPEN",
      proposer_id: "player.agent-aloe",
      counterparty_id: "player.agent-birch",
      acting_for: "org.civic-repair",
      reserved: { storage: 2 },
    });
    expect(recovered.agreements?.["agreement.repair-watch"]).toMatchObject({ status: "ACTIVE", party_a: "player.agent-aloe", party_b: "player.agent-birch" });
    expect(recovered.access_restrictions).toContainEqual({
      restriction_id: "access.east-route.office-only",
      scope: "EXIT",
      mode: "ALLOW_ONLY",
      applies_to: "org.civic-repair",
      room_id: "room.relay-quarter",
      exit_id: "east",
      expires_cycle: 41,
    });
    expect(recovered.unsettled).toEqual([]);

    // Deep Time lifted from the nested blob; culture repairs and empty catalogs filled.
    expect(recovered.co_evolution?.harvest_pressure).toEqual(before.co_evolution?.harvest_pressure);
    expect(recovered.co_evolution?.regen_mod).toEqual(before.co_evolution?.regen_mod);
    expect(recovered.scars?.[0]).toMatchObject({ scar_id: "scar.relay-neglect", strength: 0.44 });
    expect(recovered.co_evolution?.deep_time?.scars?.[0]).toMatchObject({ scar_id: "scar.relay-neglect" });
    expect(recovered.co_evolution?.deep_time?.evidence_fragments?.[0]).toMatchObject({ fragment_id: "frag.route-ledger" });
    expect(recovered.trajectory_digest?.["entity.relay-trunk"].harvest_count).toBe(3);
    expect(recovered.norm_ratchets?.org_create.reversal_cost).toBe(2);
    expect(recovered.lore_attractors?.[0].label).toContain("east route");
    expect(recovered.culture?.sites["entity.relay-trunk"].repair_ids).toEqual(["evt.repair.000207"]);
    expect(recovered.culture?.sites["entity.relay-trunk"].repairs).toEqual([
      expect.objectContaining({ event_id: "evt.repair.000207", actor_id: "player.agent-aloe", cycle: 33 }),
    ]);
    expect(recovered.pressure?.class_activations).toEqual({ infrastructure_failure: 2, resource_scarcity: 1, access_restriction: 1 });
    expect(recovered.players["player.agent-aloe"].practice?.catalog_id).toBe("mastery-catalog/gc1-s1");
    expect(recovered.organizations["org.civic-repair"].treasury).toMatchObject({
      attention: 0,
      compute: 0,
      energy: 0,
      influence: 0,
      storage: 0,
    });

    // Canonical head is the migrated live snapshot, with transient settlement queues stripped.
    const head = persistedHead as WorldHead | null;
    expect(head).toBeTruthy();
    expect(head?.world_id).toBe("world.perihelion-reach-sanitized-old");
    expect(head?.sequence).toBe(218);
    expect(head?.status).toBe("ACTIVE");
    expect(head?.settlement_health).toBe("HEALTHY");
    expect(head?.state_json.unsettled).toEqual([]);
    const material = await canonicalStateMaterial(recovered);
    expect(head?.state_digest).toBe(material.state_digest);
    expect(material.canonical_json).not.toContain("evt.unsettled.sanitized");
    expect(material.canonical_json).not.toContain("old-look");
  });

  it("restores the sanitized older world from an existing canonical head", async () => {
    const world = cloneWorld();
    migrateWorldRuntime(world);
    world.unsettled = [];
    const material = await canonicalStateMaterial(world);
    const head: WorldHead = {
      world_id: world.world_id,
      sequence: world.sequence,
      cycle: world.cycle,
      genesis_id: "genesis.sanitized-old",
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: world,
      revision: 7,
      state_digest: material.state_digest,
    };
    const adoptLiveHead = vi.fn();

    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: world,
        currentWorld: { ...world, sequence: 999, players: {} },
        writerGeneration: "do.sanitized-compat",
      },
      { getHead: async () => head, adoptLiveHead },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("restore");
    expect(result.revision).toBe(7);
    expect(result.world.sequence).toBe(218);
    expect(result.world.players["player.agent-aloe"].handle).toBe("aloe");
    expect(result.world.organizations["org.civic-repair"].members).toHaveLength(2);
    expect(adoptLiveHead).not.toHaveBeenCalled();
  });

  it("rejects malformed fixture JSON before recovery is attempted", () => {
    expect(() => readFixture("{not-json")).toThrow(SyntaxError);
  });

  it("rejects incomplete older worlds instead of adopting a made-up canonical head", async () => {
    const complete = cloneWorld();
    const cases: Array<[string, Partial<WorldRuntime>]> = [
      ["missing world_id", { ...complete, world_id: "" }],
      ["missing rooms", { ...complete, rooms: undefined as unknown as WorldRuntime["rooms"] }],
      ["empty rooms", { ...complete, rooms: {} }],
      ["negative production sequence", { ...complete, sequence: -1 }],
    ];

    for (const [name, storedWorld] of cases) {
      const adoptLiveHead = vi.fn();
      const result = await runIncidentRecover(
        {
          status: "INCIDENT",
          settlement: "BLOCKING",
          storedWorld: storedWorld as WorldRuntime,
          currentWorld: complete,
          writerGeneration: `do.${name.replace(/\W+/g, "-")}`,
        },
        { getHead: async () => null, adoptLiveHead },
      );
      expect(result, name).toMatchObject({ ok: false, code: "RECOVERY_REQUIRED", http: 409 });
      expect(adoptLiveHead, name).not.toHaveBeenCalled();
    }
  });

  it("rejects incomplete fixture envelopes with explicit diagnostics", () => {
    const base = readFixture();
    expect(() => readFixture(JSON.stringify({ ...base, sanitization: { contains_real_user_data: true } }))).toThrow(/sanitized/);
    expect(() => readFixture(JSON.stringify({ ...base, world: { ...base.world, rooms: {} } }))).toThrow(/rooms/);
    expect(() => readFixture(JSON.stringify({ ...base, world: { ...base.world, players: null } }))).toThrow(/players/);
    expect(() => readFixture(JSON.stringify({ ...base, world: { ...base.world, organizations: [] } }))).toThrow(/organizations/);
  });
});
