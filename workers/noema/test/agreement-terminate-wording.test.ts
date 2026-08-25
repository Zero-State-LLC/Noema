/**
 * Defect 5: agreement termination used trade-only wording.
 *
 * A NON_AGGRESSION offer was withdrawn in the live playtest and the Player was
 * told "You withdraw the trade offer." The OFFERED branch of
 * applyAgreementTerminate hardcoded that line for every catalog type, and the
 * ACTIVE branch hardcoded "Trade agreement <id> is broken." the same way.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
import { AGREEMENT_TYPES, agreementBrokenLine, agreementWithdrawLine } from "../src/diplomacy";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.agreement",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.agreement.wording",
    world_name: "Accord Reach",
    cycle: 4,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Grid.", exits: [], entities: [] },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    agreements: {},
    contests: {},
    access_restrictions: [],
    seen_idempotency: {},
    unsettled: [],
  };
}

let seq = 0;
async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  seq += 1;
  const envl: CommandEnvelope = {
    request_id: `r.${seq}`,
    idempotency_key: `i.${seq}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

const OFFERER = principal("player.nacre");
const OTHER = principal("player.vesper");

async function pair() {
  const w = world();
  await run(w, OFFERER, "ENTER_WORLD");
  await run(w, OTHER, "ENTER_WORLD");
  w.players[OFFERER.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[OTHER.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return w;
}

async function offer(w: WorldRuntime, type: string) {
  const formed = await run(w, OFFERER, "AGREEMENT_FORM", {
    agreement_type: type,
    party_ids: [OTHER.player_id],
  });
  expect(formed.ok, JSON.stringify(formed.error)).toBe(true);
  const id = Object.keys(w.agreements!)[0];
  expect(w.agreements![id].status).toBe("OFFERED");
  return id;
}

const EXPECTED_WITHDRAW: Record<string, string> = {
  TRADE: "You withdraw the trade offer.",
  NON_AGGRESSION: "You withdraw the non-aggression offer.",
  ACCESS: "You withdraw the access offer.",
  RESOURCE_COMMITMENT: "You withdraw the resource commitment offer.",
  MUTUAL_DEFENSE: "You withdraw the mutual defense offer.",
};

describe("agreement termination wording", () => {
  it("covers every catalog type", () => {
    expect(Object.keys(EXPECTED_WITHDRAW).sort()).toEqual([...AGREEMENT_TYPES].sort());
  });

  it.each([...AGREEMENT_TYPES])("the offerer withdrawing a %s offer is told the right type", async (type) => {
    const w = await pair();
    const id = await offer(w, type);
    const ended = await run(w, OFFERER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "mutual" });
    expect(ended.ok, JSON.stringify(ended.error)).toBe(true);
    expect(ended.observation?.consequence).toBe(EXPECTED_WITHDRAW[type]);
    expect(w.agreements![id]).toBeUndefined();
  });

  it.each([...AGREEMENT_TYPES])("breaking an ACTIVE %s names the type too", async (type) => {
    const w = await pair();
    const id = await offer(w, type);
    const accepted = await run(w, OTHER, "AGREEMENT_FORM", {
      agreement_type: type,
      party_ids: [OFFERER.player_id],
    });
    expect(accepted.ok).toBe(true);
    expect(w.agreements![id].status).toBe("ACTIVE");
    const ended = await run(w, OFFERER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "violation" });
    expect(ended.ok, JSON.stringify(ended.error)).toBe(true);
    expect(ended.observation?.consequence).toBe(agreementBrokenLine(type, id));
    if (type !== "TRADE") expect(ended.observation?.consequence).not.toContain("Trade agreement");
    expect(w.agreements![id].status).toBe("BROKEN");
  });

  it("a non-offerer cannot withdraw an offer", async () => {
    const w = await pair();
    const id = await offer(w, "NON_AGGRESSION");
    const before = { ...w.players[OTHER.player_id].budgets };
    const denied = await run(w, OTHER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "mutual" });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");
    expect(w.agreements![id].status).toBe("OFFERED");
    expect(w.players[OTHER.player_id].budgets).toEqual(before);
  });

  it("a missing agreement is NOT_FOUND and debits nothing", async () => {
    const w = await pair();
    const before = { ...w.players[OFFERER.player_id].budgets };
    const missing = await run(w, OFFERER, "AGREEMENT_TERMINATE", {
      agreement_id: "agreement.nope",
      reason: "mutual",
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");
    expect(w.players[OFFERER.player_id].budgets).toEqual(before);
  });

  it("an already-ended agreement cannot be ended twice", async () => {
    const w = await pair();
    const id = await offer(w, "ACCESS");
    await run(w, OTHER, "AGREEMENT_FORM", { agreement_type: "ACCESS", party_ids: [OFFERER.player_id] });
    expect((await run(w, OFFERER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "mutual" })).ok).toBe(true);
    const before = { ...w.players[OFFERER.player_id].budgets };
    const again = await run(w, OFFERER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "mutual" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("FORBIDDEN");
    expect(w.players[OFFERER.player_id].budgets).toEqual(before);
  });

  it("a successful withdrawal debits the terminate cost exactly once", async () => {
    const w = await pair();
    const id = await offer(w, "MUTUAL_DEFENSE");
    const before = w.players[OFFERER.player_id].budgets.compute;
    expect((await run(w, OFFERER, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "mutual" })).ok).toBe(true);
    expect(w.players[OFFERER.player_id].budgets.compute).toBe(before - 1);
  });

  it("wording helpers are pure and total", () => {
    expect(agreementWithdrawLine("NON_AGGRESSION")).toBe("You withdraw the non-aggression offer.");
    expect(agreementBrokenLine("MUTUAL_DEFENSE", "agreement.x")).toBe(
      "Mutual defense agreement agreement.x is broken.",
    );
    // An unknown type must not produce trade wording.
    expect(agreementWithdrawLine("SOMETHING_ELSE")).toBe("You withdraw the agreement offer.");
  });
});
