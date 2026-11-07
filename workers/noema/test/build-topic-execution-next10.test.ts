import { expect, it } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS } from "../src/actions";
import { CONSTRUCT_COSTS } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";
type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Envelope = Parameters<typeof applyWorldCommand>[2];
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
function principal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", authentication_context: "test",
    protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] };
}
function world(): WorldRuntime {
  return { world_id: "test.hosted-canonical.build-follow", world_name: "Build Follow", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [
        { direction: "south", to_room_id: "room.quay" },
        { direction: "east", to_room_id: "room.oneway" },
        { direction: "down", to_room_id: "room.hidden", hidden: true },
      ] },
      "room.quay": { room_id: "room.quay", name: "Quay", description: "Public.", entities: [],
        exits: [{ direction: "north", to_room_id: "room.hub" }] },
      "room.oneway": { room_id: "room.oneway", name: "One Way", description: "Public.", entities: [], exits: [] },
      "room.hidden": { room_id: "room.hidden", name: "Hidden", description: "Hidden.", entities: [], exits: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [], access_restrictions: [] };
}
async function scene(kind: "workshop" | "route_link" = "workshop") {
  const w = world(), owner = principal("owner"), peer = principal("peer"), other = principal("other");
  const settled: Settled[] = []; let key = 0;
  const dispatch = (p: PlayerPrincipal, envelope: Envelope, developer = false) =>
    applyWorldCommand(w, p, envelope, async (ev) => { settled.push(ev); return true; },
      { admission: developer ? "developer" : "hosted" });
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false) => {
    const id = `build-follow-${++key}`;
    return dispatch(p, { request_id: id, idempotency_key: id, command, arguments: args }, developer);
  };
  const text = (p: PlayerPrincipal, line: string) => send(p, "LOOK", { line }, true);
  expect((await send(owner, "ENTER_WORLD")).ok).toBe(true);
  // Storage is FREE capacity, not cargo. Seed only the construction materials consumed by BUILD.
  w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[owner.player_id].budgets.storage -= CONSTRUCT_COSTS[kind].storage || 0;
  expect((await send(owner, "BUILD", { operation: "CONSTRUCT", class: kind })).ok).toBe(true);
  expect((await send(owner, "WAIT")).ok).toBe(true);
  const assets = w.rooms["room.hub"].entities.filter((e) => e.infra_type === kind);
  expect(assets).toHaveLength(1); const asset = assets[0];
  expect(asset.in_progress).not.toBe(true); expect(asset.owner_id).toBe(owner.player_id);
  // Enter observers only after the sole builder advances construction readiness (GC2-S11 fixture order).
  for (const p of [peer, other]) expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
  // This is fixture funding, not an economic or cargo-acquisition acceptance claim.
  for (const p of [owner, peer, other]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await send(p, "OBSERVE")).ok).toBe(true);
  }
  expect(settled.length).toBeGreaterThan(0);
  const assetId = asset.entity_id;
  return { w, owner, peer, other, settled, dispatch, send, text,
    get asset() {
      const current = w.rooms["room.hub"].entities.find((e) => e.entity_id === assetId);
      expect(current).toBeDefined(); return current!;
    } };
}
type Rig = Awaited<ReturnType<typeof scene>>;
async function topic(s: Rig, verb: "share" | "vest" | "connect", values: Record<string, string>, p = s.owner) {
  const r = await s.text(p, "help build"); expect(r.ok).toBe(true);
  const lines = String(r.observation?.consequence || "").split("\n").map((x) => x.trim());
  const matches = lines.filter((x) => x.startsWith(verb + " "));
  expect(matches).toHaveLength(1);
  let line = matches[0].split(/\s{2,}/)[0];
  for (const [key, value] of Object.entries(values)) line = line.replaceAll(`<${key}>`, value);
  expect(line).not.toMatch(/<[^>]+>/);
  return line; // Delimiters/options must come from actual HELP, never helper repair.
}
function projection(w: WorldRuntime) {
  // Deliberately exclude replay/activity/pending bookkeeping and observation caches.
  // Include budgets/location/discovery for EVERY principal, not just the submitting actor.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms,
    organizations: w.organizations, access_restrictions: w.access_restrictions,
    messages: w.messages, trades: w.trades, unsettled: w.unsettled,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])) });
}
function rejected(s: Rig, r: Result, before: ReturnType<typeof projection>, code: string) {
  expect(r.ok).toBe(false); expect(r.error?.code).toBe(code); expect(r.events || []).toEqual([]);
  expect(s.settled).toEqual([]); expect(projection(s.w)).toEqual(before);
}
function effect(s: Rig, r: Result, operation: "SHARE" | "VEST" | "CONNECT", set: Record<string, unknown>) {
  expect(r.ok).toBe(true);
  expect((r.events || []).map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
  expect(s.settled).toHaveLength(1);
  expect(s.settled[0]).toEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE", payload:
    expect.objectContaining({ entity_id: s.asset.entity_id, operation, set: expect.objectContaining(set) }) }));
  expect(r.events).toContainEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE", payload:
    expect.objectContaining({ entity_id: s.asset.entity_id, operation, set: expect.objectContaining(set) }) }));
  expect(s.w.rooms["room.hub"].entities.filter((e) => e.entity_id === s.asset.entity_id)).toHaveLength(1);
}
async function institution(s: Rig, name: string, occupied = true) {
  s.w.players[s.owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const ids = new Set(Object.keys(s.w.organizations));
  expect((await s.send(s.owner, "ORG_CREATE", { name, charter: "Keep" })).ok).toBe(true);
  const added = Object.keys(s.w.organizations).filter((id) => !ids.has(id));
  expect(added).toHaveLength(1); const org = added[0];
  expect((await s.send(s.owner, "ORG_OFFICE_CREATE", { org_id: org, display_name: "Keeper",
    authority_profile: "OPERATE_NAMED_ASSET" })).ok).toBe(true);
  const offices = Object.values(s.w.organizations[org].offices || {})
    .filter((o) => o.authority_profile === "OPERATE_NAMED_ASSET");
  expect(offices).toHaveLength(1); const office = offices[0].office_id;
  if (occupied) await seat(s, office);
  return { org, office };
}
async function seat(s: Rig, office: string) {
  s.w.players[s.owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await s.send(s.owner, "ORG_OFFICE_ASSIGN", { office_id: office, agent_id: s.owner.player_id })).ok).toBe(true);
}
function exits(w: WorldRuntime) {
  return structuredClone(Object.fromEntries(Object.entries(w.rooms).map(([id, r]) => [id, r.exits])));
}

it("B10.01 rendered SHARE stamps its retained asset and named recipient, not MESSAGE", async () => {
  const s = await scene();
  const line = await topic(s, "share", { thing: s.asset.label, player: s.peer.player_id });
  const messages = structuredClone(s.w.messages), compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  const r = await s.text(s.owner, line);
  effect(s, r, "SHARE", { co_owner_id: s.peer.player_id });
  expect(s.asset.co_owner_id).toBe(s.peer.player_id); expect(s.asset.owner_id).toBe(s.owner.player_id);
  expect(s.w.messages).toEqual(messages);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
});

it("B10.02 rendered SHARE refuses a non-owner without settlement and still works for the owner", async () => {
  const s = await scene();
  const line = await topic(s, "share", { thing: s.asset.label, player: s.other.player_id }, s.peer);
  const before = projection(s.w); s.settled.length = 0;
  rejected(s, await s.text(s.peer, line), before, "NOT_OWNER");
  s.settled.length = 0;
  effect(s, await s.text(s.owner, line), "SHARE", { co_owner_id: s.other.player_id });
  expect(s.asset.co_owner_id).toBe(s.other.player_id);
});

it("B10.03 a fresh-key duplicate SHARE refuses without a second stamp or charge", async () => {
  const s = await scene("route_link");
  const line = await topic(s, "share", { thing: s.asset.label, player: s.peer.player_id });
  s.settled.length = 0;
  effect(s, await s.text(s.owner, line), "SHARE", { co_owner_id: s.peer.player_id });
  const before = projection(s.w); s.settled.length = 0;
  rejected(s, await s.text(s.owner, line), before, "NOT_ADDRESSABLE");
  // Later successful mutation proves the recorder is still connected, without expanding SHARE capacity.
  const next = await topic(s, "connect", { link: s.asset.label, dest: "south" });
  s.settled.length = 0;
  effect(s, await s.text(s.owner, next), "CONNECT", { dest_room_id: "room.quay" });
  expect(s.asset.dest_room_id).toBe("room.quay");
});

it("B10.04 exact-envelope SHARE replay returns the cached result without another effect", async () => {
  const s = await scene();
  const line = await topic(s, "share", { thing: s.asset.label, player: s.peer.player_id });
  const envelope: Envelope = { request_id: "build-follow-replay", idempotency_key: "build-follow-replay",
    command: "LOOK", arguments: { line } };
  s.settled.length = 0;
  const first = await s.dispatch(s.owner, envelope, true);
  effect(s, first, "SHARE", { co_owner_id: s.peer.player_id });
  const cached = structuredClone(first), before = projection(s.w); s.settled.length = 0;
  expect(await s.dispatch(s.owner, envelope, true)).toEqual(cached);
  expect(s.settled).toEqual([]); expect(projection(s.w)).toEqual(before);
});

it("B10.05 VEST copy grants no vacant-office authority but executes after genuine assignment", async () => {
  const s = await scene(), org = await institution(s, "Vacant Works", false);
  const line = await topic(s, "vest", { thing: s.asset.label, org: org.org });
  const before = projection(s.w); s.settled.length = 0;
  rejected(s, await s.text(s.owner, line), before, "FORBIDDEN");
  await seat(s, org.office); s.settled.length = 0;
  const compute = s.w.players[s.owner.player_id].budgets.compute;
  effect(s, await s.text(s.owner, line), "VEST", { owner_id: org.org });
  expect(s.asset.owner_id).toBe(org.org);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
});

it("B10.06 VEST selects the specified institution among two legitimately held offices", async () => {
  const s = await scene(), first = await institution(s, "First Works"), second = await institution(s, "Second Works");
  expect(first.org).not.toBe(second.org);
  const line = await topic(s, "vest", { thing: s.asset.label, org: second.org });
  const institutions = structuredClone(s.w.organizations), compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  effect(s, await s.text(s.owner, line), "VEST", { owner_id: second.org });
  expect(s.asset.owner_id).toBe(second.org); expect(s.asset.owner_id).not.toBe(first.org);
  expect(s.w.organizations).toEqual(institutions);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
});

it("B10.07 VEST refuses a non-owner before transfer and the actual owner remains eligible", async () => {
  const s = await scene(), org = await institution(s, "Owner Works");
  const line = await topic(s, "vest", { thing: s.asset.label, org: org.org }, s.peer);
  const before = projection(s.w); s.settled.length = 0;
  rejected(s, await s.text(s.peer, line), before, "NOT_OWNER");
  s.settled.length = 0;
  effect(s, await s.text(s.owner, line), "VEST", { owner_id: org.org });
  expect(s.asset.owner_id).toBe(org.org);
});

it("B10.08 CONNECT pins the retained link to a two-way public neighbor without creating exits", async () => {
  const s = await scene("route_link");
  const line = await topic(s, "connect", { link: s.asset.label, dest: "south" });
  const before = exits(s.w), compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  effect(s, await s.text(s.owner, line), "CONNECT", { dest_room_id: "room.quay" });
  expect(s.asset.dest_room_id).toBe("room.quay"); expect(exits(s.w)).toEqual(before);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
});
