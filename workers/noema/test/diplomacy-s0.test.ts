import { describe, expect, it } from "vitest";
import { helpText, parseHumanCommand } from "../src/actions";
import { DIPLOMACY_CATALOG_ID, parseAgreementType } from "../src/diplomacy";
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
    world_id: "test.hosted-canonical.diplomacy-s0",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.vault" }],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
        hidden: true,
        tags: ["hidden"],
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

describe("Diplomacy S0 mapper", () => {
  it("hosts TRADE form and keeps WED/ATTEST off help", () => {
    expect(DIPLOMACY_CATALOG_ID).toMatch(/^diplomacy-catalog\/s/);
    expect(parseAgreementType("trade")).toBe("TRADE");
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    const parsed = parseHumanCommand("form agreement trade with player.vesper");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("AGREEMENT_FORM");
      expect(parsed.action.arguments.agreement_type).toBe("TRADE");
    }
    const bad = parseHumanCommand("form agreement type=pact parties=a,b");
    expect(bad.ok).toBe(false);
  });
});

describe("Diplomacy S0 world path", () => {
  it("offers then accepts a TRADE agreement and omits hidden rooms", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const hidden = await run(w, a, "AGREEMENT_FORM", {
      agreement_type: "TRADE",
      party_ids: [b.player_id],
    });
    // still in hub — this should offer
    expect(hidden.ok).toBe(true);
    const offered = Object.values(w.agreements || {});
    expect(offered).toHaveLength(1);
    expect(offered[0].status).toBe("OFFERED");
    expect((hidden.events || []).some((e) => e.event_type === "AGREEMENT_FORMED")).toBe(false);

    const again = await run(w, a, "AGREEMENT_FORM", {
      agreement_type: "TRADE",
      party_ids: [b.player_id],
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error?.code).toBe("NOT_ADDRESSABLE");

    const accepted = await run(w, b, "AGREEMENT_FORM", {
      agreement_type: "TRADE",
      party_ids: [a.player_id],
    });
    expect(accepted.ok).toBe(true);
    expect(Object.values(w.agreements || {})[0].status).toBe("ACTIVE");
    expect((accepted.events || []).some((e) => e.event_type === "AGREEMENT_FORMED")).toBe(true);
    expect(JSON.stringify(accepted.events || [])).not.toMatch(/AGREEMENT_BROKEN/);
  });

  it("rejects a hidden-room form", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].room_id = "room.vault";
    w.players[b.player_id].room_id = "room.vault";
    const hidden = await run(w, a, "AGREEMENT_FORM", {
      agreement_type: "TRADE",
      party_ids: [b.player_id],
    });
    expect(hidden.ok).toBe(false);
    if (!hidden.ok) expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
