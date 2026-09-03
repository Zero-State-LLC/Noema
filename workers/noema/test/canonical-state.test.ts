import { describe, expect, it } from "vitest";
import { canonicalEventDigest, canonicalStateMaterial, canonicalWorldState } from "../src/canonical-state";
import type { WorldRuntime } from "../src/world-actions";

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    cycle: 2,
    sequence: 7,
    entry_room_id: "room.hub",
    rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "Hub", exits: [], entities: [] } },
    players: {
      "player.a": {
        room_id: "room.hub",
        entered: true,
        handle: "a",
        budgets: { energy: 10, attention: 10, compute: 10, influence: 10, storage: 10 },
        last_seen_ms: 100,
        controlling_session_id: "sess.one",
      },
    },
    trades: {}, messages: [], organizations: {}, seen_idempotency: { "req.one": { ok: true, request_id: "req.one" } }, unsettled: [],
  };
}

describe("canonical durable state", () => {
  it("excludes transport and retry state from the world digest", async () => {
    const first = world();
    const second = structuredClone(first);
    second.players["player.a"].last_seen_ms = 999999;
    second.players["player.a"].controlling_session_id = "sess.two";
    second.seen_idempotency["req.two"] = { ok: true, request_id: "req.two" };
    second.unsettled.push({ event_id: "evt.pending", payload: {} });
    const state = canonicalWorldState(second) as { players: Record<string, Record<string, unknown>> };
    expect(state.players["player.a"].last_seen_ms).toBeUndefined();
    expect((await canonicalStateMaterial(first)).state_digest).toBe((await canonicalStateMaterial(second)).state_digest);
  });

  it("keeps reconstruction fidelity and observation evidence in semantic state", async () => {
    const first = world() as WorldRuntime & {
      observation_digests: Record<string, { fidelity: number; controller_id: string }>;
    };
    first.reconstructions = {
      "recon.gate-b": {
        reconstruction_id: "recon.gate-b",
        author_player_id: "player.a",
        subject_ref: "entity.relay",
        claim: "the relay endured",
        evidence_refs: [],
        created_cycle: 2,
        status: "RECORDED",
        visibility: "PUBLIC",
        epistemic: "OPEN",
        fidelity: 0.85,
      },
    };
    first.observation_digests = {
      "obs.gate-b": { fidelity: 0.75, controller_id: "ctrl.a" },
    };

    const state = canonicalWorldState(first) as typeof first;
    expect(state.reconstructions?.["recon.gate-b"].fidelity).toBe(0.85);
    expect(state.observation_digests["obs.gate-b"]).toEqual({ fidelity: 0.75, controller_id: "ctrl.a" });

    const second = structuredClone(first);
    second.reconstructions!["recon.gate-b"].fidelity = 0.95;
    expect((await canonicalStateMaterial(first)).state_digest).not.toBe(
      (await canonicalStateMaterial(second)).state_digest,
    );
  });

  it("binds each event digest to its preceding digest and canonical fields", async () => {
    const base = { world_id: "world.test", sequence: 8, cycle: 2, event_id: "evt.8", event_type: "MOVE", payload: { room_id: "room.hub" } };
    const first = await canonicalEventDigest({ ...base, previous_digest: null });
    const chained = await canonicalEventDigest({ ...base, previous_digest: first });
    expect(chained).not.toBe(first);
  });
});
