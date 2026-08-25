import { describe, expect, it } from "vitest";
import { buildRollbackEvidence } from "../src/rollback-evidence";
import type { WorldRuntime } from "../src/world-actions";

function world(idempotency: Record<string, unknown> = {}): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.ewm-cutover",
    world_name: "Rollback Rehearsal",
    cycle: 3,
    sequence: 7,
    entry_room_id: "room.entry",
    rooms: {
      "room.entry": {
        room_id: "room.entry",
        name: "Entry",
        description: "A test room.",
        exits: [],
        entities: [],
      },
    },
    players: {},
    organizations: {},
    messages: [],
    trades: {},
    seen_idempotency: idempotency,
    unsettled: [],
  } as unknown as WorldRuntime;
}

describe("buildRollbackEvidence", () => {
  it("keeps semantic state digest stable when only idempotency cache changes", async () => {
    const a = await buildRollbackEvidence(world(), []);
    const b = await buildRollbackEvidence(world({ "player::request": { ok: true } }), []);
    expect(b.state_digest).toBe(a.state_digest);
    expect(a.idempotency_count).toBe(0);
    expect(b.idempotency_count).toBe(1);
  });

  it("pins ordered event history and its head", async () => {
    const events = [
      { event_id: "evt.tw.rollback.000001", sequence: 1 },
      { event_id: "evt.tw.rollback.000002", sequence: 2 },
    ];
    const evidence = await buildRollbackEvidence(world(), events);
    expect(evidence).toMatchObject({
      pin: "rollback-rehearsal-evidence/1",
      canonicalization_version: "noema-jcs/1",
      history_count: 2,
      history_head_event_id: "evt.tw.rollback.000002",
      history_head_sequence: 2,
    });
    expect(evidence.state_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(evidence.history_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});
