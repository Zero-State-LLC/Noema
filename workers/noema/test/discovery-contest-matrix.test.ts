import { describe, expect, it as contestDiscoveryCase } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { enrichEntity } from "../src/actions";
import { CONTEST_FORMS, DECLARE_COST, DEFEND_COST, FORM_SPECS, type ContestForm, type ContestTarget } from "../src/contest";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function contestDiscoveryPrincipal(id: string): PlayerPrincipal {
  return { player_id: `player.${id}`, agent_id: `agent.${id}`, session_id: `sess.${id}`,
    controller_id: `ctrl.${id}`, controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1", authentication_context: "test" };
}
function contestDiscoveryWorld(): WorldRuntime {
  return { world_id: "test.hosted-canonical.discovery-contest", world_name: "Test Reach", cycle: 0,
    sequence: 0, entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public room",
        exits: [{ direction: "east", to_room_id: "room.east" }], entities: [
          enrichEntity({ entity_id: "entity.relay", label: "scarred-conduit", entity_type: "INFRASTRUCTURE", condition: 70 }),
          enrichEntity({ entity_id: "entity.tablet", label: "amber-tablet", entity_type: "ARTIFACT" }),
        ] },
      "room.east": { room_id: "room.east", name: "East", description: "Public", exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
      "room.hidden": { room_id: "room.hidden", name: "Hidden", description: "Hidden", hidden: true, tags: ["hidden"], exits: [], entities: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, contests: {}, seen_idempotency: {}, unsettled: [] };
}
let contestDiscoveryNonce = 0;
async function contestDiscoverySend(w: WorldRuntime, p: PlayerPrincipal, command: string,
  args: Record<string, unknown> = {}, settled: string[] = []) {
  const n = ++contestDiscoveryNonce;
  const envelope: CommandEnvelope = { request_id: `contest-request.${n}`, idempotency_key: `contest-idem.${n}`, command, arguments: args };
  return applyWorldCommand(w, p, envelope, async (event) => { settled.push(event.event_type); return true; }, { admission: "developer" });
}
async function contestDiscoveryEnter(w: WorldRuntime, ...principals: PlayerPrincipal[]) {
  for (const p of principals) {
    expect((await contestDiscoverySend(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { attention: 60, compute: 60, energy: 60, influence: 60, storage: 0 };
  }
}
function contestDiscoveryProjection(w: WorldRuntime) {
  return structuredClone({ sequence: w.sequence, contests: w.contests,
    budgets: Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.budgets])),
    treasury: Object.fromEntries(Object.entries(w.organizations).map(([id, org]) => [id, org.treasury])) });
}
function contestDiscoverySpent(before: Record<string, number>, after: Record<string, number>, stake: Record<string, number>, cost: Record<string, number>) {
  for (const key of ["attention", "compute", "energy", "influence", "storage"]) {
    expect(after[key], key).toBe(before[key] - (stake[key] || 0) - (cost[key] || 0));
  }
}
const contestDiscoveryPairs: Array<[ContestForm, ContestTarget, string]> = [
  ["INFRASTRUCTURE_DISRUPTION", { kind: "ENTITY", entity_id: "entity.relay" }, "entity.relay"],
  ["INFORMATION_CONTEST", { kind: "ENTITY", entity_id: "entity.tablet" }, "entity.tablet"],
  ["ACCESS_CONTEST", { kind: "ROOM", room_id: "room.hub" }, "room.hub"],
  ["ACCESS_CONTEST", { kind: "EXIT", exit_id: "east" }, "east"],
  ["PRESENCE_PRESSURE", { kind: "AGENT", agent_id: "player.sable" }, "player.sable"],
  ["RESOURCE_SEIZURE", { kind: "ENTITY", entity_id: "entity.relay" }, "entity.relay"],
];

describe("P07 exact advertised contest discovery", () => {
  contestDiscoveryCase.each(contestDiscoveryPairs)("follows %s %j actual command to typed target and charged declaration", async (form, target, targetId) => {
    const w = contestDiscoveryWorld(), actor = contestDiscoveryPrincipal("nacre"), other = contestDiscoveryPrincipal("sable");
    await contestDiscoveryEnter(w, actor, other);
    const look = await contestDiscoverySend(w, actor, "LOOK");
    const candidates = (look.observation?.affordances || []).filter((x) => x.operation === "CONTEST_DECLARE");
    const hit = candidates.find((x) => x.contest_form === form && x.target_id === targetId && JSON.stringify(x.target) === JSON.stringify(target));
    expect(hit, `${form}/${target.kind} must appear before the eight-row cap`).toBeDefined();
    expect(hit?.available).toBe(true);
    expect(hit?.stake).toEqual(FORM_SPECS[form].minimum_stake);
    const before = { ...w.players[actor.player_id].budgets }, settled: string[] = [];
    const declared = await contestDiscoverySend(w, actor, "LOOK", { line: hit!.cmd }, settled);
    expect(declared.ok, declared.error?.message).toBe(true);
    expect(declared.events?.map((event) => event.event_type)).toEqual(["BUDGET_CONSUMED", "CONTEST_DECLARED"]);
    expect(declared.events?.[1]?.payload).toMatchObject({ target, contest_form: form, stake: hit!.stake });
    expect(declared.events?.[0]?.payload).toMatchObject({ cost_paid: DECLARE_COST, acting_for: null });
    expect(settled).toEqual(["CONTEST_DECLARED"]);
    expect(Object.values(w.contests || {})).toHaveLength(1);
    expect(Object.values(w.contests || {})[0]).toMatchObject({ target, contest_form: form, stake: hit!.stake, status: "OPEN" });
    contestDiscoverySpent(before, w.players[actor.player_id].budgets, hit!.stake!, DECLARE_COST);
  });

  contestDiscoveryCase.each(contestDiscoveryPairs)("rejects %s %j below-minimum and incompatible typed target without effects", async (form, target, targetId) => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable"), settled: string[] = [];
    await contestDiscoveryEnter(w, a, b);
    const hit = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DECLARE" && x.contest_form === form && x.target_id === targetId && JSON.stringify(x.target) === JSON.stringify(target))!;
    expect(hit).toBeDefined();
    const minimum = FORM_SPECS[form].minimum_stake;
    const first = Object.keys(minimum)[0];
    const lowStake = { ...minimum, [first]: minimum[first] - 1 };
    const before = contestDiscoveryProjection(w);
    const low = await contestDiscoverySend(w, a, "LOOK", { line: hit.cmd.replace(/stake=\S+/, `stake=${Object.entries(lowStake).map(([k, v]) => `${k}:${v}`).join(",")}`) }, settled);
    expect(low.error?.code).toBe("BUDGET_EXCEEDED");
    expect(low.events || []).toHaveLength(0);
    const incompatible: ContestTarget = form === "ACCESS_CONTEST" ? { kind: "ENTITY", entity_id: "entity.relay" } : { kind: "ROOM", room_id: "room.hub" };
    const wrong = await contestDiscoverySend(w, a, "CONTEST_DECLARE", { contest_form: form, stake: minimum, target: incompatible }, settled);
    expect(wrong.ok).toBe(false);
    expect(wrong.events || []).toHaveLength(0);
    expect(settled).toEqual([]);
    expect(contestDiscoveryProjection(w)).toEqual(before);
  });

  contestDiscoveryCase("rejects a below-minimum advertised command and an invalid target without debit or settlement", async () => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable");
    await contestDiscoveryEnter(w, a, b);
    const hit = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DECLARE" && x.contest_form === "INFRASTRUCTURE_DISRUPTION")!;
    const before = contestDiscoveryProjection(w), settled: string[] = [];
    const low = await contestDiscoverySend(w, a, "LOOK", { line: hit.cmd.replace(/stake=\S+/, "stake=energy:1,influence:1,compute:1") }, settled);
    expect(low.ok).toBe(false);
    expect(low.error?.code).toBe("BUDGET_EXCEEDED");
    expect(low.events || []).toHaveLength(0);
    const wrong = await contestDiscoverySend(w, a, "LOOK", { line: hit.cmd.replace("scarred-conduit", "amber-tablet") }, settled);
    expect(wrong.ok).toBe(false);
    expect(wrong.events || []).toHaveLength(0);
    expect(settled).toEqual([]);
    expect(contestDiscoveryProjection(w)).toEqual(before);
  });

  contestDiscoveryCase("follows actual defend and withdraw offers with participant, cost and expiry controls", async () => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable"), outsider = contestDiscoveryPrincipal("stranger");
    await contestDiscoveryEnter(w, a, b, outsider);
    const declare = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DECLARE" && x.contest_form === "INFRASTRUCTURE_DISRUPTION")!;
    expect((await contestDiscoverySend(w, a, "LOOK", { line: declare.cmd })).ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    const defend = (await contestDiscoverySend(w, b, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DEFEND" && x.contest_id === contestId)!;
    expect(defend?.cmd).toBeTruthy();
    expect(defend.stake).toEqual(FORM_SPECS.INFRASTRUCTURE_DISRUPTION.minimum_stake);
    const beforeRefusal = contestDiscoveryProjection(w), settled: string[] = [];
    const unauthorized = await contestDiscoverySend(w, a, "LOOK", { line: defend.cmd }, settled);
    expect(unauthorized.error?.code).toBe("FORBIDDEN");
    const strangerWithdraw = await contestDiscoverySend(w, outsider, "LOOK", { line: `withdraw ${contestId}` }, settled);
    expect(strangerWithdraw.error?.code).toBe("FORBIDDEN");
    expect(contestDiscoveryProjection(w)).toEqual(beforeRefusal);
    expect(settled).toEqual([]);
    const before = { ...w.players[b.player_id].budgets };
    const defended = await contestDiscoverySend(w, b, "LOOK", { line: defend.cmd }, settled);
    expect(defended.ok, defended.error?.message).toBe(true);
    expect(defended.events?.map((event) => event.event_type)).toEqual(["BUDGET_CONSUMED"]);
    expect(defended.events?.[0]?.payload).toMatchObject({ cost_paid: DEFEND_COST, acting_for: null });
    expect(settled).toEqual([]);
    expect(w.contests?.[contestId]).toMatchObject({ defender_id: b.player_id, defender_stake: defend.stake, status: "OPEN" });
    contestDiscoverySpent(before, w.players[b.player_id].budgets, defend.stake!, DEFEND_COST);
    const withdraw = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_WITHDRAW" && x.contest_id === contestId)!;
    expect(withdraw?.cmd).toBe(`withdraw ${contestId}`);
    const withdrawn = await contestDiscoverySend(w, a, "LOOK", { line: withdraw.cmd }, settled);
    expect(withdrawn.ok).toBe(true);
    expect(withdrawn.events?.some((e) => e.event_type === "CONTEST_RESOLVED" && e.payload?.contest_id === contestId)).toBe(true);
    expect(w.contests?.[contestId]?.status).toBe("CLOSED");
    expect(settled).toContain("CONTEST_RESOLVED");
    const closed = contestDiscoveryProjection(w);
    expect((await contestDiscoverySend(w, b, "LOOK", { line: defend.cmd })).ok).toBe(false);
    expect(contestDiscoveryProjection(w)).toEqual(closed);
  });

  contestDiscoveryCase("instantiates five rendered HELP form alternatives at their actual minimum stake", async () => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable");
    await contestDiscoveryEnter(w, a, b);
    const help = await contestDiscoverySend(w, a, "LOOK", { line: "help contest" });
    expect(help.ok).toBe(true);
    const copy = String(help.observation?.consequence || "");
    expect(copy).toContain("contest <form> <target> stake=energy:10,influence:6");
    for (const token of ["resource_seizure", "infrastructure_disruption", "access", "presence_pressure", "information"]) {
      expect(copy).toContain(token);
    }
    const targets: Record<string, string> = { resource_seizure: "scarred-conduit", infrastructure_disruption: "scarred-conduit", access: "here", presence_pressure: "sable", information: "amber-tablet" };
    for (const [token, target] of Object.entries(targets)) {
      const form = CONTEST_FORMS.find((f) => f.toLowerCase() === token || (token === "access" && f === "ACCESS_CONTEST") || (token === "information" && f === "INFORMATION_CONTEST"))!;
      const stake = FORM_SPECS[form].minimum_stake;
      const template = copy.split("\n").map((s) => s.trim()).find((s) => s.startsWith("contest <form> <target> stake="))!;
      expect(template).toBeTruthy();
      const line = template.replace("<form>", token).replace("<target>", target)
        .replace("energy:10,influence:6", Object.entries(stake).map(([k, v]) => `${k}:${v}`).join(","));
      const fresh = contestDiscoveryWorld();
      await contestDiscoveryEnter(fresh, a, b);
      const result = await contestDiscoverySend(fresh, a, "LOOK", { line });
      expect(result.ok, `${line}: ${result.error?.message}`).toBe(true);
      const declaredEvent = result.events?.find((e) => e.event_type === "CONTEST_DECLARED");
      expect(declaredEvent?.payload?.contest_form).toBe(form);
      const expectedTarget: ContestTarget = token === "presence_pressure" ? { kind: "AGENT", agent_id: b.player_id }
        : token === "access" ? { kind: "ROOM", room_id: "room.hub" }
        : { kind: "ENTITY", entity_id: token === "information" ? "entity.tablet" : "entity.relay" };
      expect(declaredEvent?.payload?.target).toEqual(expectedTarget);
      expect(Object.values(fresh.contests || {})).toHaveLength(1);
    }
  });

  contestDiscoveryCase("rejects ambiguous entity labels, hidden declarations and insufficient personal funds without effects", async () => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable");
    await contestDiscoveryEnter(w, a, b);
    const hit = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DECLARE" && x.contest_form === "INFRASTRUCTURE_DISRUPTION")!;
    w.rooms["room.hub"].entities.push(enrichEntity({ entity_id: "entity.relay-2", label: "scarred-conduit", entity_type: "INFRASTRUCTURE", condition: 70 }));
    const before = contestDiscoveryProjection(w), settled: string[] = [];
    const ambiguous = await contestDiscoverySend(w, a, "LOOK", { line: hit.cmd }, settled);
    expect(ambiguous.ok).toBe(false);
    expect(["AMBIGUOUS_TARGET", "INVALID_REQUEST"]).toContain(ambiguous.error?.code);
    expect(settled).toEqual([]);
    expect(contestDiscoveryProjection(w)).toEqual(before);
    w.rooms["room.hub"].entities.pop();
    w.players[a.player_id].budgets.energy = 1;
    const poorBefore = contestDiscoveryProjection(w);
    const poor = await contestDiscoverySend(w, a, "LOOK", { line: hit.cmd }, settled);
    expect(poor.error?.code).toBe("BUDGET_EXCEEDED");
    expect(poor.events || []).toHaveLength(0);
    expect(contestDiscoveryProjection(w)).toEqual(poorBefore);
    w.players[a.player_id].budgets.energy = 60;
    w.players[a.player_id].room_id = "room.hidden";
    const hiddenBefore = contestDiscoveryProjection(w);
    const hidden = await contestDiscoverySend(w, a, "LOOK", { line: "contest access here stake=energy:6,influence:8" }, settled);
    expect(hidden.ok).toBe(false);
    expect(hidden.events || []).toHaveLength(0);
    expect(settled).toEqual([]);
    expect(contestDiscoveryProjection(w)).toEqual(hiddenBefore);
  });

  contestDiscoveryCase("expires participation offers and leaves refused state and settlement untouched", async () => {
    const w = contestDiscoveryWorld(), a = contestDiscoveryPrincipal("nacre"), b = contestDiscoveryPrincipal("sable");
    await contestDiscoveryEnter(w, a, b);
    const line = (await contestDiscoverySend(w, a, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DECLARE")!.cmd;
    expect((await contestDiscoverySend(w, a, "LOOK", { line })).ok).toBe(true);
    const id = Object.keys(w.contests || {})[0];
    const offered = (await contestDiscoverySend(w, b, "LOOK")).observation!.affordances!.find((x) => x.operation === "CONTEST_DEFEND" && x.contest_id === id)!;
    w.cycle = w.contests![id].expires_cycle;
    const settled: string[] = [];
    const observed = await contestDiscoverySend(w, b, "LOOK");
    expect(observed.observation?.affordances?.some((x) => x.operation === "CONTEST_DEFEND" && x.contest_id === id)).toBe(false);
    const before = contestDiscoveryProjection(w);
    for (const attempt of [offered.cmd, `withdraw ${id}`]) {
      const refused = await contestDiscoverySend(w, b, "LOOK", { line: attempt }, settled);
      expect(refused.error?.code).toBe("FORBIDDEN");
      expect(refused.events || []).toHaveLength(0);
    }
    expect(settled).toEqual([]);
    expect(contestDiscoveryProjection(w)).toEqual(before);
  });

  contestDiscoveryCase("runs institutional contest and defense from occupied relevant office/treasury, refusing vacancy and unauthorized org", async () => {
    const w = contestDiscoveryWorld(), founder = contestDiscoveryPrincipal("nacre"), holder = contestDiscoveryPrincipal("sable"), outsider = contestDiscoveryPrincipal("stranger");
    await contestDiscoveryEnter(w, founder, holder, outsider);
    const created = await contestDiscoverySend(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep the grid" });
    expect(created.ok).toBe(true);
    const org = Object.keys(w.organizations)[0];
    expect((await contestDiscoverySend(w, founder, "ORG_MEMBER_ADD", { org_id: org, agent_id: holder.player_id, role: "member" })).ok).toBe(true);
    const office = await contestDiscoverySend(w, founder, "ORG_OFFICE_CREATE", { org_id: org, display_name: "Custodian", authority_profile: "OPERATE_NAMED_ASSET" });
    expect(office.ok).toBe(true);
    const officeId = Object.keys(w.organizations[org].offices || {})[0];
    const assign = await contestDiscoverySend(w, founder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: holder.player_id });
    expect(assign.ok).toBe(true);
    const treasury = w.organizations[org].treasury!;
    Object.assign(treasury, { energy: 60, influence: 60, compute: 60 });
    const help = String((await contestDiscoverySend(w, founder, "LOOK", { line: "help contest" })).observation?.consequence || "");
    const formTemplate = help.split("\n").map((s) => s.trim()).find((s) => s.startsWith("contest for <org>"))!;
    const defendTemplate = help.split("\n").map((s) => s.trim()).find((s) => s.startsWith("defend <contest_id> for <org>"))!;
    expect(formTemplate).toBeTruthy(); expect(defendTemplate).toBeTruthy();
    const stake = FORM_SPECS.INFRASTRUCTURE_DISRUPTION.minimum_stake;
    const stakeText = Object.entries(stake).map(([k, v]) => `${k}:${v}`).join(",");
    const line = formTemplate.replace("<org>", org).replace("<form>", "infrastructure_disruption")
      .replace("<target>", "scarred-conduit").replace("energy:10,influence:6", stakeText);
    const refusalBefore = contestDiscoveryProjection(w), settled: string[] = [];
    const vacant = await contestDiscoverySend(w, founder, "LOOK", { line }, settled);
    expect(vacant.error?.code).toBe("FORBIDDEN");
    const outsiderAttempt = await contestDiscoverySend(w, outsider, "LOOK", { line }, settled);
    expect(outsiderAttempt.error?.code).toBe("FORBIDDEN");
    const unknownOrg = await contestDiscoverySend(w, holder, "LOOK", { line: line.replace(org, "org.hidden") }, settled);
    expect(unknownOrg.ok).toBe(false);
    expect(contestDiscoveryProjection(w)).toEqual(refusalBefore);
    expect(settled).toEqual([]);
    treasury.energy = 1;
    const shortTreasury = contestDiscoveryProjection(w);
    const unaffordable = await contestDiscoverySend(w, holder, "LOOK", { line }, settled);
    expect(unaffordable.error?.code).toBe("BUDGET_EXCEEDED");
    expect(unaffordable.events || []).toHaveLength(0);
    expect(contestDiscoveryProjection(w)).toEqual(shortTreasury);
    expect(settled).toEqual([]);
    treasury.energy = 60;
    const beforeTreasury = { ...treasury }, beforeHolder = { ...w.players[holder.player_id].budgets };
    const declared = await contestDiscoverySend(w, holder, "LOOK", { line }, settled);
    expect(declared.ok, declared.error?.message).toBe(true);
    const id = Object.keys(w.contests || {})[0];
    expect(w.contests?.[id]).toMatchObject({ status: "OPEN", acting_for: org, target: { kind: "ENTITY", entity_id: "entity.relay" } });
    expect(declared.events?.find((e) => e.event_type === "CONTEST_DECLARED")?.payload?.acting_for).toBe(org);
    contestDiscoverySpent(beforeTreasury, treasury, stake, DECLARE_COST);
    expect(w.players[holder.player_id].budgets).toEqual(beforeHolder);
    expect(settled).toEqual(["CONTEST_DECLARED"]);
    // An institution cannot be both parties: make a separate occupied institution for defense.
    const otherCreated = await contestDiscoverySend(w, founder, "ORG_CREATE", { name: "Response", charter: "Hold the field" });
    expect(otherCreated.ok).toBe(true);
    const otherOrg = Object.keys(w.organizations).find((x) => x !== org)!;
    const defenseOffice = await contestDiscoverySend(w, founder, "ORG_OFFICE_CREATE", { org_id: otherOrg, display_name: "Defense", authority_profile: "OPERATE_NAMED_ASSET" });
    expect(defenseOffice.ok).toBe(true);
    const defenseSeat = Object.keys(w.organizations[otherOrg].offices || {})[0];
    expect((await contestDiscoverySend(w, founder, "ORG_OFFICE_ASSIGN", { office_id: defenseSeat, agent_id: founder.player_id })).ok).toBe(true);
    Object.assign(w.organizations[otherOrg].treasury!, { energy: 60, influence: 60, compute: 60 });
    const defendLine = defendTemplate.replace("<contest_id>", id).replace("<org>", otherOrg).replace("energy:10,influence:6", stakeText);
    w.organizations[otherOrg].treasury!.energy = 1;
    const lowDefenseBefore = contestDiscoveryProjection(w);
    const lowDefense = await contestDiscoverySend(w, founder, "LOOK", { line: defendLine }, settled);
    expect(lowDefense.error?.code).toBe("BUDGET_EXCEEDED");
    expect(lowDefense.events || []).toHaveLength(0);
    expect(contestDiscoveryProjection(w)).toEqual(lowDefenseBefore);
    w.organizations[otherOrg].treasury!.energy = 60;
    const defendBefore = { ...w.organizations[otherOrg].treasury! }, founderBefore = { ...w.players[founder.player_id].budgets };
    const defended = await contestDiscoverySend(w, founder, "LOOK", { line: defendLine }, settled);
    expect(defended.ok, defended.error?.message).toBe(true);
    expect(w.contests?.[id]).toMatchObject({ defender_acting_for: otherOrg, defender_id: founder.player_id, defender_stake: stake });
    contestDiscoverySpent(defendBefore, w.organizations[otherOrg].treasury!, stake, DEFEND_COST);
    expect(w.players[founder.player_id].budgets).toEqual(founderBefore);
  });
});
