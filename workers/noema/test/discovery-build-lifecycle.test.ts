import { expect, it as buildDiscoveryCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { CONSTRUCT_COSTS, STORAGE_CAPACITY, type ConstructibleClass } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
const classes: { id: ConstructibleClass; pretty: string; energy: number; compute: number; cargo: number; influence: number }[] = [
  { id: "relay", pretty: "relay", energy: 8, compute: 4, cargo: 4, influence: 2 },
  { id: "generator", pretty: "generator", energy: 8, compute: 3, cargo: 5, influence: 0 },
  { id: "storage_bay", pretty: "storage bay", energy: 5, compute: 2, cargo: 6, influence: 0 },
  { id: "production_node", pretty: "production node", energy: 7, compute: 3, cargo: 4, influence: 0 },
  { id: "route_link", pretty: "route link", energy: 8, compute: 4, cargo: 4, influence: 2 },
  { id: "workshop", pretty: "workshop", energy: 6, compute: 3, cargo: 5, influence: 0 },
  { id: "defensive_work", pretty: "defensive work", energy: 7, compute: 3, cargo: 4, influence: 3 },
  { id: "archive_annex", pretty: "archive annex", energy: 6, compute: 4, cargo: 4, influence: 2 },
];
function buildLifecyclePrincipal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", authentication_context: "test",
    protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] };
}
function buildLifecycleWorld(): WorldRuntime {
  return { world_id: "test.hosted-canonical.discovery-build-lifecycle", world_name: "Build Lifecycle", cycle: 0,
    sequence: 0, entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [] },
      "room.hidden": { room_id: "room.hidden", name: "Hidden", description: "Private.", entities: [], exits: [], hidden: true, tags: ["hidden"] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [] };
}
async function buildLifecycleRig(kind?: ConstructibleClass) {
  const w = buildLifecycleWorld(), owner = buildLifecyclePrincipal("owner"), outsider = buildLifecyclePrincipal("outsider");
  const settled: Settled[] = []; let counter = 0;
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) => {
    const id = `build-lifecycle-${++counter}`;
    return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
      async (e) => { settled.push(e); return true; }, { admission: "developer" });
  };
  const text = (p: PlayerPrincipal, line: string) => send(p, "LOOK", { line });
  expect((await send(owner, "ENTER_WORLD")).ok).toBe(true);
  const fund = (p: PlayerPrincipal, cargo: number) => {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].budgets.storage = STORAGE_CAPACITY - cargo;
    w.players[p.player_id].budgets.energy = 40;
    w.players[p.player_id].budgets.compute = 20;
    w.players[p.player_id].budgets.influence = 20;
  };
  fund(owner, kind ? CONSTRUCT_COSTS[kind].storage || 0 : 6);
  expect((await send(owner, "OBSERVE")).ok).toBe(true);
  // The sole builder must actually finish its WAIT cycle before another actor enters.
  if (kind) {
    const built = await send(owner, "BUILD", { operation: "CONSTRUCT", class: kind });
    expect(built.ok).toBe(true);
    expect((await send(owner, "WAIT")).ok).toBe(true);
    expect(w.rooms["room.hub"].entities.filter((e) => e.infra_type === kind && !e.in_progress)).toHaveLength(1);
  }
  const enterOutsider = async () => {
    expect((await send(outsider, "ENTER_WORLD")).ok).toBe(true);
    fund(outsider, 6);
    expect((await send(outsider, "OBSERVE")).ok).toBe(true);
  };
  const asset = () => {
    expect(kind).toBeDefined();
    const found = w.rooms["room.hub"].entities.find((e) => e.infra_type === kind && e.owner_id === owner.player_id);
    expect(found).toBeDefined(); return found!;
  };
  return { w, owner, outsider, settled, send, text, fund, asset, enterOutsider };
}
type Rig = Awaited<ReturnType<typeof buildLifecycleRig>>;
async function buildTopicLine(s: Rig, verb: string, values: Record<string, string>) {
  const help = await s.text(s.owner, "help build");
  expect(help.ok).toBe(true);
  const lines = String(help.observation?.consequence || "").split("\n").map((x) => x.trim());
  const matches = lines.filter((x) => x.startsWith(`${verb} `));
  expect(matches).toHaveLength(1);
  let line = matches[0].split(/\s{2,}/)[0];
  for (const [name, value] of Object.entries(values)) line = line.replaceAll(`<${name}>`, value);
  expect(line).not.toMatch(/<[^>]+>/);
  return { line, lines };
}
async function buildOffer(s: Rig, operation: string, id?: string, actor = s.owner) {
  const seen = await s.send(actor, "OBSERVE"); expect(seen.ok).toBe(true);
  const offers = (seen.observation?.affordances || []).filter((x) => x.operation === operation && (!id || x.target_id === id));
  expect(offers).toHaveLength(1);
  return offers[0];
}
function buildProjection(w: WorldRuntime) {
  // Excludes replay/activity/pending and observation caches, not canonical economy/discovery.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms, unsettled: w.unsettled,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id,
      { room_id: p.room_id, budgets: p.budgets, discovery: p.discovery }])) });
}
function buildRefusal(s: Rig, result: Result, before: ReturnType<typeof buildProjection>, code: string) {
  expect(result.ok).toBe(false); expect(result.error?.code).toBe(code);
  expect(result.events || []).toEqual([]); expect(s.settled).toEqual([]);
  expect(buildProjection(s.w)).toEqual(before);
}
function buildDebit(s: Rig, result: Result, operation: string, cost: { energy?: number; compute?: number; storage?: number; influence?: number },
  before: { energy: number; compute: number; storage: number; influence: number }, settledTypes: string[]) {
  expect(result.ok).toBe(true);
  expect((result.events || []).map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", ...settledTypes]);
  expect(result.events?.[0]?.payload).toEqual(expect.objectContaining({ player_id: s.owner.player_id, reason: operation,
    cost_paid: expect.objectContaining(Object.fromEntries(Object.entries(cost).filter(([key, v]) =>
      v != null && v > 0 && (operation !== "DISMANTLE" || key !== "storage")))) }));
  expect(s.settled.map((e) => e.event_type)).toEqual(settledTypes);
  const b = s.w.players[s.owner.player_id].budgets;
  expect({ energy: b.energy, compute: b.compute, storage: b.storage, influence: b.influence }).toEqual({
    energy: before.energy - (cost.energy || 0), compute: before.compute - (cost.compute || 0),
    storage: before.storage + (cost.storage || 0), influence: before.influence - (cost.influence || 0),
  });
}
function buildBudget(s: Rig) {
  const { energy, compute, storage, influence } = s.w.players[s.owner.player_id].budgets;
  return { energy, compute, storage, influence };
}

buildDiscoveryCase.each(classes)("P08 construct $id follows rendered HELP and contextual class to a ready owned entity", async (entry) => {
  const s = await buildLifecycleRig();
  const { line, lines } = await buildTopicLine(s, "construct", { class: entry.pretty });
  expect(lines.find((x) => x.startsWith("construct <class>"))).toContain("relay · generator · storage_bay · production_node");
  expect(lines.join(" ")).toContain(entry.id);
  expect(line).toBe(`construct ${entry.pretty}`);
  // The class-specific contextual offer, rather than an unrelated BUILD candidate.
  const observed = await s.send(s.owner, "OBSERVE");
  const candidate = (observed.observation?.affordances || []).find((x) => x.operation === "CONSTRUCT" && x.class === entry.id);
  expect(candidate).toEqual(expect.objectContaining({ cmd: line, class: entry.id, available: true, requires: expect.objectContaining({
    energy: entry.energy, compute: entry.compute, storage: entry.cargo, influence: entry.influence,
  }) }));

  const before = buildBudget(s); s.settled.length = 0;
  const result = await s.text(s.owner, candidate!.cmd);
  buildDebit(s, result, "CONSTRUCT", { energy: entry.energy, compute: entry.compute, storage: entry.cargo, influence: entry.influence }, before, ["ENTITY_CREATE"]);
  const created = result.events?.find((e) => e.event_type === "ENTITY_CREATE");
  const id = created?.payload?.entity_id as string;
  expect(id).toMatch(new RegExp(`^entity\\.${entry.id.replaceAll("_", "-")}\\.`));
  expect(created?.payload).toEqual(expect.objectContaining({ entity_id: id, owner_id: s.owner.player_id, room_id: "room.hub",
    properties: expect.objectContaining({ infra_type: entry.id, in_progress: true }) }));
  expect(s.w.rooms["room.hub"].entities.filter((e) => e.entity_id === id)).toHaveLength(1);
  expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === id)?.in_progress).toBe(true);
  expect((await s.send(s.owner, "WAIT")).ok).toBe(true);
  expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === id)).toEqual(expect.objectContaining({
    infra_type: entry.id, owner_id: s.owner.player_id, in_progress: undefined,
  }));
});

buildDiscoveryCase("P08 ready workshop follows advertised UPGRADE once with retained ID and tier", async () => {
  const s = await buildLifecycleRig("workshop"), id = s.asset().entity_id;
  s.fund(s.owner, 6);
  const offer = await buildOffer(s, "UPGRADE", id);
  const { line } = await buildTopicLine(s, "upgrade", { thing: s.asset().label });
  expect(offer).toEqual(expect.objectContaining({ cmd: line, target_id: id, available: true }));
  const before = buildBudget(s); s.settled.length = 0;
  const r = await s.text(s.owner, offer.cmd);
  buildDebit(s, r, "UPGRADE", { energy: 4, compute: 2, storage: 2, influence: 1 }, before, ["ENTITY_UPDATE"]);
  expect(s.settled[0].payload).toEqual(expect.objectContaining({ entity_id: id,
    set: expect.objectContaining({ upgrade_tier: 1, infra_type: "workshop" }) }));
  expect(s.asset()).toEqual(expect.objectContaining({ entity_id: id, infra_type: "workshop", upgrade_tier: 1 }));
  const after = await s.send(s.owner, "OBSERVE");
  expect(after.observation?.affordances?.some((x) => x.operation === "UPGRADE" && x.target_id === id)).toBe(false);
  const unchanged = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, line), unchanged, "FORBIDDEN");
});

buildDiscoveryCase("P08 advertised REPURPOSE changes the ready workshop's class without changing its ID", async () => {
  const s = await buildLifecycleRig("workshop"), id = s.asset().entity_id;
  s.fund(s.owner, 6);
  const offer = await buildOffer(s, "REPURPOSE", id);
  const { line } = await buildTopicLine(s, "repurpose", { thing: s.asset().label });
  expect(offer).toEqual(expect.objectContaining({ cmd: line, target_id: id, available: true }));
  const before = buildBudget(s); s.settled.length = 0;
  const r = await s.text(s.owner, offer.cmd);
  buildDebit(s, r, "REPURPOSE", { energy: 4, compute: 2, storage: 2, influence: 1 }, before, ["ENTITY_UPDATE"]);
  expect(s.settled[0].payload).toEqual(expect.objectContaining({ entity_id: id, operation: "REPURPOSE",
    set: expect.objectContaining({ infra_type: "storage_bay", label: "storage-bay" }) }));
  expect(s.w.rooms["room.hub"].entities.filter((e) => e.entity_id === id)).toEqual([
    expect.objectContaining({ entity_id: id, infra_type: "storage_bay", owner_id: s.owner.player_id })]);
  const unchanged = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, line), unchanged, "NOT_FOUND");
});

buildDiscoveryCase("P08 advertised DISMANTLE removes the ready asset, salvages and leaves a nonrestorable scar", async () => {
  const s = await buildLifecycleRig("generator"), id = s.asset().entity_id;
  s.fund(s.owner, 6);
  const offer = await buildOffer(s, "DISMANTLE", id);
  const { line } = await buildTopicLine(s, "dismantle", { thing: s.asset().label });
  expect(offer).toEqual(expect.objectContaining({ cmd: line, target_id: id, available: true }));
  const before = buildBudget(s); s.settled.length = 0;
  const r = await s.text(s.owner, offer.cmd);
  buildDebit(s, r, "DISMANTLE", { energy: 4, compute: 2, storage: 2 }, before,
    ["ENTITY_DESTROY", "ENTITY_CREATE"]);
  expect(r.events?.[0]?.payload).toEqual(expect.objectContaining({ salvage_storage: 2, salvage_overflow: 0 }));
  expect(s.settled[0].payload).toEqual(expect.objectContaining({ entity_id: id, reason: "DISMANTLED", class: "generator" }));
  expect(s.w.rooms["room.hub"].entities.some((e) => e.entity_id === id)).toBe(false);
  const scar = s.w.rooms["room.hub"].entities.find((e) => e.scar);
  expect(scar).toEqual(expect.objectContaining({ entity_type: "RUIN", condition: 0, scar: true }));
  expect(s.settled[1].payload).toEqual(expect.objectContaining({ entity_id: scar?.entity_id, properties: { scar: true } }));
  const unchanged = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, `restore ${scar?.label}`), unchanged, "FORBIDDEN");
});

buildDiscoveryCase("P08 RESTORE follows eligible unclaimed/no-scar offer and retains ID with capped condition", async () => {
  const s = await buildLifecycleRig();
  // Controlled pre-existing abandonment; not evidence of scheduler abandonment.
  const relic = enrichEntity({ entity_id: "entity.workshop.abandoned", label: "abandoned-workshop",
    entity_type: "INFRASTRUCTURE", infra_type: "workshop", owner_id: s.owner.player_id,
    unclaimed: true, condition: 80 });
  s.w.rooms["room.hub"].entities.push(relic);
  s.fund(s.owner, 6);
  const offer = await buildOffer(s, "RESTORE", relic.entity_id);
  const { line } = await buildTopicLine(s, "restore", { thing: relic.label });
  expect(offer).toEqual(expect.objectContaining({ cmd: line, target_id: relic.entity_id, available: true }));
  const before = buildBudget(s); s.settled.length = 0;
  const r = await s.text(s.owner, offer.cmd);
  buildDebit(s, r, "RESTORE", { energy: 6, compute: 3, storage: 5 }, before, ["ENTITY_UPDATE"]);
  expect(s.settled[0].payload).toEqual(expect.objectContaining({ entity_id: relic.entity_id, operation: "RESTORE",
    set: expect.objectContaining({ unclaimed: false, condition: 50 }) }));
  expect(s.w.rooms["room.hub"].entities.filter((e) => e.entity_id === relic.entity_id)).toEqual([
    expect.objectContaining({ owner_id: s.owner.player_id, condition: 50, unclaimed: undefined, infra_type: "workshop" })]);
  const unchanged = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, line), unchanged, "FORBIDDEN");
});

buildDiscoveryCase.each(["dismantle", "upgrade", "repurpose"] as const)("P08 %s rejects a nonsteward while the owner succeeds", async (verb) => {
  const s = await buildLifecycleRig("workshop"), asset = s.asset();
  await s.enterOutsider(); s.fund(s.owner, 6);
  const line = (await buildTopicLine(s, verb, { thing: asset.label })).line;
  const ownerOffer = await buildOffer(s, verb.toUpperCase(), asset.entity_id);
  expect(ownerOffer).toEqual(expect.objectContaining({ cmd: line, target_id: asset.entity_id, available: true }));
  const outsider = await s.send(s.outsider, "OBSERVE");
  expect(outsider.observation?.affordances?.some((x) => x.operation === verb.toUpperCase() && x.target_id === asset.entity_id)).toBe(false);
  const before = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.outsider, line), before, "NOT_OWNER");
  s.settled.length = 0;
  expect((await s.text(s.owner, line)).ok).toBe(true);
  expect(s.settled.length).toBeGreaterThan(0);
});

buildDiscoveryCase("P08 RESTORE rejects another owner and does not advertise it to them", async () => {
  const s = await buildLifecycleRig(); await s.enterOutsider();
  const relic = enrichEntity({ entity_id: "entity.workshop.unclaimed", label: "unclaimed-workshop",
    entity_type: "INFRASTRUCTURE", infra_type: "workshop", owner_id: s.owner.player_id,
    unclaimed: true, condition: 20 });
  s.w.rooms["room.hub"].entities.push(relic);
  const offer = await buildOffer(s, "RESTORE", relic.entity_id);
  const seen = await s.send(s.outsider, "OBSERVE");
  expect(seen.observation?.affordances?.some((x) => x.operation === "RESTORE" && x.target_id === relic.entity_id)).toBe(false);
  const before = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.outsider, offer.cmd), before, "NOT_OWNER");
  s.settled.length = 0;
  expect((await s.text(s.owner, offer.cmd)).ok).toBe(true);
  expect(s.settled).toHaveLength(1);
});

buildDiscoveryCase("P08 CONSTRUCT refuses empty hold without effect", async () => {
  for (const storage of [STORAGE_CAPACITY, STORAGE_CAPACITY - 1]) {
    const s = await buildLifecycleRig();
    s.w.players[s.owner.player_id].budgets.storage = storage;
    const offer = (await s.send(s.owner, "OBSERVE")).observation?.affordances?.find((x) => x.operation === "CONSTRUCT" && x.class === "relay");
    expect(offer).toEqual(expect.objectContaining({ cmd: "construct relay", available: false }));
    const before = buildProjection(s.w); s.settled.length = 0;
    buildRefusal(s, await s.text(s.owner, offer!.cmd), before, "BUDGET_EXCEEDED");
  }
});

buildDiscoveryCase("P08 zero free storage means full cargo, not empty materials", async () => {
  const s = await buildLifecycleRig();
  s.w.players[s.owner.player_id].budgets.storage = 0;
  const offered = (await s.send(s.owner, "OBSERVE")).observation?.affordances?.find((x) => x.operation === "CONSTRUCT" && x.class === "relay");
  expect(offered).toEqual(expect.objectContaining({ available: true, cmd: "construct relay" }));
  s.settled.length = 0;
  expect((await s.text(s.owner, offered!.cmd)).ok).toBe(true);
  expect(s.settled.map((e) => e.event_type)).toEqual(["ENTITY_CREATE"]);
  expect(s.w.players[s.owner.player_id].budgets.storage).toBe(4);
});

buildDiscoveryCase.each(["upgrade", "repurpose"] as const)("P08 %s rejects in-progress workshop and cargo shortfall", async (verb) => {
  const s = await buildLifecycleRig();
  const built = await s.send(s.owner, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
  expect(built.ok).toBe(true);
  const asset = s.w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
  expect(asset.in_progress).toBe(true);
  const line = (await buildTopicLine(s, verb, { thing: asset.label })).line;
  const seen = await s.send(s.owner, "OBSERVE");
  expect(seen.observation?.affordances?.some((x) => x.operation === verb.toUpperCase() && x.target_id === asset.entity_id)).toBe(false);
  const pending = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, line), pending, "FORBIDDEN");
  expect((await s.send(s.owner, "WAIT")).ok).toBe(true);
  expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === asset.entity_id)?.in_progress).not.toBe(true);
  s.w.players[s.owner.player_id].budgets.storage = STORAGE_CAPACITY;
  const unavailable = await buildOffer(s, verb.toUpperCase(), asset.entity_id);
  expect(unavailable.available).toBe(false);
  const noCargo = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, unavailable.cmd), noCargo, "BUDGET_EXCEEDED");
});

buildDiscoveryCase("P08 RESTORE excludes scar/ruin and refuses hidden room and cargo-short valid relic", async () => {
  const s = await buildLifecycleRig();
  const relic = enrichEntity({ entity_id: "entity.workshop.relic", label: "relic-workshop",
    entity_type: "INFRASTRUCTURE", infra_type: "workshop", owner_id: s.owner.player_id,
    unclaimed: true, condition: 20 });
  const ruin = enrichEntity({ entity_id: "entity.scar.relic", label: "scarred-workshop",
    entity_type: "RUIN", scar: true, condition: 0 });
  s.w.rooms["room.hub"].entities.push(relic, ruin);
  s.w.players[s.owner.player_id].budgets.storage = STORAGE_CAPACITY;
  const offered = await buildOffer(s, "RESTORE", relic.entity_id);
  expect(offered.available).toBe(false);
  const observed = await s.send(s.owner, "OBSERVE");
  expect(observed.observation?.affordances?.some((x) => x.operation === "RESTORE" && x.target_id === ruin.entity_id)).toBe(false);
  const before = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, offered.cmd), before, "BUDGET_EXCEEDED");
  const scarState = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, `restore ${ruin.label}`), scarState, "FORBIDDEN");
  // Controlled hidden-room placement tests read-time executor, not MOVE authority.
  s.w.rooms["room.hub"].entities = s.w.rooms["room.hub"].entities.filter((e) => e.entity_id !== relic.entity_id);
  s.w.rooms["room.hidden"].entities.push(relic);
  s.w.players[s.owner.player_id].room_id = "room.hidden";
  const hidden = await s.send(s.owner, "OBSERVE");
  expect(hidden.observation?.affordances?.some((x) => x.operation === "RESTORE" || x.operation === "CONSTRUCT")).toBe(false);
  const hiddenBefore = buildProjection(s.w); s.settled.length = 0;
  buildRefusal(s, await s.text(s.owner, offered.cmd), hiddenBefore, "NOT_OBSERVABLE");
});

buildDiscoveryCase.each(
  (["construct", "dismantle", "upgrade", "repurpose", "restore"] as const)
    .flatMap((verb) => (["flag", "tag"] as const).map((hiddenBy) => ({ verb, hiddenBy }))),
)(
  "P08 $verb refuses without effects in a hidden room ($hiddenBy)", async ({ verb, hiddenBy }) => {
    const s = await buildLifecycleRig("workshop");
    const asset = s.asset();
    // Controlled relocation is only a hidden-location refusal fixture, not a MOVE claim.
    s.w.rooms["room.hub"].entities = [];
    s.w.rooms["room.hidden"].entities.push(asset);
    s.w.rooms["room.hidden"].hidden = hiddenBy === "flag";
    s.w.rooms["room.hidden"].tags = hiddenBy === "tag" ? ["hidden"] : [];
    s.w.players[s.owner.player_id].room_id = "room.hidden";
    const line = verb === "construct" ? "construct generator" : `${verb} ${asset.label}`;
    const observed = await s.send(s.owner, "OBSERVE");
    expect(observed.observation?.affordances?.some((x) => x.operation === verb.toUpperCase())).toBe(false);
    const before = buildProjection(s.w); s.settled.length = 0;
    buildRefusal(s, await s.text(s.owner, line), before, "NOT_OBSERVABLE");
  },
);
