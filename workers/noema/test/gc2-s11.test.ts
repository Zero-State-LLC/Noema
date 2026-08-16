import { describe, expect, it } from "vitest";
import { SHARE_COST } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
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
    world_id: "test.hosted-canonical.gc2-s11",
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

describe("GC2-S11 mapper", () => {
  it("parses share and keeps help quiet", () => {
    const parsed = parseHumanCommand("share workshop with player.vesper");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments).toEqual({
        operation: "SHARE",
        entity_id: "workshop",
        player_id: "player.vesper",
      });
    }
    expect(SHARE_COST).toEqual({ compute: 1 });
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "SHARE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b|\bSHARE\b|\bvest\b/i);
  });
});

describe("GC2-S11 world path", () => {
  it("shares an owned public workshop once and lets the co-owner steward", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.oriole");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const opened = await run(w, a, "WAIT");
    expect(opened.ok).toBe(true);
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    w.players[b.player_id].handle = "Vesper";
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const entityId = shop.entity_id;

    const stranger = await run(w, b, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: c.player_id,
    });
    expect(stranger.ok).toBe(false);
    expect(stranger.error?.code).toBe("NOT_OWNER");

    const shared = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: b.player_id,
    });
    expect(shared.ok).toBe(true);
    expect(shared.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(shared.events || [])).not.toMatch(/STRUCTURE_/);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === entityId)?.co_owner_id).toBe(b.player_id);
    expect(shared.observation?.consequence).toMatch(/share the workshop with Vesper/i);

    const again = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: b.player_id,
    });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("NOT_ADDRESSABLE");

    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const upgrade = await run(w, b, "BUILD", { operation: "UPGRADE", entity_id: entityId });
    expect(upgrade.ok).toBe(true);

    const vest = await run(w, a, "ORG_CREATE", { name: "Nacre Compact", charter: "works" });
    expect(vest.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Works",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: a.player_id });
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const blockedVest = await run(w, a, "BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
    expect(blockedVest.ok).toBe(false);
    expect(blockedVest.error?.code).toBe("FORBIDDEN");
  });

  it("rejects hidden-room share", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "BUILD", {
      operation: "SHARE",
      entity_id: "entity.workshop.x",
      player_id: "player.nacre",
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
