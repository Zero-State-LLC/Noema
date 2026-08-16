import { describe, expect, it, vi } from "vitest";
import { runIncidentRecover, type AdoptLiveHeadInput } from "../src/incident-recover";
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
});
