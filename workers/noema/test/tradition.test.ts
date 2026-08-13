import { describe, expect, it } from "vitest";
import {
  COMPETING_LINE,
  CUSTOM_LINE,
  DORMANT_LINE,
  REVIVED_LINE,
  TRADITION_LINE,
  WATCH_CONTESTED_PULSE,
  WATCH_TRADITION_PULSE,
  applyCultureEvents,
  cultureLines,
  emptyCulture,
  publicCulturePulses,
  traditionStatus,
} from "../src/culture";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import { redactedPublicWorld } from "../src/genesis";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${controller_type}.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Relay Quarter",
        description: "A live relay.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
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
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function repairEv(id: string, cycle: number) {
  return {
    event_id: id,
    event_type: "ENTITY_UPDATE",
    payload: { entity_id: "entity.relay-7", operation: "REPAIR" },
  };
}

describe("GC9-S1 mapper", () => {
  it("does not promote a same-cycle custom and does not advertise tradition in help", () => {
    let state = emptyCulture();
    state = applyCultureEvents(state, [repairEv("e1", 0), repairEv("e2", 0), repairEv("e3", 0)], "player.nacre", 0);
    expect(cultureLines(state, ["entity.relay-7"], "player.nacre", 0)).toEqual([CUSTOM_LINE]);
    expect(publicCulturePulses(state, 0)).toEqual([]);
    expect(helpText()).not.toMatch(/\btradition\b|\britual\b|\bholiday\b|\bquest\b/i);
  });

  it("promotes after three cycles and a second accessor", () => {
    let state = emptyCulture();
    state = applyCultureEvents(state, [repairEv("e1", 1)], "player.nacre", 1);
    state = applyCultureEvents(state, [repairEv("e2", 3)], "player.nacre", 3);
    state = applyCultureEvents(state, [repairEv("e3", 5)], "player.nacre", 5);
    state = applyCultureEvents(
      state,
      [{ event_id: "i1", event_type: "INSPECT", payload: { entity_id: "entity.relay-7" } }],
      "player.vesper",
      6,
    );
    expect(traditionStatus(state.sites["entity.relay-7"], 6, [])).toBe("TRADITION");
    expect(cultureLines(state, ["entity.relay-7"], "player.vesper", 6)).toEqual([TRADITION_LINE]);
    expect(cultureLines(state, ["entity.relay-7"], "player.oriole", 6)).toEqual([]);
    expect(publicCulturePulses(state, 6)).toEqual([WATCH_TRADITION_PULSE]);
  });

  it("dorms and revives without rewriting the ledger", () => {
    let state = emptyCulture();
    state = applyCultureEvents(state, [repairEv("e1", 1)], "player.nacre", 1);
    state = applyCultureEvents(state, [repairEv("e2", 3)], "player.nacre", 3);
    state = applyCultureEvents(state, [repairEv("e3", 5)], "player.nacre", 5);
    state = applyCultureEvents(
      state,
      [{ event_id: "i1", event_type: "INSPECT", payload: { entity_id: "entity.relay-7" } }],
      "player.vesper",
      6,
    );
    expect(cultureLines(state, ["entity.relay-7"], "player.nacre", 14)).toEqual([DORMANT_LINE]);
    expect(publicCulturePulses(state, 14)).toEqual([]);
    state = applyCultureEvents(state, [repairEv("e4", 15)], "player.nacre", 15);
    expect(cultureLines(state, ["entity.relay-7"], "player.nacre", 15)).toEqual([REVIVED_LINE]);
  });

  it("cites public reconstructions and hides private contested ones from WATCH", () => {
    let state = emptyCulture();
    state = applyCultureEvents(state, [repairEv("e1", 1), repairEv("e2", 1), repairEv("e3", 1)], "player.nacre", 1);
    const cited = cultureLines(state, ["entity.relay-7"], "player.nacre", 1, [
      { subject_ref: "entity.relay-7", visibility: "PUBLIC", claim: "Keepers still tend it." },
      { subject_ref: "entity.relay-7", visibility: "PUBLIC", claim: "A betrayal at the relay." },
    ]);
    expect(cited).toEqual([TRADITION_LINE, COMPETING_LINE]);
    expect(
      publicCulturePulses(state, 1, [
        { subject_ref: "entity.relay-7", visibility: "PRIVATE", epistemic: "CONTESTED", claim: "hidden" },
      ]),
    ).toEqual([]);
    expect(
      publicCulturePulses(state, 1, [
        { subject_ref: "entity.relay-7", visibility: "PUBLIC", epistemic: "CONTESTED" },
      ]),
    ).toContain(WATCH_CONTESTED_PULSE);
  });
});

describe("GC9-S1 world integration", () => {
  it("forms a tradition across WAIT cycles without changing REPAIR cost", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre", "human");
    const b = principal("player.vesper", "agent");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const refill = () => {
      w.players[a.player_id].budgets = cloneBudgets({
        ...DEFAULT_BUDGETS,
        energy: 80,
        compute: 64,
        storage: 16,
      });
    };
    refill();
    const first = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(first.ok).toBe(true);
    await run(w, a, "WAIT");
    await run(w, b, "WAIT");
    expect(w.cycle).toBe(1);
    refill();
    await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    await run(w, a, "WAIT");
    await run(w, b, "WAIT");
    expect(w.cycle).toBe(2);
    refill();
    const third = await run(w, a, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(third.ok).toBe(true);
    expect(w.players[a.player_id].budgets.energy).toBe(80 - (COSTS.REPAIR.energy || 0));
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const inspected = await run(w, b, "INSPECT", { entity_id: "entity.relay-7" });
    expect(inspected.ok).toBe(true);
    expect(inspected.observation?.culture_lines).toEqual([TRADITION_LINE]);
    const lookA = await run(w, a, "LOOK");
    expect(lookA.observation?.culture_lines).toEqual([TRADITION_LINE]);
    expect(lookA.observation?.culture_lines?.join(" ")).not.toMatch(
      /known_truth|quest|oracle|culture score|the ledger is wrong/i,
    );
    const pulses = publicCulturePulses(
      w.culture,
      w.cycle,
      Object.values(w.reconstructions || {}).map((r) => ({
        subject_ref: r.subject_ref,
        visibility: r.visibility,
        claim: r.claim,
        epistemic: r.epistemic,
      })),
    );
    expect(pulses).toEqual([WATCH_TRADITION_PULSE]);
    const watch = redactedPublicWorld({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms as never,
      players_present: 2,
      public_pulses: pulses,
    });
    expect(watch.public_pulses).toEqual([WATCH_TRADITION_PULSE]);
    expect(JSON.stringify(watch.public_pulses)).not.toMatch(/entity\.|known_truth|player\./);
  });
});
