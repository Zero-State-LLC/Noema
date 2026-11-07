import { expect, it as partnerRouteCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS } from "../src/actions";
import { CONSTRUCT_COSTS, SHARE_MAX_CO_OWNERS } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { ObservationAffordance, PlayerPrincipal } from "../src/types";

type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Envelope = Parameters<typeof applyWorldCommand>[2];
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
const principal = (name: string): PlayerPrincipal => ({ player_id: `player.${name}`, agent_id: `agent.${name}`,
  session_id: `sess.${name}`, controller_id: `ctrl.agent.${name}`, controller_type: "agent",
  authentication_context: "test", protocol_version: "1",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] });

async function partnerRouteScene(kind: "workshop" | "route_link" = "workshop") {
  const w: WorldRuntime = { world_id: "test.hosted-canonical.partner-route", world_name: "Partner Route", cycle: 0,
    sequence: 0, entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [
        { direction: "south", to_room_id: "room.quay" }, { direction: "east", to_room_id: "room.oneway" },
        { direction: "down", to_room_id: "room.hidden", hidden: true }] },
      "room.quay": { room_id: "room.quay", name: "Quay", description: "Public.", entities: [],
        exits: [{ direction: "north", to_room_id: "room.hub" }] },
      "room.oneway": { room_id: "room.oneway", name: "One Way", description: "Public.", entities: [], exits: [] },
      "room.hidden": { room_id: "room.hidden", name: "Hidden", description: "Hidden.", entities: [], exits: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [], access_restrictions: [] };
  const owner = principal("owner"), peer = principal("peer"), other = principal("other");
  const settled: Settled[] = []; let key = 0;
  const dispatch = (p: PlayerPrincipal, envelope: Envelope) => applyWorldCommand(w, p, envelope,
    async ev => { settled.push(ev); return true; }, { admission: "developer" });
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) => {
    const id = `partner-route-${++key}`;
    return dispatch(p, { request_id: id, idempotency_key: id, command, arguments: args });
  };
  const text = (p: PlayerPrincipal, line: string) => send(p, "LOOK", { line });
  const enter = async (p: PlayerPrincipal) => { expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS); };
  await enter(owner);
  w.players[owner.player_id].budgets.storage -= CONSTRUCT_COSTS[kind].storage || 0;
  expect((await send(owner, "BUILD", { operation: "CONSTRUCT", class: kind })).ok).toBe(true);
  expect((await send(owner, "WAIT")).ok).toBe(true);
  const created = w.rooms["room.hub"].entities.filter(e => e.infra_type === kind);
  expect(created).toHaveLength(1); const id = created[0].entity_id;
  expect(created[0].in_progress).not.toBe(true);
  await enter(peer); await enter(other);
  for (const p of [owner, peer, other]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await send(p, "OBSERVE")).ok).toBe(true);
  }
  return { w, owner, peer, other, settled, dispatch, send, text, enter,
    get asset() { const asset = w.rooms["room.hub"].entities.find(e => e.entity_id === id);
      expect(asset).toBeDefined(); return asset!; } };
}
type Scene = Awaited<ReturnType<typeof partnerRouteScene>>;
function boundedState(w: WorldRuntime) {
  // Replay, activity and pending-choice bookkeeping and observation caches are excluded.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms, organizations: w.organizations,
    messages: w.messages, trades: w.trades, access_restrictions: w.access_restrictions, unsettled: w.unsettled,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])) });
}
async function advertised(s: Scene, p: PlayerPrincipal, operation: "SHARE" | "VEST" | "CONNECT",
  select: (a: ObservationAffordance) => boolean) {
  const r = await s.send(p, "OBSERVE"); expect(r.ok).toBe(true);
  const found = (r.observation?.affordances || []).filter(a => a.operation === operation && select(a));
  expect(found).toHaveLength(1);
  return found[0];
}
function unchanged(s: Scene, before: ReturnType<typeof boundedState>, r: Result, code: string) {
  expect(r.ok).toBe(false); expect(r.error?.code).toBe(code); expect(r.events || []).toEqual([]);
  expect(s.settled).toEqual([]); expect(boundedState(s.w)).toEqual(before);
}
function stamped(s: Scene, r: Result, operation: string, set: Record<string, unknown>, payer = s.owner) {
  expect(r.ok).toBe(true);
  expect(r.events?.map(e => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
  expect(r.events?.[0]?.payload).toEqual(expect.objectContaining({ player_id: payer.player_id,
    cost_paid: { compute: 1 }, reason: operation }));
  expect(r.events?.[1]?.payload).toEqual(expect.objectContaining({ entity_id: s.asset.entity_id, operation,
    set: expect.objectContaining(set) }));
  expect(s.settled).toEqual([expect.objectContaining({ event_type: "ENTITY_UPDATE", payload:
    expect.objectContaining({ entity_id: s.asset.entity_id, operation, set: expect.objectContaining(set) }) })]);
  expect(s.w.rooms["room.hub"].entities.filter(e => e.entity_id === s.asset.entity_id)).toHaveLength(1);
}
async function namedOffice(s: Scene, name: string, profile = "OPERATE_NAMED_ASSET", occupied = true) {
  const before = new Set(Object.keys(s.w.organizations));
  s.w.players[s.owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await s.send(s.owner, "ORG_CREATE", { name, charter: "Keep" })).ok).toBe(true);
  const ids = Object.keys(s.w.organizations).filter(id => !before.has(id)); expect(ids).toHaveLength(1);
  const org = ids[0];
  expect((await s.send(s.owner, "ORG_OFFICE_CREATE", { org_id: org, display_name: "Keeper",
    authority_profile: profile })).ok).toBe(true);
  const office = Object.values(s.w.organizations[org].offices || {})[0].office_id;
  if (occupied) expect((await s.send(s.owner, "ORG_OFFICE_ASSIGN", { office_id: office,
    agent_id: s.owner.player_id })).ok).toBe(true);
  s.w.players[s.owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return { org, office };
}

partnerRouteCase("P09 SHARE exact contextual command selects the named partner and retains its asset", async () => {
  const s = await partnerRouteScene();
  const a = await advertised(s, s.owner, "SHARE", x => x.player_id === s.other.player_id);
  expect(a).toEqual(expect.objectContaining({ action: "BUILD", target_id: s.asset.entity_id,
    player_id: s.other.player_id, cmd: `share ${s.asset.label} with other`, available: true }));
  const beforeMessages = structuredClone(s.w.messages), compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, a.cmd), "SHARE", { co_owner_id: s.other.player_id });
  expect(s.asset.co_owner_id).toBe(s.other.player_id); expect(s.asset.owner_id).toBe(s.owner.player_id);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
  expect(s.w.messages).toEqual(beforeMessages);
});

partnerRouteCase("P09 SHARE penultimate slot admits only its named recipient, then full capacity suppresses offers", async () => {
  const s = await partnerRouteScene();
  const partners = [s.peer, s.other, ...["third", "fourth", "fifth", "sixth"].map(principal)];
  for (const p of partners.slice(2)) await s.enter(p);
  for (const p of partners.slice(0, SHARE_MAX_CO_OWNERS - 1)) {
    const a = await advertised(s, s.owner, "SHARE", x => x.player_id === p.player_id);
    expect(a.target_id).toBe(s.asset.entity_id); s.settled.length = 0;
    const result = await s.text(s.owner, a.cmd);
    stamped(s, result, "SHARE", { [`co_owner${p === partners[0] ? "" : `_${partners.indexOf(p) + 1}`}_id`]: p.player_id });
  }
  const last = partners[SHARE_MAX_CO_OWNERS - 1];
  const offer = await advertised(s, s.owner, "SHARE", x => x.player_id === last.player_id);
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, offer.cmd), "SHARE", { co_owner_5_id: last.player_id });
  expect([s.asset.co_owner_id, s.asset.co_owner_2_id, s.asset.co_owner_3_id,
    s.asset.co_owner_4_id, s.asset.co_owner_5_id]).toEqual(partners.slice(0, SHARE_MAX_CO_OWNERS).map(p => p.player_id));
  const observation = await s.send(s.owner, "OBSERVE");
  expect(observation.observation?.affordances?.filter(a => a.operation === "SHARE" && a.target_id === s.asset.entity_id)).toEqual([]);
  const before = boundedState(s.w); s.settled.length = 0;
  unchanged(s, before, await s.text(s.owner, `share ${s.asset.label} with ${partners[SHARE_MAX_CO_OWNERS].player_id}`), "FORBIDDEN");
});

partnerRouteCase("P09 duplicate recipient handles do not silently share with the wrong Player", async () => {
  const s = await partnerRouteScene();
  s.w.players[s.peer.player_id].handle = "twin";
  s.w.players[s.other.player_id].handle = "twin";
  const offer = await advertised(s, s.owner, "SHARE", x => x.player_id === s.other.player_id);
  expect(offer.cmd).toBe(`share ${s.asset.label} with twin`);
  expect(offer.target_id).toBe(s.asset.entity_id);
  const before = boundedState(s.w); s.settled.length = 0;
  const result = await s.text(s.owner, offer.cmd);
  expect(result.ok).toBe(false);
  expect(result.events || []).toEqual([]);
  expect(s.settled).toEqual([]);
  expect(boundedState(s.w)).toEqual(before);
  expect(s.asset.co_owner_id).toBeUndefined();
  expect(s.w.messages).toEqual([]);
  // Metadata identifies a valid partner even though two offers render the same text.
  const structured = await partnerRouteScene();
  structured.w.players[structured.peer.player_id].handle = "twin";
  structured.w.players[structured.other.player_id].handle = "twin";
  const distinct = await advertised(structured, structured.owner, "SHARE",
    x => x.player_id === structured.other.player_id);
  expect(distinct.available).toBe(true);
  structured.settled.length = 0;
  stamped(structured, await structured.send(structured.owner, "BUILD", { operation: "SHARE",
    entity_id: distinct.target_id, player_id: distinct.player_id }), "SHARE",
    { co_owner_id: structured.other.player_id });
  expect(structured.asset.co_owner_id).toBe(structured.other.player_id);
});

partnerRouteCase("P09 advertised SHARE prefers a literal handle over another player's ID suffix", async () => {
  for (const reversed of [false, true]) {
    const s = await partnerRouteScene();
    s.w.players[s.peer.player_id].handle = "unique";
    s.w.players[s.other.player_id].handle = "peer";
    if (reversed) s.w.players = Object.fromEntries(Object.entries(s.w.players).reverse());
    const offer = await advertised(s, s.owner, "SHARE", a => a.player_id === s.other.player_id);
    expect(offer).toEqual(expect.objectContaining({ target_id: s.asset.entity_id,
      player_id: s.other.player_id, cmd: `share ${s.asset.label} with peer`, available: true }));
    const beforeMessages = structuredClone(s.w.messages);
    const peerBefore = structuredClone(s.w.players[s.peer.player_id].budgets);
    const otherBefore = structuredClone(s.w.players[s.other.player_id].budgets);
    const payerBefore = s.w.players[s.owner.player_id].budgets.compute;
    s.settled.length = 0;
    const result = await s.text(s.owner, offer.cmd);
    stamped(s, result, "SHARE", { co_owner_id: s.other.player_id });
    expect(s.asset.co_owner_id).toBe(s.other.player_id);
    expect(s.asset.owner_id).toBe(s.owner.player_id);
    expect(s.w.players[s.owner.player_id].budgets.compute).toBe(payerBefore - 1);
    expect(s.w.players[s.peer.player_id].budgets).toEqual(peerBefore);
    expect(s.w.players[s.other.player_id].budgets).toEqual(otherBefore);
    expect(s.w.messages).toEqual(beforeMessages);
    const control = await partnerRouteScene();
    control.w.players[control.peer.player_id].handle = "unique";
    control.w.players[control.other.player_id].handle = "peer";
    control.settled.length = 0;
    stamped(control, await control.send(control.owner, "BUILD", { operation: "SHARE",
      entity_id: control.asset.entity_id, player_id: control.other.player_id }),
      "SHARE", { co_owner_id: control.other.player_id });
    expect(control.asset.co_owner_id).toBe(control.other.player_id);
  }
});

partnerRouteCase("P09 recipient precedence controls keep canonical IDs, literal punctuation and legacy aliases distinct", async () => {
  for (const [peerHandle, otherHandle, recipient, expected] of [
    ["unique", "player.peer", "player.peer", "player.peer"],
    ["unique", "peer", "peer", "player.other"],
    ["unique", "othername", "other", "player.other"],
    ["dash_name", "dash-name", "dash-name", "player.other"],
    ["dash_name", "dash-name", "dash_name", "player.peer"],
  ] as const) {
    for (const reverse of [false, true]) {
      const s = await partnerRouteScene();
      s.w.players[s.peer.player_id].handle = peerHandle;
      s.w.players[s.other.player_id].handle = otherHandle;
      if (reverse) s.w.players = Object.fromEntries(Object.entries(s.w.players).reverse());
      s.settled.length = 0;
      const before = s.w.players[s.owner.player_id].budgets.compute;
      const r = await s.text(s.owner, `share ${s.asset.label} with ${recipient}`);
      expect(r.ok, `${recipient} (reverse=${reverse}): ${JSON.stringify(r.error)}`).toBe(true);
      stamped(s, r, "SHARE", { co_owner_id: expected });
      expect(s.asset.co_owner_id).toBe(expected);
      expect(s.w.players[s.owner.player_id].budgets.compute).toBe(before - 1);
      expect(s.w.players[expected === s.peer.player_id ? s.other.player_id : s.peer.player_id].budgets)
        .toEqual(DEFAULT_BUDGETS);
    }
  }
  for (const [peerHandle, otherHandle, name, code] of [
    ["twin", "twin", "twin", "AMBIGUOUS_TARGET"],
    ["unique", "other", "unreachable-player", "NOT_FOUND"],
  ] as const) {
    const s = await partnerRouteScene();
    s.w.players[s.peer.player_id].handle = peerHandle;
    s.w.players[s.other.player_id].handle = otherHandle;
    const before = boundedState(s.w); s.settled.length = 0;
    unchanged(s, before, await s.text(s.owner, `share ${s.asset.label} with ${name}`), code);
  }
  // Self is excluded before any name tier.
  const own = await partnerRouteScene();
  const ownBefore = boundedState(own.w); own.settled.length = 0;
  unchanged(own, ownBefore, await own.text(own.owner, `share ${own.asset.label} with ${own.owner.player_id}`), "NOT_FOUND");
});

partnerRouteCase("P09 canonical self identity cannot redirect SHARE through another literal handle", async () => {
  for (const reverse of [false, true]) {
    const s = await partnerRouteScene();
    s.w.players[s.other.player_id].handle = s.owner.player_id;
    if (reverse) s.w.players = Object.fromEntries(Object.entries(s.w.players).reverse());
    const before = boundedState(s.w); s.settled.length = 0;
    unchanged(s, before, await s.text(s.owner, `share ${s.asset.label} with ${s.owner.player_id}`), "NOT_FOUND");
    expect(s.asset.co_owner_id).toBeUndefined();
    // A genuinely short literal handle remains addressable in the same roster.
    const payerBefore = s.w.players[s.owner.player_id].budgets.compute;
    s.settled.length = 0;
    stamped(s, await s.text(s.owner, `share ${s.asset.label} with other`), "SHARE",
      { co_owner_id: s.other.player_id });
    expect(s.w.players[s.owner.player_id].budgets.compute).toBe(payerBefore - 1);
  }
});

partnerRouteCase("P09 unresolved canonical-shaped reference does not choose a partial handle", async () => {
  for (const reverse of [false, true]) {
    const s = await partnerRouteScene();
    s.w.players[s.other.player_id].handle = "player.absent-annex";
    if (reverse) s.w.players = Object.fromEntries(Object.entries(s.w.players).reverse());
    const before = boundedState(s.w); s.settled.length = 0;
    unchanged(s, before, await s.text(s.owner, `share ${s.asset.label} with player.absent`), "NOT_FOUND");
    expect(s.asset.co_owner_id).toBeUndefined();
    s.settled.length = 0;
    stamped(s, await s.text(s.owner, `share ${s.asset.label} with player.absent-annex`), "SHARE",
      { co_owner_id: s.other.player_id });
  }
});

partnerRouteCase("P09 VEST contextual org identity transfers personal asset only with occupied named office", async () => {
  const s = await partnerRouteScene(), institution = await namedOffice(s, "Nacre Works");
  const a = await advertised(s, s.owner, "VEST", x => x.org_id === institution.org);
  expect(a).toEqual(expect.objectContaining({ action: "BUILD", target_id: s.asset.entity_id,
    org_id: institution.org, cmd: `vest ${s.asset.label} to ${institution.org}`, available: true }));
  const compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, a.cmd), "VEST", { owner_id: institution.org });
  expect(s.asset.owner_id).toBe(institution.org);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
  const after = await s.send(s.owner, "OBSERVE");
  expect(after.observation?.affordances?.filter(x => x.operation === "VEST" && x.target_id === s.asset.entity_id)).toEqual([]);
  const before = boundedState(s.w); s.settled.length = 0;
  unchanged(s, before, await s.text(s.owner, a.cmd), "NOT_OWNER");
});

partnerRouteCase("P09 jointly held asset cannot vest; failed copy has no effects", async () => {
  const s = await partnerRouteScene(), institution = await namedOffice(s, "Joint Works");
  const a = await advertised(s, s.owner, "VEST", x => x.org_id === institution.org);
  const share = await advertised(s, s.owner, "SHARE", x => x.player_id === s.peer.player_id);
  s.settled.length = 0; stamped(s, await s.text(s.owner, share.cmd), "SHARE", { co_owner_id: s.peer.player_id });
  const observation = await s.send(s.owner, "OBSERVE");
  expect(observation.observation?.affordances?.filter(x => x.operation === "VEST" && x.target_id === s.asset.entity_id)).toEqual([]);
  const before = boundedState(s.w); s.settled.length = 0;
  unchanged(s, before, await s.text(s.owner, a.cmd), "FORBIDDEN");
  expect(s.asset.owner_id).toBe(s.owner.player_id);
});

partnerRouteCase("P09 vacant or wrong-profile office cannot authorize VEST even with ownership", async () => {
  for (const [profile, occupied] of [["OPERATE_NAMED_ASSET", false], ["PUBLISH_NOTICE", true]] as const) {
    const s = await partnerRouteScene(), institution = await namedOffice(s, `Office ${profile} ${occupied}`, profile, occupied);
    const observation = await s.send(s.owner, "OBSERVE");
    expect(observation.observation?.affordances?.filter(a => a.operation === "VEST" && a.org_id === institution.org)).toEqual([]);
    const before = boundedState(s.w); s.settled.length = 0;
    unchanged(s, before, await s.text(s.owner, `vest ${s.asset.label} to ${institution.org}`), "FORBIDDEN");
  }
});

partnerRouteCase("P09 CONNECT contextual direction and structured room ID select one public two-way destination", async () => {
  const s = await partnerRouteScene("route_link");
  const a = await advertised(s, s.owner, "CONNECT", x => x.dest === "south");
  expect(a).toEqual(expect.objectContaining({ action: "BUILD", target_id: s.asset.entity_id,
    dest: "south", cmd: `connect ${s.asset.label} to south`, available: true }));
  const exits = structuredClone(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits])));
  const compute = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, a.cmd), "CONNECT", { dest_room_id: "room.quay" });
  expect(s.asset.dest_room_id).toBe("room.quay");
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
  expect(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits]))).toEqual(exits);
  const replay: Envelope = { request_id: "partner-route-replay", idempotency_key: "partner-route-replay",
    command: "LOOK", arguments: { line: a.cmd } };
  s.settled.length = 0; const first = await s.dispatch(s.owner, replay);
  stamped(s, first, "CONNECT", { dest_room_id: "room.quay" });
  const before = boundedState(s.w), cached = structuredClone(first); s.settled.length = 0;
  expect(await s.dispatch(s.owner, replay)).toEqual(cached);
  expect(s.settled).toEqual([]); expect(boundedState(s.w)).toEqual(before);
  const roomId = await s.send(s.owner, "BUILD", { operation: "CONNECT", entity_id: s.asset.entity_id, dest: "room.quay" });
  expect(roomId.ok).toBe(true); expect(roomId.events?.[1]?.payload).toEqual(expect.objectContaining({
    entity_id: s.asset.entity_id, operation: "CONNECT", set: expect.objectContaining({ dest_room_id: "room.quay" }) }));
});

partnerRouteCase("P09 co-owner stewardship CONNECT retains the jointly held route and one destination", async () => {
  const s = await partnerRouteScene("route_link");
  const share = await advertised(s, s.owner, "SHARE", x => x.player_id === s.peer.player_id);
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, share.cmd), "SHARE", { co_owner_id: s.peer.player_id });
  const offer = await advertised(s, s.peer, "CONNECT", x => x.dest === "south" && x.target_id === s.asset.entity_id);
  expect(offer).toEqual(expect.objectContaining({ cmd: `connect ${s.asset.label} to south`, available: true }));
  const exits = structuredClone(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits])));
  const ownerBefore = structuredClone(s.w.players[s.owner.player_id].budgets);
  const payerBefore = s.w.players[s.peer.player_id].budgets.compute;
  s.settled.length = 0;
  stamped(s, await s.text(s.peer, offer.cmd), "CONNECT", { dest_room_id: "room.quay" }, s.peer);
  expect(s.asset).toEqual(expect.objectContaining({ owner_id: s.owner.player_id,
    co_owner_id: s.peer.player_id, dest_room_id: "room.quay" }));
  expect(s.w.players[s.peer.player_id].budgets.compute).toBe(payerBefore - 1);
  expect(s.w.players[s.owner.player_id].budgets).toEqual(ownerBefore);
  expect(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits]))).toEqual(exits);
  const before = boundedState(s.w); s.settled.length = 0;
  unchanged(s, before, await s.text(s.other, offer.cmd), "NOT_OWNER");
});

partnerRouteCase("P09 text CONNECT room-ID destination settles once without creating an exit", async () => {
  const s = await partnerRouteScene("route_link");
  const line = `connect ${s.asset.label} to room.quay`;
  const exits = structuredClone(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits])));
  const ownerBefore = s.w.players[s.owner.player_id].budgets.compute;
  s.settled.length = 0;
  const envelope: Envelope = { request_id: "partner-room-id", idempotency_key: "partner-room-id",
    command: "LOOK", arguments: { line } };
  const first = await s.dispatch(s.owner, envelope);
  stamped(s, first, "CONNECT", { dest_room_id: "room.quay" });
  expect(s.asset.dest_room_id).toBe("room.quay");
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(ownerBefore - 1);
  expect(Object.fromEntries(Object.entries(s.w.rooms).map(([id, r]) => [id, r.exits]))).toEqual(exits);
  const before = boundedState(s.w); s.settled.length = 0;
  expect(await s.dispatch(s.owner, envelope)).toEqual(first);
  expect(s.settled).toEqual([]); expect(boundedState(s.w)).toEqual(before);
  for (const destination of ["room.hidden", "room.oneway"]) {
    const prior = boundedState(s.w); s.settled.length = 0;
    unchanged(s, prior, await s.text(s.owner, `connect ${s.asset.label} to ${destination}`), "NOT_OBSERVABLE");
  }
});

partnerRouteCase("P09 org-held link requires its own occupied named-asset office, not an unrelated office", async () => {
  const s = await partnerRouteScene("route_link"), institution = await namedOffice(s, "Route Works");
  const unrelated = await namedOffice(s, "Other Works");
  const vest = await advertised(s, s.owner, "VEST", a => a.org_id === institution.org);
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, vest.cmd), "VEST", { owner_id: institution.org });
  expect(s.asset.owner_id).toBe(institution.org);
  const connect = await advertised(s, s.owner, "CONNECT", a => a.dest === "south");
  const before = boundedState(s.w); s.settled.length = 0;
  unchanged(s, before, await s.text(s.peer, connect.cmd), "NOT_OWNER");
  // A second office in an unrelated organization cannot replace the named-asset grant.
  expect((await s.send(s.owner, "ORG_OFFICE_VACATE", { office_id: institution.office })).ok).toBe(true);
  const afterResign = await s.send(s.owner, "OBSERVE");
  expect(afterResign.observation?.affordances?.filter(a => a.operation === "CONNECT" && a.target_id === s.asset.entity_id)).toEqual([]);
  const beforeUnrelated = boundedState(s.w); s.settled.length = 0;
  unchanged(s, beforeUnrelated, await s.text(s.owner, connect.cmd), "NOT_OWNER");
  expect(Object.values(s.w.organizations[unrelated.org].offices || {})).toHaveLength(1);
  expect((await s.send(s.owner, "ORG_OFFICE_ASSIGN", { office_id: institution.office,
    agent_id: s.owner.player_id })).ok).toBe(true);
  const restored = await advertised(s, s.owner, "CONNECT", a => a.dest === "south");
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, restored.cmd), "CONNECT", { dest_room_id: "room.quay" });
  expect(s.asset.owner_id).toBe(institution.org);
});

partnerRouteCase("P09 CONNECT nonsteward and hidden or one-way destinations refuse without mutation", async () => {
  const s = await partnerRouteScene("route_link");
  const a = await advertised(s, s.owner, "CONNECT", x => x.dest === "south");
  for (const [p, cmd, code] of [[s.peer, a.cmd, "NOT_OWNER"],
    [s.owner, `connect ${s.asset.label} to room.hidden`, "NOT_OBSERVABLE"],
    [s.owner, `connect ${s.asset.label} to east`, "NOT_OBSERVABLE"]] as const) {
    const before = boundedState(s.w); s.settled.length = 0;
    unchanged(s, before, await s.text(p, cmd), code);
  }
  const offers = await s.send(s.owner, "OBSERVE");
  expect(offers.observation?.affordances?.filter(x => x.operation === "CONNECT" && x.target_id === s.asset.entity_id)
    .map(x => x.dest)).toEqual(["south"]);
  s.settled.length = 0;
  stamped(s, await s.text(s.owner, a.cmd), "CONNECT", { dest_room_id: "room.quay" });
});
