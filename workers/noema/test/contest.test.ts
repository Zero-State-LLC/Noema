import { describe, expect, it } from "vitest";
import {
  outcomeFromScore,
  parseContestForm,
  scoreContest,
  seizureAmount,
} from "../src/contest";
import {
  helpText,
  normalizeStructuredCommand,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC7-S0 isolated CONTEST_DECLARE → CONTEST_RESOLVED.
 * Authority: Noema-Specs docs/GC7-FIRST-SLICE.md / RFC-0011.
 */

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
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
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
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

describe("GC7-S0 mapper", () => {
  it("matches the published INFRASTRUCTURE_DISRUPTION arithmetic", () => {
    const scored = scoreContest({
      form: "INFRASTRUCTURE_DISRUPTION",
      declarer_stake: { energy: 12, influence: 8, compute: 4 },
      defender_stake: { energy: 10, influence: 14, compute: 4 },
      infra_condition: 70,
      seed_perturbation: 17,
    });
    expect(scored.declarer_power).toBe(920);
    expect(scored.defender_power).toBe(940);
    expect(scored.infra_mod).toBe(35);
    expect(scored.score).toBe(-38);
    expect(outcomeFromScore("INFRASTRUCTURE_DISRUPTION", -38)).toBe("PARTIAL_SUCCESS");
    expect(seizureAmount("RESOURCE_SEIZURE", "PARTIAL_SUCCESS", 8)).toBe(3);
  });

  it("rejects ATTACK/SCAN and a fifth form", () => {
    const attack = parseHumanCommand("attack relay");
    expect(attack.ok).toBe(false);
    if (!attack.ok) expect(attack.code).toBe("VERB_FORBIDDEN");
    const scan = parseHumanCommand("scan east");
    expect(scan.ok).toBe(false);
    if (!scan.ok) expect(scan.code).toBe("VERB_FORBIDDEN");
    expect(parseContestForm("INFORMATION_WAR")).toBeNull();
    const bad = parseHumanCommand("contest information_war relay stake=energy:10,influence:6");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("FORM_FORBIDDEN");
    const structured = normalizeStructuredCommand("ATTACK", {});
    expect(structured.ok).toBe(false);
    if (!structured.ok) expect(structured.code).toBe("VERB_FORBIDDEN");
  });

  it("does not advertise CONTEST in Chamber help or leak HP", () => {
    const text = helpText();
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).not.toMatch(/\bcontest\b/i);
    expect(text).not.toMatch(/\bdefend\b/i);
    expect(text).not.toMatch(/\bHP\b|\bhealth bar\b/i);
  });
});

describe("GC7-S0 isolated declare → resolve", () => {
  it("declares, then WAIT quorum resolves with disruption follow-on", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const energy = w.players[p.player_id].budgets.energy;
    const declared = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
      seed_stream_id: "stream.contest.1",
    });
    expect(declared.ok).toBe(true);
    expect(declared.events?.map((e) => e.event_type)).toEqual([
      "BUDGET_CONSUMED",
      "CONTEST_DECLARED",
    ]);
    expect(declared.observation?.contests?.[0]?.contest_form).toBe("INFRASTRUCTURE_DISRUPTION");
    expect(JSON.stringify(declared.observation?.contests || [])).not.toMatch(/hidden|hp|health|hitpoints/i);
    expect(w.players[p.player_id].budgets.energy).toBe(energy - 12);
    expect(w.players[p.player_id].budgets.compute).toBe(DEFAULT_BUDGETS.compute - 2 - 4);
    expect(w.cycle).toBe(0);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const types = waited.events?.map((e) => e.event_type) || [];
    expect(types).toContain("WAIT");
    expect(types).toContain("CONTEST_RESOLVED");
    expect(types.some((t) => /^HIT|DAMAGE|DEATH|SCANNED$/.test(t))).toBe(false);
    const resolved = waited.events?.find((e) => e.event_type === "CONTEST_RESOLVED");
    expect(resolved?.payload?.resolution_digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(["SUCCESS", "PARTIAL_SUCCESS", "FAILURE"]).toContain(resolved?.payload?.outcome);
    const disrupted = waited.events?.find((e) => e.event_type === "INFRASTRUCTURE_DISRUPTED");
    if (resolved?.payload?.outcome === "SUCCESS" || resolved?.payload?.outcome === "PARTIAL_SUCCESS") {
      expect(disrupted?.payload?.cause).toBe("CONTEST");
      expect(w.rooms["room.hub"].entities[0].condition).toBeLessThan(70);
    }
    expect(Object.values(w.contests || {})[0]?.status).toBe("CLOSED");
  });

  it("fails closed on occupied-room remote declare and low stake", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await run(w, p, "MOVE", { direction: "east" });
    const remote = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(remote.ok).toBe(false);
    expect(remote.error?.code).toBe("NOT_FOUND");
    w.players[p.player_id].room_id = "room.hub";
    const energy = w.players[p.player_id].budgets.energy;
    const poor = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 1, influence: 1 },
    });
    expect(poor.ok).toBe(false);
    expect(poor.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.players[p.player_id].budgets.energy).toBe(energy);
  });

  it("lets a co-located defender reserve without a defend event", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    const energy = w.players[b.player_id].budgets.energy;
    const defended = await run(w, b, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: { energy: 10, influence: 14, compute: 4 },
    });
    expect(defended.ok).toBe(true);
    expect(defended.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED"]);
    expect(w.players[b.player_id].budgets.energy).toBe(energy - 10);
    expect(w.contests?.[contestId]?.defender_id).toBe(b.player_id);
  });
});
