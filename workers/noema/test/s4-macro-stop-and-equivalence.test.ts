/**
 * #782 S4 developer-macro stop conditions and effect equivalence.
 * Hosted admission never enters this path (see admission-mode-default.test.ts).
 * Local reducer evidence only. Not a hosted revocation or settlement proof.
 */
import { describe, expect, it } from "vitest";
import { enrichEntity } from "../src/actions";
import { isReservedAliasName, parseAliasCommand } from "../src/command-aliases";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";

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

function other(): PlayerPrincipal {
  return { ...agent, player_id: "player.other", agent_id: "agent.other", session_id: "sess.other", controller_id: "ctrl.other" };
}

function world(): WorldRuntime {
  return {
    world_id: "world.test.s4",
    world_name: "Alias Reach",
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
          enrichEntity({ entity_id: "entity.relay-east", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
          enrichEntity({ entity_id: "entity.relay-west", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
          enrichEntity({ entity_id: "entity.conduit", label: "conduit", entity_type: "INFRASTRUCTURE", condition: 80 }),
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
}

function envelope(key: string, line: string): CommandEnvelope {
  return { request_id: key, idempotency_key: key, command: "LOOK", arguments: { line } };
}

async function dev(w: WorldRuntime, who: PlayerPrincipal, key: string, line: string, settle?: (ev: { event_type: string }) => Promise<boolean>) {
  return applyWorldCommand(w, who, envelope(key, line), settle ?? (async () => true), { admission: "developer" });
}

async function enter(w: WorldRuntime, who: PlayerPrincipal, key: string) {
  const result = await applyWorldCommand(
    w,
    who,
    { request_id: key, idempotency_key: key, command: "ENTER_WORLD" },
    async () => true,
    { admission: "developer" },
  );
  expect(result.ok).toBe(true);
}

function stableEvents(events: Array<{ event_type: string; payload: Record<string, unknown> }> | undefined) {
  return (events || []).map((event) => ({
    event_type: event.event_type,
    payload: Object.fromEntries(Object.entries(event.payload).filter(([key]) => !/id$|uuid|digest/.test(key)).sort(([a], [b]) => a.localeCompare(b))),
  }));
}

describe("#782 developer macro stops and equivalence", () => {
  it("refuses reserved synonyms and does not let one player's alias pollute another", async () => {
    for (const name of ["l", "go", "msg", "say", "wait"]) {
      expect(isReservedAliasName(name)).toBe(true);
      expect(parseAliasCommand(`alias set ${name} look`)?.ok).toBe(false);
    }
    const w = world();
    const a = agent;
    const b = other();
    await enter(w, a, "enter.a");
    await enter(w, b, "enter.b");
    const scopes = [...a.scopes];
    const set = await dev(w, a, "set.a", "alias set ii look");
    expect(set.ok).toBe(true);
    expect(a.scopes).toEqual(scopes);
    expect(w.players[a.player_id].command_aliases?.ii).toBe("look");
    expect(w.players[b.player_id].command_aliases).toBeUndefined();
    const borrowed = await dev(w, b, "use.b", "ii");
    expect(borrowed.ok).toBe(false);
    expect(w.players[b.player_id].command_aliases).toBeUndefined();
  });

  it("stops an ambiguous macro step before the later wait and leaves rest budgets unchanged", async () => {
    const w = world();
    await enter(w, agent, "enter.amb");
    const before = structuredClone(w.players[agent.player_id].budgets);
    const sequence = w.sequence;
    const stopped = await dev(w, agent, "macro.amb", "do inspect relay; wait");
    expect(stopped.ok).toBe(false);
    expect(stopped.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(w.sequence).toBe(sequence);
    expect(w.players[agent.player_id].budgets).toEqual(before);
    expect(w.players[agent.player_id].pending_clarify?.choices).toHaveLength(2);
  });

  it("stops the later step when the world becomes unusable after the first step", async () => {
    const control = world();
    await enter(control, agent, "enter.look");
    expect((await dev(control, agent, "only.look", "look")).ok).toBe(true);
    const w = world();
    await enter(w, agent, "enter.block");
    const stopped = await dev(w, agent, "macro.block", "do look; wait", async () => {
      w.rooms = {};
      return true;
    });
    expect(stopped.ok).toBe(false);
    expect(stopped.error?.code).toBe("WORLD_NOT_READY");
    expect(w.players[agent.player_id].budgets.attention).toBe(control.players[agent.player_id].budgets.attention);
    expect(w.players[agent.player_id].budgets.compute).toBe(control.players[agent.player_id].budgets.compute);
  });

  it("re-resolves the room before a later inspect and does not inspect an entity left behind", async () => {
    const w = world();
    await enter(w, agent, "enter.move");
    const before = w.rooms["room.hub"].entities.find((entity) => entity.entity_id === "entity.conduit")?.condition;
    const stopped = await dev(w, agent, "macro.move", "do move east; inspect conduit");
    expect(stopped.ok).toBe(false);
    expect(stopped.error?.code).toBe("INSPECT_FAILED");
    expect(w.players[agent.player_id].room_id).toBe("room.east");
    expect(stopped.events ?? []).toEqual([]);
    expect(w.rooms["room.hub"].entities.find((entity) => entity.entity_id === "entity.conduit")?.condition).toBe(before);
  });

  it("stops a later move when presence pressure forbids it", async () => {
    const w = world();
    await enter(w, agent, "enter.pressure");
    w.players[agent.player_id].disabled_until_cycle = 5;
    const room = w.players[agent.player_id].room_id;
    const stopped = await dev(w, agent, "macro.pressure", "do look; move east");
    expect(stopped.ok).toBe(false);
    expect(stopped.error?.code).toBe("FORBIDDEN");
    expect(w.players[agent.player_id].room_id).toBe(room);
  });

  it("settles the same per-step events as the same steps issued directly", async () => {
    const macroWorld = world();
    const directWorld = world();
    await enter(macroWorld, agent, "enter.macro");
    await enter(directWorld, agent, "enter.direct");
    const macroSettled: Array<{ event_type: string; payload: Record<string, unknown> }> = [];
    const directSettled: Array<{ event_type: string; payload: Record<string, unknown> }> = [];
    const macro = await dev(macroWorld, agent, "macro.eq", "do look; wait", async (event) => {
      macroSettled.push(event as { event_type: string; payload: Record<string, unknown> });
      return true;
    });
    const look = await dev(directWorld, agent, "direct.look", "look", async (event) => {
      directSettled.push(event as { event_type: string; payload: Record<string, unknown> });
      return true;
    });
    const wait = await dev(directWorld, agent, "direct.wait", "wait", async (event) => {
      directSettled.push(event as { event_type: string; payload: Record<string, unknown> });
      return true;
    });
    expect(macro.ok).toBe(true);
    expect(look.ok && wait.ok).toBe(true);
    expect(stableEvents(macroSettled)).toEqual(stableEvents(directSettled));
    expect(macro.events?.map((event) => event.event_type)).toEqual(["WAIT"]);
    expect(macroWorld.players[agent.player_id].budgets).toEqual(directWorld.players[agent.player_id].budgets);
    expect(macroWorld.cycle).toBe(directWorld.cycle);
  });
});
