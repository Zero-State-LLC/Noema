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
  parseShape,
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

function r4CommandFixture(): { world: WorldRuntime; agent: PlayerPrincipal } {
  return {
    world: {
      world_id: "world.test",
      world_name: "Test Reach",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: {
        "room.hub": {
          room_id: "room.hub", name: "Grid Anchor", description: "A frontier anchor.",
          exits: [
            { direction: "north", to_room_id: "room.north", hidden: true },
            { direction: "south", to_room_id: "room.south" },
            { direction: "east", to_room_id: "room.east" },
          ],
          entities: [],
        },
        "room.north": { room_id: "room.north", name: "North", description: "Hidden.", exits: [], entities: [] },
        "room.south": { room_id: "room.south", name: "South", description: "Hidden.", hidden: true, exits: [], entities: [] },
        "room.east": { room_id: "room.east", name: "East", description: "Visible.", exits: [], entities: [] },
      },
      players: {}, trades: {}, messages: [], organizations: {},
      seen_idempotency: {}, unsettled: [],
    },
    agent: {
      player_id: "player.agent", agent_id: "agent.agent", session_id: "sess.test",
      controller_id: "ctrl.agent.agent", controller_type: "agent",
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1", authentication_context: "test",
    },
  };
}

describe("#733 R4 retained text-command safety", () => {
  it("rejects a pending pick after visible exits change", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.exit.enter", idempotency_key: "r4.exit.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const ambiguous = await command("r4.exit.amb", "inspect relay");
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(world.players[agent.player_id].pending_clarify?.choices).toHaveLength(2);
    world.rooms["room.hub"].exits = [
      { direction: "west", to_room_id: "room.east" },
      ...world.rooms["room.hub"].exits.filter((exit) => exit.hidden),
    ];
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const picked = await command("r4.exit.pick", "1");
    expect(picked.error?.code).toBe("STALE_CLARIFICATION");
    expect(picked.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
  });

  it("rejects a pending pick after the public room name or description changes", async () => {
    for (const field of ["name", "description"] as const) {
      const { world, agent } = r4CommandFixture();
      world.rooms["room.hub"].entities = [
        enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
        enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
      ];
      const command = (id: string, line: string) => applyWorldCommand(world, agent,
        { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
      expect((await applyWorldCommand(world, agent,
        { request_id: "room.enter", command: "ENTER_WORLD", arguments: {} }, async () => true, { admission: "developer" })).ok).toBe(true);
      expect((await command("room.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
      world.rooms["room.hub"][field] = `Changed ${field}`;
      const beforeSequence = world.sequence;
      const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
      const pick = await command("room.pick", "1");
      expect(pick.error?.code).toBe("STALE_CLARIFICATION");
      expect(pick.events ?? []).toEqual([]);
      expect(world.sequence).toBe(beforeSequence);
      expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
      expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
    }
  });

  it("rejects a pending pick after public harvest pressure changes", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    world.co_evolution = { harvest_pressure: { "room.hub": 0 }, regen_mod: {}, protocol_strength: {} };
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "pressure.enter", command: "ENTER_WORLD", arguments: {} }, async () => true, { admission: "developer" })).ok).toBe(true);
    expect((await command("pressure.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
    world.co_evolution.harvest_pressure["room.hub"] = 7;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const pick = await command("pressure.pick", "1");
    expect(pick.error?.code).toBe("STALE_CLARIFICATION");
    expect(pick.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
  });

  it("rejects a pending pick when a public budget changes affordance availability", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "budget.enter", command: "ENTER_WORLD", arguments: {} }, async () => true, { admission: "developer" })).ok).toBe(true);
    expect((await command("budget.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
    world.players[agent.player_id].budgets.attention = 0;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const pick = await command("budget.pick", "1");
    expect(pick.error?.code).toBe("STALE_CLARIFICATION");
    expect(pick.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
  });

  it("keeps a pending pick valid when public exits stay unchanged", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.same.enter", idempotency_key: "r4.same.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const ambiguous = await applyWorldCommand(world, agent,
      { request_id: "r4.same.amb", idempotency_key: "r4.same.amb", command: "LOOK", arguments: { line: "inspect relay" } },
      async () => true, { admission: "developer" });
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    const picked = await applyWorldCommand(world, agent,
      { request_id: "r4.same.pick", idempotency_key: "r4.same.pick", command: "LOOK", arguments: { line: "1" } },
      async () => true, { admission: "developer" });
    expect(picked.ok).toBe(true);
    expect(picked.events?.some((event) => event.event_type === "INSPECT")).toBe(true);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
  });

  it("does not suggest a hidden exit on unknown text", async () => {
    const { world, agent } = r4CommandFixture();
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.enter", idempotency_key: "r4.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const result = await applyWorldCommand(world, agent,
      { request_id: "r4.unknown", idempotency_key: "r4.unknown", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("UNKNOWN_COMMAND");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("north");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("south");
    expect(result.error?.message).toContain("move east");
    expect(result.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
  });

  it("#778 T0.7: does not suggest or reveal a hidden entity on unknown text", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.secret", label: "sealed-cache", entity_type: "INFRASTRUCTURE", hidden: true }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "778.enter", idempotency_key: "778.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const result = await applyWorldCommand(world, agent,
      { request_id: "778.unknown", idempotency_key: "778.unknown", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(result.error?.code).toBe("UNKNOWN_COMMAND");
    const wire = JSON.stringify(result).toLowerCase();
    expect(wire).not.toContain("sealed-cache");
    expect(wire).not.toContain("entity.secret");
    expect(result.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
  });

  it("#778 T0.7: naming a hidden entity in text neither resolves nor reveals it", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.secret", label: "sealed-cache", entity_type: "INFRASTRUCTURE", hidden: true }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "778.h.enter", idempotency_key: "778.h.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const result = await applyWorldCommand(world, agent,
      { request_id: "778.h.inspect", idempotency_key: "778.h.inspect", command: "LOOK", arguments: { line: "inspect sealed-cache" } },
      async () => true, { admission: "developer" });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("entity.secret");
    expect(result.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
  });

  it("#778 T0.6: rejects a pending pick after a same-ID entity is relabelled", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "778.l.enter", idempotency_key: "778.l.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    expect((await command("778.l.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
    // Same entity IDs, materially different public labels: choice "1" no longer means what the Player saw.
    world.rooms["room.hub"].entities[0].label = "relay-decoy";
    const beforeSequence = world.sequence;
    const picked = await command("778.l.pick", "1");
    expect(picked.error?.code).toBe("STALE_CLARIFICATION");
    expect(world.sequence).toBe(beforeSequence);
  });

  it("#778 T0.6: a pending pick does not survive leaving and re-entering the world", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    const run = (id: string, commandName: string, args: Record<string, unknown> = {}) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: commandName, arguments: args }, async () => true, { admission: "developer" });
    expect((await run("778.s.enter", "ENTER_WORLD")).ok).toBe(true);
    expect((await run("778.s.amb", "LOOK", { line: "inspect relay" })).error?.code).toBe("AMBIGUOUS_TARGET");
    expect((await run("778.s.leave", "LEAVE_WORLD")).ok).toBe(true);
    expect((await run("778.s.reenter", "ENTER_WORLD")).ok).toBe(true);
    expect(world.players[agent.player_id].pending_clarify ?? null).toBeNull();
    const beforeSequence = world.sequence;
    const picked = await run("778.s.pick", "LOOK", { line: "1" });
    // A new session must not execute a choice offered in the previous one: "1" is no longer a pick, so it is
    // an unknown command (visible labels may still appear in its public hint), and nothing settles.
    expect(picked.ok).toBe(false);
    expect(picked.error?.code).toBe("UNKNOWN_COMMAND");
    expect(picked.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
  });

  it("#778 T0.6: a pending pick is bound to the session that was offered it", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    const run = (who: PlayerPrincipal, id: string, commandName: string, args: Record<string, unknown> = {}) => applyWorldCommand(world, who,
      { request_id: id, idempotency_key: id, command: commandName, arguments: args }, async () => true, { admission: "developer" });
    expect((await run(agent, "778.t.enter", "ENTER_WORLD")).ok).toBe(true);
    expect((await run(agent, "778.t.amb", "LOOK", { line: "inspect relay" })).error?.code).toBe("AMBIGUOUS_TARGET");
    const otherSession = { ...agent, session_id: "sess.other" };
    const beforeSequence = world.sequence;
    const picked = await run(otherSession, "778.t.pick", "LOOK", { line: "1" });
    expect(picked.error?.code).toBe("STALE_CLARIFICATION");
    expect(world.sequence).toBe(beforeSequence);
  });

  for (const between of [
    { name: "HELP", line: "help" },
    { name: "unknown text", line: "frobnicate" },
    { name: "WAIT", line: "wait" },
  ]) {
    it(`#778 bounded: a pick lives one command — ${between.name} in between clears it`, async () => {
      const { world, agent } = r4CommandFixture();
      world.rooms["room.hub"].entities = [
        enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
        enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
      ];
      const line = (id: string, text: string) => applyWorldCommand(world, agent,
        { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line: text } }, async () => true, { admission: "developer" });
      expect((await applyWorldCommand(world, agent,
        { request_id: "b.enter", idempotency_key: "b.enter", command: "ENTER_WORLD", arguments: {} },
        async () => true, { admission: "developer" })).ok).toBe(true);
      expect((await line("b.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
      await line("b.between", between.line);
      expect(world.players[agent.player_id].pending_clarify ?? null).toBeNull();
      const beforeSequence = world.sequence;
      const picked = await line("b.pick", "1");
      expect(picked.ok).toBe(false);
      expect(picked.error?.code).toBe("UNKNOWN_COMMAND");
      expect(world.sequence).toBe(beforeSequence);
    });
  }

  it("#778 bounded: a clarification lists at most 9 numbered choices and asks for more detail beyond that", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = Array.from({ length: 12 }, (_, i) =>
      enrichEntity({ entity_id: `r${i + 1}`, label: `relay-${String(i + 1).padStart(2, "0")}`, entity_type: "INFRASTRUCTURE", condition: 40 }));
    const line = (id: string, text: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line: text } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "c.enter", idempotency_key: "c.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const amb = await line("c.amb", "inspect relay");
    expect(amb.error?.code).toBe("AMBIGUOUS_TARGET");
    const pending = world.players[agent.player_id].pending_clarify;
    expect(pending?.choices).toHaveLength(9);
    const msg = String(amb.error?.message ?? "");
    expect(msg).toMatch(/^9\. /m);
    expect(msg).not.toMatch(/^10\. /m);
    expect(msg).toMatch(/more specific/i);
    // The stored list ends at the ninth match; that "10" is not a pick is asserted in the next test.
    expect(world.players[agent.player_id].pending_clarify?.choices[8]).toBe("Relay 09");
  });

  it("#778 bounded: with 12 matches, choice 10 is not a pick", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = Array.from({ length: 12 }, (_, i) =>
      enrichEntity({ entity_id: `r${i + 1}`, label: `relay-${String(i + 1).padStart(2, "0")}`, entity_type: "INFRASTRUCTURE", condition: 40 }));
    const line = (id: string, text: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line: text } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "d.enter", idempotency_key: "d.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    expect((await line("d.amb", "inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
    const beforeSequence = world.sequence;
    const ten = await line("d.ten", "10");
    expect(ten.error?.code).toBe("UNKNOWN_COMMAND");
    expect(world.sequence).toBe(beforeSequence);
  });

  it("suggests only affordable public actions", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.relay-7", label: "scarred-conduit", entity_type: "INFRASTRUCTURE" }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.hint.enter", idempotency_key: "r4.hint.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const player = world.players[agent.player_id];
    player.budgets.energy = 0;
    player.budgets.attention = 0;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(player.budgets);
    const result = await applyWorldCommand(world, agent,
      { request_id: "r4.hint.unknown", idempotency_key: "r4.hint.unknown", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(result.error?.code).toBe("UNKNOWN_COMMAND");
    expect(result.error?.message).not.toContain("move east");
    expect(result.error?.message).not.toContain("inspect scarred-conduit");
    expect(result.error?.message).toContain("help");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("north");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("south");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("entity.relay-7");
    expect(result.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(player.budgets).toEqual(beforeBudgets);

    const fresh = r4CommandFixture();
    fresh.world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.relay-7", label: "scarred-conduit", entity_type: "INFRASTRUCTURE" }),
    ];
    expect((await applyWorldCommand(fresh.world, fresh.agent,
      { request_id: "r4.hint.fresh.enter", idempotency_key: "r4.hint.fresh.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const available = await applyWorldCommand(fresh.world, fresh.agent,
      { request_id: "r4.hint.fresh.unknown", idempotency_key: "r4.hint.fresh.unknown", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(available.error?.code).toBe("UNKNOWN_COMMAND");
    expect(available.error?.message).toContain("move east");
    expect(available.error?.message).toContain("inspect scarred-conduit");

    fresh.world.players[fresh.agent.player_id].budgets.energy = 0;
    const inspectOnly = await applyWorldCommand(fresh.world, fresh.agent,
      { request_id: "r4.hint.inspect", idempotency_key: "r4.hint.inspect", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(inspectOnly.error?.message).not.toContain("move east");
    expect(inspectOnly.error?.message).toContain("inspect scarred-conduit");

    fresh.world.players[fresh.agent.player_id].budgets.energy = 20;
    fresh.world.players[fresh.agent.player_id].budgets.attention = 0;
    const moveOnly = await applyWorldCommand(fresh.world, fresh.agent,
      { request_id: "r4.hint.move", idempotency_key: "r4.hint.move", command: "LOOK", arguments: { line: "frobnicate" } },
      async () => true, { admission: "developer" });
    expect(moveOnly.error?.message).toContain("move east");
    expect(moveOnly.error?.message).not.toContain("inspect scarred-conduit");
  });

  it("does not suggest MOVE under presence pressure", async () => {
    const { world, agent } = r4CommandFixture();
    expect((await applyWorldCommand(world, agent,
      { request_id: "pressure.enter", command: "ENTER_WORLD", arguments: {} }, async () => true, { admission: "developer" })).ok).toBe(true);
    world.players[agent.player_id].disabled_until_cycle = world.cycle + 3;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const unknown = await applyWorldCommand(world, agent,
      { request_id: "pressure.unknown", command: "LOOK", arguments: { line: "frobnicate" } }, async () => true, { admission: "developer" });
    expect(unknown.error?.code).toBe("UNKNOWN_COMMAND");
    expect(unknown.error?.message).not.toContain("move east");
    expect(unknown.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    const move = await applyWorldCommand(world, agent,
      { request_id: "pressure.move", command: "LOOK", arguments: { line: "move east" } }, async () => true, { admission: "developer" });
    expect(move.error?.code).toBe("FORBIDDEN");
    expect(world.players[agent.player_id].room_id).toBe("room.hub");
    world.players[agent.player_id].disabled_until_cycle = world.cycle;
    const restored = await applyWorldCommand(world, agent,
      { request_id: "pressure.restored", command: "LOOK", arguments: { line: "frobnicate" } }, async () => true, { admission: "developer" });
    expect(restored.error?.message).toContain("move east");
  });

  it("suggests only a MOVE command that resolves to its public exit", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].exits = [{ direction: "e", to_room_id: "room.east" }];
    expect((await applyWorldCommand(world, agent,
      { request_id: "direction.enter", command: "ENTER_WORLD", arguments: {} }, async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const unknown = await applyWorldCommand(world, agent,
      { request_id: "direction.unknown", command: "LOOK", arguments: { line: "frobnicate" } }, async () => true, { admission: "developer" });
    expect(unknown.error?.code).toBe("UNKNOWN_COMMAND");
    expect(unknown.error?.message).not.toContain("move e");
    expect(unknown.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    const followed = await applyWorldCommand(world, agent,
      { request_id: "direction.follow", command: "LOOK", arguments: { line: "move e" } }, async () => true, { admission: "developer" });
    expect(followed.error?.code).toBe("MOVE_REJECTED");
    world.rooms["room.hub"].exits = [{ direction: "east", to_room_id: "room.east" }];
    const restored = await applyWorldCommand(world, agent,
      { request_id: "direction.restored", command: "LOOK", arguments: { line: "frobnicate" } }, async () => true, { admission: "developer" });
    expect(restored.error?.message).toContain("move east");
    const moved = await applyWorldCommand(world, agent,
      { request_id: "direction.moved", command: "LOOK", arguments: { line: "move east" } }, async () => true, { admission: "developer" });
    expect(moved.ok).toBe(true);
    expect(world.players[agent.player_id].room_id).toBe("room.east");
  });

  it("does not suggest an affordable but ambiguous inspect command", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay", entity_type: "INFRASTRUCTURE" }),
      enrichEntity({ entity_id: "b", label: "relay", entity_type: "INFRASTRUCTURE" }),
    ];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.duplicate.enter", idempotency_key: "r4.duplicate.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const result = await command("r4.duplicate.unknown", "frobnicate");
    expect(result.error?.code).toBe("UNKNOWN_COMMAND");
    expect(result.error?.message).not.toContain("inspect relay");
    expect(result.error?.message).toContain("move east");
    expect(result.error?.message).toContain("help");
    expect(result.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    const ambiguous = await command("r4.duplicate.inspect", "inspect relay");
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
  });

  it("does not suggest inspect text that targets a different entity", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.article", label: "the relay", entity_type: "INFRASTRUCTURE" }),
      enrichEntity({ entity_id: "entity.plain", label: "relay", entity_type: "INFRASTRUCTURE" }),
    ];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.article.enter", idempotency_key: "r4.article.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const hint = await command("r4.article.unknown", "frobnicate");
    expect(hint.error?.code).toBe("UNKNOWN_COMMAND");
    expect(hint.error?.message).not.toContain("inspect the relay");
    expect(hint.error?.message).toContain("inspect relay");
    expect(hint.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    const followed = await command("r4.article.follow", "inspect the relay");
    expect(followed.events?.some((event) => event.event_type === "INSPECT" && event.payload?.entity_id === "entity.plain")).toBe(true);
  });

  it("does not suggest a restricted route or sealed inspection", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "entity.sealed", label: "sealed-relay", entity_type: "INFRASTRUCTURE", inspect_restricted_until: 10 }),
      enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE" }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.legal.enter", idempotency_key: "r4.legal.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    world.access_restrictions = [{
      restriction_id: "restr.east", scope: "EXIT", mode: "DENY", applies_to: "*",
      room_id: "room.hub", exit_id: "east", expires_cycle: 10,
    }];
    const command = (id: string, line: string) => applyWorldCommand(world, agent,
      { request_id: id, idempotency_key: id, command: "LOOK", arguments: { line } }, async () => true, { admission: "developer" });
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const hint = await command("r4.legal.unknown", "frobnicate");
    expect(hint.error?.code).toBe("UNKNOWN_COMMAND");
    expect(hint.error?.message).not.toContain("move east");
    expect(hint.error?.message).not.toContain("inspect sealed-relay");
    expect(hint.error?.message).toContain("inspect open-conduit");
    expect(hint.events ?? []).toEqual([]);
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
    expect((await command("r4.legal.east", "move east")).error?.code).toBe("MOVE_REJECTED");
    expect((await command("r4.legal.sealed", "inspect sealed-relay")).error?.code).toBe("FORBIDDEN");

    world.rooms["room.hub"].entities = [world.rooms["room.hub"].entities[0]];
    const sealedOnly = await command("r4.legal.sealedonly", "frobnicate");
    expect(sealedOnly.error?.message).not.toContain("inspect sealed-relay");
    world.rooms["room.hub"].entities[0].inspect_restricted_until = 0;
    world.access_restrictions = [];
    const restored = await command("r4.legal.restored", "frobnicate");
    expect(restored.error?.message).toContain("move east");
    expect(restored.error?.message).toContain("inspect sealed-relay");
  });

  it("rejects a pending harvest pick after visible stock changes", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "ore-east", entity_type: "RESOURCE", stock_amount: 10 }),
      enrichEntity({ entity_id: "b", label: "ore-west", entity_type: "RESOURCE", stock_amount: 10 }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.stock.enter", idempotency_key: "r4.stock.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const ambiguous = await applyWorldCommand(world, agent,
      { request_id: "r4.stock.amb", idempotency_key: "r4.stock.amb", command: "LOOK", arguments: { line: "harvest ore" } },
      async () => true, { admission: "developer" });
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(world.players[agent.player_id].pending_clarify?.choices).toHaveLength(2);
    world.rooms["room.hub"].entities[0].stock_amount = 1;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const picked = await applyWorldCommand(world, agent,
      { request_id: "r4.stock.pick", idempotency_key: "r4.stock.pick", command: "LOOK", arguments: { line: "1" } },
      async () => true, { admission: "developer" });
    expect(picked.error?.code).toBe("STALE_CLARIFICATION");
    expect(picked.events ?? []).toEqual([]);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
  });

  it("rejects a pending pick after harvestability changes", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "ore-east", entity_type: "RESOURCE", stock_amount: 0, regen_rate: 0 }),
      enrichEntity({ entity_id: "b", label: "ore-west", entity_type: "RESOURCE", stock_amount: 0, regen_rate: 0 }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.regen.enter", idempotency_key: "r4.regen.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const ambiguous = await applyWorldCommand(world, agent,
      { request_id: "r4.regen.amb", idempotency_key: "r4.regen.amb", command: "LOOK", arguments: { line: "inspect ore" } },
      async () => true, { admission: "developer" });
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(world.players[agent.player_id].pending_clarify?.choices).toHaveLength(2);
    world.rooms["room.hub"].entities[0].regen_rate = 1;
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const picked = await applyWorldCommand(world, agent,
      { request_id: "r4.regen.pick", idempotency_key: "r4.regen.pick", command: "LOOK", arguments: { line: "1" } },
      async () => true, { admission: "developer" });
    expect(picked.error?.code).toBe("STALE_CLARIFICATION");
    expect(picked.events ?? []).toEqual([]);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
  });

  it("rejects a pending pick after same-ID relabel", async () => {
    const { world, agent } = r4CommandFixture();
    world.rooms["room.hub"].entities = [
      enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
      enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
    ];
    expect((await applyWorldCommand(world, agent,
      { request_id: "r4.pick.enter", idempotency_key: "r4.pick.enter", command: "ENTER_WORLD", arguments: {} },
      async () => true, { admission: "developer" })).ok).toBe(true);
    const ambiguous = await applyWorldCommand(world, agent,
      { request_id: "r4.pick.amb", idempotency_key: "r4.pick.amb", command: "LOOK", arguments: { line: "inspect relay" } },
      async () => true, { admission: "developer" });
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(world.players[agent.player_id].pending_clarify?.choices).toHaveLength(2);
    world.rooms["room.hub"].entities[0].label = "renamed-conduit";
    const beforeSequence = world.sequence;
    const beforeBudgets = structuredClone(world.players[agent.player_id].budgets);
    const pick = await applyWorldCommand(world, agent,
      { request_id: "r4.pick.stale", idempotency_key: "r4.pick.stale", command: "LOOK", arguments: { line: "1" } },
      async () => true, { admission: "developer" });
    expect(pick.ok).toBe(false);
    expect(pick.error?.code).toBe("STALE_CLARIFICATION");
    expect(pick.events ?? []).toEqual([]);
    expect(world.players[agent.player_id].pending_clarify).toBeUndefined();
    expect(world.sequence).toBe(beforeSequence);
    expect(world.players[agent.player_id].budgets).toEqual(beforeBudgets);
  });
});

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
      if (!r.ok) {
        expect(r.error.toLowerCase()).toMatch(/move where/);
        expect(r.code).toBe("INVALID_REQUEST");
        expect(r.reason).toBe("MOVE_DIRECTION_REQUIRED");
      }
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
    const entered = await applyWorldCommand(w, agent, enter, async () => true, { admission: "developer" });
    expect(entered.ok).toBe(true);

    const walk: CommandEnvelope = {
      request_id: "req.walk",
      idempotency_key: "idem.walk",
      command: "LOOK",
      arguments: { line: "walk east" },
    };
    const moved = await applyWorldCommand(w, agent, walk, async () => true, { admission: "developer" });
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
      '["room.hub",[["a","","",null,"",null,false,false],["b","","",null,"",null,false,false]],[]]',
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
    expect((await applyWorldCommand(w, agent, enter, async () => true, { admission: "developer" })).ok).toBe(true);

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
    { admission: "developer" });
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
    { admission: "developer" });
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
        { admission: "developer" })
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
    { admission: "developer" });
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
        { admission: "developer" })
      ).ok,
    ).toBe(true);
    const stale = await applyWorldCommand(
      w,
      agent,
      { request_id: "p", idempotency_key: "p", command: "LOOK", arguments: { line: "1" } },
      async () => true,
    { admission: "developer" });
    expect(stale.ok).toBe(false);
    // #778: the Player's own intervening command ("walk east") already dropped the clarification (one-command
    // lifetime), so "1" is no longer a pick at all. STALE_CLARIFICATION remains for a world that changes under
    // a pending pick without the Player acting (see "#733 R4 retained text-command safety").
    expect(stale.error?.code).toBe("UNKNOWN_COMMAND");
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

  it("does not resolve an unobservable recipient: it passes the typed name to admission unresolved (#791)", () => {
    // The parser never answers NOT_FOUND for a message recipient: that would distinguish a never-seen name
    // from a Player who left. World admission refuses both identically (see r4-phrase-effect-equivalence).
    const r = parseHumanCommand("tell ghost hi", ctx);
    expect(r.ok).toBe(true);
    if (r.ok && r.action.verb === "MESSAGE") expect(r.action.arguments.recipient_id).toBe("ghost");
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

describe("T0.2 parseShape (does not replace ParseResult.ok)", () => {
  it("maps resolved / ambiguous / unsupported / invalid without changing ok", () => {
    const east = parseHumanCommand("east");
    expect(east.ok).toBe(true);
    expect(parseShape(east)).toBe("resolved");

    const amb = parseHumanCommand("inspect relay", {
      entities: [
        enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE" }),
        enrichEntity({ entity_id: "b", label: "relay-west", entity_type: "INFRASTRUCTURE" }),
      ],
    });
    expect(amb.ok).toBe(false);
    if (!amb.ok) expect(amb.code).toBe("AMBIGUOUS_TARGET");
    expect(parseShape(amb)).toBe("ambiguous");

    const unk = parseHumanCommand("blorble");
    expect(unk.ok).toBe(false);
    if (!unk.ok) expect(unk.code).toBe("UNKNOWN_COMMAND");
    expect(parseShape(unk)).toBe("unsupported");

    const help = parseHumanCommand("help");
    expect(help.ok).toBe(false);
    if (!help.ok) expect(help.code).toBe("HELP");
    expect(parseShape(help)).toBe("unsupported");

    const missing = parseHumanCommand("inspect", {
      entities: [enrichEntity({ entity_id: "a", label: "relay-east", entity_type: "INFRASTRUCTURE" })],
    });
    expect(missing.ok).toBe(false);
    expect(parseShape(missing)).toBe("invalid");
  });

  it("keeps structured MOVE-without-direction as invalid, not a text-line parse", () => {
    const r = normalizeStructuredCommand("MOVE", {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("INVALID_REQUEST");
      expect(r.error).toMatch(/direction/i);
    }
    expect(parseShape(r)).toBe("invalid");
  });
});

describe("T0.8 structured protocol does not fall into the text adapter", () => {
  it("MOVE without direction stays INVALID_REQUEST", async () => {
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
    expect(
      (
        await applyWorldCommand(
          w,
          agent,
          { request_id: "e", idempotency_key: "e", command: "ENTER_WORLD", arguments: {} },
          async () => true,
        { admission: "developer" })
      ).ok,
    ).toBe(true);
    const miss = await applyWorldCommand(
      w,
      agent,
      { request_id: "m", idempotency_key: "m", command: "MOVE", arguments: {} },
      async () => true,
    { admission: "developer" });
    expect(miss.ok).toBe(false);
    expect(miss.error?.code).toBe("INVALID_REQUEST");
    expect(miss.error?.message).toMatch(/direction/i);
    expect(w.players[agent.player_id]?.room_id).toBe("room.hub");
  });
});
