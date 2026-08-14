import { describe, expect, it } from "vitest";
import { DELAYED_MESSAGE, UNREACHABLE_REASON } from "../src/communication";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import {
  WATCH_CONFLICT_PULSE,
  WATCH_REPORT_PULSE,
  epistemicFor,
  independentSourceCount,
  publicRumorPulses,
} from "../src/rumor";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(condition = 70): WorldRuntime {
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
            condition,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "East Gate",
        description: "A far room.",
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
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function enterTrio(w: WorldRuntime) {
  const nacre = principal("player.nacre");
  const vesper = principal("player.vesper");
  const oriel = principal("player.oriel", "agent");
  await run(w, nacre, "ENTER_WORLD");
  await run(w, vesper, "ENTER_WORLD");
  await run(w, oriel, "ENTER_WORLD");
  for (const p of [nacre, vesper, oriel]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  return { nacre, vesper, oriel };
}

describe("GC5-S2 rumor", () => {
  it("does not advertise rumor verbs", () => {
    const text = helpText();
    expect(text).not.toMatch(/\bRUMOR\b/);
    expect(text).not.toMatch(/\bpass\b|\brepeat\b|\breport\b/);
  });

  it("A tells B a claim; B holds it after delivery", async () => {
    const w = fixtureWorld();
    const { nacre, vesper } = await enterTrio(w);
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
    const claimId = r.events?.[0].payload?.claim_id as string;
    expect(claimId).toMatch(/^claim\./);
    expect(w.rumor?.holders[vesper.player_id]).toContain(claimId);
    expect(w.rumor?.claims[claimId].originator_ref).toBe(nacre.player_id);
    const look = await run(w, vesper, "LOOK");
    expect(look.observation?.rumor_lines?.some((l) => /heard a report/i.test(l))).toBe(true);
    expect(JSON.stringify(look.observation)).not.toMatch(/known_truth|rumor_score|lied/i);
  });

  it("B retells unchanged to C; same claim_id; origin stays A", async () => {
    const w = fixtureWorld();
    const { nacre, vesper, oriel } = await enterTrio(w);
    const first = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    const claimId = first.events?.[0].payload?.claim_id as string;
    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const second = await run(w, vesper, "MESSAGE", {
      recipient_id: oriel.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      parent_claim_id: claimId,
    });
    expect(second.ok).toBe(true);
    expect(second.events?.[0].payload?.claim_id).toBe(claimId);
    expect(w.rumor?.claims[claimId].originator_ref).toBe(nacre.player_id);
    expect(w.rumor?.holders[oriel.player_id]).toContain(claimId);
    expect(independentSourceCount(w.rumor!, claimId)).toBe(1);
  });

  it("material change creates a derived claim and leaves the original", async () => {
    const w = fixtureWorld();
    const { nacre, vesper, oriel } = await enterTrio(w);
    const first = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    const parentId = first.events?.[0].payload?.claim_id as string;
    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const second = await run(w, vesper, "MESSAGE", {
      recipient_id: oriel.player_id,
      text: "The hub relay was sabotaged.",
      as_claim: true,
      parent_claim_id: parentId,
    });
    const derivedId = second.events?.[0].payload?.claim_id as string;
    expect(derivedId).not.toBe(parentId);
    expect(w.rumor?.claims[parentId].content).toBe("The hub relay failed.");
    expect(w.rumor?.claims[derivedId].derived_from).toBe(parentId);
    expect(w.rumor?.claims[derivedId].origin_claim_id).toBe(parentId);
  });

  it("two independent origins with same text are corroborated, not truth", async () => {
    const w = fixtureWorld();
    const { nacre, vesper, oriel } = await enterTrio(w);
    await run(w, nacre, "MESSAGE", {
      recipient_id: oriel.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const second = await run(w, vesper, "MESSAGE", {
      recipient_id: oriel.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    const claimId = second.events?.[0].payload?.claim_id as string;
    const claim = w.rumor!.claims[claimId];
    expect(independentSourceCount(w.rumor!, claimId)).toBe(2);
    expect(epistemicFor(w.rumor!, claim, w.cycle)).toBe("CORROBORATED");
    const look = await run(w, oriel, "LOOK");
    expect(look.observation?.rumor_lines?.some((l) => /independent report agrees/i.test(l))).toBe(true);
    expect(JSON.stringify(look.observation)).not.toMatch(/known_truth/i);
  });

  it("delayed long-range rumor delivers on the next cycle", async () => {
    const w = fixtureWorld(25);
    const nacre = principal("player.nacre");
    const vesper = principal("player.vesper");
    await run(w, nacre, "ENTER_WORLD");
    await run(w, vesper, "ENTER_WORLD");
    w.players[nacre.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, nacre, "MOVE", { direction: "east" });
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The east gate is closed.",
      as_claim: true,
      subject_ref: "room.east",
    });
    expect(r.ok).toBe(true);
    expect(r.observation?.consequence).toBe(DELAYED_MESSAGE);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(w.rumor?.holders[vesper.player_id] || []).toEqual([]);
    w.players[vesper.player_id].wait_until_cycle = w.cycle + 1;
    await run(w, nacre, "WAIT");
    const claimId = Object.keys(w.rumor?.claims || {})[0];
    expect(w.rumor?.holders[vesper.player_id]).toContain(claimId);
  });

  it("UNREACHABLE does not create a recipient claim", async () => {
    const w = fixtureWorld(24);
    const { nacre, vesper } = await enterTrio(w);
    await run(w, nacre, "MOVE", { direction: "east" });
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "secret-signal",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe(UNREACHABLE_REASON);
    expect(Object.keys(w.rumor?.claims || {})).toEqual([]);
    expect(w.rumor?.holders[vesper.player_id] || []).toEqual([]);
  });

  it("rejects unknown parent, forge, and idempotent duplicate", async () => {
    const w = fixtureWorld();
    const { nacre, vesper } = await enterTrio(w);
    const missing = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      parent_claim_id: "claim.missing",
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");

    const first = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    }, "idem.rumor.1");
    expect(first.ok).toBe(true);
    const replay = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    }, "idem.rumor.1");
    expect(replay.ok).toBe(true);
    expect(w.rumor?.transmissions).toHaveLength(1);
  });

  it("human and agent have the same hold and delay rules", async () => {
    const w = fixtureWorld();
    const human = principal("player.nacre", "human");
    const agent = principal("player.vesper", "agent");
    await run(w, human, "ENTER_WORLD");
    await run(w, agent, "ENTER_WORLD");
    w.players[human.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[agent.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, human, "MESSAGE", {
      recipient_id: agent.player_id,
      text: "The hub relay failed.",
      as_claim: true,
      subject_ref: "entity.relay-7",
    });
    const claimId = Object.keys(w.rumor!.claims)[0];
    expect(w.rumor?.holders[agent.player_id]).toContain(claimId);
    const lookH = await run(w, human, "LOOK");
    const lookA = await run(w, agent, "LOOK");
    expect(lookH.observation?.rumor_lines?.length).toBeGreaterThan(0);
    expect(lookA.observation?.rumor_lines?.length).toBeGreaterThan(0);
  });

  it("WATCH pulses public claims without private text", async () => {
    const w = fixtureWorld();
    const { nacre } = await enterTrio(w);
    w.organizations["org.line"] = {
      org_id: "org.line",
      name: "Line",
      charter: "Keep the grid.",
      status: "ACTIVE",
      creator_id: nacre.player_id,
      created_cycle: 0,
      members: [{ agent_id: nacre.player_id, role: "founder" }],
      offices: {
        "off.notice": {
          office_id: "off.notice",
          institution_id: "org.line",
          display_name: "Crier",
          status: "OCCUPIED",
          holder_player_id: nacre.player_id,
          authority_profile: "PUBLISH_NOTICE",
          created_cycle: 0,
          history: [],
        },
      },
    };
    const posted = await run(w, nacre, "COMMIT", {
      operation: "ORG_OFFICE_ACT",
      org_id: "org.line",
      notice: "The north relay is dark.",
    });
    expect(posted.ok).toBe(true);
    const pulses = publicRumorPulses(w.rumor);
    expect(pulses).toContain(WATCH_REPORT_PULSE);
    expect(JSON.stringify(pulses)).not.toMatch(/The north relay is dark|player\.nacre|secret/i);
    expect(pulses).not.toContain(WATCH_CONFLICT_PULSE);
  });

  it("marks a held claim stale after 8 cycles without rewriting it", async () => {
    const w = fixtureWorld();
    const { nacre, vesper } = await enterTrio(w);
    await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "The east exit is closed.",
      as_claim: true,
      subject_ref: "room.east",
    });
    const claim = Object.values(w.rumor!.claims)[0];
    expect(epistemicFor(w.rumor!, claim, 8)).toBe("STALE");
    expect(w.rumor!.claims[claim.claim_id].content).toBe("The east exit is closed.");
  });
});
