import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { buildWatchLive } from "../src/watch-live";
import { NoemaWorldDO } from "../src/world-do";
import type { Env, PlayerPrincipal } from "../src/types";
import { enrichEntity } from "../src/actions";
import { canonicalStateMaterial } from "../src/canonical-state";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";

// RFC-0024 / GC6-S1: PRIVATE and INSTITUTIONAL records are not WATCH evidence.
// Preserve the existing first-public selection and 0/1 defaults, not an average
// or a census of independent Controllers. Counts here are stored adapter input.
type ReconstructionInput = NonNullable<Parameters<typeof buildWatchLive>[0]["reconstructions"]>[number];
const privateRecord = { visibility: "PRIVATE", fidelity: 0.91, controllers: 9 };
const publicZero = { visibility: "PUBLIC", fidelity: 0, controllers: 2 };
const publicRecord = { visibility: "PUBLIC", fidelity: 0.42, controllers: 3 };
const cases: Array<{ name: string; records: ReconstructionInput[]; fidelity: number; controllers: number }> = [
  { name: "private-only", records: [privateRecord], fidelity: 0, controllers: 1 },
  { name: "public zero after private nonzero", records: [privateRecord, publicZero], fidelity: 0, controllers: 2 },
  { name: "public zero before private nonzero", records: [publicZero, privateRecord], fidelity: 0, controllers: 2 },
  { name: "public after private", records: [privateRecord, publicRecord], fidelity: 0.42, controllers: 3 },
  { name: "public before private", records: [publicRecord, privateRecord], fidelity: 0.42, controllers: 3 },
  { name: "absent public evidence", records: [], fidelity: 0, controllers: 1 },
  { name: "institutional-only", records: [{ ...privateRecord, visibility: "INSTITUTIONAL" }], fidelity: 0, controllers: 1 },
  { name: "unspecified visibility", records: [{ fidelity: 0.88, controllers: 8 }], fidelity: 0, controllers: 1 },
  { name: "missing public fidelity", records: [privateRecord, { visibility: "PUBLIC", controllers: 2 }], fidelity: 0, controllers: 2 },
  { name: "public zero count", records: [{ ...publicZero, controllers: 0 }], fidelity: 0, controllers: 0 },
];

const rooms = {
  "room.hub": { room_id: "room.hub", name: "Hub", description: "A public site.", exits: [], entities: [] },
};

function storedWatch(records: ReconstructionInput[], producedState?: Record<string, unknown>) {
  const bag = new Map<string, unknown>([
    ["world", producedState ?? {
      world_id: "test.watch-reconstruction", world_name: "Projection fixture", cycle: 4, sequence: 12,
      entry_room_id: "room.hub", rooms, players: {}, trades: {}, messages: [], organizations: {},
      seen_idempotency: {}, unsettled: [],
      reconstructions: Object.fromEntries(records.map((record, index) => [`recon.${index}`, {
        reconstruction_id: `recon.${index}`, author_player_id: "player.author", subject_ref: "entity.relay",
        claim: "An authored account.", evidence_refs: [], created_cycle: 1, status: "RECORDED", epistemic: "OPEN",
        ...record,
      }])),
    }],
    ["world_meta", { status: "ACTIVE", genesis_id: "genesis.test.watch", config_frozen: true, settlement_health: "HEALTHY" }],
  ]);
  const state = {
    storage: {
      async get(key: string) { return structuredClone(bag.get(key)); },
      async put(key: string, value: unknown) { bag.set(key, structuredClone(value)); },
    },
  } as unknown as DurableObjectState;
  const env = { NOEMA_ENV: "test", DEFAULT_WORLD_ID: "test.watch-reconstruction" } as Env;
  const world = new NoemaWorldDO(state, env);
  env.WORLD_DO = {
    idFromName: () => ({}),
    get: () => ({ fetch: (request: Request | string, init?: RequestInit) =>
      world.fetch(request instanceof Request ? request : new Request(request, init)) }),
  } as unknown as DurableObjectNamespace;
  return env;
}

describe("public reconstruction projection", () => {
  it.each(cases)("builder: $name", ({ records, fidelity, controllers }) => {
    const snapshot = buildWatchLive({ world_id: "test.watch-reconstruction", cycle: 4, sequence: 12,
      rooms, players: [], events: [], reconstructions: records });
    expect(snapshot).toMatchObject({ reconstruction_fidelity: fidelity, controllers, corroboration: controllers });
  });

  it.each(cases)("Worker GET → World DO snapshot: $name", async ({ records, fidelity, controllers }) => {
    const response = await worker.fetch(new Request("https://watch.test/v1/watch/live"), storedWatch(records));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ projection: "public", reconstruction_fidelity: fidelity,
      controllers, corroboration: controllers, sequence: 12, cycle: 4 });
  });

  it("preserves explicit zero-valued public adapter inputs", () => {
    const snapshot = buildWatchLive({ world_id: "test.watch-reconstruction", cycle: 4, sequence: 12,
      rooms, players: [], events: [], reconstruction_fidelity: 0, controllers: 0,
      reconstructions: [publicRecord] });
    expect(snapshot).toMatchObject({ reconstruction_fidelity: 0, controllers: 0, corroboration: 0 });
  });
});


describe("reconstruction producer → canonical state → public Worker projection", () => {
  it("keeps produced fidelity private through hydration until the author publishes", async () => {
    const world: WorldRuntime = {
      world_id: "test.watch-reconstruction", world_name: "Producer fixture", cycle: 0, sequence: 0,
      entry_room_id: "room.hub",
      rooms: { "room.hub": { ...rooms["room.hub"], entities: [enrichEntity({
        entity_id: "entity.relay", label: "relay", entity_type: "INFRASTRUCTURE", condition: 90,
      })] } },
      players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
    };
    const principal: PlayerPrincipal = {
      player_id: "player.author", agent_id: "agent.author", session_id: "session.author",
      controller_id: "controller.author", controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1", authentication_context: "test",
    };
    let request = 0;
    async function act(command: string, args: Record<string, unknown> = {}) {
      const result = await applyWorldCommand(world, principal, {
        request_id: `projection.${++request}`, command, arguments: args,
      }, async () => true);
      expect(result.ok, JSON.stringify(result.error)).toBe(true);
    }
    async function snapshot() {
      const material = await canonicalStateMaterial(world);
      // Settlement transports state_json with JSON.stringify; canonical_json
      // is separate digest material, not the object worldFromHead hydrates.
      const restored: Record<string, unknown> = JSON.parse(JSON.stringify(material.state_json));
      const response = await worker.fetch(new Request("https://watch.test/v1/watch/live"), storedWatch([], restored));
      expect(response.status).toBe(200);
      return response.json();
    }
    await act("ENTER_WORLD");
    await act("INSPECT", { entity_id: "entity.relay" });
    await act("COMMIT", { operation: "RECONSTRUCT", subject_ref: "entity.relay",
      claim: "An account of the relay.", evidence: ["LIVE_INSPECT"] });
    const records = Object.values(world.reconstructions || {});
    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record.visibility).toBe("PRIVATE");
    // Current producer emits 0.2 when no Deep Time fragments exist. It does
    // not persist controllerCount, so WATCH must not invent one from evidence.
    expect(record.fidelity).toBe(0.2);
    expect(record).not.toHaveProperty("controllers");
    expect(await snapshot()).toMatchObject({ reconstruction_fidelity: 0, controllers: 1, corroboration: 1 });

    await act("COMMIT", { operation: "RECONSTRUCT_PUBLISH", reconstruction_id: record.reconstruction_id,
      visibility: "PUBLIC" });
    expect(record.visibility).toBe("PUBLIC");
    const publicSnapshot = await snapshot();
    expect(publicSnapshot).toMatchObject({ reconstruction_fidelity: 0.2, controllers: 1, corroboration: 1 });
    expect(JSON.stringify(publicSnapshot)).not.toContain(record.claim);
    expect(JSON.stringify(publicSnapshot)).not.toContain(record.reconstruction_id);
  });
});
