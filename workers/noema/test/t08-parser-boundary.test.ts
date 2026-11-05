/**
 * #778 T0.8 — the text parser never sees Player-supplied text under hosted admission.
 *
 * Specs MUD-NATIVE-INTERACTION-TASKS.md T0.8 "Agent bypass regression": structured protocol verbs are
 * dispatched as structured commands, never re-read as text. The R4 matrix asked for an *instrumented*
 * assertion (a spy on `parseHumanCommand`), not only an outcome check. `arguments.line` stays a
 * developer-tooling carrier: under hosted admission (the default since #766) it is inert.
 *
 * The spy also records the server's own hint parsing (affordance commands it generated itself), so
 * assertions are about *Player-supplied* strings reaching the parser, with a developer-mode positive
 * control proving the spy is wired. Local reducer evidence only.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const parserCalls: string[] = [];
vi.mock("../src/actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/actions")>();
  return {
    ...actual,
    parseHumanCommand: (line: string, ctx?: Parameters<typeof actual.parseHumanCommand>[1]) => {
      parserCalls.push(String(line));
      return actual.parseHumanCommand(line, ctx);
    },
  };
});

const { applyWorldCommand } = await import("../src/world-actions");
type WorldRuntime = import("../src/world-actions").WorldRuntime;
type PlayerPrincipal = import("../src/types").PlayerPrincipal;

const agent: PlayerPrincipal = {
  player_id: "player.agent",
  agent_id: "agent.agent",
  session_id: "sess.t08",
  controller_id: "ctrl.agent.agent",
  controller_type: "agent",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1",
  authentication_context: "test",
};

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.t08",
    world_name: "Boundary Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.a",
    rooms: {
      "room.a": { room_id: "room.a", name: "Room A", description: "The start.", exits: [{ direction: "east", to_room_id: "room.b" }], entities: [] },
      "room.b": { room_id: "room.b", name: "Room B", description: "The far side.", exits: [{ direction: "west", to_room_id: "room.a" }], entities: [] },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

type Mode = { admission: "developer" } | undefined;
async function run(w: WorldRuntime, id: string, command: string, args: Record<string, unknown> = {}, mode?: Mode) {
  return applyWorldCommand(w, agent, { request_id: id, idempotency_key: id, command, arguments: args }, async () => true, mode);
}

/** Player text that, if parsed, would do something the structured command did not ask for. */
const CARRIERS = [
  "move east",
  "e",
  "ask desk",
  "alias go = move east",
  "move east; move west",
] as const;

const reachedParser = (text: string) => parserCalls.some((c) => c === text || c.includes(text));

describe("#778 T0.8 hosted admission never hands Player text to the parser", () => {
  beforeEach(() => {
    parserCalls.length = 0;
  });

  for (const line of CARRIERS) {
    it(`hosted: a structured LOOK carrying line ${JSON.stringify(line)} is dispatched as LOOK; the line never reaches the parser`, async () => {
      const w = world();
      expect((await run(w, "enter", "ENTER_WORLD")).ok).toBe(true);
      parserCalls.length = 0;
      const r = await run(w, "look", "LOOK", { line });
      expect(reachedParser(line)).toBe(false);
      expect(w.players[agent.player_id].room_id).toBe("room.a");
      expect(w.players[agent.player_id].command_aliases ?? {}).toEqual({});
      // Dispatched as exactly the structured LOOK: its own two events, no MOVE / macro / alias effects.
      expect(r.ok).toBe(true);
      expect((r.events ?? []).map((e) => e.event_type)).toEqual(["LOOK", "OBSERVATION_GENERATED"]);
    });
  }

  it("hosted: a text-shaped command name is refused without being parsed as text", async () => {
    const w = world();
    expect((await run(w, "enter", "ENTER_WORLD")).ok).toBe(true);
    parserCalls.length = 0;
    const r = await run(w, "text-cmd", "move east");
    expect(r.ok).toBe(false);
    expect(reachedParser("move east")).toBe(false);
    expect(w.players[agent.player_id].room_id).toBe("room.a");
  });

  it("hosted: every structured MOVE resolves from its arguments, not from a contradicting line", async () => {
    const w = world();
    expect((await run(w, "enter", "ENTER_WORLD")).ok).toBe(true);
    parserCalls.length = 0;
    const r = await run(w, "move", "MOVE", { direction: "east", line: "move west" });
    expect(r.ok).toBe(true);
    expect(w.players[agent.player_id].room_id).toBe("room.b");
    expect(reachedParser("move west")).toBe(false);
  });

  it("developer (positive control): the same line IS parsed, so the spy can see Player text", async () => {
    const w = world();
    expect((await run(w, "enter", "ENTER_WORLD", {}, { admission: "developer" })).ok).toBe(true);
    parserCalls.length = 0;
    const r = await run(w, "look", "LOOK", { line: "move east" }, { admission: "developer" });
    expect(reachedParser("move east")).toBe(true);
    expect(r.ok).toBe(true);
    expect(w.players[agent.player_id].room_id).toBe("room.b");
  });
});
