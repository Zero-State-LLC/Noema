import { expect, test, vi } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

// P02: developer reducer only. Human PLAY and hosted text admission are not this seam.
let serial = 0;
async function dictionaryScene() {
  const principal: PlayerPrincipal = {
    player_id: "player.p02", agent_id: "agent.p02", session_id: "session.p02",
    controller_id: "controller.p02", controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1", authentication_context: "test",
  };
  const w: WorldRuntime = {
    world_id: "test.p02", world_name: "Dictionary", cycle: 0, sequence: 0,
    entry_room_id: "room.hub",
    rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "Public room.", exits: [], entities: [] } },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settle = vi.fn<Parameters<typeof applyWorldCommand>[3]>(async () => true);
  const send = (line: string, developer = true) => {
    const key = `p02.${++serial}`;
    return applyWorldCommand(w, principal, { request_id: key, idempotency_key: key,
      command: "LOOK", arguments: { line } }, settle, { admission: developer ? "developer" : undefined });
  };
  expect((await send("enter")).ok).toBe(true);
  // The same recorder must be reachable on a real admitted mutation.
  expect(settle).toHaveBeenCalled();
  settle.mockClear();
  w.players[principal.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  // Initialize the lazy discovery projection before any no-effect snapshot.
  expect((await send("help")).ok).toBe(true);
  return { w, principal, settle, send };
}
type Scene = Awaited<ReturnType<typeof dictionaryScene>>;
// Excludes replay keys, pending choices, observation caches and activity timestamps.
function canonical(s: Scene) {
  return structuredClone({ cycle: s.w.cycle, sequence: s.w.sequence,
    players: Object.fromEntries(Object.entries(s.w.players).map(([id, p]) => [id, {
      entered: p.entered, room_id: p.room_id, budgets: p.budgets, focus: p.focus,
      wait_until_cycle: p.wait_until_cycle, discovery: p.discovery,
    }])),
    rooms: s.w.rooms, trades: s.w.trades, messages: s.w.messages,
    organizations: s.w.organizations, unsettled: s.w.unsettled });
}
async function freeRead(s: Scene, line: string) {
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const r = await s.send(line);
  expect(r.ok).toBe(true);
  expect(r.events).toEqual([]);
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
  return r.observation?.consequence ?? "";
}
function advertised(s: Scene, action: string, cmd?: string) {
  // Read from the actual retained observation, not a hand-built affordance.
  return s.send("help").then((r) => {
    expect(r.ok).toBe(true);
    const a = r.observation?.affordances?.find((x) => x.action === action && x.available && (!cmd || x.cmd === cmd));
    expect(a?.cmd).toBeTruthy();
    return a!;
  });
}

test("P02 LOOK exact observation command spends attention and settles only observation events", async () => {
  const s = await dictionaryScene();
  const a = await advertised(s, "LOOK");
  expect(a.cmd).toBe("look");
  expect(a.target_id).toBeUndefined();
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const r = await s.send(a.cmd!);
  expect(r.ok).toBe(true);
  expect(r.events?.map((e) => e.event_type)).toEqual(["LOOK", "OBSERVATION_GENERATED"]);
  expect(r.events?.[0].payload).toMatchObject({ player_id: s.principal.player_id, room_id: "room.hub", cost_paid: { attention: 1 } });
  expect(r.events?.[0].payload).not.toHaveProperty("entity_id");
  expect(s.settle.mock.calls.length - calls).toBe(2);
  expect(s.w.sequence).toBe(before.sequence); // observation events are off-ledger
  expect(s.w.players[s.principal.player_id].budgets.attention).toBe(before.players[s.principal.player_id].budgets!.attention! - (r.events![0]!.payload?.cost_paid as { attention: number }).attention);
  expect(s.w.players[s.principal.player_id].room_id).toBe("room.hub");
});

test("P02 unavailable LOOK at zero attention refuses without debit or settlement; WAIT is still advertised", async () => {
  const s = await dictionaryScene();
  s.w.players[s.principal.player_id].budgets.attention = 0;
  const view = await s.send("help");
  const look = view.observation?.affordances?.find((x) => x.action === "LOOK");
  expect(look?.cmd).toBe("look");
  expect(look?.available).toBe(false);
  expect(view.observation?.affordances?.find((x) => x.action === "WAIT")?.available).toBe(true);
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const denied = await s.send(look!.cmd!);
  expect(denied.error?.code).toBe("BUDGET_EXCEEDED");
  expect(denied.events ?? []).toEqual([]);
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
});

test("P02 WAIT follows exact observation command: targetless rest, not a free no-op", async () => {
  const s = await dictionaryScene();
  const a = await advertised(s, "WAIT");
  expect(a.cmd).toBe("wait");
  expect(a.target_id).toBeUndefined();
  s.w.players[s.principal.player_id].budgets.attention = 0;
  s.w.players[s.principal.player_id].budgets.compute = 0;
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const r = await s.send(a.cmd!);
  expect(r.ok).toBe(true);
  expect(r.events?.map((e) => e.event_type)).toContain("WAIT");
  expect(r.events?.find((e) => e.event_type === "WAIT")?.payload).toMatchObject({ player_id: s.principal.player_id, cycles: 1 });
  expect(r.events?.find((e) => e.event_type === "WAIT")?.payload).not.toHaveProperty("target_id");
  expect(s.w.players[s.principal.player_id].wait_until_cycle).toBeDefined();
  expect(s.w.players[s.principal.player_id].budgets.attention).toBeGreaterThan(before.players[s.principal.player_id].budgets.attention);
  expect(s.w.players[s.principal.player_id].budgets.compute).toBeGreaterThan(before.players[s.principal.player_id].budgets.compute);
  expect(s.w.players[s.principal.player_id].room_id).toBe("room.hub");
  // WAIT can commit the sole Player's cycle without invoking external settlement
  // when there are no due world operations; sequence is its separate ledger measure.
  expect(s.w.cycle).toBeGreaterThan(before.cycle);
  expect(s.w.sequence).toBeGreaterThan(before.sequence);
  expect(s.settle.mock.calls.length).toBe(calls);
});

test("P02 each focus track and clear follows observation and rendered topic alternatives without grants", async () => {
  const s = await dictionaryScene();
  const topic = await freeRead(s, "help focus");
  const alternatives = topic.match(/^  focus ([a-z|]+)$/m)?.[1].split("|");
  expect(alternatives).toEqual(["explorer", "surveyor", "broker", "engineer"]);
  expect(topic).toMatch(/^  focus clear$/m);
  expect(topic).toContain("Grants no verbs.");
  for (const track of alternatives!) {
    const a = await advertised(s, "FOCUS", `focus ${track}`);
    expect(a.track).toBe(track);
    expect(a.target_id).toBeUndefined();
    const before = canonical(s), calls = s.settle.mock.calls.length;
    const r = await s.send(a.cmd!);
    expect(r.ok).toBe(true);
    expect(r.events).toEqual([]);
    expect(s.settle.mock.calls.length).toBe(calls);
    expect(s.w.sequence).toBe(before.sequence);
    expect(s.w.players[s.principal.player_id].budgets).toEqual(before.players[s.principal.player_id].budgets);
    expect(s.w.players[s.principal.player_id].focus).toEqual({ track, declared_cycle: s.w.cycle });
    const clear = await advertised(s, "FOCUS", "focus clear");
    expect(clear.clear).toBe(true);
    const cleared = await s.send(clear.cmd!);
    expect(cleared.ok).toBe(true);
    expect(cleared.events).toEqual([]);
    expect(s.w.players[s.principal.player_id].focus).toBeUndefined();
    expect(s.w.players[s.principal.player_id].budgets).toEqual(before.players[s.principal.player_id].budgets);
    expect(s.settle.mock.calls.length).toBe(calls);
    expect(s.w.sequence).toBe(before.sequence);
  }
  // FOCUS neither grants budget nor authorizes a command the actor could not afford.
  s.w.players[s.principal.player_id].budgets.attention = 0;
  expect((await s.send(`focus ${alternatives![0]}`)).ok).toBe(true);
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const denied = await s.send("look");
  expect(denied.error?.code).toBe("BUDGET_EXCEEDED");
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
});

test("P02 invalid track preserves prior focus, budget, sequence and settlement", async () => {
  const s = await dictionaryScene();
  const a = await advertised(s, "FOCUS", "focus explorer");
  expect((await s.send(a.cmd!)).ok).toBe(true);
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const bad = await s.send("focus overlord");
  expect(bad.error?.code).toBe("INVALID_REQUEST");
  expect(bad.events ?? []).toEqual([]);
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
});

test("P02 help all and commands are equal, and ten named topic branches route without mutation", async () => {
  const s = await dictionaryScene();
  const all = await freeRead(s, "help all");
  expect(await freeRead(s, "help commands")).toBe(all);
  expect(all).toContain("talk <desk>     World Service (not a Player)");
  expect(all).toContain("message <player>");
  for (const [name, heading] of [
    ["trade", "TRADE"], ["repair", "REPAIR"], ["harvest", "HARVEST"],
    ["message", "MESSAGE"], ["org", "ORGANIZATIONS"], ["build", "BUILD"],
    ["contest", "CONTEST"], ["agreement", "AGREEMENT"],
    ["access", "ACCESS"], ["focus", "FOCUS"],
  ]) {
    expect(all).toContain(name);
    expect(await freeRead(s, `help ${name}`)).toContain(heading);
  }
  expect(await freeRead(s, "help alias")).toContain("ALIAS");
  expect(await freeRead(s, "help organization")).toBe(await freeRead(s, "help org"));
  expect(await freeRead(s, "help organizations")).toBe(await freeRead(s, "help org"));
});

test("P02 rendered alias dictionary list/set/rm and do execute mapped commands only in developer mode", async () => {
  const s = await dictionaryScene();
  const topic = await freeRead(s, "help alias");
  for (const line of ["alias list", "alias set <name> <command>", "alias rm <name>", "do <cmd>; <cmd>"]) expect(topic).toContain(line);
  expect(topic).toContain("Cannot replace reserved commands.");
  const before = canonical(s), calls = s.settle.mock.calls.length;
  expect((await s.send("alias list")).observation?.consequence).toContain("No aliases.");
  expect((await s.send("alias set glance look")).ok).toBe(true);
  expect(s.w.players[s.principal.player_id].command_aliases?.glance).toBe("look");
  expect((await s.send("alias list")).observation?.consequence).toContain("glance → look");
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
  const expanded = await s.send("glance");
  expect(expanded.events?.map((e) => e.event_type)).toEqual(["LOOK", "OBSERVATION_GENERATED"]);
  expect(s.settle.mock.calls.length - calls).toBe(2);
  const macro = await s.send("do look; wait");
  expect(macro.ok).toBe(true);
  expect(macro.events?.some((e) => e.event_type === "WAIT")).toBe(true);
  expect(s.w.players[s.principal.player_id].command_aliases?.glance).toBe("look");
  expect((await s.send("alias rm glance")).observation?.consequence).toContain("Alias glance removed.");
  expect(s.w.players[s.principal.player_id].command_aliases?.glance).toBeUndefined();
});

test("P02 alias syntax is developer-only, not structured LOOK text admission", async () => {
  const s = await dictionaryScene();
  const before = canonical(s);
  const r = await s.send("alias set glance wait", false);
  // An untrusted `line` under ordinary structured LOOK cannot install an alias;
  // LOOK itself may legitimately spend attention and emit observation events.
  expect(r.ok).toBe(true);
  expect(r.events?.map((e) => e.event_type)).toEqual(["LOOK", "OBSERVATION_GENERATED"]);
  expect(s.w.players[s.principal.player_id].command_aliases?.glance).toBeUndefined();
  expect(s.w.sequence).toBe(before.sequence);
  expect(s.w.players[s.principal.player_id].budgets.attention).toBeLessThan(before.players[s.principal.player_id].budgets!.attention!);
});

test("P02 reserved/depth/nesting aliases and an aliased real budget refusal gain no authority", async () => {
  const s = await dictionaryScene();
  const calls = s.settle.mock.calls.length;
  const reserved = await s.send("alias set look wait");
  expect(reserved.observation?.consequence).toMatch(/reserved/i);
  expect(s.w.players[s.principal.player_id].command_aliases?.look).toBeUndefined();
  for (const [name, expansion] of [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"], ["f", "look"]]) {
    expect((await s.send(`alias set ${name} ${expansion}`)).ok).toBe(true);
  }
  const before = canonical(s);
  const depth = await s.send("a");
  expect(depth.error?.code).toBe("ALIAS_DEPTH");
  expect(depth.events ?? []).toEqual([]);
  const nested = await s.send("do look; do wait");
  expect(nested.error?.code).toBe("MACRO_REJECTED");
  expect(nested.events ?? []).toEqual([]);
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
  expect((await s.send("alias set glance look")).ok).toBe(true);
  s.w.players[s.principal.player_id].budgets.attention = 0;
  const deniedBefore = canonical(s), deniedCalls = s.settle.mock.calls.length;
  const direct = await s.send("look");
  const alias = await s.send("glance");
  expect(direct.error?.code).toBe("BUDGET_EXCEEDED");
  expect(alias.error?.code).toBe(direct.error?.code);
  expect(alias.events ?? []).toEqual([]);
  expect(canonical(s)).toEqual(deniedBefore);
  expect(s.settle.mock.calls.length).toBe(deniedCalls);
});

// The two SOURCE_ONLY producers must be followed from their actual observation,
// not reconstructed from a label or passed as structured target metadata.
async function targetScene() {
  const s = await dictionaryScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.p02.primary", label: "relay", entity_type: "INFRASTRUCTURE", condition: 100 }),
    enrichEntity({ entity_id: "entity.p02.other", label: "relay-annex", entity_type: "INFRASTRUCTURE", condition: 100 }),
  ];
  s.w.rooms["room.hub"].exits = [{ direction: "east", to_room_id: "room.east" }];
  s.w.rooms["room.east"] = { room_id: "room.east", name: "East", description: "Public destination.", exits: [], entities: [] };
  return s;
}

async function refusedTarget(s: Scene, line: string, code: string) {
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const result = await s.send(line);
  expect(result.ok).toBe(false);
  expect(result.error?.code).toBe(code);
  expect(result.events ?? []).toEqual([]);
  expect(canonical(s)).toEqual(before);
  expect(s.settle.mock.calls.length).toBe(calls);
  return result;
}

test("P02 advertised INSPECT follows exact text to the selected entity, player cost, and settled events", async () => {
  const s = await targetScene();
  const offered = await advertised(s, "INSPECT", "inspect relay-annex");
  expect(offered.target_id).toBe("entity.p02.other");
  expect(offered.requires).toEqual({ attention: 2 });
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const result = await s.send(offered.cmd!);
  expect(result.ok).toBe(true);
  expect(result.events?.map((e) => e.event_type)).toEqual(["INSPECT", "OBSERVATION_GENERATED"]);
  expect(result.events?.[0].payload).toMatchObject({ player_id: s.principal.player_id,
    entity_id: offered.target_id, room_id: "room.hub", cost_paid: offered.requires });
  expect(result.events?.[1].payload).toMatchObject({ entity_id: offered.target_id, kind: "INSPECT" });
  expect(s.settle.mock.calls.slice(calls).map(([event]) => event.event_type)).toEqual(["INSPECT", "OBSERVATION_GENERATED"]);
  expect(s.w.players[s.principal.player_id].budgets.attention).toBe(
    before.players[s.principal.player_id].budgets!.attention! - (result.events![0].payload!.cost_paid as { attention: number }).attention);
  expect(s.w.players[s.principal.player_id].room_id).toBe("room.hub");
  expect(s.w.sequence).toBe(before.sequence); // read events are not ledger mutations
  expect(s.w.rooms["room.hub"].entities).toEqual(before.rooms["room.hub"].entities);
});

test("P02 advertised MOVE follows exact text to its direction and destination with player debit", async () => {
  const s = await targetScene();
  const offered = await advertised(s, "MOVE", "move east");
  expect(offered.target_id).toBe("east"); // MOVE metadata is direction, not room ID
  expect(offered.requires).toEqual({ energy: 1 });
  const destination = s.w.rooms["room.hub"].exits.find((x) => x.direction === offered.target_id)?.to_room_id;
  expect(destination).toBe("room.east");
  const before = canonical(s), calls = s.settle.mock.calls.length;
  const result = await s.send(offered.cmd!);
  expect(result.ok).toBe(true);
  expect(result.events?.map((e) => e.event_type)).toEqual(["MOVE"]);
  expect(result.events?.[0].payload).toMatchObject({ player_id: s.principal.player_id,
    from: "room.hub", to: destination, direction: offered.target_id, cost_paid: offered.requires });
  expect(s.settle.mock.calls.slice(calls).map(([event]) => event.event_type)).toEqual(["MOVE"]);
  expect(s.w.players[s.principal.player_id].room_id).toBe(destination);
  expect(s.w.players[s.principal.player_id].budgets.energy).toBe(
    before.players[s.principal.player_id].budgets!.energy! - (result.events![0].payload!.cost_paid as { energy: number }).energy);
  expect(s.w.sequence).toBe(before.sequence + 1);
  expect(s.w.rooms).toEqual(before.rooms);
});

test("P02 duplicate and stale INSPECT labels clarify or refuse without selecting an unintended entity", async () => {
  const s = await targetScene();
  const offered = await advertised(s, "INSPECT", "inspect relay-annex");
  expect(offered.target_id).toBe("entity.p02.other");
  s.w.rooms["room.hub"].entities.push(enrichEntity({ entity_id: "entity.p02.twin", label: "relay-annex", entity_type: "INFRASTRUCTURE", condition: 100 }));
  // Ambiguity is a pending choice, not a generic failed-action presentation.
  await refusedTarget(s, offered.cmd!, "AMBIGUOUS_TARGET");
  expect(s.w.players[s.principal.player_id].pending_clarify?.choices).toHaveLength(2);
  s.w.rooms["room.hub"].entities.pop();
  s.w.rooms["room.hub"].entities[1].inspect_restricted_until = s.w.cycle + 2;
  await refusedTarget(s, offered.cmd!, "FORBIDDEN");
  s.w.rooms["room.hub"].entities[1].inspect_restricted_until = undefined;
  s.w.rooms["room.hub"].entities.splice(0);
  await refusedTarget(s, offered.cmd!, "INSPECT_FAILED");
});

test("P02 advertised target commands cannot bypass empty purses or restricted exits", async () => {
  const s = await targetScene();
  const inspect = await advertised(s, "INSPECT", "inspect relay-annex");
  const move = await advertised(s, "MOVE", "move east");
  s.w.players[s.principal.player_id].budgets.attention = 0;
  s.w.players[s.principal.player_id].budgets.energy = 0;
  await refusedTarget(s, inspect.cmd!, "BUDGET_EXCEEDED");
  await refusedTarget(s, move.cmd!, "BUDGET_EXCEEDED");
  s.w.players[s.principal.player_id].budgets.energy = DEFAULT_BUDGETS.energy;
  s.w.access_restrictions = [{ restriction_id: "p02.deny", scope: "EXIT", mode: "DENY", applies_to: "*",
    room_id: "room.hub", exit_id: "east", expires_cycle: s.w.cycle + 2 }];
  await refusedTarget(s, move.cmd!, "MOVE_REJECTED");
  const blockedView = await s.send("help");
  // Raw affordability affordances can remain discoverable; HERE filters executor-denied routes.
  expect(blockedView.observation?.consequence).not.toMatch(/^  move east$/m);
  s.w.access_restrictions = [];
  s.w.rooms["room.hub"].exits = [];
  await refusedTarget(s, move.cmd!, "MOVE_REJECTED");
});
