import { describe, expect, it } from "vitest";
import {
  classDue,
  effectiveInfraDelta,
  orbitalWaveBounds,
  CONDITION_DELTA,
  DEFENSIVE_WORK_DELTA,
} from "../src/pressure";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import {
  RECHARGE_COOLDOWN_CYCLES,
  RECHARGE_ENERGY_CAP,
  RECHARGE_ENERGY_GRANT,
  RECHARGE_GENERATOR_WEAR,
} from "../src/actions";
import type { PlayerPrincipal } from "../src/types";
import { buildWatchLive } from "../src/watch-live";
import { applyCultureEvents, emptyCulture } from "../src/culture";

function principalFor(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "agent-token",
  };
}

function makeWorld(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.rfc0136-recharge",
    world_name: "Test Reach",
    cycle: 5,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Generator Hub",
        description: "Power bay.",
        exits: [],
        entities: [
          {
            entity_id: "entity.generator.test1",
            label: "generator-1",
            entity_type: "INFRASTRUCTURE",
            infra_type: "generator",
            condition: 80,
          },
        ],
      },
    },
    players: {},
    trades: {},
    organizations: {},
    messages: [],
    seen_idempotency: {},
    unsettled: [],
  };
}

const okSettle = async () => true;

describe("RFC-0135: Perihelion Orbital Pressure Waves", () => {
  it("preserves exact cycle 1..20 GC10-S1 behavior and unlocks recurring waves every 60 cycles", () => {
    expect(classDue(3, "infrastructure_failure", 0)).toBe(false);
    expect(classDue(4, "infrastructure_failure", 0)).toBe(true);
    expect(classDue(4, "infrastructure_failure", 1)).toBe(false);
    expect(classDue(25, "infrastructure_failure", 1, 4)).toBe(false);

    expect(orbitalWaveBounds(59)).toBeNull();
    expect(orbitalWaveBounds(60)).toEqual({ waveStart: 60, waveEnd: 71, offset: 0 });
    expect(orbitalWaveBounds(72)).toBeNull();

    // Wave 1 (cycles 60..71)
    expect(classDue(60, "infrastructure_failure", 1, 4)).toBe(true);
    expect(classDue(61, "infrastructure_failure", 2, 60)).toBe(false);
    expect(classDue(63, "resource_scarcity", 1, 8)).toBe(false);
    expect(classDue(64, "resource_scarcity", 1, 8)).toBe(true);
    expect(classDue(68, "access_restriction", 1, 12)).toBe(true);
    expect(classDue(69, "access_restriction", 2, 68)).toBe(false);

    // Wave 2 (cycles 120..131)
    expect(classDue(120, "infrastructure_failure", 2, 60)).toBe(true);
    expect(effectiveInfraDelta(false)).toBe(CONDITION_DELTA);
    expect(effectiveInfraDelta(true)).toBe(DEFENSIVE_WORK_DELTA);
  });
});

describe("RFC-0136: Generator RECHARGE and band-redacted Deep Time WATCH projection", () => {
  it("recharges +4 energy at an active generator with wear and 3-cycle cooldown", async () => {
    const w = makeWorld();
    const p = principalFor("player.rivet");
    await applyWorldCommand(w, p, { request_id: "req-enter", command: "ENTER_WORLD" }, okSettle);
    const pl = w.players[p.player_id];
    pl.budgets.energy = 2;

    const look = await applyWorldCommand(w, p, { request_id: "req-look", command: "LOOK" }, okSettle);
    const aff = (look.observation?.affordances || []).find((a) => a.action === "RECHARGE");
    expect(aff?.available).toBe(true);

    const r1 = await applyWorldCommand(
      w,
      p,
      {
        request_id: "req-r1",
        command: "COMMIT",
        arguments: { operation: "RECHARGE", entity_id: "entity.generator.test1" },
      },
      okSettle,
    );
    expect(r1.ok).toBe(true);
    expect(pl.budgets.energy).toBe(Math.min(RECHARGE_ENERGY_CAP, 2 + RECHARGE_ENERGY_GRANT));
    const gen = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.generator.test1");
    expect(gen?.condition).toBe(80 - RECHARGE_GENERATOR_WEAR);

    // Cooldown rejects immediate second recharge
    const r2 = await applyWorldCommand(
      w,
      p,
      {
        request_id: "req-r2",
        command: "COMMIT",
        arguments: { operation: "RECHARGE", entity_id: "entity.generator.test1" },
      },
      okSettle,
    );
    expect(r2.ok).toBe(false);

    // After RECHARGE_COOLDOWN_CYCLES, succeeds again up to cap
    w.cycle += RECHARGE_COOLDOWN_CYCLES;
    const r3 = await applyWorldCommand(
      w,
      p,
      {
        request_id: "req-r3",
        command: "COMMIT",
        arguments: { operation: "RECHARGE", entity_id: "entity.generator.test1" },
      },
      okSettle,
    );
    expect(r3.ok).toBe(true);
    expect(pl.budgets.energy).toBe(RECHARGE_ENERGY_CAP);
  });

  it("projects band-redacted Deep Time and Culture fields onto public rooms and omits hidden rooms/raw scalars", () => {
    let culture = emptyCulture();
    for (let i = 1; i <= 3; i++) {
      culture = applyCultureEvents(
        culture,
        [{ event_id: `ev.r${i}`, event_type: "ENTITY_UPDATE", payload: { entity_id: "entity.relay-7", operation: "REPAIR" } }],
        i === 1 ? "player.a" : "player.b",
        i,
      );
    }
    const snap = buildWatchLive({
      world_id: "world.test-dt",
      cycle: 10,
      sequence: 50,
      rooms: {
        "room.relay": {
          room_id: "room.relay",
          name: "Relay Quarter",
          description: "Relays",
          exits: [],
          entities: [{ entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE" }],
        },
        "room.secret": {
          room_id: "room.secret",
          name: "Hidden Vault",
          description: "Secret",
          hidden: true,
          exits: [],
          entities: [],
        },
      },
      players: [
        {
          player_id: "player.rivet",
          handle: "Rivet-Custodian",
          room_id: "room.relay",
          entered: true,
          last_seen_ms: Date.now(),
          public_activity: true,
        },
      ],
      events: [
        {
          event_type: "ENTITY_UPDATE",
          sequence: 49,
          cycle: 10,
          player_id: "player.rivet",
          handle: "Rivet-Custodian",
          payload: { entity_id: "entity.relay-7", operation: "RECHARGE", from: 80, to: 78 },
        },
      ],
      scars: [
        { room_id: "room.relay", strength: 0.72, visibility: "public", domain: "economic", fossilized: true },
        { room_id: "room.relay", strength: 0.9, visibility: "hidden", domain: "social" },
        { room_id: "room.secret", strength: 0.9, visibility: "public", domain: "economic" },
      ],
      harvest_pressure: { "room.relay": 9, "room.secret": 20 },
      lore_attractors: [
        { room_id: "room.relay", label: "First Relay Surge", weight: 0.85, basin: "crystallized" },
        { room_id: "room.secret", label: "Secret Lore", weight: 0.95, basin: "crystallized" },
      ],
      culture,
    });

    const rooms = snap.rooms as Array<Record<string, unknown>>;
    expect(rooms).toHaveLength(1);
    const relay = rooms[0];
    expect(relay.scar_band).toBe("deep");
    expect(relay.scar_fossilized).toBe(true);
    expect(relay.pressure_band).toBe("moderate");
    expect(relay.lore_state).toBe("crystallized");
    expect(relay.lore_label).toBe("First Relay Surge");
    expect(relay.tradition_status).toBe("TRADITION");
    const serialized = JSON.stringify(snap);
    expect(serialized).not.toContain("0.72");
    expect(serialized).not.toContain("Secret Lore");
    expect(serialized).not.toContain("room.secret");
    const acts = relay.room_activity as Array<Record<string, unknown>>;
    expect(acts.some((a) => a.verb === "recharge")).toBe(true);
  });
});
