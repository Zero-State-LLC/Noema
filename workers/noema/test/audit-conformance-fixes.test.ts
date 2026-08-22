/** 2026-08-21 audit high-priority fixes: active_norms honesty, checkpoint
 *  Deep Time restore, production bootstrap fail-closed. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { semanticAttach } from "../src/reputation";
import { createCheckpoint, resumeFromCheckpoint, type WorldRuntime } from "../src/world-actions";
import { ensureDeepTime } from "../src/deep-time";

const HERE = new URL(".", import.meta.url).pathname;

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 10,
    sequence: 40,
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "",
        exits: [],
        entities: [{ entity_id: "entity.node", label: "node", entity_type: "RESOURCE_NODE", stock_amount: 10 }],
      },
    },
    players: {},
  } as unknown as WorldRuntime;
}

describe("active_norms reports the live ratcheted cost", () => {
  it("adds the org_create reversal_cost to the base influence cost", () => {
    const w = world();
    expect(semanticAttach(w as never, undefined, "room.hub").active_norms?.org_create_influence).toBe(5);
    ensureDeepTime(w as never);
    (w as { norm_ratchets?: Record<string, { norm_id: string; established_cycle: number; reinforcements: number; reversal_cost: number; path_dependence_strength: number } > }).norm_ratchets = {
      org_create: { norm_id: "org_create", established_cycle: 5, reinforcements: 3, reversal_cost: 3, path_dependence_strength: 0.4 },
    };
    expect(semanticAttach(w as never, undefined, "room.hub").active_norms?.org_create_influence).toBe(8);
  });
});

describe("checkpoint restore carries Deep Time state", () => {
  it("resume drops post-checkpoint scars and restores snapshotted ones", () => {
    const w = world();
    ensureDeepTime(w as never);
    w.scars = [
      { scar_id: "scar.before", room_id: "room.hub", domain: "economic", strength: 0.4, decay_rate: 0.01, created_cycle: 8, trigger: "harvest", visibility: "public" },
    ] as never;
    w.trajectory_digest = { "room.hub": { harvest_count: 3 } } as never;
    const cp = createCheckpoint(w, "pre-experiment");
    expect((cp.snapshot as { scars?: unknown[] }).scars).toHaveLength(1);

    // World moves on: a new scar and digest churn happen after the checkpoint.
    (w.scars as unknown[]).push({
      scar_id: "scar.after", room_id: "room.hub", domain: "economic", strength: 0.9, decay_rate: 0.01, created_cycle: 12, trigger: "harvest", visibility: "public",
    });
    (w.trajectory_digest as Record<string, { harvest_count: number }>)["room.hub"].harvest_count = 9;

    resumeFromCheckpoint(w, cp);
    const ids = (w.scars as Array<{ scar_id: string }>).map((s) => s.scar_id);
    expect(ids).toEqual(["scar.before"]);
    expect((w.trajectory_digest as Record<string, { harvest_count: number }>)["room.hub"].harvest_count).toBe(3);
    // Derived caches reset so the restored blob rehydrates consistently.
    expect(w.norm_ratchets).toBeUndefined();
    expect(w.evidence_fragments).toBeUndefined();
    expect(w.lore_attractors).toBeUndefined();
  });

  it("keeps working when the checkpoint predates Deep Time (no snapshot fields)", () => {
    const w = world();
    const cp = createCheckpoint(w, "bare");
    delete (cp.snapshot as { scars?: unknown }).scars;
    delete (cp.snapshot as { trajectory_digest?: unknown }).trajectory_digest;
    w.scars = [{ scar_id: "scar.late", room_id: "room.hub", domain: "economic", strength: 0.2, decay_rate: 0.01, created_cycle: 11, trigger: "harvest", visibility: "public" }] as never;
    resumeFromCheckpoint(w, cp);
    expect(w.scars).toBeUndefined();
    ensureDeepTime(w as never);
    expect(w.scars).toEqual([]);
  });
});

describe("production bootstrap is fail-closed", () => {
  it("world-do gates bootstrap on the explicit admit or the operator env latch, never a world-id literal", () => {
    const src = readFileSync(join(HERE, "../src/world-do.ts"), "utf8");
    const gate = src.slice(src.indexOf("const bootstrapEmpty"));
    expect(gate.slice(0, 200)).not.toContain('w.world_id === "world.perihelion-reach-3"');
    expect(src).toContain("NOEMA_ALLOW_PROD_BOOTSTRAP");
    expect(src).toContain("this.allowCanonicalBootstrap || operatorLatch");
  });
});
