import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import catalogJson from "../src/player-tempo-catalog.1.0.json";
import {
  advanceTempoAdmissionClock,
  admitTempoAction,
  changeTempoMode,
  inferWorldKind,
  loadPlayerTempoCatalog,
  fillsActionSlot,
  operatorTempoTrigger,
  pinPlayerTempo,
  publicTempoProjection,
  redactedTempoState,
  sortAcceptedActions,
  tempoCanonicalFingerprint,
  validatePlayerTempoCatalog,
} from "../src/player-tempo";
import { runIncidentRecover } from "../src/incident-recover";
import { applyWorldCommand, runPinnedTempoResolve, type WorldRuntime } from "../src/world-actions";
import { commitCycleIfReady } from "../src/world-time";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const CLOCK = 1_700_000_000_000;
const SRC = dirname(fileURLToPath(import.meta.url));

function principal(id: string): PlayerPrincipal {
  const short = id.replace(/^player\./, "");
  return {
    player_id: id,
    agent_id: `agent.${short}`,
    session_id: `sess.${short}`,
    controller_id: `ctrl.${short}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(worldId = "test.hosted-canonical.tempo"): WorldRuntime {
  return {
    world_id: worldId,
    world_name: "Tempo Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          {
            entity_id: "entity.cache",
            label: "cache",
            entity_type: "RESOURCE",
          },
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "East Dock",
        description: "An eastern dock.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  now = CLOCK,
  settle: () => Promise<boolean> = async () => true,
  extra: Partial<CommandEnvelope> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
    ...extra,
  };
  return applyWorldCommand(w, p, envl, async () => settle(), { now });
}

async function enterThenPin(
  w: WorldRuntime,
  players: PlayerPrincipal[],
  mode: "OBSERVED_LIVE" | "FAST_TEST" | "STEP_TEST" = "FAST_TEST",
  now = CLOCK,
) {
  for (const p of players) {
    const entered = await run(w, p, "ENTER_WORLD", {}, now);
    expect(entered.ok).toBe(true);
  }
  const pinned = pinPlayerTempo(w, { mode, now, reason: "test pin" });
  expect(pinned.ok).toBe(true);
  return pinned;
}

function fingerprintWorld(w: WorldRuntime) {
  const rooms = Object.fromEntries(
    Object.entries(w.players).map(([id, player]) => [
      id,
      {
        room_id: player.room_id,
        energy: player.budgets?.energy,
        attention: player.budgets?.attention,
        wait: player.wait_until_cycle ?? null,
      },
    ]),
  );
  return tempoCanonicalFingerprint({
    cycle: w.cycle,
    sequence: w.sequence,
    accepted: w.player_tempo?.last_accepted_snapshot || [],
    events: [],
  }) + JSON.stringify(rooms);
}

describe("player-tempo catalog pin artifact", () => {
  it("loads and validates the frozen catalog", () => {
    const loaded = loadPlayerTempoCatalog();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.catalog.policy_version).toBe("player-tempo/1.0");
    const onDisk = JSON.parse(
      readFileSync(join(SRC, "../src/player-tempo-catalog.1.0.json"), "utf8"),
    );
    expect(catalogJson).toEqual(onDisk);
    expect(validatePlayerTempoCatalog(catalogJson).ok).toBe(true);
    const live = loaded.catalog.modes.find((m) => m.mode === "OBSERVED_LIVE");
    expect(live?.collect_window_ms).toBe(20000);
    expect(live?.presentation_hold_ms).toBe(10000);
    expect(live?.empty_window_advances).toBe(false);
    const fast = loaded.catalog.modes.find((m) => m.mode === "FAST_TEST");
    expect(fast?.allowed_world_kinds).toEqual(["ISOLATED_TEST"]);
  });
});

describe("PT01 first distinct mutation during COLLECT", () => {
  it("accepts into the Player slot without applying verb effects", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b], "FAST_TEST");
    const beforeEnergy = w.players[a.player_id].budgets.energy;
    const beforeCycle = w.cycle;
    const r = await run(w, a, "MOVE", { direction: "east" });
    expect(r.ok).toBe(true);
    expect(r.error).toBeUndefined();
    expect(w.cycle).toBe(beforeCycle);
    expect(w.players[a.player_id].room_id).toBe("room.hub");
    expect(w.players[a.player_id].budgets.energy).toBe(beforeEnergy);
    expect(w.player_tempo?.phase).toBe("COLLECT");
    expect(w.player_tempo?.accepted).toHaveLength(1);
    expect(w.player_tempo?.accepted[0]?.verb).toBe("MOVE");
    expect(r.events || []).toEqual([]);
  });
});

describe("PT02 exact idempotent retry", () => {
  it("returns the original result and does not fill a second slot", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    const envl: CommandEnvelope = {
      request_id: "r.retry",
      idempotency_key: "idem.nacre.look",
      command: "LOOK",
      client_action_sequence: 1,
    };
    const first = await applyWorldCommand(w, a, envl, async () => true, { now: CLOCK });
    const attention = w.players[a.player_id].budgets.attention;
    const second = await applyWorldCommand(w, a, { ...envl, request_id: "r.retry.2" }, async () => true, {
      now: CLOCK,
    });
    expect(second).toEqual(first);
    expect(w.player_tempo?.accepted).toHaveLength(1);
    expect(w.players[a.player_id].budgets.attention).toBe(attention);
    expect(w.cycle).toBe(0);
  });
});

describe("PT03 second distinct mutation", () => {
  it("returns ACTION_SLOT_FILLED and does not mutate", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    await run(w, a, "LOOK");
    const attention = w.players[a.player_id].budgets.attention;
    const second = await run(w, a, "WAIT");
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("ACTION_SLOT_FILLED");
    expect(second.error?.cycle).toBe(0);
    expect(second.error?.phase).toBe("COLLECT");
    expect(w.players[a.player_id].budgets.attention).toBe(attention);
    expect(w.players[a.player_id].wait_until_cycle).toBeUndefined();
    expect(w.player_tempo?.accepted).toHaveLength(1);
  });
});

describe("PT04 mutation during RESOLVE", () => {
  it("returns PACE_LIMITED and does not mutate", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    w.player_tempo!.phase = "RESOLVE";
    const r = await run(w, a, "LOOK");
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("PACE_LIMITED");
    expect(r.error?.phase).toBe("RESOLVE");
    expect(w.cycle).toBe(0);
  });
});

describe("PT05 mutation during PRESENT", () => {
  it("returns PACE_LIMITED with retry guidance", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b], "OBSERVED_LIVE");
    w.player_tempo!.phase = "PRESENT";
    w.player_tempo!.presentation_not_before_ms = CLOCK + 10000;
    const r = await run(w, a, "LOOK", {}, CLOCK + 2500);
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("PACE_LIMITED");
    expect(r.error?.phase).toBe("PRESENT");
    expect(r.error?.retry_after_ms).toBe(7500);
  });
});

describe("PT06 participant quorum freeze", () => {
  it("resolves the accepted set in canonical order", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    const first = await run(w, a, "WAIT");
    expect(first.ok).toBe(true);
    expect(w.cycle).toBe(0);
    const second = await run(w, b, "WAIT");
    expect(second.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.player_tempo?.phase).toBe("PRESENT");
    expect(w.players[a.player_id].wait_until_cycle).toBe(1);
    expect(w.players[b.player_id].wait_until_cycle).toBe(1);
    const order = (w.player_tempo?.last_accepted_snapshot || []).map((row) => row.agent_id);
    expect(order).toEqual(["agent.nacre", "agent.vesper"]);
    expect(commitCycleIfReady(w, CLOCK)).toBe(false);
  });
});

describe("PT07 deadline with at least one accepted action", () => {
  it("freezes only accepted actions and invents no WAIT", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b], "OBSERVED_LIVE");
    await run(w, a, "WAIT", {}, CLOCK);
    expect(w.cycle).toBe(0);
    const adv = advanceTempoAdmissionClock(w, CLOCK + 20000);
    expect(adv.should_resolve).toBe(true);
    const close = await applyWorldCommand(
      w,
      b,
      { request_id: "r.observe", idempotency_key: "i.observe", command: "OBSERVE" },
      async () => true,
      { now: CLOCK + 20000 },
    );
    expect(close.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.players[a.player_id].wait_until_cycle).toBe(1);
    expect(w.players[b.player_id].wait_until_cycle).toBeUndefined();
    expect(w.player_tempo?.last_accepted_snapshot.map((row) => row.player_id)).toEqual([a.player_id]);
  });
});

describe("PT08 empty COLLECT window", () => {
  it("does not advance cycle or sequence", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a], "OBSERVED_LIVE");
    const before = { cycle: w.cycle, sequence: w.sequence };
    advanceTempoAdmissionClock(w, CLOCK + 20000);
    const look = await applyWorldCommand(
      w,
      a,
      { request_id: "r.obs", idempotency_key: "i.obs", command: "OBSERVE" },
      async () => true,
      { now: CLOCK + 20000 },
    );
    expect(look.ok).toBe(true);
    expect(w.cycle).toBe(before.cycle);
    expect(w.sequence).toBe(before.sequence);
    expect(w.player_tempo?.phase).toBe("COLLECT");
    expect(w.player_tempo?.accepted).toHaveLength(0);
  });
});

describe("PT09 arrival order independence", () => {
  it("produces the same digest for two arrival orders", async () => {
    async function play(order: Array<"nacre" | "vesper">) {
      const w = fixtureWorld();
      const a = principal("player.nacre");
      const b = principal("player.vesper");
      await enterThenPin(w, [a, b]);
      const actors = { nacre: a, vesper: b };
      let last;
      for (const name of order) {
        last = await run(w, actors[name], "MOVE", { direction: "east" });
      }
      expect(last?.ok).toBe(true);
      return {
        digest: fingerprintWorld(w),
        rooms: {
          nacre: w.players[a.player_id].room_id,
          vesper: w.players[b.player_id].room_id,
        },
        ids: (w.player_tempo?.last_accepted_snapshot || []).map((row) => row.action_id),
      };
    }
    const ab = await play(["nacre", "vesper"]);
    const ba = await play(["vesper", "nacre"]);
    expect(ab.rooms).toEqual({ nacre: "room.east", vesper: "room.east" });
    expect(ba.rooms).toEqual(ab.rooms);
    expect(ba.digest).toBe(ab.digest);
    expect(ab.ids).toEqual(ba.ids);
  });
});

describe("PT10 settlement failure during RESOLVE", () => {
  it("runs a durable commit callback before returning a resolved batch", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a]);
    const envelope = {
      request_id: "r.look.callback",
      idempotency_key: "i.look.callback",
      command: "LOOK",
    };
    const admitted = admitTempoAction(w, {
      principal: a,
      envelope,
      verb: "LOOK",
      now: CLOCK,
      worldPaused: false,
    });
    expect(admitted.ok).toBe(true);
    let committedEventCount = 0;
    const resolved = await runPinnedTempoResolve(w, async () => true, CLOCK, async (events) => {
      committedEventCount = events.length;
      return true;
    });
    expect(resolved.ok).toBe(true);
    expect(committedEventCount).toBeGreaterThan(0);
    expect(w.player_tempo?.phase).toBe("PRESENT");
  });

  it("freezes the batch when the durable commit callback rejects it", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a]);
    const envelope = {
      request_id: "r.look.commit-fail",
      idempotency_key: "i.look.commit-fail",
      command: "LOOK",
    };
    const admitted = admitTempoAction(w, {
      principal: a,
      envelope,
      verb: "LOOK",
      now: CLOCK,
      worldPaused: false,
    });
    expect(admitted.ok).toBe(true);
    const resolved = await runPinnedTempoResolve(w, async () => true, CLOCK, async () => false);
    expect(resolved.ok).toBe(false);
    expect(w.cycle).toBe(0);
    expect(w.player_tempo?.phase).toBe("RESOLVE");
    expect(w.player_tempo?.settlement_failed).toBe(true);
  });

  it("leaves the cycle uncommitted and restores verb effects", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a]);
    const beforeAttention = w.players[a.player_id].budgets.attention;
    const r = await applyWorldCommand(
      w,
      a,
      { request_id: "r.look", idempotency_key: "i.look", command: "LOOK" },
      async () => false,
      { now: CLOCK },
    );
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("SETTLEMENT_FAILED");
    expect(w.cycle).toBe(0);
    expect(w.players[a.player_id].budgets.attention).toBe(beforeAttention);
    expect(w.player_tempo?.phase).toBe("RESOLVE");
    expect(w.player_tempo?.settlement_failed).toBe(true);
  });

  it("clears the freeze through Admin recover and admits a later COLLECT action", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a]);
    const failed = await applyWorldCommand(
      w,
      a,
      { request_id: "r.look", idempotency_key: "i.look", command: "LOOK", client_action_sequence: 1 },
      async () => false,
      { now: CLOCK },
    );
    expect(failed.ok).toBe(false);
    expect(w.player_tempo?.settlement_failed).toBe(true);
    const blocked = await applyWorldCommand(
      w,
      a,
      { request_id: "r.look.2", idempotency_key: "i.look.2", command: "LOOK", client_action_sequence: 2 },
      async () => true,
      { now: CLOCK },
    );
    expect(blocked.error?.code).toBe("PACE_LIMITED");

    let persisted: WorldRuntime | null = null;
    const recovered = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: w,
        currentWorld: w,
        writerGeneration: "do.1",
      },
      {
        getHead: async () =>
          persisted
            ? {
                world_id: persisted.world_id,
                sequence: persisted.sequence,
                cycle: persisted.cycle,
                status: "ACTIVE",
                settlement_health: "HEALTHY",
                state_json: persisted,
                revision: 1,
                state_digest: "sha256:tempo-recover",
              }
            : null,
        adoptLiveHead: async (input) => {
          persisted = input.world;
          return { ok: true as const, revision: 1, sequence: input.world.sequence, idempotent: false };
        },
      },
    );
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.mode).toBe("adopt");
    expect(persisted).toBe(recovered.world);
    expect(recovered.world.player_tempo?.phase).toBe("COLLECT");
    expect(recovered.world.player_tempo?.settlement_failed).toBe(false);
    expect(recovered.world.player_tempo?.accepted).toEqual([]);
    expect(recovered.world.player_tempo?.phase_open.reason).toBe("admin-recover");
    expect(recovered.world.cycle).toBe(0);
    Object.assign(w, recovered.world);

    const retry = await applyWorldCommand(
      w,
      a,
      { request_id: "r.look", idempotency_key: "i.look", command: "LOOK", client_action_sequence: 1 },
      async () => true,
      { now: CLOCK },
    );
    expect(retry.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.player_tempo?.phase).toBe("PRESENT");
  });

  it("restores a settlement_failed head to COLLECT without inventing a pin on unpinned worlds", async () => {
    const frozen = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(frozen, [a]);
    await applyWorldCommand(
      frozen,
      a,
      { request_id: "r.look", idempotency_key: "i.look", command: "LOOK" },
      async () => false,
      { now: CLOCK },
    );
    expect(frozen.player_tempo?.settlement_failed).toBe(true);

    const restored = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: frozen,
        currentWorld: frozen,
        writerGeneration: "do.1",
      },
      {
        getHead: async () => ({
          world_id: frozen.world_id,
          sequence: frozen.sequence,
          cycle: frozen.cycle,
          status: "INCIDENT",
          settlement_health: "BLOCKING",
          state_json: structuredClone(frozen),
          revision: 3,
          state_digest: "sha256:frozen-head",
        }),
        adoptLiveHead: async () => ({ ok: false, code: "UNUSED" }),
      },
    );
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.mode).toBe("restore");
    expect(restored.world.player_tempo?.phase).toBe("COLLECT");
    expect(restored.world.player_tempo?.settlement_failed).toBe(false);

    const unpinned = fixtureWorld("world.test-unpinned-recover");
    await run(unpinned, a, "ENTER_WORLD");
    const unpinnedRecover = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: unpinned,
        currentWorld: unpinned,
        writerGeneration: "do.1",
      },
      {
        getHead: async () => ({
          world_id: unpinned.world_id,
          sequence: unpinned.sequence,
          cycle: unpinned.cycle,
          status: "INCIDENT",
          settlement_health: "BLOCKING",
          state_json: structuredClone(unpinned),
          revision: 2,
          state_digest: "sha256:unpinned",
        }),
        adoptLiveHead: async () => ({ ok: false, code: "UNUSED" }),
      },
    );
    expect(unpinnedRecover.ok).toBe(true);
    if (!unpinnedRecover.ok) return;
    expect(unpinnedRecover.world.player_tempo_policy_version).toBeUndefined();
    expect(unpinnedRecover.world.player_tempo).toBeUndefined();
    expect(unpinnedRecover.world.players[a.player_id].entered).toBe(true);
  });
});

describe("PT11 OBSERVED_LIVE presentation hold", () => {
  it("keeps the next COLLECT closed for 10000 ms without sleeping", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a], "OBSERVED_LIVE");
    const first = await run(w, a, "WAIT", {}, CLOCK);
    expect(first.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.player_tempo?.phase).toBe("PRESENT");
    const early = await run(w, a, "LOOK", {}, CLOCK + 9999);
    expect(early.ok).toBe(false);
    expect(early.error?.code).toBe("PACE_LIMITED");
    expect(early.error?.retry_after_ms).toBe(1);
    const ready = await run(w, a, "LOOK", {}, CLOCK + 10000);
    expect(ready.ok).toBe(true);
    expect(w.player_tempo?.phase).toBe("PRESENT");
    expect(w.cycle).toBe(2);
  });
});

describe("PT12 FAST_TEST on isolated world", () => {
  it("allows zero delay and still settles", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a], "FAST_TEST");
    const first = await run(w, a, "WAIT", {}, CLOCK);
    expect(first.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const second = await run(w, a, "LOOK", {}, CLOCK);
    expect(second.ok).toBe(true);
    expect(w.cycle).toBe(2);
    expect(w.players[a.player_id].budgets.attention).toBeLessThan(16);
  });
});

describe("PT13 FAST_TEST / STEP_TEST denied on production", () => {
  it("refuses fast and step modes on production and ordinary live worlds", () => {
    const production = fixtureWorld("world.perihelion-reach-3");
    production.world_kind = "PRODUCTION";
    const denied = pinPlayerTempo(production, {
      mode: "FAST_TEST",
      now: CLOCK,
      reason: "should deny",
      defaultWorldId: "world.perihelion-reach-3",
    });
    expect(denied.ok).toBe(false);
    expect(production.player_tempo_policy_version).toBeUndefined();
    expect(inferWorldKind("world-01")).toBe("PRODUCTION");
    const ordinary = fixtureWorld("world.ordinary-live");
    const step = pinPlayerTempo(ordinary, { mode: "STEP_TEST", now: CLOCK, reason: "should deny" });
    expect(step.ok).toBe(false);
    expect(changeTempoMode(ordinary, { mode: "FAST_TEST", now: CLOCK, reason: "no" }).ok).toBe(false);
  });
});

describe("PT14 STEP_TEST without operator step", () => {
  it("does not freeze or advance until the operator steps", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    await enterThenPin(w, [a], "STEP_TEST");
    const waiting = await run(w, a, "WAIT");
    expect(waiting.ok).toBe(true);
    expect(w.cycle).toBe(0);
    expect(w.players[a.player_id].wait_until_cycle).toBeUndefined();
    expect(w.player_tempo?.phase).toBe("COLLECT");
    const closed = operatorTempoTrigger(w, { trigger: "OPERATOR_STEP", now: CLOCK });
    expect(closed.ok).toBe(true);
    if (closed.ok) expect(closed.should_resolve).toBe(true);
    const observe = await applyWorldCommand(
      w,
      a,
      { request_id: "r.step-observe", idempotency_key: "i.step-observe", command: "OBSERVE" },
      async () => true,
      { now: CLOCK },
    );
    expect(observe.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.players[a.player_id].wait_until_cycle).toBe(1);
  });
});

describe("PT15 WATCH / Admin projection redaction", () => {
  it("preserves committed cycle labels and hides pre-resolve bodies", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    const pending = await run(w, a, "MOVE", { direction: "east" });
    expect(pending.ok).toBe(true);
    expect(w.player_tempo?.accepted[0]?.envelope.arguments?.direction).toBe("east");
    const admin = publicTempoProjection(w, CLOCK);
    const redacted = JSON.stringify(redactedTempoState(w.player_tempo));
    expect(admin.accepted_slot_count).toBe(1);
    expect(admin.active_participant_count).toBe(2);
    expect(redacted).not.toContain("east");
    expect(redacted).not.toContain("do-not-leak");
    expect(redacted).not.toContain("envelope");
    const resolved = await run(w, b, "WAIT");
    expect(resolved.ok).toBe(true);
    expect(resolved.events?.every((ev) => typeof ev.sequence === "number")).toBe(true);
    expect(w.players[a.player_id].room_id).toBe("room.east");
  });
});

describe("PT16 replay of recorded accepted set", () => {
  it("reproduces the digest without wall-clock waits", async () => {
    const live = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(live, [a, b], "OBSERVED_LIVE");
    await run(live, a, "MOVE", { direction: "east" }, CLOCK);
    await run(live, b, "INSPECT", { entity_id: "entity.cache" }, CLOCK);
    const recorded = live.player_tempo?.last_accepted_snapshot || [];
    expect(recorded).toHaveLength(2);
    const replayed = sortAcceptedActions(recorded).map((row) => row.action_id);
    const liveOrder = recorded.map((row) => row.action_id);
    expect(replayed).toEqual(sortAcceptedActions([...recorded].reverse()).map((row) => row.action_id));
    const digest = tempoCanonicalFingerprint({
      cycle: live.cycle,
      sequence: live.sequence,
      accepted: recorded,
    });
    const replayDigest = tempoCanonicalFingerprint({
      cycle: live.cycle,
      sequence: live.sequence,
      accepted: [...recorded].reverse(),
    });
    expect(replayDigest).toBe(digest);
    expect(liveOrder).toEqual(replayed);
    expect(live.players[a.player_id].room_id).toBe("room.east");
  });
});

describe("unpinned worlds stay on RFC-0019", () => {
  it("refuses a tempo pin while unresolved settlement candidates remain", () => {
    const w = fixtureWorld();
    w.unsettled = [{ event_id: "evt.pending", payload: { source: "pre-canonical" } }];
    const denied = pinPlayerTempo(w, { mode: "FAST_TEST", now: CLOCK, reason: "test pin" });
    expect(denied.ok).toBe(false);
    if (denied.ok) throw new Error("expected tempo pin to be denied");
    expect(denied.code).toBe("TEMPO_PIN_FORBIDDEN");
    expect(w.player_tempo).toBeUndefined();
  });

  it("still commits from WAIT quorum and applies LOOK immediately", async () => {
    const w = fixtureWorld("world.test-unpinned");
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    expect(w.players[a.player_id].budgets.attention).toBeLessThan(16);
    const waiting = await run(w, a, "WAIT");
    expect(waiting.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(waiting.events?.[0]?.payload?.cycle_committed).toBe(true);
  });

  it("ignores client-supplied tempo mode on a pinned world", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b], "OBSERVED_LIVE");
    await run(w, a, "LOOK", { mode: "FAST_TEST", tempo_mode: "FAST_TEST" });
    expect(w.player_tempo?.mode).toBe("OBSERVED_LIVE");
    expect(w.cycle).toBe(0);
  });

  it("refuses a mid-cycle pin flip", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterThenPin(w, [a, b]);
    await run(w, a, "LOOK");
    const again = pinPlayerTempo(w, { mode: "STEP_TEST", now: CLOCK, reason: "flip" });
    expect(again.ok).toBe(false);
    expect(w.player_tempo?.mode).toBe("FAST_TEST");
  });
});

describe("slot-filling verbs", () => {
  it("treats LOOK INSPECT MESSAGE MOVE WAIT TRADE as slot filling", async () => {
    for (const verb of ["LOOK", "INSPECT", "MESSAGE", "MOVE", "WAIT", "TRADE"]) {
      expect(fillsActionSlot(verb), verb).toBe(true);
    }
    expect(fillsActionSlot("OBSERVE")).toBe(false);
    const verbs = ["LOOK", "INSPECT", "MOVE", "WAIT"] as const;
    for (const verb of verbs) {
      const w = fixtureWorld(`test.hosted-canonical.slot-${verb.toLowerCase()}`);
      const a = principal("player.nacre");
      const b = principal("player.vesper");
      await enterThenPin(w, [a, b]);
      const args =
        verb === "INSPECT" ? { entity_id: "entity.cache" } : verb === "MOVE" ? { direction: "east" } : {};
      const r = await run(w, a, verb, args);
      expect(r.ok, verb).toBe(true);
      expect(w.player_tempo?.accepted[0]?.verb, verb).toBe(verb);
      expect(w.cycle, verb).toBe(0);
    }
  });
});
