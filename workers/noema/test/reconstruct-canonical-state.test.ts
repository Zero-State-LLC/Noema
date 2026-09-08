import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { CanonicalStateSerializationError, canonicalStateMaterial, canonicalWorldState } from "../src/canonical-state";

// Regression for #634: RECONSTRUCT optional fields (org_id,
// supersedes_reconstruction_id) can produce non-JSON canonical state text
// when the producer leaves them `undefined`. This exercises the real
// RECONSTRUCT/RECONSTRUCT_SUPERSEDE producer and the canonical-state
// serialization boundary that settlement (settle.ts) and rollback evidence
// (rollback-evidence.ts) both depend on.

function agent(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.reconstruct-634",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A live relay and a fragmentary archive.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
            scar: true,
          }),
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "black-archive",
            entity_type: "ARTIFACT",
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    reconstructions: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function gatherEvidence(w: WorldRuntime, p: PlayerPrincipal) {
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(
    (
      await run(w, p, "ATTEST", {
        entity_id: "entity.archive-ledger",
        subject_entity_id: "entity.relay-7",
        archive_claim: "DESTROYED",
      })
    ).ok,
  ).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.relay-7" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

describe("RECONSTRUCT optional fields produce valid canonical JSON (#634)", () => {
  it("RECONSTRUCT with org_id/supersedes_reconstruction_id omitted yields JSON.parse-able canonical text", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    await gatherEvidence(w, a);

    const result = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "The relay endured.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PRIVATE",
      // org_id intentionally omitted: this is the optional field from #634.
    });
    expect(result.ok).toBe(true);

    const rec = Object.values(w.reconstructions || {})[0] as Record<string, unknown>;
    // The producer must not carry the optional keys at all when unset —
    // not merely set them to `undefined`.
    expect("org_id" in rec).toBe(false);
    expect("supersedes_reconstruction_id" in rec).toBe(false);

    const state = canonicalWorldState(w);
    const material = await canonicalStateMaterial(w);
    expect(state).toBeTruthy();
    expect(() => JSON.parse(material.canonical_json)).not.toThrow();
    const parsed = JSON.parse(material.canonical_json);
    expect(parsed.reconstructions).toBeTruthy();
  });

  it("RECONSTRUCT_SUPERSEDE with org_id omitted still yields JSON.parse-able canonical text", async () => {
    const w = world();
    const a = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await gatherEvidence(w, a);

    const first = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "The relay endured.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PRIVATE",
    });
    expect(first.ok).toBe(true);
    const recId = Object.keys(w.reconstructions || {})[0];

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const superseded = await run(w, a, "RECONSTRUCT_SUPERSEDE", {
      reconstruction_id: recId,
      claim: "The relay endured, revised.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
    });
    expect(superseded.ok).toBe(true);

    const rec = Object.values(w.reconstructions || {}).find(
      (r) => (r as Record<string, unknown>).reconstruction_id !== recId,
    ) as Record<string, unknown>;
    expect(rec.supersedes_reconstruction_id).toBe(recId);
    expect("org_id" in rec).toBe(false);

    const material = await canonicalStateMaterial(w);
    expect(() => JSON.parse(material.canonical_json)).not.toThrow();
  });

  it("canonicalStateMaterial fails explicitly (not silently) if semantic state ever serializes to non-JSON text", async () => {
    const w = world() as WorldRuntime & { reconstructions: Record<string, unknown> };
    // Simulate a future producer regression: an undefined value nested where
    // stableStringify's object-key filtering cannot repair it (an array
    // element), so the resulting text is not valid JSON. The canonical-state
    // boundary must reject this before it can be hashed or persisted rather
    // than silently shipping unparsable text (which is exactly what #634
    // reported for the object-key case before this filtering existed).
    (w as unknown as { badArray: unknown[] }).badArray = [1, undefined, 3];
    await expect(canonicalStateMaterial(w)).rejects.toBeInstanceOf(CanonicalStateSerializationError);
  });
});
