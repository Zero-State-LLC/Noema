import { describe, expect, it } from "vitest";
import { NOTICE_EXPIRE_AFTER_CYCLES } from "../src/communication";
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
    world_id: "test.hosted-canonical.gc5-s11",
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

async function occupyNoticeOffice(w: WorldRuntime, p: PlayerPrincipal) {
  const formed = await run(w, p, "ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
  expect(formed.ok).toBe(true);
  const orgId = Object.keys(w.organizations)[0];
  const created = await run(w, p, "ORG_OFFICE_CREATE", {
    org_id: orgId,
    display_name: "Crier",
    authority_profile: "PUBLISH_NOTICE",
  });
  expect(created.ok).toBe(true);
  const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
  const assigned = await run(w, p, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: p.player_id });
  expect(assigned.ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return orgId;
}

describe("GC5-S11 mapper", () => {
  it("expires after one cycle and stays silent", () => {
    expect(NOTICE_EXPIRE_AFTER_CYCLES).toBe(1);
    expect(projectionIdForEvent("MESSAGE", { surface: "NOTICE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bNOTICE\b/);
  });
});

describe("GC5-S11 world path", () => {
  it("keeps last 1 in the posting cycle, then drops it after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const orgId = await occupyNoticeOffice(w, p);

    const first = await run(w, p, "MESSAGE", { surface: "NOTICE", org_id: orgId, text: "First." });
    expect(first.ok).toBe(true);
    expect(first.observation?.notice_lines).toEqual(["A notice from Nacre Compact: First."]);
    const second = await run(w, p, "MESSAGE", { surface: "NOTICE", text: "Second." });
    expect(second.ok).toBe(true);
    expect(second.observation?.notice_lines).toEqual(["A notice from Nacre Compact: Second."]);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.rooms["room.hub"].institution_notice).toBeUndefined();
    expect(JSON.stringify(waited.events || [])).not.toMatch(/MESSAGE_EXPIRED|STRUCTURE_/);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.notice_lines || []).toEqual([]);

    const again = await run(w, p, "MESSAGE", { surface: "NOTICE", text: "After." });
    expect(again.ok).toBe(true);
    expect(again.observation?.notice_lines).toEqual(["A notice from Nacre Compact: After."]);
  });

  it("rejects hidden-room notice", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await occupyNoticeOffice(w, p);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "MESSAGE", { surface: "NOTICE", text: "Secret." });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
    expect(w.rooms["room.vault"].institution_notice).toBeUndefined();
  });
});
