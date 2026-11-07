import { expect, test as helpCase, vi } from "vitest";
import { cloneBudgets, COSTS, DEFAULT_BUDGETS, enrichEntity, resolveVisibleEntity } from "../src/actions";
import { STORAGE_CAPACITY } from "../src/construction";
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

helpCase("T23-next10 04 repair help leaves infrastructure condition untouched", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help repair");
  expect(r.observation?.consequence).toContain("REPAIR");
  expect(r.observation?.consequence).toContain("Condition +15");
  expect(s.w.rooms["room.hub"].entities?.[0].condition).toBe(60);
});

helpCase("T23-next10 05 build help creates no asset or co-owner", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help build");
  expect(r.observation?.consequence).toContain("BUILD");
  expect(r.observation?.consequence).toContain("share <thing> <player>");
  expect(s.w.rooms["room.hub"].entities).toHaveLength(1);
});

helpCase("T23-next10 06 organization help grants no membership or authority", async () => {
  const s = await helpScene();
  const r = await readonlyHelp(s, "help org");
  expect(r.observation?.consequence).toContain("ORGANIZATIONS");
  expect(r.observation?.consequence).toContain("officers invite");
  expect(s.w.organizations).toEqual({});
});

helpCase("T23-next10 07 zero budgets do not prevent free contextual help", async () => {
  const s = await helpScene();
  const budgets = s.w.players[s.observer.player_id].budgets;
  for (const k of Object.keys(budgets) as Array<keyof typeof budgets>) budgets[k] = 0;
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).toContain("help all");
  expect(Object.values(s.w.players[s.observer.player_id].budgets).every((n) => n === 0)).toBe(true);
});

helpCase("T23-next10 08 contextual help omits a hidden route but retains a public one", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.rooms["room.secret"] = {
    room_id: "room.secret", name: "Quiet Annex", description: "Not public.",
    hidden: true, exits: [], entities: [],
  };
  s.w.rooms["room.hub"].exits.push({ direction: "north", to_room_id: "room.secret" });
  const r = await readonlyHelp(s, "help");
  const text = r.observation!.consequence!;
  expect(text).not.toMatch(/north|Quiet Annex|room\.secret/i);
  expect(text).toMatch(/move east/i);
});

helpCase("T23-next10 09 same-envelope help replay creates no new canonical effect", async () => {
  const s = await helpScene();
  const key = "help.replay.exact-envelope";
  const first = await readonlyHelp(s, "help all", key);
  const replay = await readonlyHelp(s, "help all", key);
  expect(replay).toEqual(first);
  expect(s.settle).not.toHaveBeenCalled();
});

helpCase("T23-next10 10 a real MOVE after help reaches the same settlement recorder", async () => {
  const s = await helpScene();
  await readonlyHelp(s, "help");
  expect(s.settle).not.toHaveBeenCalled();
  const sequence = s.w.sequence;
  const moved = await s.command(s.observer, "MOVE", { direction: "east" });
  expect(moved.ok).toBe(true);
  expect(s.settle.mock.calls.length).toBeGreaterThan(0);
  expect(s.w.sequence).toBeGreaterThan(sequence);
  expect(s.w.players[s.observer.player_id].room_id).toBe("room.east");
  expect((moved.events ?? []).length).toBeGreaterThan(0);
});

helpCase("T23-executable sealed inspection is not advertised by HELP", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.sealed", label: "sealed-relay", entity_type: "INFRASTRUCTURE", condition: 100, inspect_restricted_until: 10 }),
    enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE", condition: 100 }),
  ];
  const blocked = await s.ask("inspect sealed-relay");
  expect(blocked.error?.code).toBe("FORBIDDEN");
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toContain("inspect sealed-relay");
  expect(r.observation?.consequence).toContain("inspect open-conduit");
  const followed = await s.ask("inspect open-conduit");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === "entity.open")).toBe(true);
});

helpCase("T23-executable duplicate entity labels do not advertise ambiguous inspection", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.duplicate-a", label: "relay", entity_type: "INFRASTRUCTURE", condition: 100 }),
    enrichEntity({ entity_id: "entity.duplicate-b", label: "relay", entity_type: "INFRASTRUCTURE", condition: 100 }),
    enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE", condition: 100 }),
  ];
  expect((await s.ask("inspect relay")).error?.code).toBe("AMBIGUOUS_TARGET");
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toMatch(/^  inspect relay$/m);
  expect(r.observation?.consequence).toContain("inspect open-conduit");
  const followed = await s.ask("inspect open-conduit");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === "entity.open")).toBe(true);
});

helpCase("T23-executable article normalization cannot advertise the wrong inspection target", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.article", label: "the relay", entity_type: "INFRASTRUCTURE", condition: 100 }),
    enrichEntity({ entity_id: "entity.plain", label: "relay", entity_type: "INFRASTRUCTURE", condition: 100 }),
  ];
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toContain("inspect the relay");
  expect(r.observation?.consequence).toMatch(/^  inspect relay$/m);
  const followed = await s.ask("inspect relay");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === "entity.plain")).toBe(true);
});

helpCase("T23-executable presence-blocked MOVE is suppressed until restored", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.players[s.observer.player_id].disabled_until_cycle = s.w.cycle + 10;
  expect((await s.ask("move east")).ok).toBe(false);
  const blocked = await readonlyHelp(s, "help");
  expect(blocked.observation?.consequence).not.toContain("move east");
  s.w.players[s.observer.player_id].disabled_until_cycle = s.w.cycle;
  const restored = await readonlyHelp(s, "help");
  expect(restored.observation?.consequence).toContain("move east");
  expect((await s.ask("move east")).ok).toBe(true);
  expect(s.w.players[s.observer.player_id].room_id).toBe("room.east");
});


helpCase("T23-boundary 01 MOVE affordability recovers after energy restoration", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.players[s.observer.player_id].budgets.energy = 0;
  expect((await s.ask("move east")).error?.code).toBe("BUDGET_EXCEEDED");
  const denied = await readonlyHelp(s, "help");
  expect(denied.observation?.consequence).not.toMatch(/^  move east$/m);
  s.w.players[s.observer.player_id].budgets.energy = DEFAULT_BUDGETS.energy;
  const restored = await readonlyHelp(s, "help");
  expect(restored.observation?.consequence).toMatch(/^  move east$/m);
  expect((await s.ask("move east")).ok).toBe(true);
  expect(s.w.players[s.observer.player_id].room_id).toBe("room.east");
});


helpCase("T23-boundary 02 INSPECT affordability recovers after attention restoration", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE", condition: 100 })];
  s.w.players[s.observer.player_id].budgets.attention = 0;
  expect((await s.ask("inspect open-conduit")).error?.code).toBe("BUDGET_EXCEEDED");
  const denied = await readonlyHelp(s, "help");
  expect(denied.observation?.consequence).not.toContain("inspect open-conduit");
  expect(denied.observation?.consequence).toMatch(/^  move east$/m);
  s.w.players[s.observer.player_id].budgets.attention = DEFAULT_BUDGETS.attention;
  const restored = await readonlyHelp(s, "help");
  expect(restored.observation?.consequence).toContain("inspect open-conduit");
  const followed = await s.ask("inspect open-conduit");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === "entity.open")).toBe(true);
});


helpCase("T23-boundary 03 inspection seal releases exactly at its cycle boundary", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [enrichEntity({ entity_id: "entity.seal-boundary", label: "sealed-conduit", entity_type: "INFRASTRUCTURE", condition: 100, inspect_restricted_until: 10 })];
  s.w.cycle = 9;
  expect((await s.ask("inspect sealed-conduit")).error?.code).toBe("FORBIDDEN");
  const sealed = await readonlyHelp(s, "help");
  expect(sealed.observation?.consequence).not.toContain("inspect sealed-conduit");
  s.w.cycle = 10;
  const released = await readonlyHelp(s, "help");
  expect(released.observation?.consequence).toContain("inspect sealed-conduit");
  const followed = await s.ask("inspect sealed-conduit");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === "entity.seal-boundary")).toBe(true);
});


helpCase("T23-boundary 04 exit DENY remains active at its expires cycle", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE", condition: 100 })];
  s.w.access_restrictions = [{ restriction_id: "help.deny.boundary", scope: "EXIT", mode: "DENY", applies_to: "*", room_id: "room.hub", exit_id: "east", expires_cycle: 10 }];
  s.w.cycle = 10;
  expect((await s.ask("move east")).error?.code).toBe("MOVE_REJECTED");
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toMatch(/^  move east$/m);
  expect(r.observation?.consequence).toContain("inspect open-conduit");
  expect((await s.ask("inspect open-conduit")).ok).toBe(true);
});


helpCase("T23-boundary 05 exit DENY expires only after its expires cycle", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.access_restrictions = [{ restriction_id: "help.deny.expired", scope: "EXIT", mode: "DENY", applies_to: "*", room_id: "room.hub", exit_id: "east", expires_cycle: 10 }];
  s.w.cycle = 11;
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).toMatch(/^  move east$/m);
  const followed = await s.ask("move east");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "MOVE" && e.payload?.to === "room.east")).toBe(true);
});


helpCase("T23-boundary 06 ALLOW_ONLY excludes an unlisted observer", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [enrichEntity({ entity_id: "entity.open", label: "open-conduit", entity_type: "INFRASTRUCTURE", condition: 100 })];
  s.w.access_restrictions = [{ restriction_id: "help.allow.other", scope: "EXIT", mode: "ALLOW_ONLY", applies_to: s.near.player_id, room_id: "room.hub", exit_id: "east", expires_cycle: 10 }];
  expect((await s.ask("move east")).error?.code).toBe("MOVE_REJECTED");
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toMatch(/^  move east$/m);
  expect(r.observation?.consequence).toContain("inspect open-conduit");
  expect((await s.ask("inspect open-conduit")).ok).toBe(true);
});


helpCase("T23-boundary 07 ALLOW_ONLY admits its listed observer", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.access_restrictions = [{ restriction_id: "help.allow.self", scope: "EXIT", mode: "ALLOW_ONLY", applies_to: s.observer.player_id, room_id: "room.hub", exit_id: "east", expires_cycle: 10 }];
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).toMatch(/^  move east$/m);
  const followed = await s.ask("move east");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "MOVE" && e.payload?.to === "room.east")).toBe(true);
});


helpCase("T23-boundary 08 Player-specific DENY does not exclude a different observer", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.access_restrictions = [{ restriction_id: "help.deny.other", scope: "EXIT", mode: "DENY", applies_to: s.near.player_id, room_id: "room.hub", exit_id: "east", expires_cycle: 10 }];
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).toMatch(/^  move east$/m);
  const followed = await s.ask("move east");
  expect(followed.ok).toBe(true);
  expect(followed.events?.some((e) => e.event_type === "MOVE" && e.payload?.to === "room.east")).toBe(true);
});


helpCase("T23-boundary 09 direction aliases cannot advertise a different route", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.rooms["room.alias"] = { room_id: "room.alias", name: "Alias annex", description: "Public alias destination.", exits: [], entities: [] };
  s.w.rooms["room.hub"].exits = [{ direction: "e", to_room_id: "room.alias" }, { direction: "east", to_room_id: "room.east" }];
  const r = await readonlyHelp(s, "help");
  expect(r.observation?.consequence).not.toMatch(/^  move e$/m);
  expect(r.observation?.consequence).toMatch(/^  move east$/m);
  const followed = await s.ask("move east");
  expect(followed.ok).toBe(true);
  expect(s.w.players[s.observer.player_id].room_id).toBe("room.east");
  expect(followed.events?.some((e) => e.event_type === "MOVE" && e.payload?.to === "room.east")).toBe(true);
});


helpCase("T23-boundary 10 ineligible candidates are removed before the three-command cap", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.sealed", label: "sealed-conduit", entity_type: "INFRASTRUCTURE", condition: 100, inspect_restricted_until: 10 }),
    ...["a", "b", "c"].map((x) => enrichEntity({ entity_id: `entity.open-${x}`, label: `open-${x}`, entity_type: "INFRASTRUCTURE", condition: 100 })),
  ];
  const r = await readonlyHelp(s, "help");
  const commands = r.observation!.consequence!.split("\n").filter((line) => line.startsWith("  ")).map((line) => line.trim());
  expect(commands).toEqual(["inspect open-a", "inspect open-b", "inspect open-c"]);
  for (const x of ["a", "b", "c"]) {
    const followed = await s.ask(`inspect open-${x}`);
    expect(followed.ok).toBe(true);
    expect(followed.events?.some((e) => e.event_type === "INSPECT" && e.payload?.entity_id === `entity.open-${x}`)).toBe(true);
  }
});


helpCase("T23-audit advertised repair reaches its canonical target", async () => {
  const s = await helpScene();
  // storage is free hold capacity; carry exactly the canonical repair cargo.
  s.w.players[s.observer.player_id].budgets.storage = STORAGE_CAPACITY - (COSTS.REPAIR.storage || 0);
  const before = s.w.rooms["room.hub"].entities![0].condition!;
  const help = await readonlyHelp(s, "help");
  const a = help.observation?.affordances?.find((x) => x.action === "REPAIR" && x.cmd === "repair relay" && x.available);
  expect(a?.target_id).toBe("entity.help.relay");
  expect(help.observation?.consequence!.split("\n")).toContain("  repair relay");
  const calls = s.settle.mock.calls.length;
  const result = await s.ask(a!.cmd!);
  expect(result.ok).toBe(true);
  expect(s.w.rooms["room.hub"].entities!.find((e) => e.entity_id === "entity.help.relay")!.condition).toBeGreaterThan(before);
  expect(s.settle.mock.calls.length).toBeGreaterThan(calls);
});


helpCase("T23-audit advertised harvest reaches its canonical target", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [enrichEntity({ entity_id: "entity.audit-node", label: "audit-node", entity_type: "RESOURCE", stock_resource: "energy", stock_amount: 2, max_stock: 2, regen_rate: 0 })];
  const help = await readonlyHelp(s, "help");
  const a = help.observation?.affordances?.find((x) => x.action === "HARVEST" && x.cmd === "harvest audit-node 1" && x.available);
  expect(a?.target_id).toBe("entity.audit-node");
  expect(help.observation?.consequence!.split("\n")).toContain("  harvest audit-node 1");
  const calls = s.settle.mock.calls.length;
  const result = await s.ask(a!.cmd!);
  expect(result.ok).toBe(true);
  expect(s.w.rooms["room.hub"].entities![0].stock_amount).toBe(1);
  expect(s.settle.mock.calls.length).toBeGreaterThan(calls);
});


helpCase("T23-audit advertised message reaches its canonical target", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.rooms["room.hub"].exits = [];
  const help = await readonlyHelp(s, "help");
  const a = help.observation?.affordances?.find((x) => x.action === "MESSAGE" && x.available && x.target_id === s.near.player_id);
  expect(a?.cmd).toBe('message help-near "hello"');
  expect(help.observation?.consequence!.split("\n")).toContain('  message help-near "hello"');
  const calls = s.settle.mock.calls.length;
  const result = await s.ask(a!.cmd!);
  expect(result.ok).toBe(true);
  expect(result.events?.some((e) => e.event_type === "MESSAGE" && e.payload?.recipient_id === s.near.player_id && e.payload?.text === "hello")).toBe(true);
  expect(result.events?.some((e) => e.event_type === "MESSAGE" && e.payload?.recipient_id === s.far.player_id)).toBe(false);
  expect(s.settle.mock.calls.length).toBeGreaterThan(calls);
});


helpCase("T23-audit advertised trade reaches its canonical target", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [];
  s.w.rooms["room.hub"].exits = [];
  const help = await readonlyHelp(s, "help");
  const a = help.observation?.affordances?.find((x) => x.action === "TRADE" && x.available && x.target_id === s.near.player_id);
  expect(a?.cmd).toBe("trade help-near offer=energy:1 want=energy:1");
  expect(help.observation?.consequence!.split("\n")).toContain("  trade help-near offer=energy:1 want=energy:1");
  const calls = s.settle.mock.calls.length;
  const result = await s.ask(a!.cmd!);
  expect(result.ok).toBe(true);
  const offers = Object.values(s.w.trades).filter((t) => t.status === "OPEN");
  expect(offers).toHaveLength(1);
  expect(offers[0].proposer_id).toBe(s.observer.player_id);
  expect(offers[0].counterparty_id).toBe(s.near.player_id);
  expect(s.settle.mock.calls.length).toBeGreaterThan(calls);
});


helpCase("T25-audit hidden chosen entity invalidates numeric inspect pick", async () => {
  const s = await helpScene();
  s.w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.audit-a", label: "relay-a", entity_type: "INFRASTRUCTURE", condition: 100 }),
    enrichEntity({ entity_id: "entity.audit-b", label: "relay-b", entity_type: "INFRASTRUCTURE", condition: 100 }),
  ];
  const offered = await s.ask("inspect relay");
  expect(offered.error?.code).toBe("AMBIGUOUS_TARGET");
  const pending = s.w.players[s.observer.player_id].pending_clarify!;
  expect(pending.choices).toHaveLength(2);
  // Pending choices use title-cased display labels, not raw entity labels.
  const resolved = resolveVisibleEntity(pending.choices[0], s.w.rooms["room.hub"].entities!);
  expect(resolved.ok).toBe(true);
  if (!resolved.ok) throw new Error("Fixture cannot resolve the offered first choice");
  resolved.entity.hidden = true;
  const before = helpCanonical(s);
  const calls = s.settle.mock.calls.length;
  const picked = await s.ask("1");
  expect(picked.error?.code).toBe("STALE_CLARIFICATION");
  expect(picked.events ?? []).toEqual([]);
  expect(s.settle.mock.calls.length).toBe(calls);
  expect(helpCanonical(s)).toEqual(before);
});
