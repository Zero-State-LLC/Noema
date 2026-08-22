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
          enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE", condition: 90 }),
          enrichEntity({ entity_id: "entity.archive-ledger", label: "ledger", entity_type: "ARTIFACT" }),
          {
            ...enrichEntity({
              entity_id: "entity.salvage-cache",
              label: "salvage cache",
              entity_type: "RESOURCE",
              stock_resource: "materials",
              stock_amount: 8,
            }),
            max_stock: 18,
            regen_rate: 1,
          },
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
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(ok.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBe("OPERATING");
    expect(w.players[p.player_id].image_score).toBe(1);
    expect((w.co_evolution?.protocol_strength || {})["room.hub"]).toBeGreaterThanOrEqual(1);
    expect(ok.observation?.signaling_quality).toBeDefined();
    expect(ok.observation?.cascading_risk).toBeDefined();
    expect(ok.observation?.reputation_summary?.self_image).toBe(1);
    expect(ok.observation?.active_norms?.org_create_influence).toBe(5);
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
    expect(kindAccept.observation?.reputation_summary?.self_second_order).toBeDefined();
    expect(JSON.stringify(kindAccept.observation?.players_here || [])).not.toMatch(/second_order/);
  });

  it("justified TRADE reject with observed signal costs punisher influence; pressure untouched (RFC-0123)", async () => {
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
    // RFC-0123: a social sanction never mutates EWM extraction pressure.
    expect(w.co_evolution!.harvest_pressure["room.hub"]).toBe(pressureBefore);
    // RFC-0123: the sanction is visible to the punisher, not silent.
    expect(rejected.observation?.consequence || "").toContain("cost 1 influence");
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
    expect(text).not.toMatch(/reputation_summary/);
    expect(text).not.toMatch(/active_norms/);
    expect(text).not.toMatch(/protocol_strength/);
    expect(text).not.toMatch(/"reputation"/);
  });

  it("DESTROYED ATTEST on a sound relay is ontologically FORBIDDEN", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const blocked = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
      signal: { grounding: "observed" },
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("FORBIDDEN");
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBeUndefined();
  });

  it("ATTEST assumption entity.* must be in the room", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const blocked = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed", assumptions: ["entity.nope"] },
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.message).toMatch(/assumption/i);
  });

  it("grounded compact MESSAGE under harvest pressure raises protocol_strength by 2", async () => {
    const w = fixture();
    w.co_evolution!.harvest_pressure["room.hub"] = 5;
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, compute: 8 });
    const before = w.co_evolution!.protocol_strength?.["room.hub"] || 0;
    const r1 = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "stock is thin",
      signal: { grounding: "observed" },
    });
    expect(r1.ok).toBe(true);
    const r2 = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "still thin",
      signal: { grounding: "observed" },
    });
    expect(r2.ok).toBe(true);
    expect((w.co_evolution!.protocol_strength || {})["room.hub"]).toBe(before + 4);
    expect(r2.observation?.protocol_strength).toBe(before + 4);
  });

  it("TRADE accept affordance hints standing vs trustworthy", async () => {
    const w = fixture();
    const weak = principal("player.weak");
    const strong = principal("player.strong");
    const acc = principal("player.acc");
    await run(w, weak, "ENTER_WORLD");
    await run(w, strong, "ENTER_WORLD");
    await run(w, acc, "ENTER_WORLD");
    for (const id of [weak.player_id, strong.player_id, acc.player_id]) {
      w.players[id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 10, compute: 10, storage: 8 });
    }
    w.players[weak.player_id].image_score = -2;
    w.players[strong.player_id].image_score = 4;
    await run(w, weak, "TRADE", {
      phase: "propose",
      counterparty_id: acc.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    await run(w, strong, "TRADE", {
      phase: "propose",
      counterparty_id: acc.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    const look = await run(w, acc, "LOOK");
    expect(look.ok).toBe(true);
    const accepts = (look.observation?.affordances || []).filter((a) => a.action === "TRADE_ACCEPT");
    expect(accepts.length).toBe(2);
    const hints = accepts.map((a) => a.hint).sort();
    expect(hints).toEqual(["standing is weak", "trustworthy"]);
  });

  it("HARVEST hint under harvest_pressure > 4", async () => {
    const w = fixture();
    w.co_evolution!.harvest_pressure["room.hub"] = 5;
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 8, compute: 8, storage: 8 });
    const look = await run(w, p, "LOOK");
    const harvest = (look.observation?.affordances || []).find((a) => a.action === "HARVEST");
    expect(harvest?.hint).toBe("compact grounded signal preferred");
  });

  it("protocol-strength ratchets share lineage_id under harvest pressure", async () => {
    const w = fixture();
    w.co_evolution!.harvest_pressure["room.hub"] = 5;
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, compute: 8 });
    const r1 = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "thin",
      signal: { grounding: "observed" },
    });
    expect(r1.ok).toBe(true);
    const r2 = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "still thin",
      signal: { grounding: "observed" },
    });
    expect(r2.ok).toBe(true);
    const evo = (w.genesis_evolutions || []).filter((e) => e.kind === "PROTOCOL_STRENGTH");
    expect(evo.length).toBeGreaterThanOrEqual(2);
    expect(evo[0].lineage_id).toBe(evo[1].lineage_id);
    expect(evo[1].parent_kind).toBe(evo[0].kind);
    expect(JSON.stringify(r2.observation?.location?.genesis_evolutions || [])).toMatch(/lineage_id/);
  });

  it("mutationGroundingOk treats missing as legal and hearsay as blocked", () => {
    expect(mutationGroundingOk(undefined)).toBe(true);
    expect(mutationGroundingOk({ grounding: "observed" })).toBe(true);
    expect(mutationGroundingOk({ grounding: "hearsay" })).toBe(false);
    expect(mutationGroundingOk({ grounding: "inferred-from-belief" })).toBe(false);
  });
});

describe("message grounding feeds cascading risk without reaching the Player", () => {
  it("persists grounding on the record but never in the inbox projection", async () => {
    const w = fixture();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const sent = await run(w, a, "MESSAGE", {
      recipient_id: b.player_id,
      text: "the cache is empty",
      signal: { grounding: "hearsay" },
    });
    expect(sent.ok).toBe(true);
    const rec = (w.messages || []).find((m) => m.recipient_id === b.player_id);
    expect(rec?.grounding).toBe("hearsay");
    // recipient's observation must not carry the internal metrology field
    const look = await run(w, b, "LOOK");
    expect(JSON.stringify(look.observation?.messages || [])).not.toContain("hearsay");
    expect(JSON.stringify(look.observation?.messages || [])).not.toContain("grounding");
  });
});
