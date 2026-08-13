import { describe, expect, it } from "vitest";
import { parseHumanCommand } from "../src/actions";
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
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.x",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "East",
        description: "Other room.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, line: string) {
  const envl: CommandEnvelope = {
    request_id: `req.${Math.random().toString(16).slice(2)}`,
    command: "LOOK",
    arguments: { line },
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("leave parse", () => {
  it("bare leave and leave world are LEAVE_WORLD", () => {
    const a = parseHumanCommand("leave");
    expect(a.ok && a.action.verb).toBe("LEAVE_WORLD");
    const b = parseHumanCommand("leave world");
    expect(b.ok && b.action.verb).toBe("LEAVE_WORLD");
    const c = parseHumanCommand("exit");
    expect(c.ok && c.action.verb).toBe("LEAVE_WORLD");
  });

  it("leave <org> stays org-leave", () => {
    const r = parseHumanCommand("leave org.x", { selfId: "player.me" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.action.verb).toBe("COMMIT");
      if (r.action.verb === "COMMIT") expect(r.action.arguments.operation).toBe("ORG_MEMBER_REMOVE");
    }
  });
});

describe("LEAVE_WORLD reducer", () => {
  it("sets entered false, emits AGENT_LEFT_WORLD, and drops presence", async () => {
    const w = world();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "enter");
    await run(w, b, "enter");
    expect(w.players["player.a"].entered).toBe(true);
    const seen = (await run(w, b, "look")).observation?.players_here || [];
    expect(seen.some((p) => p.player_id === "player.a")).toBe(true);

    const left = await run(w, a, "leave");
    expect(left.ok).toBe(true);
    expect(left.events?.some((e) => e.event_type === "AGENT_LEFT_WORLD")).toBe(true);
    expect(w.players["player.a"].entered).toBe(false);
    expect(left.observation?.in_world).toBe(false);

    const after = (await run(w, b, "look")).observation?.players_here || [];
    expect(after.some((p) => p.player_id === "player.a")).toBe(false);

    const msg = await run(w, b, 'message a "hi"');
    expect(msg.ok).toBe(false);
    expect(msg.error?.code).toBe("FORBIDDEN");
  });

  it("rejects leave when not entered", async () => {
    const w = world();
    const a = principal("player.a");
    const r = await run(w, a, "leave");
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("NOT_IN_WORLD");
  });

  it("players_here is room-local", async () => {
    const w = world();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "enter");
    await run(w, b, "enter");
    await run(w, b, "move east");
    const here = (await run(w, a, "look")).observation?.players_here || [];
    expect(here.some((p) => p.player_id === "player.b")).toBe(false);
  });
});
