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
    world_id: "test.hosted-canonical.gc5-s6",
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

describe("GC5-S6 mapper", () => {
  it("keeps notice as OFFICE_ACT and help quiet", () => {
    const parsed = parseHumanCommand('notice org.x "Ledger open."');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.action).toEqual({
        verb: "COMMIT",
        arguments: { operation: "ORG_OFFICE_ACT", org_id: "org.x", notice: "Ledger open." },
      });
    }
    expect(helpText()).not.toMatch(/\bNOTICE\b/);
    expect(helpText("message")).not.toMatch(/\bNOTICE\b/);
    expect(helpText("message")).not.toMatch(/\bboard\b/i);
  });
});

describe("GC5-S6 world path", () => {
  it("accepts occupied PUBLISH_NOTICE in public, keeps last 1, and rejects vacant and hidden", async () => {
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
    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Crier",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    const vacant = await run(w, a, "MESSAGE", { surface: "NOTICE", org_id: orgId, text: "Too soon." });
    expect(vacant.ok).toBe(false);
    expect(vacant.error?.code).toBe("FORBIDDEN");

    const assigned = await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: a.player_id });
    expect(assigned.ok).toBe(true);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const outsider = await run(w, b, "MESSAGE", { surface: "NOTICE", org_id: orgId, text: "Not mine." });
    expect(outsider.ok).toBe(false);
    expect(outsider.error?.code).toBe("FORBIDDEN");

    const first = await run(w, a, "MESSAGE", { surface: "NOTICE", org_id: orgId, text: "First." });
    expect(first.ok).toBe(true);
    expect(first.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(first.observation?.notice_lines).toEqual(["A notice from Nacre Compact: First."]);
    const second = await run(w, a, "MESSAGE", { surface: "NOTICE", text: "Second." });
    expect(second.ok).toBe(true);
    expect(second.observation?.notice_lines).toEqual(["A notice from Nacre Compact: Second."]);
    expect(JSON.stringify(second.events || [])).not.toContain("MESSAGE_DELIVERED");
    expect(w.organizations[orgId].public_notice).toBeUndefined();

    const hidden = world();
    const q = principal("player.oriole");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const formedH = await run(hidden, q, "ORG_CREATE", { name: "Vault Compact", charter: "quiet" });
    expect(formedH.ok).toBe(true);
    const hidOrg = Object.keys(hidden.organizations)[0];
    await run(hidden, q, "ORG_OFFICE_CREATE", {
      org_id: hidOrg,
      display_name: "Crier",
      authority_profile: "PUBLISH_NOTICE",
    });
    const hidOffice = Object.keys(hidden.organizations[hidOrg].offices || {})[0];
    await run(hidden, q, "ORG_OFFICE_ASSIGN", { office_id: hidOffice, agent_id: q.player_id });
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "MESSAGE", { surface: "NOTICE", text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(hidden.rooms["room.vault"].institution_notice).toBeUndefined();
  });
});
