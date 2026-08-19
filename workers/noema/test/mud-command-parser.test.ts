import { describe, expect, it } from "vitest";
import { parseHumanCommand, normalizeStructuredCommand, resolveVisibleEntity, enrichEntity } from "../src/actions";
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

describe("GB-NOEMA-102 safe local noun-resolution", () => {
  const visible = [
    enrichEntity({
      entity_id: "entity.relay-7",
      label: "scarred-conduit",
      entity_type: "INFRASTRUCTURE",
    }),
  ];

  it("resolves a visible label", () => {
    const r = resolveVisibleEntity("scarred-conduit", visible);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entity.entity_id).toBe("entity.relay-7");
    const inspect = parseHumanCommand("inspect scarred-conduit", { entities: visible });
    expect(inspect.ok).toBe(true);
    if (inspect.ok && inspect.action.verb === "INSPECT") {
      expect(inspect.action.arguments.entity_id).toBe("entity.relay-7");
    }
  });

  it("does not confirm an internal entity_id on the text adapter", () => {
    const byId = resolveVisibleEntity("entity.relay-7", visible);
    expect(byId.ok).toBe(false);
    if (!byId.ok) expect(byId.code).toBe("NOT_FOUND");
    const inspect = parseHumanCommand("inspect entity.relay-7", { entities: visible });
    expect(inspect.ok).toBe(false);
    if (!inspect.ok) expect(inspect.code).toBe("NOT_FOUND");
  });

  it("does not treat a hidden entity_id as a discovery hit", () => {
    const hidden = resolveVisibleEntity("entity.not-in-room", visible);
    expect(hidden.ok).toBe(false);
    if (!hidden.ok) expect(hidden.code).toBe("NOT_FOUND");
  });

  it("leaves structured INSPECT on entity_id (protocol bypass)", () => {
    const a = normalizeStructuredCommand("INSPECT", { entity_id: "entity.relay-7" });
    expect(a.ok).toBe(true);
    if (a.ok && a.action.verb === "INSPECT") {
      expect(a.action.arguments.entity_id).toBe("entity.relay-7");
    }
  });
});

describe("GB-NOEMA-202 enrichEntity does not invent condition", () => {
  it("leaves condition unset when the world did not provide one", () => {
    const scarred = enrichEntity({
      entity_id: "entity.relay-7",
      label: "scarred-conduit",
      entity_type: "INFRASTRUCTURE",
    });
    expect(scarred.condition).toBeUndefined();
    const ruin = enrichEntity({
      entity_id: "entity.ruin-1",
      label: "dead-spindle",
      entity_type: "RUIN",
    });
    expect(ruin.condition).toBeUndefined();
  });

  it("preserves an authorized condition", () => {
    const e = enrichEntity({
      entity_id: "entity.relay-7",
      label: "scarred-conduit",
      entity_type: "INFRASTRUCTURE",
      condition: 35,
    });
    expect(e.condition).toBe(35);
  });
});

describe("GB-NOEMA-103 look-at / article inspect phrases", () => {
  const visible = [
    enrichEntity({
      entity_id: "entity.relay-7",
      label: "scarred-conduit",
      entity_type: "INFRASTRUCTURE",
    }),
  ];

  function inspectRelay(r: ReturnType<typeof parseHumanCommand>) {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.action.verb).toBe("INSPECT");
    if (r.action.verb === "INSPECT") expect(r.action.arguments.entity_id).toBe("entity.relay-7");
  }

  it("keeps bare look / l as LOOK", () => {
    for (const line of ["look", "l", "LOOK"]) {
      const r = parseHumanCommand(line);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.action.verb).toBe("LOOK");
    }
  });

  it("maps look X / look at X / inspect X / inspect the X to the same INSPECT", () => {
    for (const line of [
      "look scarred-conduit",
      "look at scarred-conduit",
      "look at the scarred-conduit",
      "inspect scarred-conduit",
      "inspect the scarred-conduit",
      "examine the scarred-conduit",
      "x scarred-conduit",
    ]) {
      inspectRelay(parseHumanCommand(line, { entities: visible }));
    }
  });

  it("does not turn look at into a new verb", () => {
    const r = parseHumanCommand("look at", { entities: visible });
    expect(r.ok).toBe(false);
  });
});
