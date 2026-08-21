import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, normalizeStructuredCommand } from "../src/actions";
import { buildWatchLive } from "../src/watch-live";
import { mutationGroundingOk } from "../src/signal";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixture(): WorldRuntime {
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
        description: "Hub.",
        exits: [],
        entities: [
          enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE" }),
          enrichEntity({ entity_id: "entity.archive-ledger", label: "ledger", entity_type: "ARTIFACT" }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
    co_evolution: { harvest_pressure: { "room.hub": 4 }, regen_mod: {} },
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("TRADE optional signal parse", () => {
  it("attaches valid signal and rejects bad certainty", () => {
    const ok = normalizeStructuredCommand("TRADE", {
      phase: "accept",
      trade_id: "trade.1",
      signal: { grounding: "observed", certainty: 0.9 },
    });
    expect(ok.ok).toBe(true);
    if (ok.ok && ok.action.verb === "TRADE") {
      expect(ok.action.arguments.signal).toEqual({ grounding: "observed", certainty: 0.9 });
    }
    const bad = normalizeStructuredCommand("TRADE", { phase: "accept", trade_id: "trade.1", signal: { grounding: "nope" } });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("INVALID_REQUEST");
  });
});

describe("application-time grounding gate", () => {
  it("hearsay ATTEST does not write archive_claim; observed ATTEST does", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const blocked = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
      signal: { grounding: "hearsay" },
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("FORBIDDEN");
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBeUndefined();
    expect(w.players[p.player_id].image_score || 0).toBe(0);

    const ok = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
      signal: { grounding: "observed" },
    });
    expect(ok.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBe("DESTROYED");
    expect(w.players[p.player_id].image_score).toBe(1);
    expect(ok.observation?.signaling_quality).toBeDefined();
    expect(ok.observation?.cascading_risk).toBeDefined();
    expect(JSON.stringify(ok.observation)).not.toMatch(/image_score/);
  });

  it("hearsay TRADE accept does not settle; observed accept does", async () => {
    const w = fixture();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 10, compute: 10 });
    w.players[b.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 10, compute: 10, storage: 8 });
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];
    expect(tradeId).toBeTruthy();
    const blocked = await run(w, b, "TRADE", {
      phase: "accept",
      trade_id: tradeId,
      signal: { grounding: "hearsay" },
    });
    expect(blocked.ok).toBe(false);
    expect(w.trades[tradeId].status).toBe("OPEN");

    const ok = await run(w, b, "TRADE", {
      phase: "accept",
      trade_id: tradeId,
      signal: { grounding: "genesis" },
    });
    expect(ok.ok).toBe(true);
    expect(w.trades[tradeId].status).toBe("SETTLED");
    expect((w.players[a.player_id].image_score || 0) > 0).toBe(true);
    expect((w.players[b.player_id].image_score || 0) > 0).toBe(true);
  });

  it("hearsay ORG_CREATE does not create an org; missing signal does", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 8, compute: 8 });
    const blocked = await run(w, p, "ORG_CREATE", {
      name: "Hearsay League",
      charter: "We heard there is a league.",
      signal: { grounding: "hearsay" },
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("FORBIDDEN");
    expect(Object.keys(w.organizations)).toHaveLength(0);

    const ok = await run(w, p, "ORG_CREATE", {
      name: "Observed League",
      charter: "We founded a league.",
    });
    expect(ok.ok).toBe(true);
    expect(Object.keys(w.organizations)).toHaveLength(1);
    expect(w.players[p.player_id].image_score).toBe(1);
  });
});

describe("reputation privileged + second-order + justified punish", () => {
  it("second-order differs for well-behaved vs poorly-behaved counterparties", async () => {
    const w = fixture();
    const kind = principal("player.kind");
    const mean = principal("player.mean");
    const good = principal("player.good");
    const bad = principal("player.bad");
    await run(w, kind, "ENTER_WORLD");
    await run(w, mean, "ENTER_WORLD");
    await run(w, good, "ENTER_WORLD");
    await run(w, bad, "ENTER_WORLD");
    for (const id of [kind.player_id, mean.player_id, good.player_id, bad.player_id]) {
      w.players[id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 10, compute: 10, storage: 8 });
    }
    w.players[good.player_id].image_score = 4;
    w.players[bad.player_id].image_score = -2;

    const withGood = await run(w, good, "TRADE", {
      phase: "propose",
      counterparty_id: kind.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(withGood.ok).toBe(true);
    const goodTrade = Object.keys(w.trades).find((id) => w.trades[id].status === "OPEN");
    expect(goodTrade).toBeTruthy();
    const kindAccept = await run(w, kind, "TRADE", { phase: "accept", trade_id: goodTrade });
    expect(kindAccept.ok).toBe(true);
    expect(w.trades[goodTrade!].status).toBe("SETTLED");

    const withBad = await run(w, bad, "TRADE", {
      phase: "propose",
      counterparty_id: mean.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(withBad.ok).toBe(true);
    const badTrade = Object.keys(w.trades).find((id) => w.trades[id].status === "OPEN");
    expect(badTrade).toBeTruthy();
    const meanAccept = await run(w, mean, "TRADE", { phase: "accept", trade_id: badTrade });
    expect(meanAccept.ok).toBe(true);
    expect(w.trades[badTrade!].status).toBe("SETTLED");

    expect(w.players[kind.player_id].second_order).toBe(1);
    expect(w.players[mean.player_id].second_order).toBe(0);
    expect(w.players[kind.player_id].second_order).not.toBe(w.players[mean.player_id].second_order);
    expect(JSON.stringify(kindAccept.observation)).not.toMatch(/second_order/);
  });

  it("justified TRADE reject with observed signal costs punisher influence and eases harvest_pressure", async () => {
    const w = fixture();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 8, compute: 8, influence: 5 });
    w.players[b.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, compute: 8, influence: 5 });
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];
    const infBefore = w.players[b.player_id].budgets.influence;
    const pressureBefore = w.co_evolution!.harvest_pressure["room.hub"];
    const rejected = await run(w, b, "TRADE", {
      phase: "reject",
      trade_id: tradeId,
      signal: { grounding: "observed" },
    });
    expect(rejected.ok).toBe(true);
    expect(w.players[b.player_id].budgets.influence).toBe(infBefore - 1);
    expect(w.players[a.player_id].image_score).toBe(-2);
    expect(w.co_evolution!.harvest_pressure["room.hub"]).toBe(pressureBefore - 1);
  });
});

describe("WATCH leak-closed", () => {
  it("public watch projection has no image_score or reputation scalar", () => {
    const snap = buildWatchLive({
      world_id: "world.test",
      cycle: 0,
      sequence: 1,
      rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] } },
      players: [{ player_id: "player.a", handle: "a", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
      events: [],
    });
    const text = JSON.stringify(snap);
    expect(text).not.toMatch(/image_score/);
    expect(text).not.toMatch(/second_order/);
    expect(text).not.toMatch(/"reputation"/);
  });

  it("mutationGroundingOk treats missing as legal and hearsay as blocked", () => {
    expect(mutationGroundingOk(undefined)).toBe(true);
    expect(mutationGroundingOk({ grounding: "observed" })).toBe(true);
    expect(mutationGroundingOk({ grounding: "hearsay" })).toBe(false);
    expect(mutationGroundingOk({ grounding: "inferred-from-belief" })).toBe(false);
  });
});
