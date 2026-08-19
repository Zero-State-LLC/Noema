import { describe, expect, it } from "vitest";
import {
  parseHumanCommand,
  normalizeStructuredCommand,
  resolveVisibleEntity,
  enrichEntity,
  classifyResourceNode,
  matchClarifyPick,
  observationFingerprint,
  helpText,
  type Affordance,
} from "../src/actions";
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

  it("suggests only visible affordances on UNKNOWN_COMMAND", () => {
    const r = parseHumanCommand("frobnicate", {
      entities: [
        enrichEntity({
          entity_id: "entity.relay-7",
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
        }),
      ],
      exits: [{ direction: "east" }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("UNKNOWN_COMMAND");
      expect(r.error.toLowerCase()).toMatch(/try:/);
      expect(r.error).toMatch(/help/);
      expect(r.error).toMatch(/move east/);
      expect(r.error).toMatch(/inspect scarred-conduit/);
      expect(r.error).not.toMatch(/entity\.relay-7/);
    }
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

describe("GB-NOEMA-203 classifyResourceNode does not invent stock", () => {
  it("does not treat cache/cell labels as harvest nodes", () => {
    const n = classifyResourceNode({
      entity_id: "entity.storage-cell-cache",
      label: "bond-board",
      entity_type: "INFRASTRUCTURE",
    });
    expect(n.is_node).toBe(false);
  });

  it("honors explicit stock and RESOURCE type without inventing amount 8", () => {
    expect(
      classifyResourceNode({
        entity_id: "entity.ore",
        label: "outcrop",
        entity_type: "RESOURCE",
      }),
    ).toEqual({ is_node: true, resource: "energy", amount: 0 });
    expect(
      classifyResourceNode({
        entity_id: "entity.cache",
        label: "cache",
        entity_type: "INFRASTRUCTURE",
        stock_resource: "energy",
        stock_amount: 8,
      }),
    ).toEqual({ is_node: true, resource: "energy", amount: 8 });
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

describe("T0.6 ambiguity lifecycle", () => {
  const pending = {
    fingerprint: "room.hub#a|b",
    verb: "inspect",
    choices: ["Relay East", "Relay West"],
  };

  it("matches numeric and unique-name picks", () => {
    expect(matchClarifyPick("1", pending)).toBe("Relay East");
    expect(matchClarifyPick("2", pending)).toBe("Relay West");
    expect(matchClarifyPick("relay east", pending)).toBe("Relay East");
    expect(matchClarifyPick("3", pending)).toBeNull();
    expect(matchClarifyPick("relay", pending)).toBeNull();
    expect(observationFingerprint("room.hub", [{ entity_id: "b" }, { entity_id: "a" }])).toBe(
      "room.hub#a|b",
    );
  });

  it("inspect 1 after AMBIGUOUS_TARGET inspects the first visible label", async () => {
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
          entities: [
            enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE" }),
            enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE" }),
          ],
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
    expect((await applyWorldCommand(w, agent, enter, async () => true)).ok).toBe(true);

    const amb = await applyWorldCommand(
      w,
      agent,
      {
        request_id: "req.amb",
        idempotency_key: "idem.amb",
        command: "LOOK",
        arguments: { line: "inspect relay" },
      },
      async () => true,
    );
    expect(amb.ok).toBe(false);
    expect(amb.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(w.players[agent.player_id]?.pending_clarify?.choices?.length).toBe(2);

    const picked = await applyWorldCommand(
      w,
      agent,
      {
        request_id: "req.pick",
        idempotency_key: "idem.pick",
        command: "LOOK",
        arguments: { line: "1" },
      },
      async () => true,
    );
    expect(picked.ok).toBe(true);
    expect(picked.events?.some((e) => e.event_type === "INSPECT")).toBe(true);
    expect(w.players[agent.player_id]?.pending_clarify).toBeUndefined();
  });

  it("rejects a numeric pick after the room observation changes", async () => {
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
          entities: [
            enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE" }),
            enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE" }),
          ],
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
    expect(
      (
        await applyWorldCommand(
          w,
          agent,
          { request_id: "e", idempotency_key: "e", command: "ENTER_WORLD", arguments: {} },
          async () => true,
        )
      ).ok,
    ).toBe(true);
    await applyWorldCommand(
      w,
      agent,
      {
        request_id: "a",
        idempotency_key: "a",
        command: "LOOK",
        arguments: { line: "inspect relay" },
      },
      async () => true,
    );
    expect(
      (
        await applyWorldCommand(
          w,
          agent,
          {
            request_id: "m",
            idempotency_key: "m",
            command: "LOOK",
            arguments: { line: "walk east" },
          },
          async () => true,
        )
      ).ok,
    ).toBe(true);
    const stale = await applyWorldCommand(
      w,
      agent,
      { request_id: "p", idempotency_key: "p", command: "LOOK", arguments: { line: "1" } },
      async () => true,
    );
    expect(stale.ok).toBe(false);
    expect(stale.error?.code).toBe("STALE_CLARIFICATION");
  });
});

describe("T0.5 message phrases", () => {
  const players = [
    { player_id: "player.self", handle: "self" },
    { player_id: "player.rhea", handle: "rhea" },
  ];
  const ctx = { players, selfId: "player.self" };

  function toRhea(r: ReturnType<typeof parseHumanCommand>, text: string) {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.action.verb).toBe("MESSAGE");
    if (r.action.verb === "MESSAGE") {
      expect(r.action.arguments.recipient_id).toBe("player.rhea");
      expect(r.action.arguments.text).toBe(text);
    }
  }

  it("maps tell / say to / message to the same MESSAGE", () => {
    toRhea(parseHumanCommand("tell rhea hello", ctx), "hello");
    toRhea(parseHumanCommand("say to rhea hello", ctx), "hello");
    toRhea(parseHumanCommand('message rhea "hello"', ctx), "hello");
    toRhea(parseHumanCommand("message rhea hello", ctx), "hello");
    toRhea(parseHumanCommand("msg rhea hello", ctx), "hello");
  });

  it("does not resolve an unobservable recipient", () => {
    const r = parseHumanCommand("tell ghost hi", ctx);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOT_FOUND");
  });

  it("keeps structured MESSAGE off the text adapter", () => {
    const a = normalizeStructuredCommand("MESSAGE", { recipient_id: "player.rhea", text: "hello" });
    expect(a.ok).toBe(true);
    if (a.ok && a.action.verb === "MESSAGE") {
      expect(a.action.arguments.recipient_id).toBe("player.rhea");
      expect(a.action.arguments.text).toBe("hello");
    }
  });
});

describe("S2 contextual help", () => {
  const many: Affordance[] = [
    { action: "LOOK", verb: "LOOK", label: "Look", cmd: "look", available: true, kind: "utility" },
    { action: "MOVE", verb: "MOVE", label: "East", cmd: "move east", available: true, kind: "move" },
    { action: "INSPECT", verb: "INSPECT", label: "Inspect", cmd: "inspect scarred-conduit", available: true, kind: "utility" },
    { action: "REPAIR", verb: "REPAIR", label: "Repair", cmd: "repair scarred-conduit", available: true, kind: "primary" },
  ];

  it("default help with affordances lists at most 3 acts and no KNOWN COMMANDS dump", () => {
    const text = helpText(undefined, many);
    expect(text).toMatch(/^HERE/m);
    expect(text).toMatch(/look/);
    expect(text).toMatch(/move east/);
    expect(text).toMatch(/inspect scarred-conduit/);
    expect(text).not.toMatch(/repair scarred-conduit/);
    expect(text).not.toMatch(/KNOWN COMMANDS/);
    expect(text).toMatch(/help all/);
  });

  it("help all is explicit deep disclosure of existing authority", () => {
    const text = helpText("all");
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).toMatch(/\bBUILD\b/);
    expect(text).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});
