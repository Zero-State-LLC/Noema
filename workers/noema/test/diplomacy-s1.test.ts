import { describe, expect, it } from "vitest";
import { helpText, parseHumanCommand } from "../src/actions";
import { DIPLOMACY_CATALOG_ID } from "../src/diplomacy";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
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

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.diplomacy-s1",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    agreements: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function formTrade(w: WorldRuntime, a: PlayerPrincipal, b: PlayerPrincipal) {
  await run(w, a, "ENTER_WORLD");
  await run(w, b, "ENTER_WORLD");
  w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(
    (await run(w, a, "AGREEMENT_FORM", { agreement_type: "TRADE", party_ids: [b.player_id] })).ok,
  ).toBe(true);
  expect(
    (await run(w, b, "AGREEMENT_FORM", { agreement_type: "TRADE", party_ids: [a.player_id] })).ok,
  ).toBe(true);
  return Object.values(w.agreements || {})[0];
}

describe("Diplomacy S1 mapper", () => {
  it("hosts terminate and keeps AGREEMENT off help", () => {
    expect(DIPLOMACY_CATALOG_ID).toMatch(/^diplomacy-catalog\/s/);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    const parsed = parseHumanCommand("terminate agreement agreement.1 reason=mutual");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("AGREEMENT_TERMINATE");
      expect(parsed.action.arguments.reason).toBe("MUTUAL");
    }
    const missing = parseHumanCommand("terminate agreement agreement.1");
    expect(missing.ok).toBe(false);
  });
});

describe("Diplomacy S1 world path", () => {
  it("lets a party break an ACTIVE trade agreement", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.other");
    const agr = await formTrade(w, a, b);
    await run(w, c, "ENTER_WORLD");
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const bystander = await run(w, c, "AGREEMENT_TERMINATE", {
      agreement_id: agr.agreement_id,
      reason: "MUTUAL",
    });
    expect(bystander.ok).toBe(false);
    if (!bystander.ok) expect(bystander.error?.code).toBe("FORBIDDEN");

    const ended = await run(w, a, "AGREEMENT_TERMINATE", {
      agreement_id: agr.agreement_id,
      reason: "MUTUAL",
    });
    expect(ended.ok).toBe(true);
    expect(w.agreements?.[agr.agreement_id].status).toBe("BROKEN");
    const broken = ended.events?.find((e) => e.event_type === "AGREEMENT_BROKEN");
    expect(broken?.payload?.reason).toBe("MUTUAL");
    expect(broken?.payload?.visibility).toBe("PUBLIC");

    const again = await run(w, b, "AGREEMENT_TERMINATE", {
      agreement_id: agr.agreement_id,
      reason: "MUTUAL",
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error?.code).toBe("FORBIDDEN");
  });

  it("lets the offerer withdraw an unaccepted offer without AGREEMENT_BROKEN", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const offer = await run(w, a, "AGREEMENT_FORM", {
      agreement_type: "TRADE",
      party_ids: [b.player_id],
    });
    expect(offer.ok).toBe(true);
    const id = Object.keys(w.agreements || {})[0];
    const withdrawn = await run(w, a, "AGREEMENT_TERMINATE", { agreement_id: id, reason: "MUTUAL" });
    expect(withdrawn.ok).toBe(true);
    expect(w.agreements?.[id]).toBeUndefined();
    expect((withdrawn.events || []).some((e) => e.event_type === "AGREEMENT_BROKEN")).toBe(false);
  });
});
