import { describe, expect, it } from "vitest";
import {
  creditAcceptedTrade,
  creditDangerEvidence,
  creditsFromDangerEvent,
  creditsFromTradeAccepted,
  emptyDangerMemory,
  emptyTradeMemory,
  socialMemoryLines,
} from "../src/social-memory";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("GC3-S0 mapper", () => {
  it("credits both parties on TRADE_ACCEPTED and ignores rejects", () => {
    const trades = {
      "trade.1": { proposer_id: "player.nacre", counterparty_id: "player.vesper" },
    };
    expect(
      creditsFromTradeAccepted(
        { event_id: "e1", event_type: "TRADE_ACCEPTED", payload: { trade_id: "trade.1" } },
        trades,
      ),
    ).toHaveLength(2);
    expect(
      creditsFromTradeAccepted(
        {
          event_id: "e2",
          event_type: "TRADE_REJECTED",
          payload: { trade_id: "trade.1", rejected_by: "player.vesper" },
        },
        trades,
      ),
    ).toEqual([]);
  });

  it("reaches RELIABLE at three distinct trades and never prints amounts", () => {
    let mem = emptyTradeMemory();
    mem = creditAcceptedTrade(mem, "player.vesper", "trade.1");
    mem = creditAcceptedTrade(mem, "player.vesper", "trade.1");
    expect(socialMemoryLines(mem, { "player.vesper": "Vesper" })).toEqual([
      "You have traded with Vesper.",
    ]);
    mem = creditAcceptedTrade(mem, "player.vesper", "trade.2");
    mem = creditAcceptedTrade(mem, "player.vesper", "trade.3");
    const lines = socialMemoryLines(mem, { "player.vesper": "Vesper" });
    expect(lines).toEqual(["You have found Vesper reliable in trade."]);
    expect(lines.join(" ")).not.toMatch(/amount|stock|entity_id|hidden|reputation|72/i);
  });
});

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
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC3-S0 world integration", () => {
  it("three accepted trades produce private reliable lines without changing TRADE cost", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[b.player_id].handle = "Vesper";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    for (let i = 0; i < 3; i += 1) {
      const computeBefore = w.players[a.player_id].budgets.compute;
      const prop = await run(w, a, "TRADE", {
        phase: "propose",
        counterparty_id: b.player_id,
        offered: { energy: 1 },
        requested: { compute: 1 },
      });
      expect(prop.ok).toBe(true);
      expect(w.players[a.player_id].budgets.compute).toBe(computeBefore - COSTS.TRADE.compute!);
      const tradeId = Object.keys(w.trades).find((id) => w.trades[id].status === "OPEN");
      expect(tradeId).toBeTruthy();
      w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
      const acc = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
      expect(acc.ok).toBe(true);
    }

    const lookA = await run(w, a, "LOOK");
    const lookB = await run(w, b, "LOOK");
    expect(lookA.observation?.social_memory_lines).toContain(
      "You have found Vesper reliable in trade.",
    );
    expect(lookB.observation?.social_memory_lines).toContain(
      "You have found Nacre reliable in trade.",
    );
    expect(JSON.stringify(lookA.observation?.players_here || [])).not.toMatch(/reliable|traded with/i);
    expect(lookA.observation?.social_memory_lines?.join(" ")).not.toMatch(/energy|stock|72/i);
  });

  it("rejected trades do not create memory", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    const tradeId = Object.keys(w.trades)[0];
    await run(w, b, "TRADE", { phase: "reject", trade_id: tradeId });
    const look = await run(w, a, "LOOK");
    expect(look.observation?.social_memory_lines || []).toEqual([]);
  });
});

describe("GC3-S1 mapper", () => {
  it("credits defender only on CONTEST_RESOLVED and ignores declare/reject", () => {
    expect(
      creditsFromDangerEvent({
        event_id: "e1",
        event_type: "CONTEST_DECLARED",
        payload: { contest_id: "contest.0001", declarer_id: "player.nacre", defender_id: "player.vesper" },
      }),
    ).toEqual([]);
    expect(
      creditsFromDangerEvent({
        event_id: "e2",
        event_type: "TRADE_REJECTED",
        payload: { trade_id: "trade.x", reason: "DECLINED" },
      }),
    ).toEqual([]);
    expect(
      creditsFromDangerEvent({
        event_id: "e3",
        event_type: "CONTEST_RESOLVED",
        payload: {
          contest_id: "contest.0001",
          declarer_id: "player.nacre",
          defender_id: "player.vesper",
        },
      }),
    ).toEqual([
      { player_id: "player.vesper", other_id: "player.nacre", evidence_id: "contest.0001" },
    ]);
  });

  it("credits AGREEMENT_BROKEN parties and CRIME_DETECTED victim only", () => {
    expect(
      creditsFromDangerEvent({
        event_id: "e4",
        event_type: "AGREEMENT_BROKEN",
        payload: {
          breach_id: "breach.1",
          broken_by: "player.nacre",
          party_ids: ["player.nacre", "player.vesper"],
        },
      }),
    ).toEqual([
      { player_id: "player.vesper", other_id: "player.nacre", evidence_id: "breach.1" },
    ]);
    expect(
      creditsFromDangerEvent({
        event_id: "e5",
        event_type: "CRIME_DETECTED",
        payload: {
          detection_id: "det.1",
          victim_id: "player.vesper",
          subject_id: "player.nacre",
        },
      }),
    ).toEqual([
      { player_id: "player.vesper", other_id: "player.nacre", evidence_id: "det.1" },
    ]);
  });

  it("projects the danger line independently of trade reliability", () => {
    let danger = emptyDangerMemory();
    danger = creditDangerEvidence(danger, "player.nacre", "contest.0001");
    danger = creditDangerEvidence(danger, "player.nacre", "contest.0001");
    let trade = emptyTradeMemory();
    trade = creditAcceptedTrade(trade, "player.nacre", "trade.1");
    const lines = socialMemoryLines(trade, { "player.nacre": "Nacre" }, danger);
    expect(lines).toContain("You have traded with Nacre.");
    expect(lines).toContain("You have found Nacre dangerous.");
    expect(lines.join(" ")).not.toMatch(/amount|stock|entity_id|hidden|reputation|hp/i);
  });
});

describe("GC3-S1 world integration", () => {
  it("resolved contest marks the defender only; declarer and third party stay empty", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.oriole");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[b.player_id].handle = "Vesper";
    w.players[c.player_id].handle = "Oriole";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    const defended = await run(w, b, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: { energy: 10, influence: 14, compute: 4 },
    });
    expect(defended.ok).toBe(true);

    await run(w, a, "WAIT");
    expect(w.cycle).toBe(0);
    const waitB = await run(w, b, "WAIT");
    expect(w.cycle).toBe(0);
    const waitC = await run(w, c, "WAIT");
    expect(waitC.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const resolvedEv = (waitB.events || []).concat(waitC.events || []).find(
      (e) => e.event_type === "CONTEST_RESOLVED",
    );
    expect(resolvedEv).toBeTruthy();
    expect(resolvedEv?.payload?.declarer_id).toBe(a.player_id);
    expect(resolvedEv?.payload?.defender_id).toBe(b.player_id);

    const lookB = await run(w, b, "LOOK");
    const lookA = await run(w, a, "LOOK");
    const lookC = await run(w, c, "LOOK");
    expect(lookB.observation?.social_memory_lines).toContain("You have found Nacre dangerous.");
    expect(lookA.observation?.social_memory_lines || []).not.toContain(
      "You have found Vesper dangerous.",
    );
    expect(lookC.observation?.social_memory_lines || []).not.toContain("You have found Nacre dangerous.");
    expect(lookC.observation?.social_memory_lines || []).toContain("Nacre is publicly dangerous.");
    expect(JSON.stringify(lookB.observation?.players_here || [])).not.toMatch(/dangerous/i);
    expect(lookB.observation?.social_memory_lines?.join(" ")).not.toMatch(
      /amount|stock|entity_id|hidden|reputation|hp|contest_id/i,
    );
  });

  it("rejected trades still do not create danger", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    const tradeId = Object.keys(w.trades)[0];
    await run(w, b, "TRADE", { phase: "reject", trade_id: tradeId });
    const lookA = await run(w, a, "LOOK");
    const lookB = await run(w, b, "LOOK");
    expect(lookA.observation?.social_memory_lines || []).toEqual([]);
    expect(lookB.observation?.social_memory_lines || []).toEqual([]);
  });
});
