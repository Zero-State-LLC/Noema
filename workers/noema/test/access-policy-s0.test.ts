import { describe, expect, it } from "vitest";
import { helpText, parseHumanCommand } from "../src/actions";
import { ACCESS_POLICY_CATALOG_ID, parseAccessMode } from "../src/access-policy";
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
    world_id: "test.hosted-canonical.access-policy-s0",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.quay" }],
        entities: [],
      },
      "room.quay": {
        room_id: "room.quay",
        name: "Quay",
        description: "Water.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
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

async function seatGrant(w: WorldRuntime, founder: PlayerPrincipal): Promise<string> {
  await run(w, founder, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await run(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep" });
  const orgId = Object.keys(w.organizations)[0];
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const created = await run(w, founder, "ORG_OFFICE_CREATE", {
    org_id: orgId,
    display_name: "Gate",
    authority_profile: "GRANT_ACCESS",
  });
  expect(created.ok).toBe(true);
  const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
  await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: founder.player_id });
  const treasury = w.organizations[orgId].treasury!;
  treasury.compute = 8;
  treasury.influence = 8;
  return orgId;
}

describe("ACCESS_POLICY S0 mapper", () => {
  it("hosts EXIT DENY/CLEAR and keeps ACCESS_POLICY off help", () => {
    expect(ACCESS_POLICY_CATALOG_ID).toBe("access-policy-catalog/s3");
    expect(parseAccessMode("deny")).toBe("DENY");
    expect(parseAccessMode("ALLOW_ONLY")).toBe("ALLOW_ONLY");
    expect(parseAccessMode("allow")).toBe("ALLOW_ONLY");
    expect(helpText()).toMatch(/\bACCESS\b/);
    expect(helpText()).not.toMatch(/ACCESS_POLICY/);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    expect(helpText("access")).toMatch(/deny for <org>/);
    expect(helpText("access")).toMatch(/allow for <org>/);
    expect(helpText("access")).not.toMatch(/ACCESS_POLICY/);
    const parsed = parseHumanCommand("access east deny for org.line");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("ACCESS_POLICY");
      expect(parsed.action.arguments.mode).toBe("DENY");
      expect(parsed.action.arguments.scope).toBe("EXIT");
      expect(parsed.action.arguments.direction).toBe("east");
      expect(parsed.action.arguments.acting_for).toBe("org.line");
    }
    const room = parseHumanCommand("access here deny for org.line");
    expect(room.ok).toBe(true);
    if (room.ok && room.action.verb === "COMMIT") {
      expect(room.action.arguments.scope).toBe("ROOM");
      expect(room.action.arguments.direction).toBeUndefined();
    }
    const allow = parseHumanCommand("access east allow for org.line applies_to=player.sable");
    expect(allow.ok).toBe(true);
    if (allow.ok && allow.action.verb === "COMMIT") {
      expect(allow.action.arguments.mode).toBe("ALLOW_ONLY");
      expect(allow.action.arguments.applies_to).toBe("player.sable");
    }
    const star = parseHumanCommand("access east allow for org.line applies_to=*");
    expect(star.ok).toBe(false);
  });
});

describe("ACCESS_POLICY S0 world path", () => {
  it("denies an exit when GRANT_ACCESS holds, and blocks MOVE", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const walker = principal("player.sable");
    const orgId = await seatGrant(w, gate);
    await run(w, walker, "ENTER_WORLD");
    w.players[walker.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const denied = await run(w, gate, "LOOK", { line: `access east deny for ${orgId}` });
    expect(denied.ok).toBe(true);
    expect(denied.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
    expect(w.access_restrictions?.some((r) => r.exit_id === "east" && r.mode === "DENY")).toBe(true);
    expect(w.organizations[orgId].treasury!.influence).toBe(6);
    expect(w.organizations[orgId].treasury!.compute).toBe(7);

    const moved = await run(w, walker, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(false);
    expect(moved.error?.code).toBe("MOVE_REJECTED");
    expect(w.players[walker.player_id].room_id).toBe("room.hub");
  });

  it("clears a matching restriction", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const orgId = await seatGrant(w, gate);
    await run(w, gate, "LOOK", { line: `access east deny for ${orgId}` });
    const cleared = await run(w, gate, "LOOK", { line: `access east clear for ${orgId}` });
    expect(cleared.ok).toBe(true);
    expect(w.access_restrictions?.some((r) => r.exit_id === "east" && w.cycle <= r.expires_cycle)).toBe(false);
  });

  it("forbids access without GRANT_ACCESS", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const res = await run(w, p, "LOOK", { line: "access east deny for org.missing" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("NOT_FOUND");
  });

  it("denies the whole public room and blocks every exit", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const walker = principal("player.sable");
    const orgId = await seatGrant(w, gate);
    await run(w, walker, "ENTER_WORLD");
    w.players[walker.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const denied = await run(w, gate, "LOOK", { line: `access here deny for ${orgId}` });
    expect(denied.ok).toBe(true);
    expect(w.access_restrictions?.some((r) => r.scope === "ROOM" && r.room_id === "room.hub")).toBe(true);
    const moved = await run(w, walker, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(false);
    expect(moved.error?.code).toBe("MOVE_REJECTED");
    const cleared = await run(w, gate, "LOOK", { line: `access here clear for ${orgId}` });
    expect(cleared.ok).toBe(true);
    const after = await run(w, walker, "MOVE", { direction: "east" });
    expect(after.ok).toBe(true);
    expect(w.players[walker.player_id].room_id).toBe("room.quay");
  });

  it("allows listed MOVE under ALLOW_ONLY and rejects everyone else", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const listed = principal("player.sable");
    const other = principal("player.vesper");
    const orgId = await seatGrant(w, gate);
    await run(w, listed, "ENTER_WORLD");
    await run(w, other, "ENTER_WORLD");
    w.players[listed.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[other.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const set = await run(w, gate, "LOOK", {
      line: `access east allow for ${orgId} applies_to=${listed.player_id}`,
    });
    expect(set.ok).toBe(true);
    expect(set.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
    expect(w.access_restrictions?.some((r) => r.mode === "ALLOW_ONLY" && r.applies_to === listed.player_id)).toBe(
      true,
    );
    const okMove = await run(w, listed, "MOVE", { direction: "east" });
    expect(okMove.ok).toBe(true);
    expect(w.players[listed.player_id].room_id).toBe("room.quay");
    const blocked = await run(w, other, "MOVE", { direction: "east" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("MOVE_REJECTED");
    expect(w.players[other.player_id].room_id).toBe("room.hub");
  });

  it("keeps DENY stronger than ALLOW_ONLY", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const listed = principal("player.sable");
    const orgId = await seatGrant(w, gate);
    await run(w, listed, "ENTER_WORLD");
    w.players[listed.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, gate, "LOOK", { line: `access east allow for ${orgId} applies_to=${listed.player_id}` });
    w.organizations[orgId].treasury!.compute = 8;
    w.organizations[orgId].treasury!.influence = 8;
    await run(w, gate, "LOOK", { line: `access east deny for ${orgId}` });
    const moved = await run(w, listed, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(false);
    expect(moved.error?.code).toBe("MOVE_REJECTED");
  });

  it("rejects hidden rooms", async () => {
    const w = world();
    const gate = principal("player.nacre");
    const orgId = await seatGrant(w, gate);
    w.players[gate.player_id].room_id = "room.vault";
    const res = await run(w, gate, "LOOK", { line: `access west deny for ${orgId}` });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("NOT_OBSERVABLE");
  });
});
