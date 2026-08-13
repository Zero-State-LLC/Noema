import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  allocateOrgId,
  cloneBudgets,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { enrichEntity } from "../src/actions";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Test hub.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          }),
        ],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("allocateOrgId", () => {
  it("produces org.<slug>.<hex> without free-form invention", () => {
    const id = allocateOrgId("Nacre Compact!");
    expect(id).toMatch(/^org\.nacre-compact\.[a-f0-9]{8}$/);
  });
});

describe("ORG human parse", () => {
  it("parses form / invite / leave / remove", () => {
    const f = parseHumanCommand('form Nacre Compact charter="local bonds"');
    expect(f.ok).toBe(true);
    if (f.ok && f.action.verb === "COMMIT") {
      expect(f.action.arguments.operation).toBe("ORG_CREATE");
      expect(f.action.arguments.name).toBe("Nacre Compact");
    }
    const inv = parseHumanCommand("invite bob to org.x role=officer", {
      players: [
        { player_id: "player.me", handle: "me" },
        { player_id: "player.bob", handle: "bob" },
      ],
      selfId: "player.me",
    });
    expect(inv.ok).toBe(true);
    if (inv.ok && inv.action.verb === "COMMIT") {
      expect(inv.action.arguments.operation).toBe("ORG_MEMBER_ADD");
      expect(inv.action.arguments.agent_id).toBe("player.bob");
      expect(inv.action.arguments.role).toBe("officer");
    }
    const leave = parseHumanCommand("leave org.x", { selfId: "player.me" });
    expect(leave.ok).toBe(true);
    const rem = parseHumanCommand('remove bob from org.x reason="breach"', {
      players: [
        { player_id: "player.me", handle: "me" },
        { player_id: "player.bob", handle: "bob" },
      ],
      selfId: "player.me",
    });
    expect(rem.ok).toBe(true);
  });

  it("rejects self-join style invent and agreement form", () => {
    const j = parseHumanCommand("join org.x");
    expect(j.ok).toBe(false);
    const a = parseHumanCommand("form agreement type=pact parties=a,b");
    expect(a.ok).toBe(false);
  });
});

describe("ORG world mutations", () => {
  it("form → invite → leave with costs and authority", async () => {
    const w = world();
    const founder = principal("player.founder");
    const peer = principal("player.peer");
    await run(w, founder, "ENTER_WORLD");
    await run(w, peer, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[peer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const beforeInf = w.players[founder.player_id].budgets.influence;
    const created = await run(w, founder, "LOOK", {
      line: 'form Nacre Compact charter="local coordination"',
    });
    expect(created.ok).toBe(true);
    expect(created.observation?.consequence).toMatch(/Organization formed/);
    expect(w.players[founder.player_id].budgets.influence).toBe(
      beforeInf - (COSTS.ORG_CREATE.influence || 0),
    );
    const orgs = Object.values(w.organizations);
    expect(orgs).toHaveLength(1);
    const org = orgs[0];
    expect(org.org_id).toMatch(/^org\.nacre-compact\./);
    expect(org.members[0].role).toBe("founder");

    // non-officer cannot invite
    const bad = await run(w, peer, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: org.org_id,
      agent_id: peer.player_id,
      role: "member",
    });
    expect(bad.ok).toBe(false);
    expect(bad.error?.code).toBe("FORBIDDEN");

    const inv = await run(w, founder, "COMMIT", {
      operation: "ORG_MEMBER_ADD",
      org_id: org.org_id,
      agent_id: peer.player_id,
      role: "member",
    });
    expect(inv.ok).toBe(true);
    expect(w.organizations[org.org_id].members.some((m) => m.agent_id === peer.player_id)).toBe(
      true,
    );

    const left = await run(w, peer, "LOOK", { line: `leave ${org.org_id}` });
    expect(left.ok).toBe(true);
    expect(w.organizations[org.org_id].members.some((m) => m.agent_id === peer.player_id)).toBe(
      false,
    );

    // observation includes org for founder
    const look = await run(w, founder, "LOOK");
    expect(look.observation?.organizations?.some((o) => o.org_id === org.org_id)).toBe(true);
    expect(look.observation?.affordances?.some((a) => a.action === "ORG_CREATE")).toBe(true);
  });

  it("no debit on failed budget for form", async () => {
    const w = world();
    const p = principal("player.broke");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets.influence = 0;
    const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", {
      operation: "ORG_CREATE",
      name: "X",
      charter: "y",
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.players[p.player_id].budgets).toEqual(before);
  });
});
