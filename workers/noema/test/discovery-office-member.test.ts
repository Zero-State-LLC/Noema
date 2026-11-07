import { expect, it as officeDiscoveryCase } from "vitest";
import { cloneBudgets, COSTS, DEFAULT_BUDGETS } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyPractice, ENGINEER_TRACK } from "../src/practice";
import { resolveOfficeConflict } from "../src/offices";
import type { PlayerPrincipal } from "../src/types";

type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
const person = (name: string): PlayerPrincipal => ({
  player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
  controller_id: `ctrl.${name}`, controller_type: "agent", authentication_context: "test",
  protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
});

async function officeMemberScene() {
  const w: WorldRuntime = {
    world_id: "test.hosted-canonical.p04-office", world_name: "P04", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", entities: [], exits: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const founder = person("founder"), officer = person("officer"), member = person("member"),
    candidate = person("candidate"), outsider = person("outsider");
  const settled: Settled[] = []; let n = 0;
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false,
    fixedId?: string) => {
    const id = fixedId || `p04.${++n}`;
    return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
      async (ev) => { settled.push(ev); return true; }, { admission: developer ? "developer" : "hosted" });
  };
  const text = (p: PlayerPrincipal, line: string, fixedId?: string) => send(p, "LOOK", { line }, true, fixedId);
  const affordance = async (p: PlayerPrincipal, operation: string, target?: string, label?: string) => {
    const read = await send(p, "OBSERVE"); expect(read.ok).toBe(true);
    const rows = (read.observation?.affordances || []).filter((a) =>
      a.operation === operation && (target === undefined || a.target_id === target) &&
      (label === undefined || a.target_label === label));
    expect(rows).toHaveLength(1);
    return rows[0];
  };
  for (const p of [founder, officer, member, candidate, outsider]) {
    expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), attention: 30, compute: 30, influence: 30, energy: 30 };
    expect((await send(p, "OBSERVE")).ok).toBe(true);
  }
  expect(settled.length).toBeGreaterThan(0); settled.length = 0;
  // Formation uses the real executor, not hand-seeded membership, and budgets exceed its dynamic charge.
  expect((await text(founder, 'form Nacre Compact charter="local coordination"')).ok).toBe(true);
  const orgId = Object.keys(w.organizations)[0]; expect(orgId).toMatch(/^org\.nacre-compact\./);
  for (const [p, role] of [[officer, "officer"], [member, "member"], [candidate, "member"]] as const) {
    expect((await text(founder, `invite ${p.player_id} to ${orgId} role=${role}`)).ok).toBe(true);
  }
  settled.length = 0;
  const org = () => w.organizations[orgId];
  return { w, founder, officer, member, candidate, outsider, settled, send, text, affordance, orgId, org };
}
type Scene = Awaited<ReturnType<typeof officeMemberScene>>;
function canonical(s: Scene) {
  // Excludes replay cache, activity stamps, pending choices and observation caches.
  return structuredClone({ cycle: s.w.cycle, sequence: s.w.sequence, organizations: s.w.organizations,
    rooms: s.w.rooms, messages: s.w.messages, unsettled: s.w.unsettled,
    players: Object.fromEntries(Object.entries(s.w.players).map(([id, p]) => [id,
      { entered: p.entered, room_id: p.room_id, budgets: p.budgets, discovery: p.discovery }])) });
}
function refusal(s: Scene, r: Result, before: ReturnType<typeof canonical>, code: string) {
  expect(r.ok).toBe(false); expect(r.error?.code).toBe(code); expect(r.events || []).toEqual([]);
  expect(s.settled).toEqual([]); expect(canonical(s)).toEqual(before);
}
function paid(s: Scene, r: Result, p: PlayerPrincipal, cost: Partial<typeof DEFAULT_BUDGETS>,
  before: typeof DEFAULT_BUDGETS, event: string, payload: Record<string, unknown>) {
  expect(r.ok).toBe(true);
  expect(r.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", event]);
  expect(r.events?.[0].payload).toEqual(expect.objectContaining({ player_id: p.player_id, cost_paid: cost }));
  expect(s.settled).toHaveLength(1);
  expect(s.settled[0]).toEqual(expect.objectContaining({ event_type: event,
    event_id: r.events?.[1].event_id, payload: expect.objectContaining(payload) }));
  for (const [key, amount] of Object.entries(cost)) {
    expect(s.w.players[p.player_id].budgets[key as keyof typeof before]).toBe(before[key as keyof typeof before] - amount);
  }
}
async function published(s: Scene, p: PlayerPrincipal, operation: string, target?: string, label?: string) {
  const a = await s.affordance(p, operation, target, label);
  expect(a.verb).toBe("COMMIT"); expect(a.available).toBe(true); expect(a.cmd).toBeTruthy();
  s.settled.length = 0;
  const before = { ...s.w.players[p.player_id].budgets };
  const r = await s.text(p, a.cmd!);
  return { a, r, before };
}

officeDiscoveryCase("P04 advertised invite/leave bind org and nominated member, personal payer and replay", async () => {
  const s = await officeMemberScene();
  const invitation = await published(s, s.founder, "ORG_MEMBER_ADD", s.orgId);
  expect(invitation.a.cmd).toBe(`invite outsider to ${s.orgId} role=member`);
  paid(s, invitation.r, s.founder, COSTS.ORG_MEMBER_ADD, invitation.before, "ORG_MEMBER_ADD",
    { org_id: s.orgId, agent_id: s.outsider.player_id, role: "member", by: s.founder.player_id });
  expect(s.org().members.find((m) => m.agent_id === s.outsider.player_id)?.role).toBe("member");
  const orgTreasury = structuredClone(s.org().treasury);
  const leave = await published(s, s.outsider, "ORG_MEMBER_REMOVE", s.orgId);
  expect(leave.a.cmd).toBe(`leave ${s.orgId}`);
  paid(s, leave.r, s.outsider, COSTS.ORG_MEMBER_REMOVE, leave.before, "ORG_MEMBER_REMOVE",
    { org_id: s.orgId, agent_id: s.outsider.player_id, reason: "SELF_LEAVE" });
  expect(s.org().members.some((m) => m.agent_id === s.outsider.player_id)).toBe(false);
  expect(s.org().treasury).toEqual(orgTreasury);
  const prior = canonical(s); s.settled.length = 0;
  refusal(s, await s.text(s.outsider, leave.a.cmd!), prior, "NOT_FOUND");
  const fixed = `invite outsider to ${s.orgId} role=member`;
  const first = await s.text(s.founder, fixed, "p04.replay.invite");
  expect(first.ok).toBe(true);
  const after = canonical(s); s.settled.length = 0;
  const replay = await s.text(s.founder, fixed, "p04.replay.invite");
  expect(replay).toEqual(first); expect(s.settled).toEqual([]); expect(canonical(s)).toEqual(after);
});

officeDiscoveryCase("P04 advertised office create/assign/notice/resign/retire bind exact seat and office authority", async () => {
  const s = await officeMemberScene();
  const initial = new Set(Object.keys(s.org().offices || {}));
  const create = await published(s, s.founder, "ORG_OFFICE_CREATE", s.orgId);
  expect(create.a.cmd).toBe(`office create ${s.orgId} name="Notice" profile=PUBLISH_NOTICE`);
  // The published command created precisely one new seat (not a lookalike in another organization).
  expect(create.r.ok).toBe(true);
  const officeId = Object.keys(s.org().offices || {}).find((id) => !initial.has(id))!;
  expect(officeId).toBeTruthy();
  paid(s, create.r, s.founder, COSTS.ORG_OFFICE_CREATE, create.before, "ENTITY_CREATE",
    { entity_id: officeId, owner_id: s.orgId });
  expect(s.org().offices?.[officeId]).toEqual(expect.objectContaining({ authority_profile: "PUBLISH_NOTICE", status: "VACANT" }));
  const assign = await published(s, s.founder, "ORG_OFFICE_ASSIGN", officeId, "officer");
  expect(assign.a.cmd).toBe(`office assign ${officeId} officer`);
  paid(s, assign.r, s.founder, COSTS.ORG_OFFICE_ASSIGN, assign.before, "ENTITY_UPDATE",
    { entity_id: officeId, set: expect.objectContaining({ holder_player_id: s.officer.player_id, institution_id: s.orgId }) });
  expect(s.org().offices?.[officeId].holder_player_id).toBe(s.officer.player_id);
  const notice = await published(s, s.officer, "ORG_OFFICE_ACT", s.orgId);
  expect(notice.a.cmd).toBe(`notice ${s.orgId} "posted"`);
  paid(s, notice.r, s.officer, COSTS.ORG_OFFICE_ACT, notice.before, "ENTITY_UPDATE",
    { entity_id: officeId, set: expect.objectContaining({ public_notice: "posted", institution_id: s.orgId }) });
  expect(s.org().public_notice).toBe("posted");
  const resign = await published(s, s.officer, "ORG_OFFICE_VACATE", officeId);
  expect(resign.a.cmd).toBe(`resign ${officeId}`);
  paid(s, resign.r, s.officer, COSTS.ORG_OFFICE_VACATE, resign.before, "ENTITY_UPDATE",
    { entity_id: officeId, set: expect.objectContaining({ office_status: "VACANT" }) });
  expect(s.org().offices?.[officeId].holder_player_id).toBeUndefined();
  const retire = await published(s, s.founder, "ORG_OFFICE_RETIRE", officeId);
  expect(retire.a.cmd).toBe(`office retire ${officeId}`);
  paid(s, retire.r, s.founder, COSTS.ORG_OFFICE_RETIRE, retire.before, "ENTITY_UPDATE",
    { entity_id: officeId, set: expect.objectContaining({ office_status: "RETIRED", institution_id: s.orgId }) });
  expect(s.org().offices?.[officeId].status).toBe("RETIRED");
  const prior = canonical(s); s.settled.length = 0;
  refusal(s, await s.text(s.officer, notice.a.cmd!), prior, "FORBIDDEN");
});

officeDiscoveryCase("P04 member cannot inherit invite, office, or notice authority merely by reading text", async () => {
  const s = await officeMemberScene();
  const create = await published(s, s.founder, "ORG_OFFICE_CREATE", s.orgId);
  const officeId = Object.keys(s.org().offices || {})[0]; expect(create.r.ok).toBe(true);
  for (const [line, code] of [
    [`invite outsider to ${s.orgId} role=member`, "FORBIDDEN"],
    [create.a.cmd!, "FORBIDDEN"],
    [`office assign ${officeId} candidate`, "FORBIDDEN"],
    [`office retire ${officeId}`, "FORBIDDEN"],
    [`notice ${s.orgId} "forged"`, "FORBIDDEN"],
  ]) {
    s.settled.length = 0; const before = canonical(s);
    refusal(s, await s.text(s.member, line), before, code);
  }
  expect(s.org().public_notice).toBeUndefined();
});

officeDiscoveryCase("P04 occupied seat, track, profile, cross-org and affordability reject without effects", async () => {
  const s = await officeMemberScene();
  expect((await s.text(s.founder,
    `office create ${s.orgId} name="Tracked" profile=PUBLISH_NOTICE requires=engineer`)).ok).toBe(true);
  const tracked = Object.keys(s.org().offices || {})[0];
  const rejectOfficeMemberLine = async (p: PlayerPrincipal, line: string, code: string) => {
    s.settled.length = 0; const before = canonical(s);
    refusal(s, await s.text(p, line), before, code);
  };
  await rejectOfficeMemberLine(s.founder, `office assign ${tracked} member`, "FORBIDDEN");
  // Required track means recognized practice, not merely choosing FOCUS.
  const practice = emptyPractice();
  practice.recognition = { [ENGINEER_TRACK]: ["entity.one", "entity.two", "entity.three"] };
  s.w.players[s.officer.player_id].practice = practice;
  expect((await s.text(s.founder, `office assign ${tracked} officer`)).ok).toBe(true);
  await rejectOfficeMemberLine(s.founder, `office assign ${tracked} candidate`, "FORBIDDEN");
  await rejectOfficeMemberLine(s.member, `resign ${tracked}`, "FORBIDDEN");
  await rejectOfficeMemberLine(s.member, `notice ${s.orgId} "forged"`, "FORBIDDEN");
  expect((await s.text(s.founder, `office create ${s.orgId} name="Archive" profile=GRANT_ACCESS`)).ok).toBe(true);
  const accessSeat = Object.keys(s.org().offices || {}).find((id) => id !== tracked)!;
  expect((await s.text(s.founder, `office assign ${accessSeat} member`)).ok).toBe(true);
  await rejectOfficeMemberLine(s.member, `notice ${s.orgId} "wrong profile"`, "FORBIDDEN");
  expect((await s.text(s.outsider, 'form Other Compact charter="distinct"')).ok).toBe(true);
  const otherId = Object.keys(s.w.organizations).find((id) => id !== s.orgId)!;
  const otherTreasury = structuredClone(s.w.organizations[otherId].treasury);
  await rejectOfficeMemberLine(s.officer, `notice ${otherId} "cross org"`, "FORBIDDEN");
  await rejectOfficeMemberLine(s.founder, `office assign ${tracked} outsider`, "FORBIDDEN");
  expect(s.w.organizations[otherId].treasury).toEqual(otherTreasury);
  s.w.players[s.founder.player_id].budgets.compute = 0;
  await rejectOfficeMemberLine(s.founder, `office retire ${accessSeat}`, "BUDGET_EXCEEDED");
  await rejectOfficeMemberLine(s.founder, `office assign ${accessSeat} candidate`, "FORBIDDEN"); // occupied wins before cost
  await rejectOfficeMemberLine(s.founder, `office create ${s.orgId} name="Unfunded" profile=PUBLISH_NOTICE`, "BUDGET_EXCEEDED");
  await rejectOfficeMemberLine(s.founder, `invite outsider to ${s.orgId} role=member`, "BUDGET_EXCEEDED");
  expect((await s.affordance(s.founder, "ORG_OFFICE_CREATE", s.orgId)).available).toBe(false);
  s.w.players[s.member.player_id].budgets.compute = 0;
  await rejectOfficeMemberLine(s.member, `leave ${s.orgId}`, "BUDGET_EXCEEDED");
  s.w.players[s.officer.player_id].budgets.compute = 0;
  await rejectOfficeMemberLine(s.officer, `notice ${s.orgId} "unfunded"`, "BUDGET_EXCEEDED");
});

officeDiscoveryCase("P04 same-profile seats in two organizations never route notice to the other org", async () => {
  const s = await officeMemberScene();
  expect((await s.text(s.founder, `office create ${s.orgId} name="First" profile=PUBLISH_NOTICE`)).ok).toBe(true);
  const firstSeat = Object.keys(s.org().offices || {})[0];
  expect((await s.text(s.founder, `office assign ${firstSeat} officer`)).ok).toBe(true);
  expect((await s.text(s.outsider, 'form Separate Charter charter="public notices"')).ok).toBe(true);
  const otherId = Object.keys(s.w.organizations).find((id) => id !== s.orgId)!;
  expect((await s.text(s.outsider, `invite candidate to ${otherId} role=member`)).ok).toBe(true);
  expect((await s.text(s.outsider, `office create ${otherId} name="Second" profile=PUBLISH_NOTICE`)).ok).toBe(true);
  const secondSeat = Object.keys(s.w.organizations[otherId].offices || {})[0];
  expect((await s.text(s.outsider, `office assign ${secondSeat} candidate`)).ok).toBe(true);
  s.settled.length = 0;
  const before = canonical(s);
  refusal(s, await s.text(s.officer, `notice ${otherId} "wrong seat"`), before, "FORBIDDEN");
  const right = await published(s, s.officer, "ORG_OFFICE_ACT", s.orgId);
  paid(s, right.r, s.officer, COSTS.ORG_OFFICE_ACT, right.before, "ENTITY_UPDATE",
    { entity_id: firstSeat, set: expect.objectContaining({ institution_id: s.orgId, public_notice: "posted" }) });
  expect(s.w.organizations[otherId].public_notice).toBeUndefined();
  expect(s.w.organizations[otherId].offices?.[secondSeat].holder_player_id).toBe(s.candidate.player_id);
});

officeDiscoveryCase("P04 rendered help org alternatives/remove reason/optional scope and precedence execute", async () => {
  const s = await officeMemberScene();
  const help = await s.text(s.founder, "help org"); expect(help.ok).toBe(true);
  const lines = String(help.observation?.consequence).split("\n").map((line) => line.trim());
  const line = (prefix: string) => {
    const hits = lines.filter((x) => x.startsWith(prefix)); expect(hits).toHaveLength(1); return hits[0];
  };
  const invite = line("invite <player>");
  for (const role of ["member", "officer", "advisor"] as const) {
    // Substitution retains published words/delimiters and selects a documented alternative.
    const target = s.outsider;
    const cmd = invite.replace("<player>", target.player_id).replace("<org_id>", s.orgId)
      .replace("member|officer|advisor", role);
    const prior = canonical(s); s.settled.length = 0;
    refusal(s, await s.text(s.member, cmd), prior, "FORBIDDEN");
    const before = { ...s.w.players[s.founder.player_id].budgets };
    const result = await s.text(s.founder, cmd);
    paid(s, result, s.founder, COSTS.ORG_MEMBER_ADD, before, "ORG_MEMBER_ADD",
      { org_id: s.orgId, agent_id: target.player_id, role });
    expect(s.org().members.find((m) => m.agent_id === target.player_id)?.role).toBe(role);
    expect((await s.text(target, line("leave <org_id>").replace("<org_id>", s.orgId))).ok).toBe(true);
  }
  const remove = line("remove <player>").replace("<player>", s.member.player_id)
    .replace("<org_id>", s.orgId).replace("cause", "breach");
  s.settled.length = 0;
  const removed = await s.text(s.officer, remove);
  expect(removed.ok).toBe(true);
  expect(s.settled).toContainEqual(expect.objectContaining({ event_type: "ORG_MEMBER_REMOVE",
    payload: expect.objectContaining({ org_id: s.orgId, agent_id: s.member.player_id, reason: "breach" }) }));
  expect(s.org().members.some((m) => m.agent_id === s.member.player_id)).toBe(false);
  const template = line("office create <org>").split(" [object_set=")[0];
  const tail = line("office create <org>").slice(template.length);
  const scoped = `${template.replace("<org>", s.orgId).replace("Treasurer", "Scoped")} ${tail.match(/\[object_set=([^\]]+)\]/)?.[0]
    .replace("[object_set=id,id]", "object_set=entity.alpha,entity.beta")} ${tail.match(/\[precedence=([^\]]+)\]/)?.[0]
    .replace("[precedence=append|lead]", "precedence=lead")}`;
  expect(scoped).not.toMatch(/[<>\[\]]/);
  const office = await s.text(s.officer, scoped); expect(office.ok).toBe(true);
  const seat = Object.values(s.org().offices || {})[0];
  expect(seat).toEqual(expect.objectContaining({ display_name: "Scoped", object_set: ["entity.alpha", "entity.beta"] }));
  expect(s.org().office_precedence?.[0]).toBe(seat.office_id);
});

officeDiscoveryCase("P04 invited officer independently creates, assigns and retires a member's office", async () => {
  const s = await officeMemberScene();
  expect(s.org().members.find((m) => m.agent_id === s.officer.player_id)?.role).toBe("officer");
  expect(s.org().members.find((m) => m.agent_id === s.candidate.player_id)?.role).toBe("member");
  const initial = new Set(Object.keys(s.org().offices || {}));
  const create = await published(s, s.officer, "ORG_OFFICE_CREATE", s.orgId);
  const seatId = Object.keys(s.org().offices || {}).find((id) => !initial.has(id))!;
  expect(seatId).toBeTruthy();
  paid(s, create.r, s.officer, COSTS.ORG_OFFICE_CREATE, create.before, "ENTITY_CREATE",
    { entity_id: seatId, owner_id: s.orgId });
  const assign = await published(s, s.officer, "ORG_OFFICE_ASSIGN", seatId, "candidate");
  expect(assign.a.cmd).toBe(`office assign ${seatId} candidate`);
  paid(s, assign.r, s.officer, COSTS.ORG_OFFICE_ASSIGN, assign.before, "ENTITY_UPDATE",
    { entity_id: seatId, set: expect.objectContaining({ holder_player_id: s.candidate.player_id, institution_id: s.orgId }) });
  expect(s.org().offices?.[seatId].holder_player_id).toBe(s.candidate.player_id);
  const retire = await published(s, s.officer, "ORG_OFFICE_RETIRE", seatId);
  expect(retire.a.cmd).toBe(`office retire ${seatId}`);
  paid(s, retire.r, s.officer, COSTS.ORG_OFFICE_RETIRE, retire.before, "ENTITY_UPDATE",
    { entity_id: seatId, set: expect.objectContaining({ office_status: "RETIRED", institution_id: s.orgId }) });
  expect(s.org().offices?.[seatId]).toEqual(expect.objectContaining({ status: "RETIRED", holder_player_id: undefined }));
});

officeDiscoveryCase("P04 valid assign and holder resign refuse one compute short then succeed when funded", async () => {
  const s = await officeMemberScene();
  expect(COSTS.ORG_OFFICE_ASSIGN).toEqual({ compute: 1 });
  expect(COSTS.ORG_OFFICE_VACATE).toEqual({ compute: 1 });
  const create = await published(s, s.founder, "ORG_OFFICE_CREATE", s.orgId);
  expect(create.r.ok).toBe(true);
  const seatId = Object.keys(s.org().offices || {})[0];
  const assignLine = `office assign ${seatId} candidate`;
  const treasury = structuredClone(s.org().treasury);
  s.w.players[s.officer.player_id].budgets.compute = 0;
  // Complete all read-time initialization before the refusal projection.
  expect((await s.send(s.officer, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0;
  const beforeAssignRefusal = canonical(s);
  refusal(s, await s.text(s.officer, assignLine), beforeAssignRefusal, "BUDGET_EXCEEDED");
  expect(s.org().offices?.[seatId].status).toBe("VACANT");
  s.w.players[s.officer.player_id].budgets.compute = 1;
  const beforeAssign = { ...s.w.players[s.officer.player_id].budgets }; s.settled.length = 0;
  const assigned = await s.text(s.officer, assignLine);
  paid(s, assigned, s.officer, COSTS.ORG_OFFICE_ASSIGN, beforeAssign, "ENTITY_UPDATE",
    { entity_id: seatId, set: expect.objectContaining({ holder_player_id: s.candidate.player_id, institution_id: s.orgId }) });
  expect(s.org().offices?.[seatId].status).toBe("OCCUPIED");
  s.w.players[s.candidate.player_id].budgets.compute = 0;
  expect((await s.send(s.candidate, "OBSERVE")).ok).toBe(true);
  s.settled.length = 0;
  const beforeResign = canonical(s);
  refusal(s, await s.text(s.candidate, `resign ${seatId}`), beforeResign, "BUDGET_EXCEEDED");
  expect(s.org().offices?.[seatId].holder_player_id).toBe(s.candidate.player_id);
  s.w.players[s.candidate.player_id].budgets.compute = 1;
  const beforeVacate = { ...s.w.players[s.candidate.player_id].budgets }; s.settled.length = 0;
  const resigned = await s.text(s.candidate, `resign ${seatId}`);
  paid(s, resigned, s.candidate, COSTS.ORG_OFFICE_VACATE, beforeVacate, "ENTITY_UPDATE",
    { entity_id: seatId, set: expect.objectContaining({ office_status: "VACANT", institution_id: s.orgId }), unset: ["holder_player_id"] });
  expect(s.org().offices?.[seatId].holder_player_id).toBeUndefined();
  expect(s.org().treasury).toEqual(treasury);
});

officeDiscoveryCase("P04 rendered default, append and lead order overlapping occupied offices", async () => {
  const s = await officeMemberScene();
  const help = await s.text(s.founder, "help org");
  const template = String(help.observation?.consequence).split("\n")
    .map((row) => row.trim()).find((row) => row.startsWith("office create <org>"))!;
  expect(template).toContain("[precedence=append|lead]");
  const createLine = (name: string, precedence?: "append" | "lead") => template
    .replace("<org>", s.orgId).replace("Treasurer", name)
    .replace(" [object_set=id,id]", " object_set=entity.alpha,entity.beta")
    .replace(" [precedence=append|lead]", precedence ? ` precedence=${precedence}` : "");
  const seats: string[] = [];
  for (const [name, mode] of [["First", undefined], ["Second", "append"], ["Third", "lead"]] as const) {
    const beforeIds = new Set(Object.keys(s.org().offices || {}));
    const before = { ...s.w.players[s.officer.player_id].budgets }; s.settled.length = 0;
    const r = await s.text(s.officer, createLine(name, mode));
    const id = Object.keys(s.org().offices || {}).find((x) => !beforeIds.has(x))!;
    expect(id).toBeTruthy();
    paid(s, r, s.officer, COSTS.ORG_OFFICE_CREATE, before, "ENTITY_CREATE",
      { entity_id: id, owner_id: s.orgId });
    expect(s.org().offices?.[id].object_set).toEqual(["entity.alpha", "entity.beta"]);
    seats.push(id);
    expect(s.org().office_precedence || []).toEqual(mode === undefined ? [] :
      mode === "append" ? [seats[1]] : [seats[2], seats[1]]);
  }
  for (const [id, p] of [[seats[0], s.founder], [seats[1], s.member], [seats[2], s.candidate]] as const) {
    const r = await s.text(s.officer, `office assign ${id} ${p.player_id}`);
    expect(r.ok).toBe(true);
    expect(s.org().offices?.[id].holder_player_id).toBe(p.player_id);
  }
  expect(s.org().office_precedence).toEqual([seats[2], seats[1]]);
  // Default created an unranked overlapping rival. Even lead cannot outrank
  // that rival until it vacates; publication is not a blanket grant.
  expect(resolveOfficeConflict(s.org(), seats[2], "entity.alpha")).toEqual(expect.objectContaining({ ok: false, code: "AUTHORITY_CONFLICT" }));
  expect((await s.text(s.founder, `resign ${seats[0]}`)).ok).toBe(true);
  expect(s.org().offices?.[seats[0]].status).toBe("VACANT");
  expect(s.org().office_precedence).toEqual([seats[2], seats[1]]);
  expect(resolveOfficeConflict(s.org(), seats[2], "entity.alpha")).toEqual({ ok: true });
  expect(resolveOfficeConflict(s.org(), seats[1], "entity.alpha")).toEqual(expect.objectContaining({ ok: false, code: "AUTHORITY_CONFLICT" }));
  expect(s.org().offices?.[seats[1]].holder_player_id).toBe(s.member.player_id);
  expect(s.org().offices?.[seats[2]].holder_player_id).toBe(s.candidate.player_id);
});
