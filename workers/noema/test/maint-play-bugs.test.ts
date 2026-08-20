import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  isRepairable,
  normalizeStructuredCommand,
} from "../src/actions";
import { situationFromLive } from "../src/orientation";
import { commandResultHttpStatus, resolveSoftSettlementFailure } from "../src/settle";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, CommandResult, PlayerPrincipal } from "../src/types";

function principal(id = "player.nacre"): PlayerPrincipal {
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

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.maint-play-bugs",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "Quiet ground.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.storage-cell-cache",
            label: "west-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "energy",
            stock_amount: 8,
          }),
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "cold-ledger",
            entity_type: "ARTIFACT",
            condition: 50,
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
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("maint play bugs — TRADE aliases", () => {
  it("accepts offer/want/counterparty aliases and names canonical fields on miss", () => {
    const ok = normalizeStructuredCommand("TRADE", {
      phase: "propose",
      counterparty: "player.vesper",
      offer: { energy: 1 },
      want: { compute: 1 },
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.action.verb).toBe("TRADE");
    if (ok.action.verb !== "TRADE") return;
    expect(ok.action.arguments.counterparty_id).toBe("player.vesper");
    expect(ok.action.arguments.offered).toEqual({ energy: 1 });
    expect(ok.action.arguments.requested).toEqual({ compute: 1 });

    const bad = normalizeStructuredCommand("TRADE", { phase: "propose" });
    expect(bad.ok).toBe(true);
    // propose with missing fields is still a structured TRADE; apply path rejects.
  });

  it("apply path accepts aliases and rejects with canonical field names", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const miss = await run(w, a, "TRADE", { phase: "propose" });
    expect(miss.ok).toBe(false);
    expect(miss.error?.message).toMatch(/counterparty_id|offered|requested/);
    expect(miss.error?.message).not.toBe("counterparty, offer, and want are required.");

    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty: b.player_id,
      offer: { energy: 1 },
      want: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    expect(Object.keys(w.trades)).toHaveLength(1);
  });
});

describe("maint play bugs — energy deadlock", () => {
  it("WAIT restores energy so agents can leave energy 0", async () => {
    const w = fixtureWorld();
    const p = principal();
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 0, compute: 0, attention: 0 });
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.players[p.player_id].budgets.energy).toBeGreaterThan(0);
    expect(w.players[p.player_id].budgets.compute).toBeGreaterThan(0);
  });
});

describe("maint play bugs — situation strain is room-local", () => {
  it("does not bleed global report lines into a quiet room", () => {
    expect(
      situationFromLive({
        name: "Grid Anchor",
        condition: "Open ground — routes lead outward.",
        entities: [],
        report_lines: ["Market post condition 41.", "Bond board stock 0."],
      }),
    ).toEqual({ place: "Grid Anchor" });
  });
});

describe("maint play bugs — cold ledger repairable", () => {
  it("marks damaged ARTIFACT ledgers repairable", () => {
    const ledger = enrichEntity({
      entity_id: "entity.archive-ledger",
      label: "cold-ledger",
      entity_type: "ARTIFACT",
      condition: 50,
    });
    expect(isRepairable(ledger)).toBe(true);
  });

  it("advertises REPAIR on LOOK for cold ledger", async () => {
    const w = fixtureWorld();
    const p = principal();
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, p, "LOOK");
    const ent = look.observation?.location?.entities?.find((e) => e.entity_id === "entity.archive-ledger");
    expect(ent?.repairable).toBe(true);
    expect(look.observation?.affordances?.some((a) => a.operation === "REPAIR" && a.target_id === "entity.archive-ledger")).toBe(
      true,
    );
  });
});

describe("maint play bugs — command HTTP status", () => {
  it("uses 200 for structured action failures so clients read the envelope", () => {
    const fail: CommandResult = {
      ok: false,
      request_id: "r1",
      error: { code: "BUDGET_EXCEEDED", message: "You do not have enough energy." },
    };
    expect(commandResultHttpStatus(fail)).toBe(200);
    expect(commandResultHttpStatus({ ok: true })).toBe(200);
  });
});

describe("maint play bugs — NONCONTIGUOUS soft recover", () => {
  it("restores from durable head instead of staying INCIDENT", async () => {
    const live: WorldRuntime = {
      ...fixtureWorld(),
      sequence: 40,
    };
    const headWorld: WorldRuntime = { ...fixtureWorld(), sequence: 39, cycle: 2 };
    const getHead = vi.fn(async () => ({
      world_id: headWorld.world_id,
      sequence: 39,
      cycle: 2,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: headWorld,
      revision: 7,
      ledger_head_digest: "sha256:head",
    }));
    const out = await resolveSoftSettlementFailure({
      code: "NONCONTIGUOUS_SEQUENCE",
      before: live,
      request_id: "r.soft",
      getHead,
      writer_generation: "do.1",
    });
    expect(out.mode).toBe("soft_restore");
    expect(out.result.ok).toBe(false);
    expect(out.result.error?.code).toBe("SETTLEMENT_RESYNC");
    expect(out.metaPatch.status).toBe("ACTIVE");
    expect(out.metaPatch.settlement_health).toBe("HEALTHY");
    expect(out.world?.sequence).toBe(39);
    expect(getHead).toHaveBeenCalled();
  });

  it("falls through to hard INCIDENT for other settlement codes without a head", async () => {
    const out = await resolveSoftSettlementFailure({
      code: "SETTLEMENT_UNCERTAIN",
      before: fixtureWorld(),
      request_id: "r.hard",
      getHead: async () => null,
      writer_generation: "do.1",
    });
    expect(out.mode).toBe("incident");
    expect(out.metaPatch.status).toBe("INCIDENT");
  });
});
