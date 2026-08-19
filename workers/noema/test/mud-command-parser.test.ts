import { describe, expect, it } from "vitest";
import { parseHumanCommand, normalizeStructuredCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function eastMove(r: ReturnType<typeof parseHumanCommand>) {
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.action.verb).toBe("MOVE");
  if (r.action.verb === "MOVE") expect(r.action.arguments.direction).toBe("east");
}

describe("GB-NOEMA-101 movement normalization", () => {
  it("maps e / east / go east / walk east / move east to the same MOVE", () => {
    for (const line of ["e", "east", "go east", "walk east", "move east", "move e", "go e", "walk e"]) {
      eastMove(parseHumanCommand(line));
    }
  });

  it("canonicalizes the other compass shorthand the same way", () => {
    const table: Array<[string, string]> = [
      ["n", "north"],
      ["north", "north"],
      ["go north", "north"],
      ["s", "south"],
      ["walk south", "south"],
      ["w", "west"],
      ["move w", "west"],
    ];
    for (const [line, dir] of table) {
      const r = parseHumanCommand(line);
      expect(r.ok).toBe(true);
      if (r.ok && r.action.verb === "MOVE") expect(r.action.arguments.direction).toBe(dir);
      else expect(r.ok && r.action.verb).toBe("MOVE");
    }
  });

  it("does not treat an unknown bare word as a direction", () => {
    const r = parseHumanCommand("crane");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("UNKNOWN_COMMAND");
  });

  it("still asks for a direction when move/go/walk have none", () => {
    for (const line of ["move", "go", "walk"]) {
      const r = parseHumanCommand(line);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.toLowerCase()).toMatch(/move where/);
    }
  });

  it("keeps structured MOVE on the same canonical direction (no parser on this path)", () => {
    const a = normalizeStructuredCommand("MOVE", { direction: "e" });
    const b = normalizeStructuredCommand("MOVE", { direction: "east" });
    expect(a.ok && a.action.verb).toBe("MOVE");
    expect(b.ok && b.action.verb).toBe("MOVE");
    if (a.ok && a.action.verb === "MOVE") expect(a.action.arguments.direction).toBe("east");
    if (b.ok && b.action.verb === "MOVE") expect(b.action.arguments.direction).toBe("east");
  });
});

describe("GB-NOEMA-101 text-line inhabit (agent)", () => {
  it("walk east through arguments.line settles to the east exit", async () => {
    const w: WorldRuntime = {
      world_id: "world.test",
      world_name: "Test Reach",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "A frontier anchor.",
          exits: [{ direction: "east", to_room_id: "room.east" }],
          entities: [],
        },
        "room.east": {
          room_id: "room.east",
          name: "Coldline",
          description: "A thin route.",
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
    const agent: PlayerPrincipal = {
      player_id: "player.agent",
      agent_id: "agent.agent",
      session_id: "sess.test",
      controller_id: "ctrl.agent.agent",
      controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "test",
    };
    const enter: CommandEnvelope = {
      request_id: "req.enter",
      idempotency_key: "idem.enter",
      command: "ENTER_WORLD",
      arguments: {},
    };
    const entered = await applyWorldCommand(w, agent, enter, async () => true);
    expect(entered.ok).toBe(true);

    const walk: CommandEnvelope = {
      request_id: "req.walk",
      idempotency_key: "idem.walk",
      command: "LOOK",
      arguments: { line: "walk east" },
    };
    const moved = await applyWorldCommand(w, agent, walk, async () => true);
    expect(moved.ok).toBe(true);
    expect(w.players[agent.player_id]?.room_id).toBe("room.east");
  });
});
