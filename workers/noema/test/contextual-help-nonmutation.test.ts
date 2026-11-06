import { expect, test as helpCase, vi } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

const helpPrincipal = (name: string): PlayerPrincipal => ({
  player_id: `player.help-${name}`, agent_id: `agent.help-${name}`,
  session_id: `session.help-${name}`, controller_id: `controller.help-${name}`,
  controller_type: "agent",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1", authentication_context: "test",
});
let helpRequest = 0;

async function helpScene() {
  const observer = helpPrincipal("observer"), near = helpPrincipal("near"), far = helpPrincipal("far");
  const w: WorldRuntime = {
    world_id: "test.contextual-help", world_name: "Help controls", cycle: 0, sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public hub.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [enrichEntity({ entity_id: "entity.help.relay", label: "relay", entity_type: "INFRASTRUCTURE",
          condition: 60, owner_id: observer.player_id, infra_type: "generator" })] },
      "room.east": { room_id: "room.east", name: "East", description: "Public east room.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settle = vi.fn<Parameters<typeof applyWorldCommand>[3]>(async () => true);
  const command = (p: PlayerPrincipal, verb: string, args: Record<string, unknown> = {}) => {
    const key = `help.setup.${++helpRequest}`;
    return applyWorldCommand(w, p,
      { request_id: key, idempotency_key: key, command: verb, arguments: args }, settle);
  };
  for (const p of [observer, near, far]) expect((await command(p, "ENTER_WORLD")).ok).toBe(true);
  expect((await command(far, "MOVE", { direction: "east" })).ok).toBe(true);
  w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  // Demonstrate that real admitted setup acts reached this exact settlement recorder.
  expect(settle.mock.calls.length).toBeGreaterThan(0);
  settle.mockClear();
  const ask = (line: string, fixedKey?: string) => {
    const key = fixedKey ?? `help.read.${++helpRequest}`;
    return applyWorldCommand(w, observer,
      { request_id: key, idempotency_key: key, command: "LOOK", arguments: { line } },
      settle, { admission: "developer" });
  };
  return { w, observer, near, far, settle, command, ask };
}

type HelpScene = Awaited<ReturnType<typeof helpScene>>;
function helpCanonical(s: HelpScene) {
  const w = s.w;
  return structuredClone({
    cycle: w.cycle, sequence: w.sequence,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, {
      entered: p.entered, room_id: p.room_id, budgets: p.budgets,
    }])),
    rooms: w.rooms, trades: w.trades, messages: w.messages,
    organizations: w.organizations, unsettled: w.unsettled,
  });
}
async function readonlyHelp(s: HelpScene, line: string, fixedKey?: string) {
  const before = helpCanonical(s);
  const callsBefore = s.settle.mock.calls.length;
  const r = await s.ask(line, fixedKey);
  expect(r.ok).toBe(true);
  expect(r.events).toEqual([]);
  expect(s.settle.mock.calls.length).toBe(callsBefore);
  expect(helpCanonical(s)).toEqual(before);
  expect(typeof r.observation?.consequence).toBe("string");
  return r;
}

helpCase("T23-next10 01 contextual help is free and bounded", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help");
  const text = r.observation!.consequence!;
  expect(text).toContain("HERE");
  expect(text).toContain("help all");
  expect(text.split("\n").filter((x) => x.startsWith("  ")).length).toBeLessThanOrEqual(3);
});

helpCase("T23-next10 02 help all does not execute listed verbs", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help all");
  expect(r.observation?.consequence).toContain("KNOWN COMMANDS");
  expect(r.observation?.consequence).toContain("move <dir>");
  expect(s.w.players[s.observer.player_id].room_id).toBe("room.hub");
});

helpCase("T23-next10 03 trade help creates no reservations or trade", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help trade");
  expect(r.observation?.consequence).toContain("TRADE");
  expect(r.observation?.consequence).toContain("reserved until accept/reject");
  expect(s.w.trades).toEqual({});
});
