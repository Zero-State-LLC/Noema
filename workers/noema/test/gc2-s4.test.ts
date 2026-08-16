import { describe, expect, it } from "vitest";
import { parseConstructibleClass, withAnnexAttention } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s4",
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
        entities: [
          enrichEntity({
            entity_id: "entity.tablet",
            label: "old-tablet",
            entity_type: "ARTIFACT",
            condition: 80,
          }),
        ],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [],
        hidden: true,
        tags: ["hidden"],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC2-S4 mapper", () => {
  it("parses archive_annex and discounts attention without changing help", () => {
    expect(parseConstructibleClass("archive_annex")).toBe("archive_annex");
    expect(parseConstructibleClass("archive annex")).toBe("archive_annex");
    expect(withAnnexAttention({ attention: 2 }, true).attention).toBe(1);
    expect(withAnnexAttention({ ...COSTS.ATTEST }, true).attention).toBe(1);
    expect(helpText()).not.toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    expect(helpText()).not.toMatch(/\bQUEST\b/);
  });
});

describe("GC2-S4 world path", () => {
  it("opens an annex, discounts inspect and attest, and rejects hidden construct", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/archive annex is open/i);
    const beforeInspect = w.players[p.player_id].budgets.attention;
    const looked = await run(w, p, "INSPECT", { entity_id: "entity.tablet" });
    expect(looked.ok).toBe(true);
    expect(w.players[p.player_id].budgets.attention).toBe(beforeInspect - 1);
    const beforeAttest = w.players[p.player_id].budgets.attention;
    const attested = await run(w, p, "COMMIT", {
      operation: "ATTEST",
      entity_id: "entity.tablet",
      subject_entity_id: "entity.tablet",
      archive_claim: "OPERATING",
    });
    expect(attested.ok).toBe(true);
    expect(w.players[p.player_id].budgets.attention).toBe(beforeAttest - 1);

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
