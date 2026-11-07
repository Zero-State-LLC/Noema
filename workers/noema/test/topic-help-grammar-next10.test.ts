import { expect, it } from "vitest";
import { helpText, parseHumanCommand, enrichEntity, DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";
type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
const ctx = { selfId: "player.gate", players: [{ player_id: "player.peer", handle: "peer" }], entities: [
  enrichEntity({ entity_id: "entity.workshop", label: "workshop", entity_type: "INFRASTRUCTURE" }),
  enrichEntity({ entity_id: "entity.link", label: "route-link", entity_type: "INFRASTRUCTURE" }),
] };
function example(text: string, verb: string) {
  const line = text.split("\n").map((s) => s.trim()).find((s) => s.startsWith(verb + " "));
  expect(line).toBeDefined();
  return line!.split(/\s{2,}/)[0];
}
function roomForm(text: string, mode: "deny" | "clear" | "allow") {
  const line = text.split("\n").map((s) => s.trim()).find((s) => s.startsWith("access here ") && s.includes(mode));
  expect(line).toBeDefined();
  return line!.split(/\s{2,}/)[0].replace(/deny\|clear(?:\|allow)?/, mode);
}
function fill(text: string, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) text = text.replaceAll(`<${key}>`, value);
  expect(text).not.toMatch(/<[^>]+>/);
  return text;
}
function principal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", authentication_context: "test", protocol_version: "1",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] };
}
function world(): WorldRuntime {
  return { world_id: "test.hosted-canonical.topic-next10", world_name: "Topic Reach", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [{ direction: "east", to_room_id: "room.quay" }] },
      "room.quay": { room_id: "room.quay", name: "Quay", description: "Public.", entities: [], exits: [{ direction: "west", to_room_id: "room.hub" }] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [], access_restrictions: [] };
}
type Rig = { w: WorldRuntime; gate: PlayerPrincipal; peer: PlayerPrincipal; org: string; settled: unknown[];
  send: (p: PlayerPrincipal, command: string, args?: Record<string, unknown>) => Promise<Result>;
  help: (topic: string) => Promise<Result> };
async function seat(s: Rig) {
  s.w.players[s.gate.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await s.send(s.gate, "ORG_OFFICE_CREATE", { org_id: s.org, display_name: "Gate", authority_profile: "GRANT_ACCESS" })).ok).toBe(true);
  const office = Object.values(s.w.organizations[s.org].offices || {}).find((o) => o.authority_profile === "GRANT_ACCESS");
  expect(office).toBeDefined();
  expect((await s.send(s.gate, "ORG_OFFICE_ASSIGN", { office_id: office!.office_id, agent_id: s.gate.player_id })).ok).toBe(true);
}
async function scene(granted = true): Promise<Rig> {
  const w = world(), gate = principal("gate"), peer = principal("peer"), settled: unknown[] = [];
  let key = 0;
  const send: Rig["send"] = (p, command, args = {}) => {
    const id = `topic-${++key}`;
    return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
      async (event) => { settled.push(event); return true; }, { admission: "developer" });
  };
  for (const p of [gate, peer]) expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
  expect((await send(gate, "ORG_CREATE", { name: "Line", charter: "Keep" })).ok).toBe(true);
  const org = Object.keys(w.organizations)[0];
  expect(org).toBeTruthy();
  const s: Rig = { w, gate, peer, org, settled, send, help: (topic) => send(gate, "LOOK", { line: `help ${topic}` }) };
  if (granted) await seat(s);
  w.organizations[org].treasury!.compute = 8;
  w.organizations[org].treasury!.influence = 8;
  for (const p of [gate, peer]) expect((await send(p, "OBSERVE")).ok).toBe(true);
  return s;
}
function projection(w: WorldRuntime) {
  // Exclude replay/activity/pending bookkeeping; retain authority and treasury fields.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms, organizations: w.organizations,
    access_restrictions: w.access_restrictions, messages: w.messages, unsettled: w.unsettled,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])) });
}
function copy(r: Result) { expect(r.ok).toBe(true); return String(r.observation?.consequence || ""); }
async function nonmutatingTopic(s: Rig, topic: "build" | "access") {
  expect(s.settled.length).toBeGreaterThan(0); // Same recorder observes setup mutations.
  for (const k of Object.keys(s.w.players[s.gate.player_id].budgets) as Array<keyof typeof DEFAULT_BUDGETS>) s.w.players[s.gate.player_id].budgets[k] = 0;
  s.w.organizations[s.org].treasury!.compute = 0;
  s.w.organizations[s.org].treasury!.influence = 0;
  const before = projection(s.w); s.settled.length = 0;
  const r = await s.help(topic);
  expect(copy(r)).toBe(helpText(topic)); expect(r.events || []).toEqual([]);
  expect(s.settled).toEqual([]); expect(projection(s.w)).toEqual(before);
  // Prove the same recorder still reaches a genuine later mutation.
  s.w.organizations[s.org].treasury!.compute = 8;
  s.w.organizations[s.org].treasury!.influence = 8;
  const after = await s.send(s.gate, "LOOK", { line: `access here deny for ${s.org}` });
  expect(after.ok).toBe(true); expect(s.settled).toHaveLength(1);
  expect(s.settled[0]).toEqual(expect.objectContaining({ event_type: "ACCESS_RESTRICTED" }));
}

it("G10.01 BUILD VEST topic maps to canonical entity and institution", async () => {
  const line = fill(example(helpText("build"), "vest"), { thing: "workshop", org: "org.fixture" });
  const r = parseHumanCommand(line, ctx);
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.error);
  expect(r.action).toEqual({ verb: "BUILD", arguments: { operation: "VEST", entity_id: "entity.workshop", org_id: "org.fixture" } });
});

it("G10.02 BUILD SHARE topic cannot become claim forwarding", async () => {
  const line = fill(example(helpText("build"), "share"), { thing: "workshop", player: "peer" });
  const r = parseHumanCommand(line, ctx);
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.error);
  expect(r.action).toEqual({ verb: "BUILD", arguments: { operation: "SHARE", entity_id: "entity.workshop", player_id: "player.peer" } });
});

it("G10.03 BUILD CONNECT topic preserves the link and destination", async () => {
  const line = fill(example(helpText("build"), "connect"), { link: "route-link", dest: "east" });
  const r = parseHumanCommand(line, ctx);
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.error);
  expect(r.action).toEqual({ verb: "BUILD", arguments: { operation: "CONNECT", entity_id: "entity.link", dest: "east" } });
});

it("G10.04 ACCESS room allow copy includes the required listed player", async () => {
  const template = roomForm(helpText("access"), "allow");
  expect(template).toContain("applies_to=<player>");
  const r = parseHumanCommand(fill(template, { org: "org.fixture", player: "player.peer" }), ctx);
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.error);
  expect(r.action).toEqual({ verb: "COMMIT", arguments: expect.objectContaining({ operation: "ACCESS_POLICY", scope: "ROOM", mode: "ALLOW_ONLY", applies_to: "player.peer", acting_for: "org.fixture" }) });
});

it("G10.05 BUILD topic remains nonmutating with zero personal and institutional funds", async () => {
  const s = await scene();
  await nonmutatingTopic(s, "build");
});

it("G10.06 ACCESS topic remains nonmutating with zero personal and institutional funds", async () => {
  const s = await scene();
  await nonmutatingTopic(s, "access");
});

it("G10.07 rendered room allow command settles the listed player scope", async () => {
  const s = await scene();
  const line = fill(roomForm(copy(await s.help("access")), "allow"), { org: s.org, player: s.peer.player_id });
  s.settled.length = 0;
  const r = await s.send(s.gate, "LOOK", { line });
  expect(r.ok).toBe(true);
  expect(s.w.access_restrictions).toEqual([expect.objectContaining({ scope: "ROOM", room_id: "room.hub", mode: "ALLOW_ONLY", applies_to: s.peer.player_id })]);
  expect(s.settled).toHaveLength(1);
  expect(s.settled[0]).toEqual(expect.objectContaining({ event_type: "ACCESS_RESTRICTED", payload: expect.objectContaining({ authorized_by: s.org, scope: "ROOM", mode: "ALLOW_ONLY", applies_to: s.peer.player_id }) }));
});
