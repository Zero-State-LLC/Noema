import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc5-s7",
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

describe("GC5-S7 mapper", () => {
  it("parses channel notes and keeps help quiet", () => {
    const parsed = parseHumanCommand('channel org.x "Meet at dusk."');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.action).toEqual({
        verb: "MESSAGE",
        arguments: { surface: "CHANNEL", org_id: "org.x", text: "Meet at dusk." },
      });
    }
    expect(helpText()).not.toMatch(/\bCHANNEL\b/);
    expect(helpText("message")).not.toMatch(/\bCHANNEL\b/);
    expect(helpText("message")).not.toMatch(/\bchannel\b/i);
  });
});

describe("GC5-S7 world path", () => {
  it("accepts current members, hides from outsiders, and uses one fail for unknown and non-member", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const formed = await run(w, a, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];

    const outsider = await run(w, b, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Not mine." });
    expect(outsider.ok).toBe(false);
    expect(outsider.error?.code).toBe("NOT_ADDRESSABLE");
    expect(outsider.error?.message).toBe("That channel is not addressable.");

    const unknown = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: "org.missing", text: "Ghost." });
    expect(unknown.ok).toBe(false);
    expect(unknown.error?.code).toBe(outsider.error?.code);
    expect(unknown.error?.message).toBe(outsider.error?.message);

    const first = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "First." });
    expect(first.ok).toBe(true);
    expect(first.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(first.observation?.channel_lines).toEqual(["A channel note in Nacre Compact: First."]);
    const second = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Second." });
    expect(second.ok).toBe(true);
    expect(second.observation?.channel_lines).toEqual(["A channel note in Nacre Compact: Second."]);
    expect(JSON.stringify(second.events || [])).not.toContain("MESSAGE_DELIVERED");

    const lookOut = await run(w, b, "LOOK");
    expect(lookOut.observation?.channel_lines || []).toEqual([]);

    w.players[a.player_id].room_id = "room.vault";
    const hidden = await run(w, a, "MESSAGE", { surface: "CHANNEL", org_id: orgId, text: "Secret." });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
    expect(w.organizations[orgId].channel?.text).toBe("Second.");
  });
});
