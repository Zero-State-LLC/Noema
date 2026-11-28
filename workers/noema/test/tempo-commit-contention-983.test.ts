import { describe, expect, it } from "vitest";
import { STALE_FENCE, STALE_HEAD, planTempoCommitFailure, type FenceHead } from "../src/settle-fence";

const head: FenceHead = { world_id: "world-01", revision: 45181, sequence: 86844, cycle: 10 };

describe("Noema#983 tempo-alarm commit failure", () => {
  it("lost settlement race resyncs to the durable revision instead of INCIDENT", () => {
    for (const code of [STALE_HEAD, STALE_FENCE, "DIGEST_LINEAGE_MISMATCH", "NONCONTIGUOUS_SEQUENCE", "DUPLICATE_EVENT_CONFLICT"]) {
      expect(planTempoCommitFailure(code, head)).toEqual({ mode: "resync", revision: 45181 });
    }
  });

  it("contention without a readable durable head still fails closed", () => {
    expect(planTempoCommitFailure(STALE_HEAD, null)).toEqual({ mode: "incident" });
  });

  it("non-contention failures still enter INCIDENT", () => {
    for (const code of ["RPC_ERROR", "INVALID_SCHEMA", "CONFLICT", ""]) {
      expect(planTempoCommitFailure(code, head)).toEqual({ mode: "incident" });
    }
  });
});

import { advanceTempoAdmissionClock, admitTempoAction, nextTempoAlarmAt, pinPlayerTempo, reopenTempoAfterContention } from "../src/player-tempo";
import { applyWorldCommand, runPinnedTempoResolve, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

const CLOCK = 1_700_000_000_000;

function who(id: string): PlayerPrincipal {
  const short = id.replace(/^player\./, "");
  return {
    player_id: id, agent_id: `agent.${short}`, session_id: `sess.${short}`, controller_id: `ctrl.${short}`,
    controller_type: "agent", scopes: ["noema.world.observe", "noema.world.act"], protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.tempo-983", world_name: "Tempo", cycle: 0, sequence: 0, entry_room_id: "room.hub",
    rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "Hub.", exits: [], entities: [] } },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  } as unknown as WorldRuntime;
}

async function pinnedWithOneLook() {
  const w = world();
  const a = who("player.nacre");
  const entered = await applyWorldCommand(w, a, { request_id: "r.enter", idempotency_key: "i.enter", command: "ENTER_WORLD" }, async () => true, { now: CLOCK });
  expect(entered.ok).toBe(true);
  expect(pinPlayerTempo(w, { mode: "OBSERVED_LIVE", now: CLOCK, reason: "test pin" }).ok).toBe(true);
  const admitted = admitTempoAction(w, {
    principal: a, envelope: { request_id: "r.look", idempotency_key: "i.look", command: "LOOK" }, verb: "LOOK", now: CLOCK, worldPaused: false,
  });
  expect(admitted.ok).toBe(true);
  return w;
}

describe("Noema#983 tempo state after a lost commit race", () => {
  it("contention reopens a schedulable COLLECT that keeps the batch and commits on retry", async () => {
    const w = await pinnedWithOneLook();
    const failed = await runPinnedTempoResolve(w, async () => true, CLOCK, async () => false);
    expect(failed.ok).toBe(false);
    expect(w.player_tempo?.phase).toBe("RESOLVE");
    expect(nextTempoAlarmAt(w.player_tempo, CLOCK)).toBeNull(); // the P1: frozen with no alarm

    expect(reopenTempoAfterContention(w, CLOCK)).toBe(true);
    expect(w.player_tempo?.phase).toBe("COLLECT");
    expect(w.player_tempo?.settlement_failed).toBe(false);
    expect(w.player_tempo?.accepted).toHaveLength(1);
    const next = nextTempoAlarmAt(w.player_tempo, CLOCK);
    expect(typeof next).toBe("number");

    const adv = advanceTempoAdmissionClock(w, (next as number) + 1);
    expect(adv.should_resolve).toBe(true);
    const retried = await runPinnedTempoResolve(w, async () => true, (next as number) + 1, async () => true);
    expect(retried.ok).toBe(true);
    expect(w.cycle).toBe(1);
  });

  it("does nothing outside a failed RESOLVE, so hard failures keep the fail-closed freeze", async () => {
    const w = await pinnedWithOneLook();
    expect(reopenTempoAfterContention(w, CLOCK)).toBe(false);
    expect(w.player_tempo?.phase).toBe("COLLECT");
  });
});
