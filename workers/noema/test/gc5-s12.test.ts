import { describe, expect, it } from "vitest";
import { CHANNEL_EXPIRE_AFTER_CYCLES } from "../src/communication";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc5-s12",
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

describe("GC5-S12 mapper", () => {
  it("expires after one cycle and stays silent", () => {
    expect(CHANNEL_EXPIRE_AFTER_CYCLES).toBe(1);
    expect(projectionIdForEvent("MESSAGE", { surface: "CHANNEL" })).toBeNull();
    expect(helpText()).not.toMatch(/\bCHANNEL\b/);
    expect(helpText("message")).not.toMatch(/\bchannel\b/i);
  });
});

describe("GC5-S12 world path", () => {
  it("keeps last 1 in the posting cycle, then drops it after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const formed = await run(w, p, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const first = await run(w, p, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "First." });
    expect(first.ok).toBe(true);
    expect(first.observation?.channel_lines).toEqual(["A channel note in Nacre Compact: First."]);
    const second = await run(w, p, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Second." });
    expect(second.ok).toBe(true);
    expect(second.observation?.channel_lines).toEqual(["A channel note in Nacre Compact: Second."]);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.organizations[orgId].channel).toBeUndefined();
    expect(JSON.stringify(waited.events || [])).not.toMatch(/MESSAGE_EXPIRED|STRUCTURE_/);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.channel_lines || []).toEqual([]);

    const again = await run(w, p, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "After." });
    expect(again.ok).toBe(true);
    expect(again.observation?.channel_lines).toEqual(["A channel note in Nacre Compact: After."]);
  });

  it("rejects hidden-room channel send", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const formed = await run(w, p, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(w.organizations[orgId].channel).toBeUndefined();
  });

  it("uses one fail for unknown org and non-member after expiry WAIT", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const formed = await run(w, a, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const posted = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Hold." });
    expect(posted.ok).toBe(true);
    const waited = await run(w, a, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.organizations[orgId].channel).toBeUndefined();

    const b = principal("player.vesper");
    await run(w, b, "ENTER_WORLD");
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const outsider = await run(w, b, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Not mine." });
    expect(outsider.ok).toBe(false);
    expect(outsider.error?.code).toBe("NOT_ADDRESSABLE");
    expect(outsider.error?.message).toBe("That channel is not addressable.");
    const unknown = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: "org.missing", text: "Ghost." });
    expect(unknown.ok).toBe(false);
    expect(unknown.error?.code).toBe(outsider.error?.code);
    expect(unknown.error?.message).toBe(outsider.error?.message);
  });
});
