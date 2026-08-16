import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
} from "../src/actions";
import {
  creditAcceptedTrade,
  creditDangerEvidence,
  creditsFromDeceptiveEvent,
  emptyDangerMemory,
  emptyDeceptiveMemory,
  emptyTradeMemory,
  liveHostileToward,
  socialMemoryLines,
  tradeCautionCost,
  watchPublicDescriptorLines,
} from "../src/social-memory";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { emptyTreasury } from "../src/offices";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

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
    world_id: "test.hosted-canonical.gc3-s2-s6",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "Trade floor.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          }),
        ],
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
) {
  const envl: CommandEnvelope = {
    request_id: `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC3-S2 WATCH public bands", () => {
  it("public contest → WATCH dangerous band; three TRADE_ACCEPTED stay silent", () => {
    const handles = { "player.nacre": "Nacre", "player.vesper": "Vesper" };
    const contestLines = watchPublicDescriptorLines(
      [
        {
          event_id: "evt.1",
          event_type: "CONTEST_RESOLVED",
          payload: {
            contest_id: "contest.0001",
            declarer_id: "player.nacre",
            defender_id: "player.vesper",
          },
        },
      ],
      handles,
    );
    expect(contestLines).toEqual(["Nacre is publicly dangerous."]);

    const tradeLines = watchPublicDescriptorLines(
      [1, 2, 3].map((i) => ({
        event_id: `evt.t${i}`,
        event_type: "TRADE_ACCEPTED",
        payload: { trade_id: `trade.${i}`, proposer_id: "player.nacre", counterparty_id: "player.vesper" },
      })),
      handles,
    );
    expect(tradeLines).toEqual([]);

    const rejectLines = watchPublicDescriptorLines(
      [
        {
          event_id: "evt.r",
          event_type: "TRADE_REJECTED",
          payload: { trade_id: "trade.x", reason: "DECLINED" },
        },
        {
          event_id: "evt.priv",
          event_type: "AGREEMENT_BROKEN",
          payload: {
            breach_id: "breach.priv",
            broken_by: "player.nacre",
            party_ids: ["player.nacre", "player.vesper"],
            visibility: "PRIVATE",
          },
        },
      ],
      handles,
    );
    expect(rejectLines).toEqual([]);

    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.gc3-s2-s6",
      cycle: 1,
      sequence: 4,
      rooms: {},
      players: [],
      events: [
        {
          event_type: "CONTEST_RESOLVED",
          sequence: 4,
          cycle: 1,
          payload: {
            contest_id: "contest.0001",
            declarer_id: "player.nacre",
            defender_id: "player.vesper",
          },
        },
      ],
      handles,
    });
    expect(snap.public_descriptor_lines).toEqual(["Nacre is publicly dangerous."]);
  });
});

describe("GC3-S4 decay/rehab", () => {
  it("danger at cycle 0 omitted at cycle 13; three later trades omit danger and keep trade line", () => {
    let danger = emptyDangerMemory();
    danger = creditDangerEvidence(danger, "player.nacre", "contest.old", 0);
    expect(
      socialMemoryLines(emptyTradeMemory(), { "player.nacre": "Nacre" }, danger, { asOfCycle: 13 }),
    ).toEqual([]);

    let trade = emptyTradeMemory();
    trade = creditAcceptedTrade(trade, "player.nacre", "trade.r1", 1);
    trade = creditAcceptedTrade(trade, "player.nacre", "trade.r2", 2);
    trade = creditAcceptedTrade(trade, "player.nacre", "trade.r3", 3);
    const lines = socialMemoryLines(trade, { "player.nacre": "Nacre" }, danger, { asOfCycle: 4 });
    expect(lines).toContain("You have found Nacre reliable in trade.");
    expect(lines).not.toContain("You have found Nacre dangerous.");
  });
});

describe("GC3-S6 deceptive", () => {
  it("TRADE_REJECTED and CONTEST_RESOLVED do not credit deceptive; AGREEMENT_BROKEN does", () => {
    expect(
      creditsFromDeceptiveEvent({
        event_id: "e1",
        event_type: "TRADE_REJECTED",
        payload: { trade_id: "trade.x", reason: "DECLINED" },
      }),
    ).toEqual([]);
    expect(
      creditsFromDeceptiveEvent({
        event_id: "e2",
        event_type: "CONTEST_RESOLVED",
        payload: { contest_id: "contest.x", declarer_id: "player.nacre", defender_id: "player.vesper" },
      }),
    ).toEqual([]);
    expect(
      creditsFromDeceptiveEvent({
        event_id: "e3",
        event_type: "AGREEMENT_BROKEN",
        payload: {
          breach_id: "breach.1",
          broken_by: "player.nacre",
          party_ids: ["player.nacre", "player.vesper"],
        },
      }),
    ).toEqual([{ player_id: "player.vesper", other_id: "player.nacre", evidence_id: "breach.1" }]);
  });
});

describe("GC3-S5 TRADE_CAUTION", () => {
  it("live hostile → extra compute 1 and auto_reject false; no live edge → extra 0", () => {
    const live = tradeCautionCost(true);
    expect(live.extra_compute).toBe(1);
    expect(live.auto_reject).toBe(false);
    expect(live.reason_code).toBe("TRADE_CAUTION");
    const idle = tradeCautionCost(false);
    expect(idle.extra_compute).toBe(0);
    expect(idle.auto_reject).toBe(false);
    expect(idle.reason_code).toBeNull();
  });
});

describe("GC3-S2–S6 world path", () => {
  it("three accepted trades stay off WATCH; org acting_for trade is officer PLAY only; caution surcharges propose", async () => {
    const w = fixtureWorld();
    const founder = principal("player.nacre");
    const treas = principal("player.vesper");
    const outsider = principal("player.oriole");
    await run(w, founder, "ENTER_WORLD");
    await run(w, treas, "ENTER_WORLD");
    await run(w, outsider, "ENTER_WORLD");
    w.players[founder.player_id].handle = "Nacre";
    w.players[treas.player_id].handle = "Vesper";
    w.players[outsider.player_id].handle = "Oriole";
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[outsider.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    await run(w, founder, "COMMIT", {
      operation: "ORG_CREATE",
      name: "Line",
      charter: "Keep the grid.",
      org_id: "org.line",
    });
    await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: "org.line",
      agent_id: treas.player_id,
      role: "member",
    });
    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_CREATE",
      org_id: "org.line",
      display_name: "Treasurer",
      authority_profile: "OPERATE_RESOURCE_ACCOUNT",
    });
    const officeId = Object.keys(w.organizations["org.line"].offices || {})[0];
    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_ASSIGN",
      org_id: "org.line",
      office_id: officeId,
      agent_id: treas.player_id,
    });
    const treasury = w.organizations["org.line"].treasury || emptyTreasury();
    treasury.energy = 20;
    treasury.compute = 20;
    treasury.storage = 10;
    w.organizations["org.line"].treasury = treasury;
    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const orgTrade = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: outsider.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
      acting_for: "org.line",
      office_id: officeId,
    });
    expect(orgTrade.ok).toBe(true);
    const tradeId = Object.keys(w.trades).find((id) => w.trades[id].status === "OPEN");
    expect(tradeId).toBeTruthy();
    w.players[outsider.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const acc = await run(w, outsider, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(acc.ok).toBe(true);

    const lookOfficer = await run(w, founder, "LOOK");
    const lookOther = await run(w, outsider, "LOOK");
    expect(lookOfficer.observation?.social_memory_lines).toContain("Line has traded with Oriole.");
    expect(lookOther.observation?.social_memory_lines || []).not.toContain("Line has traded with Oriole.");

    const watchAfterTrades = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: {},
      players: [],
      events: (w.public_social_events || []).map((ev, i) => ({
        event_type: ev.event_type,
        sequence: i,
        payload: ev.payload,
      })),
      handles: { "player.nacre": "Nacre", "player.vesper": "Vesper", "player.oriole": "Oriole" },
    });
    expect(watchAfterTrades.public_descriptor_lines).toEqual([]);

    const declared = await run(w, founder, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    await run(w, treas, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: { energy: 10, influence: 14, compute: 4 },
    });
    await run(w, founder, "WAIT");
    await run(w, treas, "WAIT");
    await run(w, outsider, "WAIT");

    const watchAfterContest = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: {},
      players: [],
      events: (w.public_social_events || []).map((ev, i) => ({
        event_type: ev.event_type,
        sequence: i,
        payload: ev.payload,
      })),
      handles: { "player.nacre": "Nacre", "player.vesper": "Vesper", "player.oriole": "Oriole" },
    });
    expect(watchAfterContest.public_descriptor_lines).toContain("Nacre is publicly dangerous.");

    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = w.players[treas.player_id].budgets.compute;
    const cautioned = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(cautioned.ok).toBe(true);
    expect(w.players[treas.player_id].budgets.compute).toBe(before - (COSTS.TRADE.compute! + 1));
    expect(tradeCautionCost(true).auto_reject).toBe(false);
    expect(
      liveHostileToward(
        w.players[treas.player_id].danger_memory,
        w.players[treas.player_id].deceptive_memory,
        w.players[treas.player_id].trade_memory,
        founder.player_id,
        w.cycle,
      ),
    ).toBe(true);
  });

  it("rejected trade still creates no deceptive line", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[b.player_id].handle = "Vesper";
    await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    const tradeId = Object.keys(w.trades)[0];
    await run(w, b, "TRADE", { phase: "reject", trade_id: tradeId });
    const lookA = await run(w, a, "LOOK");
    expect(lookA.observation?.social_memory_lines || []).not.toContain("You have found Vesper deceptive.");
    expect(emptyDeceptiveMemory().edges).toEqual({});
  });
});
