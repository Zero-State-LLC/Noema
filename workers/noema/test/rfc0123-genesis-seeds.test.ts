/** RFC-0123 ratchet bounds + punish decoupling; EWM/Deep-Time genesis seed wiring (audit G6/D5). */

import { describe, expect, it } from "vitest";
import { deepTimeCoEvolve, ORG_RATCHET_CAP, ratchetOnOrgCreate } from "../src/deep-time";
import { ensureCoevo } from "../src/reputation";
import { cycle0ToWorld } from "../src/world-do";

function world(): Record<string, unknown> {
  return { world_id: "world.test", cycle: 10, sequence: 1, rooms: {}, players: {} };
}

describe("RFC-0123 ratchet bounds", () => {
  it("caps org_create reversal_cost at 5 and decays after 10 quiet cycles", () => {
    const w = world();
    for (let i = 0; i < 12; i++) ratchetOnOrgCreate(w as never, 10 + i);
    const ratchets = () => (w.norm_ratchets as Record<string, { reversal_cost: number; established_cycle: number; hits: number }>).org_create;
    expect(ratchets().reversal_cost).toBe(ORG_RATCHET_CAP);
    // last reinforcement was cycle 21 — no decay before 10 quiet cycles
    w.cycle = 25;
    deepTimeCoEvolve(w as never);
    expect(ratchets().reversal_cost).toBe(ORG_RATCHET_CAP);
    // one step per slow pass once quiet
    w.cycle = 35;
    deepTimeCoEvolve(w as never);
    expect(ratchets().reversal_cost).toBe(ORG_RATCHET_CAP - 1);
    expect(ratchets().established_cycle).toBe(10);
    expect(ratchets().hits).toBe(12);
  });
});

describe("coevo rebuild persistence", () => {
  it("ensureCoevo preserves the deep_time blob and genesis seeds", () => {
    const w = {
      co_evolution: {
        harvest_pressure: {},
        regen_mod: {},
        deep_time: { scars: [{ scar_id: "s1" }] },
        genesis_seeds: { initial_beliefs: { org_threshold: 5 } },
      },
    } as never;
    const co = ensureCoevo(w);
    expect((co.deep_time as { scars: unknown[] }).scars).toHaveLength(1);
    expect(co.genesis_seeds?.initial_beliefs?.org_threshold).toBe(5);
  });
});

describe("genesis seeds reach live state (audit G6/D5)", () => {
  it("cycle0ToWorld carries co-evolution, scars, lore, beliefs, and styles", () => {
    const w = cycle0ToWorld({
      world_id: "world.seeded",
      world_name: "Seeded",
      world_seed: "seed",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] } },
      institutions: [],
      artifacts: [],
      tensions: [],
      scars: [],
      resources: [],
      opportunities: [],
      ewm_features: true,
      initial_beliefs: { expected_regen: 0.82, org_threshold: 5 },
      initial_co_evolution: { harvest_pressure: 0, regen_mod: { default: 1.15 }, protocol_strength: { "room.hub": 1 } },
      signaling_styles: { archivist: "grounded-first" },
      scar_seeds: [
        { scar_id: "scar.seed", domain: "economic", strength: 0.15, decay_rate: 0.08, room_id: "room.hub", cycle_born: 0, visibility: "public", reconstruction_confidence: 0.3 },
      ],
      lore_prototypes: [{ attractor_id: "lore.hub", label: "hub memory", weight: 0.1, room_id: "room.hub", basin: "forming" }],
    } as never);
    expect(w.co_evolution?.protocol_strength?.["room.hub"]).toBe(1);
    // genesis emits a scalar 0 — live per-room map starts empty, not corrupted
    expect(w.co_evolution?.harvest_pressure).toEqual({});
    expect(w.co_evolution?.genesis_seeds?.initial_beliefs?.org_threshold).toBe(5);
    expect(w.co_evolution?.genesis_seeds?.signaling_styles?.archivist).toBe("grounded-first");
    expect(w.scars).toHaveLength(1);
    expect(w.lore_attractors).toHaveLength(1);
    // mirrored into the persistence blob so DO reloads rehydrate
    expect((w.co_evolution?.deep_time as { scars: unknown[] }).scars).toHaveLength(1);
  });

  it("worlds without EWM seeds stay unchanged", () => {
    const w = cycle0ToWorld({
      world_id: "world.plain",
      world_name: "Plain",
      world_seed: "seed",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] } },
      institutions: [],
      artifacts: [],
      tensions: [],
      scars: [],
      resources: [],
      opportunities: [],
    } as never);
    expect(w.co_evolution).toBeUndefined();
    expect(w.scars).toBeUndefined();
    expect(w.lore_attractors).toBeUndefined();
  });
});

describe("EWM debt tranche", () => {
  it("attest ratchet never carries a reversal surcharge (RFC-0123 bounds org_create only)", async () => {
    const { ratchetOnAttest } = await import("../src/deep-time");
    const w = { world_id: "w", cycle: 4, rooms: {}, players: {} } as never;
    for (let i = 0; i < 5; i++) ratchetOnAttest(w, 4 + i);
    const attest = (w as { norm_ratchets: Record<string, { reversal_cost: number; hits: number; path_dependence_strength: number }> }).norm_ratchets.attest;
    expect(attest.reversal_cost).toBe(0);
    // path dependence still accrues — the field is zero by contract, not inert
    expect(attest.hits).toBe(5);
    expect(attest.path_dependence_strength).toBeGreaterThan(0);
  });
});
