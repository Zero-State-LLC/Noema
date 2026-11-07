import { expect, it as discoveryCase } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { cloneBudgets, DEFAULT_BUDGETS, helpText } from "../src/actions";
import { ACCESS_POLICY_COST } from "../src/access-policy";
import { AGREEMENT_FORM_COST, AGREEMENT_TERMINATE_COST } from "../src/diplomacy";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
function discoveryPrincipal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", authentication_context: "test", protocol_version: "1",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] };
}
function discoveryWorld(): WorldRuntime {
  return { world_id: "test.hosted-canonical.discovery-agreement-access", world_name: "Discovery Reach", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [
        { direction: "east", to_room_id: "room.quay" }, { direction: "down", to_room_id: "room.vault", hidden: true }] },
      "room.quay": { room_id: "room.quay", name: "Quay", description: "Public.", entities: [], exits: [{ direction: "west", to_room_id: "room.hub" }] },
      "room.vault": { room_id: "room.vault", name: "Vault", description: "Hidden.", hidden: true, tags: ["hidden"], entities: [], exits: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, agreements: {}, access_restrictions: [], seen_idempotency: {}, unsettled: [] };
}
type Rig = { w: WorldRuntime; a: PlayerPrincipal; b: PlayerPrincipal; c: PlayerPrincipal; settled: Array<{ event_type: string; payload: Record<string, unknown> }>;
  send: (p: PlayerPrincipal, command: string, args?: Record<string, unknown>) => Promise<Result>;
  text: (p: PlayerPrincipal, line: string) => Promise<Result>;
  topic: (p: PlayerPrincipal, name: string) => Promise<string> };
async function discoveryRig(): Promise<Rig> {
  const w = discoveryWorld(), a = discoveryPrincipal("nacre"), b = discoveryPrincipal("sable"), c = discoveryPrincipal("cinder");
  const settled: Rig["settled"] = []; let key = 0;
  const send: Rig["send"] = (p, command, args = {}) => {
    const id = `discovery-${++key}`;
    const envelope: CommandEnvelope = { request_id: id, idempotency_key: id, command, arguments: args };
    return applyWorldCommand(w, p, envelope, async (e) => { settled.push(e as Rig["settled"][number]); return true; }, { admission: "developer" });
  };
  for (const p of [a, b, c]) { expect((await send(p, "ENTER_WORLD")).ok).toBe(true); w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS); }
  const text = (p: PlayerPrincipal, line: string) => send(p, "LOOK", { line });
  const topic = async (p: PlayerPrincipal, name: string) => {
    const r = await text(p, `help ${name}`); expect(r.ok).toBe(true);
    const result = String(r.observation?.consequence || ""); expect(result).toBe(helpText(name)); return result;
  };
  return { w, a, b, c, settled, send, text, topic };
}
function template(text: string, prefix: string): string {
  const row = text.split("\n").map((line) => line.trim()).find((line) => line.startsWith(prefix));
  expect(row).toBeDefined(); return row!.split(/\s{2,}/)[0];
}
function fillTemplate(text: string, fields: Record<string, string>): string {
  for (const [field, value] of Object.entries(fields)) text = text.replaceAll(`<${field}>`, value);
  expect(text).not.toMatch(/<[^>]+>/); return text;
}
function discoveryProjection(s: Rig) {
  // Exclude replay/activity/pending and discovery caches, retain action-sensitive canonical state.
  return structuredClone({ sequence: s.w.sequence, agreements: s.w.agreements, restrictions: s.w.access_restrictions,
    organizations: s.w.organizations, unsettled: s.w.unsettled,
    players: Object.fromEntries(Object.entries(s.w.players).map(([id, p]) => [id, { room_id: p.room_id, budgets: p.budgets }])) });
}
async function refusal(s: Rig, p: PlayerPrincipal, line: string, code: string) {
  const before = discoveryProjection(s), count = s.settled.length;
  const r = await s.text(p, line);
  expect(r.ok).toBe(false); expect(r.error?.code).toBe(code); expect(r.events || []).toEqual([]);
  expect(s.settled).toHaveLength(count); expect(discoveryProjection(s)).toEqual(before);
}
async function accessSeat(s: Rig): Promise<string> {
  expect((await s.send(s.a, "ORG_CREATE", { name: "Line", charter: "Keep" })).ok).toBe(true);
  const org = Object.keys(s.w.organizations)[0]; expect(org).toBeTruthy();
  s.w.players[s.a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await s.send(s.a, "ORG_OFFICE_CREATE", { org_id: org, display_name: "Gate", authority_profile: "GRANT_ACCESS" })).ok).toBe(true);
  const office = Object.values(s.w.organizations[org].offices || {})[0]; expect(office).toBeDefined();
  expect((await s.send(s.a, "ORG_OFFICE_ASSIGN", { office_id: office.office_id, agent_id: s.a.player_id })).ok).toBe(true);
  return org;
}

discoveryCase("P06 agreement catalog: all five rendered type alternatives offer and activate the intended pair", async () => {
  for (const [display, canonical] of [
    ["trade", "TRADE"], ["non_aggression", "NON_AGGRESSION"], ["access", "ACCESS"],
    ["commitment", "RESOURCE_COMMITMENT"], ["defense", "MUTUAL_DEFENSE"],
  ]) {
    const s = await discoveryRig(); const topic = await s.topic(s.a, "agreement");
    expect(topic).toContain(display);
    const affordance = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
      x.operation === "AGREEMENT_FORM" && x.agreement_type === canonical && x.party_ids?.[0] === s.b.player_id);
    expect(affordance?.available).toBe(true);
    expect(affordance?.cmd).toBe(fillTemplate(template(topic, "form agreement "), { type: display, player: "sable" }));
    const before = { ...s.w.players[s.a.player_id].budgets }; s.settled.length = 0;
    const offered = await s.text(s.a, affordance!.cmd); expect(offered.ok).toBe(true);
    const id = Object.keys(s.w.agreements || {})[0]; expect(id).toBeTruthy();
    expect(s.w.agreements?.[id]).toEqual(expect.objectContaining({ agreement_type: canonical, status: "OFFERED", offered_by: s.a.player_id,
      party_ids: [s.a.player_id, s.b.player_id].sort() }));
    expect(s.w.players[s.a.player_id].budgets.compute).toBe(before.compute - AGREEMENT_FORM_COST.compute);
    expect(s.w.players[s.a.player_id].budgets.influence).toBe(before.influence - AGREEMENT_FORM_COST.influence);
    expect(s.settled).toEqual([]); // An offer is retained, but not yet a formed agreement event.
    const acceptingBefore = structuredClone(s.w.players[s.b.player_id].budgets);
    const acceptingOffer = (await s.send(s.b, "OBSERVE")).observation?.affordances?.find((x) =>
      x.operation === "AGREEMENT_FORM" && x.agreement_type === canonical && x.player_id === s.a.player_id);
    expect(acceptingOffer?.available).toBe(true);
    expect(acceptingOffer?.cmd).toBe(fillTemplate(template(await s.topic(s.b, "agreement"), "form agreement "),
      { type: display, player: "nacre" }));
    const accept = await s.text(s.b, acceptingOffer!.cmd);
    expect(accept.ok).toBe(true); expect(s.w.agreements?.[id].status).toBe("ACTIVE");
    expect(s.w.agreements?.[id].party_ids).toEqual([s.a.player_id, s.b.player_id].sort());
    expect(s.w.players[s.b.player_id].budgets).toEqual({ ...acceptingBefore,
      compute: acceptingBefore.compute - AGREEMENT_FORM_COST.compute,
      influence: acceptingBefore.influence - AGREEMENT_FORM_COST.influence });
    expect(s.settled).toEqual([expect.objectContaining({ event_type: "AGREEMENT_FORMED", payload: expect.objectContaining({
      agreement_id: id, agreement_type: canonical, cost_payer_id: s.b.player_id,
      party_ids: [s.a.player_id, s.b.player_id].sort(), cost_paid: { ...AGREEMENT_FORM_COST } }) })]);
  }
});

discoveryCase("P06 terminate rendered own OFFERED withdrawal and ACTIVE break; foreign missing ended and remote forms refuse", async () => {
  const s = await discoveryRig(), topic = await s.topic(s.a, "agreement");
  const form = fillTemplate(template(topic, "form agreement "), { type: "trade", player: s.b.player_id });
  expect((await s.text(s.a, form)).ok).toBe(true);
  const id = Object.keys(s.w.agreements || {})[0]; const term = fillTemplate(template(topic, "terminate agreement "), { id });
  const offeredHint = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) => x.operation === "AGREEMENT_TERMINATE" && x.agreement_id === id);
  expect(offeredHint?.cmd).toBe(term); expect(offeredHint?.agreement_reason).toBe("MUTUAL");
  await refusal(s, s.b, term, "FORBIDDEN"); await refusal(s, s.c, term, "FORBIDDEN");
  await refusal(s, s.a, term.replace(id, "agreement.missing"), "NOT_FOUND");
  const before = s.w.players[s.a.player_id].budgets.compute; const settledBefore = s.settled.length;
  expect((await s.text(s.a, term)).ok).toBe(true); expect(s.w.agreements?.[id]).toBeUndefined();
  expect(s.w.players[s.a.player_id].budgets.compute).toBe(before - AGREEMENT_TERMINATE_COST.compute);
  expect(s.settled).toHaveLength(settledBefore); // Withdrawal is not a breach event.
  expect((await s.text(s.a, form)).ok).toBe(true);
  const activeId = Object.keys(s.w.agreements || {})[0];
  expect((await s.text(s.b, fillTemplate(template(topic, "form agreement "), { type: "trade", player: s.a.player_id }))).ok).toBe(true);
  const activeTerm = fillTemplate(template(topic, "terminate agreement "), { id: activeId });
  const activeHint = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
    x.operation === "AGREEMENT_TERMINATE" && x.agreement_id === activeId);
  expect(activeHint?.available).toBe(true); expect(activeHint?.cmd).toBe(activeTerm);
  expect(activeHint?.agreement_reason).toBe("MUTUAL"); expect(activeHint?.party_ids).toEqual([s.a.player_id, s.b.player_id].sort());
  s.settled.length = 0; const activeBefore = s.w.players[s.a.player_id].budgets.compute;
  expect((await s.text(s.a, activeHint!.cmd)).ok).toBe(true); expect(s.w.agreements?.[activeId].status).toBe("BROKEN");
  expect(s.w.players[s.a.player_id].budgets.compute).toBe(activeBefore - AGREEMENT_TERMINATE_COST.compute);
  expect(s.settled).toEqual([expect.objectContaining({ event_type: "AGREEMENT_BROKEN", payload: expect.objectContaining({
    agreement_id: activeId, broken_by: s.a.player_id, reason: "MUTUAL" }) })]);
  await refusal(s, s.a, activeTerm, "FORBIDDEN");
  s.w.players[s.b.player_id].room_id = "room.quay";
  await refusal(s, s.a, form, "NOT_COLOCATED");
  s.w.players[s.a.player_id].room_id = "room.vault"; s.w.players[s.b.player_id].room_id = "room.vault";
  await refusal(s, s.a, form, "NOT_OBSERVABLE");
});

discoveryCase("P06 valid personal budget shortfall refuses FORM and both TERMINATE phases without effects; restored funds succeed", async () => {
  const formRig = await discoveryRig();
  const formOffer = (await formRig.send(formRig.a, "OBSERVE")).observation?.affordances?.find((x) =>
    x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE" && x.player_id === formRig.b.player_id);
  expect(formOffer?.available).toBe(true);
  const form = formOffer!.cmd;
  formRig.w.players[formRig.a.player_id].budgets.compute = AGREEMENT_FORM_COST.compute - 1;
  expect((await formRig.send(formRig.a, "OBSERVE")).observation?.affordances?.find((x) => x.cmd === form)?.available).toBe(false);
  await refusal(formRig, formRig.a, form, "BUDGET_EXCEEDED");
  formRig.w.players[formRig.a.player_id].budgets.compute = AGREEMENT_FORM_COST.compute;
  const paid = structuredClone(formRig.w.players[formRig.a.player_id].budgets);
  expect((await formRig.text(formRig.a, form)).ok).toBe(true);
  const id = Object.keys(formRig.w.agreements || {})[0]; expect(id).toBeTruthy();
  expect(formRig.w.players[formRig.a.player_id].budgets.compute).toBe(paid.compute - AGREEMENT_FORM_COST.compute);
  expect(formRig.w.agreements?.[id].party_ids).toEqual([formRig.a.player_id, formRig.b.player_id].sort());

  for (const status of ["OFFERED", "ACTIVE"] as const) {
    const s = await discoveryRig();
    expect((await s.text(s.a, form)).ok).toBe(true);
    const pactId = Object.keys(s.w.agreements || {})[0]; expect(pactId).toBeTruthy();
    if (status === "ACTIVE") {
      const accept = (await s.send(s.b, "OBSERVE")).observation?.affordances?.find((x) =>
        x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE" && x.player_id === s.a.player_id);
      expect(accept?.available).toBe(true);
      expect((await s.text(s.b, accept!.cmd)).ok).toBe(true);
    }
    expect(s.w.agreements?.[pactId].status).toBe(status);
    const offer = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
      x.operation === "AGREEMENT_TERMINATE" && x.agreement_id === pactId);
    expect(offer?.available).toBe(true); expect(offer?.agreement_reason).toBe("MUTUAL");
    s.w.players[s.a.player_id].budgets.compute = AGREEMENT_TERMINATE_COST.compute - 1;
    expect((await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) => x.cmd === offer!.cmd)?.available).toBe(false);
    await refusal(s, s.a, offer!.cmd, "BUDGET_EXCEEDED");
    s.w.players[s.a.player_id].budgets.compute = AGREEMENT_TERMINATE_COST.compute;
    const count = s.settled.length;
    expect((await s.text(s.a, offer!.cmd)).ok).toBe(true);
    expect(s.w.players[s.a.player_id].budgets.compute).toBe(0);
    if (status === "OFFERED") {
      expect(s.w.agreements?.[pactId]).toBeUndefined(); expect(s.settled).toHaveLength(count);
    } else {
      expect(s.w.agreements?.[pactId].status).toBe("BROKEN");
      expect(s.settled.slice(count)).toEqual([expect.objectContaining({ event_type: "AGREEMENT_BROKEN",
        payload: expect.objectContaining({ agreement_id: pactId }) })]);
    }
  }
});

discoveryCase("P06 ACCESS directional topic and observed variants retain only the intended exit, player and treasury debit", async () => {
  const s = await discoveryRig(), org = await accessSeat(s); const topic = await s.topic(s.a, "access");
  const treasury = s.w.organizations[org].treasury!;
  const directional = [
    ["access <dir> deny", "DENY", "*"], ["access <dir> clear", "CLEAR", "*"],
    ["access <dir> allow", "ALLOW_ONLY", s.b.player_id],
  ] as const;
  // Start with the rendered observation command, not a rebuilt synthetic line.
  treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
  const observed = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
    x.operation === "ACCESS_POLICY" && x.scope === "EXIT" && x.mode === "DENY" && x.direction === "east");
  expect(observed?.available).toBe(true); expect(observed?.acting_for).toBe(org);
  expect(observed?.cmd).toBe(fillTemplate(template(topic, "access <dir> deny"), { dir: "east", org }));
  const personal = structuredClone(s.w.players[s.a.player_id].budgets); s.settled.length = 0;
  const first = await s.text(s.a, observed!.cmd); expect(first.ok).toBe(true);
  expect(s.w.access_restrictions).toEqual([expect.objectContaining({ scope: "EXIT", room_id: "room.hub", exit_id: "east", mode: "DENY", applies_to: "*" })]);
  expect(treasury.compute).toBe(0); expect(treasury.influence).toBe(0);
  expect(s.w.players[s.a.player_id].budgets).toEqual(personal);
  expect(s.settled).toEqual([expect.objectContaining({ event_type: "ACCESS_RESTRICTED", payload: expect.objectContaining({ authorized_by: org, scope: "EXIT", mode: "DENY", exit_id: "east" }) })]);
  await refusal(s, s.a, fillTemplate(template(topic, "access <dir> clear"), { dir: "east", org }), "BUDGET_EXCEEDED");
  for (const [prefix, mode, applies] of directional) {
    if (mode === "DENY") continue; // Already followed from observation; topic form is identical.
    treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
    const line = fillTemplate(template(topic, prefix), { dir: "east", org, player: s.b.player_id });
    const current = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
      x.operation === "ACCESS_POLICY" && x.scope === "EXIT" && x.mode === mode && x.direction === "east" && x.applies_to === applies);
    expect(current?.available).toBe(true); expect(current?.acting_for).toBe(org);
    expect(current?.cmd).toBe(line);
    s.settled.length = 0; const result = await s.text(s.a, current!.cmd); expect(result.ok).toBe(true);
    expect(s.settled).toEqual([expect.objectContaining({ event_type: "ACCESS_RESTRICTED", payload: expect.objectContaining({
      authorized_by: org, scope: "EXIT", mode, exit_id: "east", applies_to: applies }) })]);
    expect(s.w.players[s.a.player_id].budgets).toEqual(personal); expect(treasury.compute).toBe(0); expect(treasury.influence).toBe(0);
    if (mode === "CLEAR") expect(s.w.access_restrictions).toEqual([]);
    else expect(s.w.access_restrictions).toEqual([expect.objectContaining({ scope: "EXIT", exit_id: "east", mode, applies_to: s.b.player_id })]);
  }
  // A directional rule must not silently create a ROOM rule or restrict the west exit.
  expect(s.w.access_restrictions?.every((r) => r.scope === "EXIT" && r.exit_id === "east")).toBe(true);
});

discoveryCase("P06 ACCESS distinct room templates, office and target refusal; hidden exit and no-funds leave no effect", async () => {
  const s = await discoveryRig(), org = await accessSeat(s), text = await s.topic(s.a, "access");
  const treasury = s.w.organizations[org].treasury!;
  // Room ALLOW_ONLY has a topic template but no contextual producer branch (actions.ts:4013-4033).
  // Follow the current DENY and CLEAR offers; retain the separate room ALLOW_ONLY topic check.
  const roomDeny = fillTemplate(template(text, "access here deny|clear" ).replace("deny|clear", "deny"), { org });
  const roomAllow = fillTemplate(template(text, "access here allow"), { org, player: s.b.player_id });
  treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
  const personal = structuredClone(s.w.players[s.a.player_id].budgets);
  const denyOffer = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
    x.operation === "ACCESS_POLICY" && x.scope === "ROOM" && x.mode === "DENY" && x.applies_to === "*");
  expect(denyOffer?.available).toBe(true); expect(denyOffer?.acting_for).toBe(org); expect(denyOffer?.cmd).toBe(roomDeny);
  const denyCount = s.settled.length;
  expect((await s.text(s.a, denyOffer!.cmd)).ok).toBe(true);
  expect(s.w.access_restrictions).toEqual([expect.objectContaining({ scope: "ROOM", room_id: "room.hub", mode: "DENY", applies_to: "*" })]);
  expect(s.settled.slice(denyCount)).toEqual([expect.objectContaining({ event_type: "ACCESS_RESTRICTED",
    payload: expect.objectContaining({ authorized_by: org, scope: "ROOM", mode: "DENY", room_id: "room.hub", applies_to: "*" }) })]);
  expect(treasury.compute).toBe(0); expect(treasury.influence).toBe(0);
  expect(s.w.players[s.a.player_id].budgets).toEqual(personal);
  treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
  const roomClear = fillTemplate(template(text, "access here deny|clear").replace("deny|clear", "clear"), { org });
  const clearOffer = (await s.send(s.a, "OBSERVE")).observation?.affordances?.find((x) =>
    x.operation === "ACCESS_POLICY" && x.scope === "ROOM" && x.mode === "CLEAR" && x.applies_to === "*");
  expect(clearOffer?.available).toBe(true); expect(clearOffer?.acting_for).toBe(org); expect(clearOffer?.cmd).toBe(roomClear);
  const clearCount = s.settled.length;
  expect((await s.text(s.a, clearOffer!.cmd)).ok).toBe(true);
  expect(s.w.access_restrictions).toEqual([]);
  expect(s.settled.slice(clearCount)).toEqual([expect.objectContaining({ event_type: "ACCESS_RESTRICTED",
    payload: expect.objectContaining({ authorized_by: org, scope: "ROOM", mode: "CLEAR", room_id: "room.hub" }) })]);
  expect(treasury.compute).toBe(0); expect(treasury.influence).toBe(0);
  expect(s.w.players[s.a.player_id].budgets).toEqual(personal);
  treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
  const allowCount = s.settled.length;
  expect((await s.text(s.a, roomAllow)).ok).toBe(true);
  expect(s.w.access_restrictions).toEqual(expect.arrayContaining([expect.objectContaining({ scope: "ROOM", mode: "ALLOW_ONLY", applies_to: s.b.player_id })]));
  expect(s.settled.slice(allowCount)).toEqual([expect.objectContaining({ event_type: "ACCESS_RESTRICTED",
    payload: expect.objectContaining({ authorized_by: org, scope: "ROOM", mode: "ALLOW_ONLY", applies_to: s.b.player_id }) })]);
  expect(treasury.compute).toBe(0); expect(treasury.influence).toBe(0);
  expect(s.w.players[s.a.player_id].budgets).toEqual(personal);
  expect(s.w.access_restrictions?.some((r) => r.scope === "EXIT")).toBe(false);
  await refusal(s, s.b, roomDeny, "FORBIDDEN");
  treasury.compute = 0; treasury.influence = ACCESS_POLICY_COST.influence;
  await refusal(s, s.a, roomDeny, "BUDGET_EXCEEDED");
  treasury.compute = ACCESS_POLICY_COST.compute; treasury.influence = ACCESS_POLICY_COST.influence;
  await refusal(s, s.a, `access down deny for ${org}`, "NOT_FOUND");
  await refusal(s, s.a, `access east allow for ${org} applies_to=*`, "INVALID_REQUEST");
  await refusal(s, s.a, `access east allow for ${org} applies_to=player.missing`, "NOT_FOUND");
});

discoveryCase("P06 ACCESS occupied office is required; vacancy and hidden room refuse without a treasury charge", async () => {
  const s = await discoveryRig(), org = await accessSeat(s), topic = await s.topic(s.a, "access");
  const line = fillTemplate(template(topic, "access <dir> deny"), { dir: "east", org });
  const office = Object.values(s.w.organizations[org].offices || {})[0];
  const purse = s.w.organizations[org].treasury!;
  purse.compute = ACCESS_POLICY_COST.compute; purse.influence = ACCESS_POLICY_COST.influence;
  expect((await s.send(s.a, "OBSERVE")).observation?.affordances?.some((x) =>
    x.operation === "ACCESS_POLICY" && x.cmd === line && x.available)).toBe(true);
  office.status = "VACANT"; office.holder_player_id = undefined;
  expect((await s.send(s.a, "OBSERVE")).observation?.affordances?.some((x) => x.operation === "ACCESS_POLICY")).toBe(false);
  await refusal(s, s.a, line, "FORBIDDEN");
  office.status = "OCCUPIED"; office.holder_player_id = s.a.player_id;
  s.w.players[s.a.player_id].room_id = "room.vault";
  await refusal(s, s.a, line, "NOT_OBSERVABLE");
  expect(purse.compute).toBe(ACCESS_POLICY_COST.compute);
  expect(purse.influence).toBe(ACCESS_POLICY_COST.influence);
  s.w.players[s.a.player_id].room_id = "room.hub";
  const good = await s.text(s.a, line);
  expect(good.ok).toBe(true);
  expect(s.w.access_restrictions).toEqual([expect.objectContaining({ room_id: "room.hub", exit_id: "east", scope: "EXIT" })]);
});
