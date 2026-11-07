import { expect, it as successionEmergencyCase } from "vitest";
import { cloneBudgets, COSTS, DEFAULT_BUDGETS, enrichEntity, helpText } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyPractice, ENGINEER_TRACK } from "../src/practice";
import { emptyTreasury } from "../src/offices";
import { EMERGENCY_DURATION } from "../src/emergency";
import type { ObservationAffordance, PlayerPrincipal } from "../src/types";

type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
const person = (name: string): PlayerPrincipal => ({
  player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
  controller_id: `ctrl.${name}`, controller_type: "agent", authentication_context: "test",
  protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
});
async function successionEmergencyScene() {
  const w: WorldRuntime = {
    world_id: "test.hosted-canonical.p05", world_name: "P05", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: { "room.hub": { room_id: "room.hub", name: "Hub",
      description: "Public.", exits: [], entities: [enrichEntity({ entity_id: "entity.relay",
        label: "scarred-conduit", entity_type: "INFRASTRUCTURE", condition: 10 })] } },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const founder = person("founder"), officer = person("officer"), member = person("member"),
    candidate = person("candidate"), outsider = person("outsider");
  const settled: Settled[] = []; let n = 0;
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false) => {
    const id = `p05.${++n}`;
    return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
      async (ev) => { settled.push(ev); return true; }, { admission: developer ? "developer" : "hosted" });
  };
  const text = (p: PlayerPrincipal, line: string) => send(p, "LOOK", { line }, true);
  const affordance = async (p: PlayerPrincipal, operation: string, predicate: (a: ObservationAffordance) => boolean = () => true) => {
    const read = await send(p, "OBSERVE"); expect(read.ok).toBe(true);
    const rows = (read.observation?.affordances || []).filter((a) => a.operation === operation && predicate(a));
    expect(rows).toHaveLength(1); return rows[0];
  };
  for (const p of [founder, officer, member, candidate, outsider]) {
    expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), attention: 30, compute: 30, influence: 30, energy: 30 };
    expect((await send(p, "OBSERVE")).ok).toBe(true);
  }
  expect((await text(founder, 'form Nacre Compact charter="local coordination"')).ok).toBe(true);
  const orgId = Object.keys(w.organizations)[0]; expect(orgId).toMatch(/^org\.nacre-compact\./);
  for (const [p, role] of [[officer, "officer"], [member, "member"], [candidate, "member"]] as const) {
    expect((await text(founder, `invite ${p.player_id} to ${orgId} role=${role}`)).ok).toBe(true);
  }
  const org = () => w.organizations[orgId];
  settled.length = 0;
  return { w, founder, officer, member, candidate, outsider, settled, send, text, affordance, orgId, org };
}
type Scene = Awaited<ReturnType<typeof successionEmergencyScene>>;
function projection(s: Scene) {
  // Excludes replay/activity timestamps, pending choices and observation caches only.
  return structuredClone({ cycle: s.w.cycle, sequence: s.w.sequence, organizations: s.w.organizations,
    rooms: s.w.rooms, trades: s.w.trades, messages: s.w.messages, unsettled: s.w.unsettled,
    players: Object.fromEntries(Object.entries(s.w.players).map(([id, p]) => [id,
      { entered: p.entered, room_id: p.room_id, budgets: p.budgets, discovery: p.discovery }])) });
}
function denied(s: Scene, r: Result, before: ReturnType<typeof projection>, code: string) {
  expect(r.ok, JSON.stringify(r.error)).toBe(false); expect(r.error?.code).toBe(code);
  expect(r.events || []).toEqual([]); expect(s.settled).toEqual([]); expect(projection(s)).toEqual(before);
}
async function refuse(s: Scene, p: PlayerPrincipal, line: string, code: string) {
  expect((await s.send(p, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0; const before = projection(s);
  denied(s, await s.text(p, line), before, code);
}
function paid(s: Scene, r: Result, p: PlayerPrincipal, before: number, eventType: string,
  eventPayload: Record<string, unknown>) {
  expect(r.ok, JSON.stringify(r.error)).toBe(true);
  expect(r.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", eventType]);
  expect(r.events?.[0].payload).toEqual(expect.objectContaining({ player_id: p.player_id, cost_paid: COSTS.ORG_OFFICE_ACT }));
  expect(s.w.players[p.player_id].budgets.compute).toBe(before - COSTS.ORG_OFFICE_ACT.compute!);
  expect(s.settled).toHaveLength(1);
  expect(s.settled[0]).toEqual(expect.objectContaining({ event_id: r.events?.[1].event_id,
    event_type: eventType, payload: expect.objectContaining(eventPayload) }));
}
async function follow(s: Scene, p: PlayerPrincipal, operation: string,
  predicate?: (a: ObservationAffordance) => boolean) {
  const a = await s.affordance(p, operation, predicate);
  expect(a.verb).toBe("COMMIT"); expect(a.available).toBe(true);
  s.settled.length = 0; const before = s.w.players[p.player_id].budgets.compute;
  return { a, r: await s.text(p, a.cmd!), before };
}
async function createSeat(s: Scene, profile = "PUBLISH_NOTICE", required = "") {
  const before = new Set(Object.keys(s.org().offices || {}));
  const r = await s.text(s.founder, `office create ${s.orgId} name="Seat" profile=${profile}${required ? ` requires=${required}` : ""}`);
  expect(r.ok, JSON.stringify(r.error)).toBe(true);
  const id = Object.keys(s.org().offices || {}).find((x) => !before.has(x))!; expect(id).toBeTruthy();
  return id;
}

successionEmergencyCase("P05 advertised member-order and designation bind office and candidate, not just structured metadata", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s);
  const rule = await follow(s, s.founder, "ORG_SUCCESSION_RULE", (a) => a.office_id === seat);
  expect(rule.a.cmd).toBe(`succession rule ${seat} member_order`);
  paid(s, rule.r, s.founder, rule.before, "ENTITY_UPDATE", { entity_id: seat,
    operation: "RULE", set: expect.objectContaining({ rule_id: "MEMBER_ORDER", designated_by: s.founder.player_id }) });
  expect(s.org().offices?.[seat].succession?.rule_id).toBe("MEMBER_ORDER");
  const designation = await follow(s, s.founder, "ORG_SUCCESSION_DESIGNATE", (a) => a.office_id === seat);
  expect(designation.a.cmd).toBe(`succession ${seat} officer`);
  paid(s, designation.r, s.founder, designation.before, "ENTITY_UPDATE", { entity_id: seat,
    set: expect.objectContaining({ successors: [s.officer.player_id], designated_by: s.founder.player_id }) });
  expect(s.org().offices?.[seat].succession?.successors).toEqual([s.officer.player_id]);
  await refuse(s, s.member, designation.a.cmd!, "FORBIDDEN");
  await refuse(s, s.founder, `succession ${seat} outsider`, "FORBIDDEN");
  s.w.players[s.founder.player_id].budgets.compute = 0;
  await refuse(s, s.founder, rule.a.cmd!, "BUDGET_EXCEEDED");
});

successionEmergencyCase("P05 vacant consent follows every eligible candidate's exact command; occupied and track-ineligible refuse", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s, "PUBLISH_NOTICE", "engineer");
  const practice = emptyPractice(); practice.recognition = { [ENGINEER_TRACK]: ["unit.one", "unit.two", "unit.three"] };
  s.w.players[s.officer.player_id].practice = structuredClone(practice);
  s.w.players[s.candidate.player_id].practice = structuredClone(practice);
  const read = await s.send(s.founder, "OBSERVE");
  const candidates = (read.observation?.affordances || []).filter((a) => a.operation === "ORG_SUCCESSION_CONSENT" && a.office_id === seat);
  expect(candidates.map((a) => a.player_id).sort()).toEqual([s.candidate.player_id, s.officer.player_id].sort());
  expect(candidates.every((a) => a.available)).toBe(true);
  for (const a of candidates) {
    const fresh = await successionEmergencyScene(); const otherSeat = await createSeat(fresh, "PUBLISH_NOTICE", "engineer");
    fresh.w.players[fresh.officer.player_id].practice = structuredClone(practice);
    fresh.w.players[fresh.candidate.player_id].practice = structuredClone(practice);
    const offer = await fresh.affordance(fresh.founder, "ORG_SUCCESSION_CONSENT", (x) => x.office_id === otherSeat && x.player_id === a.player_id);
    expect(offer.cmd).toBe(`consent ${otherSeat} ${a.player_id!.replace("player.", "")}`);
    fresh.settled.length = 0; const before = fresh.w.players[fresh.founder.player_id].budgets.compute;
    const r = await fresh.text(fresh.founder, offer.cmd!);
    paid(fresh, r, fresh.founder, before, "ENTITY_UPDATE", { entity_id: otherSeat,
      set: expect.objectContaining({ office_kind: "INSTITUTION_OFFICE" }) });
    expect(fresh.org().offices?.[otherSeat].consents).toEqual([{ member_id: fresh.founder.player_id, candidate_id: a.player_id }]);
    const second = await fresh.affordance(fresh.member, "ORG_SUCCESSION_CONSENT", (x) => x.office_id === otherSeat && x.player_id === a.player_id);
    fresh.settled.length = 0;
    const done = await fresh.text(fresh.member, second.cmd!);
    expect(done.ok, JSON.stringify(done.error)).toBe(true);
    expect(fresh.org().offices?.[otherSeat]).toEqual(expect.objectContaining({ status: "OCCUPIED", holder_player_id: a.player_id }));
    expect(fresh.settled).toHaveLength(1);
    expect(fresh.settled[0].payload).toEqual(expect.objectContaining({ entity_id: otherSeat,
      set: expect.objectContaining({ succession_to: a.player_id }) }));
    await refuse(fresh, fresh.founder, offer.cmd!, "FORBIDDEN");
  }
  await refuse(s, s.outsider, `consent ${seat} officer`, "FORBIDDEN");
  await refuse(s, s.founder, `consent ${seat} member`, "FORBIDDEN");
  await refuse(s, s.founder, `succession ${seat} member`, "FORBIDDEN");
});

successionEmergencyCase("P05 rendered org succession office and scope forms designate distinct retained targets", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s);
  const h = helpText("org");
  expect(h).toContain("succession <office> <player> [player2]");
  expect(h).toContain("succession scope <scope> <player> [player2]");
  s.settled.length = 0; let before = s.w.players[s.founder.player_id].budgets.compute;
  let r = await s.text(s.founder, `succession ${seat} officer candidate`);
  paid(s, r, s.founder, before, "ENTITY_UPDATE", { entity_id: seat,
    set: expect.objectContaining({ successors: [s.officer.player_id, s.candidate.player_id] }) });
  expect(s.org().offices?.[seat].succession?.successors).toEqual([s.officer.player_id, s.candidate.player_id]);
  s.w.rooms["room.hub"].entities[0].owner_id = s.founder.player_id;
  const activated = await follow(s, s.founder, "ORG_EMERGENCY_ACTIVATE", (a) => a.template_id === "emrule.repair");
  expect(activated.r.ok, JSON.stringify(activated.r.error)).toBe(true);
  const scope = s.org().emergency_scopes![0];
  s.settled.length = 0; before = s.w.players[s.founder.player_id].budgets.compute;
  r = await s.text(s.founder, `succession scope ${scope.scope_id} officer candidate`);
  paid(s, r, s.founder, before, "ENTITY_UPDATE", { entity_id: scope.scope_id,
    set: expect.objectContaining({ successors: [s.officer.player_id, s.candidate.player_id], office_kind: "EMERGENCY_SCOPE" }) });
  expect(scope.succession?.successors).toEqual([s.officer.player_id, s.candidate.player_id]);
  await refuse(s, s.member, `succession scope ${scope.scope_id} officer`, "FORBIDDEN");
  await refuse(s, s.founder, `succession scope ${scope.scope_id} outsider`, "FORBIDDEN");
});

successionEmergencyCase("P05 exact entity and treasury emergency commands retain source, target, payer and revoke", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s, "GRANT_ACCESS");
  expect((await s.text(s.founder, `office assign ${seat} officer`)).ok).toBe(true);
  s.w.rooms["room.hub"].entities[0].owner_id = s.officer.player_id;
  s.org().treasury = { ...emptyTreasury(), energy: 4, compute: 8, storage: 8 };
  const treasuryBefore = structuredClone(s.org().treasury);
  const repair = await follow(s, s.officer, "ORG_EMERGENCY_ACTIVATE", (a) => a.template_id === "emrule.repair");
  expect(repair.a.cmd).toBe(`emergency activate ${s.orgId} emrule.repair entity.relay`);
  const repairScope = s.org().emergency_scopes![0];
  paid(s, repair.r, s.officer, repair.before, "ENTITY_CREATE", { entity_id: repairScope.scope_id,
    owner_id: s.orgId, properties: expect.objectContaining({ target_ref: "entity.relay", capability: "REPAIR",
      holder_player_id: s.officer.player_id }) });
  expect(repairScope).toEqual(expect.objectContaining({ template_id: "emrule.repair", target_ref: "entity.relay",
    source_office_id: undefined, holder_player_id: s.officer.player_id, end_cycle: s.w.cycle + EMERGENCY_DURATION }));
  const trade = await follow(s, s.officer, "ORG_EMERGENCY_ACTIVATE", (a) => a.template_id === "emrule.trade");
  expect(trade.a.cmd).toBe(`emergency activate ${s.orgId} emrule.trade treasury`);
  const tradeScope = s.org().emergency_scopes![1];
  paid(s, trade.r, s.officer, trade.before, "ENTITY_CREATE", { entity_id: tradeScope.scope_id,
    owner_id: s.orgId, properties: expect.objectContaining({ target_ref: "treasury", capability: "TRADE" }) });
  expect(tradeScope).toEqual(expect.objectContaining({ template_id: "emrule.trade", target_ref: "treasury",
    source_office_id: undefined, holder_player_id: s.officer.player_id }));
  expect(s.org().treasury).toEqual(treasuryBefore);
  await refuse(s, s.member, `emergency revoke ${repairScope.scope_id}`, "FORBIDDEN");
  const revoke = await follow(s, s.officer, "ORG_EMERGENCY_REVOKE", (a) => a.emergency_scope_id === repairScope.scope_id);
  expect(revoke.a.cmd).toBe(`emergency revoke ${repairScope.scope_id}`);
  paid(s, revoke.r, s.officer, revoke.before, "ENTITY_UPDATE", { entity_id: repairScope.scope_id,
    set: expect.objectContaining({ emergency_status: "REVOKED" }) });
  expect(repairScope.status).toBe("REVOKED"); expect(tradeScope.status).toBe("ACTIVE");
  expect(s.org().treasury).toEqual(treasuryBefore);
});

successionEmergencyCase("P05 emergency requires live condition, office authority and personal compute; closed scopes cannot authorize", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s, "GRANT_ACCESS");
  expect((await s.text(s.founder, `office assign ${seat} officer`)).ok).toBe(true);
  s.w.rooms["room.hub"].entities[0].owner_id = s.officer.player_id;
  s.org().treasury = { ...emptyTreasury(), energy: 4, compute: 8, storage: 8 };
  const entity = `emergency activate ${s.orgId} emrule.repair entity.relay`;
  const treasury = `emergency activate ${s.orgId} emrule.trade treasury`;
  await refuse(s, s.member, entity, "FORBIDDEN");
  await refuse(s, s.outsider, treasury, "FORBIDDEN");
  await refuse(s, s.officer, `emergency activate ${s.orgId} emrule.repair entity.missing`, "NOT_FOUND");
  s.w.rooms["room.hub"].entities[0].condition = 90;
  await refuse(s, s.officer, entity, "FORBIDDEN");
  s.w.rooms["room.hub"].entities[0].condition = 10;
  s.org().treasury!.energy = 8;
  await refuse(s, s.officer, treasury, "FORBIDDEN");
  s.org().treasury!.energy = 4;
  s.w.players[s.officer.player_id].budgets.compute = 0;
  await refuse(s, s.officer, entity, "BUDGET_EXCEEDED");
  await refuse(s, s.officer, treasury, "BUDGET_EXCEEDED");
  s.w.players[s.officer.player_id].budgets.compute = 20;
  expect((await s.text(s.officer, entity)).ok).toBe(true);
  const scope = s.org().emergency_scopes![0];
  expect((await s.text(s.officer, `emergency revoke ${scope.scope_id}`)).ok).toBe(true);
  // This explicit scope is a structured-only operand; text REPAIR cannot carry it.
  expect((await s.send(s.officer, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0; const beforeClosedUse = projection(s);
  denied(s, await s.send(s.officer, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay",
    acting_for: s.orgId, emergency_scope_id: scope.scope_id }), beforeClosedUse, "FORBIDDEN");
  // The predeclared template remains reusable; a revoked scope does not remain usable.
  expect((await s.text(s.officer, entity)).ok).toBe(true);
  const next = s.org().emergency_scopes![1];
  expect(next.scope_id).not.toBe(scope.scope_id);
  // The officer's office-free emergency scope remains usable after the unrelated seat vacates.
  s.org().offices![seat].status = "VACANT"; s.org().offices![seat].holder_player_id = undefined;
  s.settled.length = 0;
  const officeFreeUse = await s.send(s.officer, "COMMIT", { operation: "REPAIR",
    entity_id: "entity.relay", acting_for: s.orgId, emergency_scope_id: next.scope_id });
  expect(officeFreeUse.ok, JSON.stringify(officeFreeUse.error)).toBe(true);
  expect(next.source_office_id).toBeUndefined();
  expect(s.settled.length).toBeGreaterThan(0);
  expect((await s.text(s.officer, `emergency revoke ${next.scope_id}`)).ok).toBe(true);
  await refuse(s, s.member, entity, "FORBIDDEN");
});

successionEmergencyCase("P05 member's occupied grant gates activation/revocation; treasury depletion, revoked and due-cycle expired scope effects", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s, "GRANT_ACCESS");
  expect((await s.text(s.founder, `office assign ${seat} member`)).ok).toBe(true);
  s.w.rooms["room.hub"].entities[0].owner_id = s.member.player_id;
  s.org().treasury = { ...emptyTreasury(), energy: 4, compute: 8, storage: 8 };
  const offer = await follow(s, s.member, "ORG_EMERGENCY_ACTIVATE", (a) => a.template_id === "emrule.repair");
  const scope = s.org().emergency_scopes![0];
  paid(s, offer.r, s.member, offer.before, "ENTITY_CREATE", { entity_id: scope.scope_id,
    properties: expect.objectContaining({ holder_player_id: s.member.player_id, target_ref: "entity.relay" }) });
  expect(scope.source_office_id).toBe(seat);
  // Current authority must be checked at execution, not inferred from the old grant.
  s.org().offices![seat].status = "VACANT"; s.org().offices![seat].holder_player_id = undefined;
  await refuse(s, s.member, `emergency revoke ${scope.scope_id}`, "FORBIDDEN");
  await refuse(s, s.member, offer.a.cmd!, "FORBIDDEN");
  // The bound source seat remains mandatory at use, even while the scope stays ACTIVE.
  expect((await s.send(s.member, "OBSERVE")).ok).toBe(true);
  const use = { operation: "REPAIR", entity_id: "entity.relay", acting_for: s.orgId,
    emergency_scope_id: scope.scope_id };
  s.settled.length = 0; const beforeVacantUse = projection(s);
  denied(s, await s.send(s.member, "COMMIT", use), beforeVacantUse, "FORBIDDEN");
  expect(scope).toEqual(expect.objectContaining({ status: "ACTIVE", source_office_id: seat,
    holder_player_id: s.member.player_id }));
  // Retired or missing bindings also fail closed without rewriting the scope.
  s.org().offices![seat].status = "RETIRED";
  s.settled.length = 0; const beforeRetiredUse = projection(s);
  denied(s, await s.send(s.member, "COMMIT", use), beforeRetiredUse, "FORBIDDEN");
  const retiredSeat = s.org().offices![seat]; delete s.org().offices![seat];
  s.settled.length = 0; const beforeMissingUse = projection(s);
  denied(s, await s.send(s.member, "COMMIT", use), beforeMissingUse, "FORBIDDEN");
  s.org().offices![seat] = retiredSeat;
  // Assigning the old source seat to someone else does not transfer this scope.
  s.org().offices![seat].status = "OCCUPIED"; s.org().offices![seat].holder_player_id = s.candidate.player_id;
  s.settled.length = 0; const beforeReassignedUse = projection(s);
  denied(s, await s.send(s.member, "COMMIT", use), beforeReassignedUse, "FORBIDDEN");
  s.org().offices![seat].holder_player_id = s.member.player_id;
  s.settled.length = 0;
  const beforeUse = s.org().treasury!.energy;
  const repaired = await s.send(s.member, "COMMIT", use);
  expect(repaired.ok, JSON.stringify(repaired.error)).toBe(true);
  expect(s.org().treasury!.energy).toBe(beforeUse - 3);
  expect(s.w.rooms["room.hub"].entities[0].condition).toBe(25);
  expect(s.settled.length).toBeGreaterThan(0);
  // A depleted institution cannot fund another use, even if the principal has energy.
  await refuse(s, s.member, `repair scarred-conduit for ${s.orgId}`, "BUDGET_EXCEEDED");
  expect((await s.text(s.member, `emergency revoke ${scope.scope_id}`)).ok).toBe(true);
  s.settled.length = 0; const beforeRevoked = projection(s);
  denied(s, await s.send(s.member, "COMMIT", use), beforeRevoked, "FORBIDDEN");
  // Fresh second scope, advanced by real WAITs rather than a direct cycle assignment.
  s.w.rooms["room.hub"].entities[0].condition = 10;
  expect((await s.text(s.member, offer.a.cmd!)).ok).toBe(true);
  const second = s.org().emergency_scopes![1];
  for (let i = 0; i < EMERGENCY_DURATION; i++) {
    for (const p of [s.founder, s.officer, s.member, s.candidate, s.outsider]) {
      s.w.players[p.player_id].wait_until_cycle = s.w.cycle + 1;
    }
    expect((await s.send(s.founder, "WAIT")).ok).toBe(true);
  }
  expect(s.w.cycle).toBe(second.end_cycle);
  expect(second.status).toBe("EXPIRED");
  s.settled.length = 0; const beforeExpired = projection(s);
  denied(s, await s.send(s.member, "COMMIT", { ...use, emergency_scope_id: second.scope_id }), beforeExpired, "FORBIDDEN");
});

successionEmergencyCase("P05 independent standing repair office remains valid when emergency source seat vacates", async () => {
  const s = await successionEmergencyScene(); const source = await createSeat(s, "GRANT_ACCESS");
  expect((await s.text(s.founder, `office assign ${source} member`)).ok).toBe(true);
  s.w.rooms["room.hub"].entities[0].owner_id = s.member.player_id;
  s.org().treasury = { ...emptyTreasury(), energy: 8, compute: 8, storage: 8 };
  expect((await s.text(s.member, `emergency activate ${s.orgId} emrule.repair entity.relay`)).ok).toBe(true);
  const scope = s.org().emergency_scopes![0]; expect(scope.source_office_id).toBe(source);
  s.org().offices![source].status = "VACANT"; s.org().offices![source].holder_player_id = undefined;
  const standing = await createSeat(s, "OPERATE_NAMED_ASSET");
  expect((await s.text(s.founder, `office assign ${standing} member`)).ok).toBe(true);
  s.settled.length = 0; const before = s.org().treasury!.energy;
  const r = await s.send(s.member, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay",
    acting_for: s.orgId, emergency_scope_id: scope.scope_id });
  expect(r.ok, JSON.stringify(r.error)).toBe(true);
  expect(s.org().treasury!.energy).toBe(before - 3);
  expect(s.settled.length).toBeGreaterThan(0);
  expect(scope).toEqual(expect.objectContaining({ status: "ACTIVE", source_office_id: source,
    spent: {} }));
});

successionEmergencyCase("P05 treasury emergency spend cap binds the actual trade reserve, not personal energy", async () => {
  const s = await successionEmergencyScene(); const seat = await createSeat(s, "GRANT_ACCESS");
  expect((await s.text(s.founder, `office assign ${seat} member`)).ok).toBe(true);
  s.org().treasury = { ...emptyTreasury(), energy: 4, compute: 8, storage: 8 };
  const activation = await follow(s, s.member, "ORG_EMERGENCY_ACTIVATE", (a) => a.template_id === "emrule.trade");
  expect(activation.r.ok).toBe(true);
  const scope = s.org().emergency_scopes![0];
  expect(scope.source_office_id).toBe(seat);
  const trade = (energy: number) => s.send(s.member, "TRADE", { phase: "propose",
    counterparty_id: s.candidate.player_id, offered: { energy }, requested: { storage: 1 },
    acting_for: s.orgId, emergency_scope_id: scope.scope_id });
  s.settled.length = 0; const ownEnergy = s.w.players[s.member.player_id].budgets.energy;
  const first = await trade(4);
  expect(first.ok, JSON.stringify(first.error)).toBe(true);
  expect(scope.spent?.energy).toBe(4);
  expect(s.org().treasury!.energy).toBe(0);
  expect(s.w.players[s.member.player_id].budgets.energy).toBe(ownEnergy);
  expect(Object.values(s.w.trades).filter((t) => t.acting_for === s.orgId)).toHaveLength(1);
  expect(s.settled.length).toBeGreaterThan(0);
  // Controlled funding makes the forbidden trade otherwise affordable.
  s.org().treasury!.energy = 8;
  // A vacant source seat cannot reserve treasury cargo or spend this still-ACTIVE scope.
  s.org().offices![seat].status = "VACANT"; s.org().offices![seat].holder_player_id = undefined;
  expect((await s.send(s.member, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0; const beforeVacantTrade = projection(s);
  denied(s, await trade(1), beforeVacantTrade, "FORBIDDEN");
  expect(scope).toEqual(expect.objectContaining({ status: "ACTIVE", source_office_id: seat,
    spent: { energy: 4 } }));
  s.org().offices![seat].status = "OCCUPIED"; s.org().offices![seat].holder_player_id = s.candidate.player_id;
  s.settled.length = 0; const beforeReassignedTrade = projection(s);
  denied(s, await trade(1), beforeReassignedTrade, "FORBIDDEN");
  s.org().offices![seat].holder_player_id = s.member.player_id;
  // Controlled treasury funding is fixture state, not an asserted funding verb.
  s.org().treasury!.energy = 8;
  expect((await s.send(s.member, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0; const beforeCap = projection(s);
  denied(s, await trade(7), beforeCap, "FORBIDDEN");
  const exact = await trade(6);
  expect(exact.ok, JSON.stringify(exact.error)).toBe(true);
  expect(scope.spent?.energy).toBe(10);
  expect(s.org().treasury!.energy).toBe(2);
  expect(Object.values(s.w.trades).filter((t) => t.acting_for === s.orgId)).toHaveLength(2);
  s.settled.length = 0; const exhausted = projection(s);
  denied(s, await trade(1), exhausted, "FORBIDDEN");
});
