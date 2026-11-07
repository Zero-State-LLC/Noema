import { expect, test as affordabilityCase, vi } from "vitest";
import { cloneBudgets, COSTS, DEFAULT_BUDGETS } from "../src/actions";
import { orgCreateExtraInfluence } from "../src/deep-time";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const actor: PlayerPrincipal = {
  player_id: "player.affordability", agent_id: "agent.affordability",
  session_id: "session.affordability", controller_id: "controller.affordability",
  controller_type: "agent", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1", authentication_context: "test",
};

async function affordabilityScene() {
  const w: WorldRuntime = {
    world_id: "world.affordability", world_name: "Affordability", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public hub.", exits: [], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settle = vi.fn<Parameters<typeof applyWorldCommand>[3]>(async () => true);
  let serial = 0;
  const send = (line: string, fixedKey?: string) => {
    const key = fixedKey ?? `org.affordability.${++serial}`;
    const envelope: CommandEnvelope = {
      command: "LOOK", arguments: { line }, request_id: key, idempotency_key: key,
    };
    return applyWorldCommand(w, actor, envelope, settle, { admission: "developer" });
  };
  const entered = await applyWorldCommand(w, actor, {
    command: "ENTER_WORLD", request_id: "org.enter", idempotency_key: "org.enter", arguments: {},
  }, settle, { admission: "developer" });
  expect(entered.ok).toBe(true);
  w.players[actor.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const base = COSTS.ORG_CREATE.influence ?? 0;
  const compute = COSTS.ORG_CREATE.compute ?? 0;
  expect(orgCreateExtraInfluence(w)).toBe(0);
  const before = { ...w.players[actor.player_id].budgets };
  const seed = await send('form Seed Compact charter="local coordination"');
  expect(seed.ok).toBe(true);
  expect(seed.events?.map((e) => e.event_type)).toContain("ORG_CREATE");
  expect(w.players[actor.player_id].budgets.influence).toBe(before.influence - base);
  expect(w.players[actor.player_id].budgets.compute).toBe(before.compute - compute);
  const premium = orgCreateExtraInfluence(w);
  expect(premium).toBeGreaterThan(0);
  expect(Object.keys(w.organizations)).toHaveLength(1);
  settle.mockClear();
  return { w, send, settle, base, compute, premium };
}

type AffordabilityScene = Awaited<ReturnType<typeof affordabilityScene>>;
function affordabilityProjection(s: AffordabilityScene) {
  return structuredClone({ sequence: s.w.sequence, cycle: s.w.cycle,
    budgets: s.w.players[actor.player_id].budgets, organizations: s.w.organizations,
    unsettled: s.w.unsettled });
}
async function affordabilityAdvertisement(s: AffordabilityScene) {
  const help = await s.send("help");
  expect(help.ok).toBe(true);
  expect(help.events).toEqual([]);
  const affordance = help.observation?.affordances?.find((a) => a.action === "ORG_CREATE");
  expect(affordance).toBeDefined();
  expect(affordance?.operation).toBe("ORG_CREATE");
  expect(affordance?.verb).toBe("COMMIT");
  expect(affordance?.cmd).toBe('form My Compact charter="local coordination"');
  return { help, affordance: affordance! };
}

affordabilityCase("P01 base funds below ratcheted price: follow exact advertised form and retain refusal", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base;
  s.w.players[actor.player_id].budgets.compute = s.compute;
  expect(s.base).toBeLessThan(s.base + s.premium);
  const { help, affordance } = await affordabilityAdvertisement(s);
  expect(affordance.requires).toEqual({ ...COSTS.ORG_CREATE, influence: s.base + s.premium });
  expect(affordance.available).toBe(false);
  expect(affordance.reason).toContain(`influence ${s.base + s.premium}`);
  expect(help.observation?.available_actions).not.toContain("ORG_CREATE");
  const contextual = await s.send("help");
  expect(contextual.observation?.consequence).not.toContain(affordance.cmd);
  expect(s.settle).not.toHaveBeenCalled();
  const before = affordabilityProjection(s);
  const rejected = await s.send(affordance.cmd);
  expect(rejected.ok).toBe(false);
  expect(rejected.error?.code).toBe("BUDGET_EXCEEDED");
  expect(rejected.events ?? []).toEqual([]);
  expect(affordabilityProjection(s)).toEqual(before);
  expect(s.settle).not.toHaveBeenCalled();
  if (process.env.NOEMA_P01_DIAG === "1") console.log("P01_DIAG " + JSON.stringify({
    case: "base-only", base: s.base, compute: s.compute, premium: s.premium,
    actualCost: s.base + s.premium, cmd: affordance.cmd, requires: affordance.requires,
    available: affordance.available, reason: affordance.reason ?? null,
    inAvailableActions: help.observation?.available_actions?.includes("ORG_CREATE"),
    error: rejected.error?.code, events: rejected.events ?? [], settlementCalls: s.settle.mock.calls.length,
    unchanged: JSON.stringify(affordabilityProjection(s)) === JSON.stringify(before),
  }));
});

affordabilityCase("P01 exact dynamic price: advertised form creates one organization, settles and replays once", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base + s.premium;
  s.w.players[actor.player_id].budgets.compute = s.compute;
  const { affordance } = await affordabilityAdvertisement(s);
  const before = affordabilityProjection(s);
  const result = await s.send(affordance.cmd, "org.dynamic.exact");
  expect(affordance.requires).toEqual({ ...COSTS.ORG_CREATE, influence: s.base + s.premium });
  expect(affordance.available).toBe(true);
  expect(affordance.reason).toBeUndefined();
  expect(result.ok).toBe(true);
  expect(result.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ORG_CREATE"]);
  const created = Object.values(s.w.organizations).filter((o) => o.name === "My Compact");
  expect(created).toHaveLength(1);
  expect(created[0].org_id).toMatch(/^org\.my-compact\.[a-f0-9]{8}$/);
  expect(result.events?.find((e) => e.event_type === "ORG_CREATE")?.payload?.org_id).toBe(created[0].org_id);
  expect(result.events?.find((e) => e.event_type === "BUDGET_CONSUMED")?.payload?.cost_paid)
    .toEqual({ ...COSTS.ORG_CREATE, influence: s.base + s.premium });
  expect(s.w.players[actor.player_id].budgets.influence).toBe(before.budgets.influence - s.base - s.premium);
  expect(s.w.players[actor.player_id].budgets.compute).toBe(before.budgets.compute - s.compute);
  expect(s.w.sequence).toBeGreaterThan(before.sequence);
  expect(s.settle).toHaveBeenCalledTimes(1);
  expect(s.settle.mock.calls[0][0].event_type).toBe("ORG_CREATE");
  const after = affordabilityProjection(s);
  const replay = await s.send(affordance.cmd, "org.dynamic.exact");
  expect(replay).toEqual(result);
  expect(affordabilityProjection(s)).toEqual(after);
  expect(s.settle).toHaveBeenCalledTimes(1);
  if (process.env.NOEMA_P01_DIAG === "1") console.log("P01_DIAG " + JSON.stringify({
    case: "exact-premium", base: s.base, compute: s.compute, premium: s.premium,
    actualCost: s.base + s.premium, cmd: affordance.cmd, ok: result.ok,
    orgId: created[0].org_id, orgCount: Object.keys(s.w.organizations).length,
    eventTypes: result.events?.map((e) => e.event_type),
    debit: result.events?.find((e) => e.event_type === "BUDGET_CONSUMED")?.payload?.cost_paid,
    settlementCalls: s.settle.mock.calls.length, replayIdentical: JSON.stringify(replay) === JSON.stringify(result),
    unchangedOnReplay: JSON.stringify(affordabilityProjection(s)) === JSON.stringify(after),
  }));
});

affordabilityCase("P01 rendered help org form accepts with actual dynamic cost", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base + s.premium;
  s.w.players[actor.player_id].budgets.compute = s.compute;
  const help = await s.send("help org");
  const form = help.observation?.consequence?.split("\n")
    .find((part) => part.trim() === 'form <name> charter="purpose"')?.trim();
  expect(form).toBe('form <name> charter="purpose"');
  expect(help.events).toEqual([]);
  expect(s.settle).not.toHaveBeenCalled();
  const line = form!.replace("<name>", "Topic Compact").replace("purpose", "local coordination");
  const before = affordabilityProjection(s);
  const result = await s.send(line);
  expect(result.ok).toBe(true);
  expect(result.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ORG_CREATE"]);
  expect(Object.values(s.w.organizations).filter((o) => o.name === "Topic Compact")).toHaveLength(1);
  expect(s.w.players[actor.player_id].budgets.influence).toBe(before.budgets.influence - s.base - s.premium);
  expect(s.w.players[actor.player_id].budgets.compute).toBe(before.budgets.compute - s.compute);
  expect(s.settle).toHaveBeenCalledTimes(1);
});

affordabilityCase("P01 below base: advertised form refuses, rendered help org is a dictionary", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base - 1;
  s.w.players[actor.player_id].budgets.compute = s.compute;
  const { affordance } = await affordabilityAdvertisement(s);
  expect(affordance.requires).toEqual({ ...COSTS.ORG_CREATE, influence: s.base + s.premium });
  expect(affordance.available).toBe(false);
  expect(affordance.reason).toContain(`influence ${s.base + s.premium}`);
  const help = await s.send("help org");
  const text = help.observation?.consequence ?? "";
  expect(text).toContain('form <name> charter="purpose"');
  expect(text).not.toMatch(/you can afford|currently affordable/i);
  // Replace only documented metavariables in the actual rendered form.
  const line = text.split("\n").find((part) => part.trim() === 'form <name> charter="purpose"')!.trim()
    .replace("<name>", "Topic Compact").replace("purpose", "local coordination");
  expect(line).toBe('form Topic Compact charter="local coordination"');
  expect(s.settle).not.toHaveBeenCalled();
  const before = affordabilityProjection(s);
  const rejected = await s.send(line);
  expect(rejected.ok).toBe(false);
  expect(rejected.error?.code).toBe("BUDGET_EXCEEDED");
  expect(rejected.events ?? []).toEqual([]);
  expect(affordabilityProjection(s)).toEqual(before);
  expect(s.settle).not.toHaveBeenCalled();
  if (process.env.NOEMA_P01_DIAG === "1") console.log("P01_DIAG " + JSON.stringify({
    case: "below-base-help-org", base: s.base, compute: s.compute, premium: s.premium,
    influence: s.base - 1, advertisedCmd: affordance.cmd, available: affordance.available,
    reason: affordance.reason, helpForm: text.split("\n").find((part) => part.trim() === 'form <name> charter="purpose"')?.trim(),
    submittedLine: line, error: rejected.error?.code, events: rejected.events ?? [],
    settlementCalls: s.settle.mock.calls.length,
    unchanged: JSON.stringify(affordabilityProjection(s)) === JSON.stringify(before),
  }));
});

affordabilityCase("P01 compute shortfall excludes the form from HERE", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base + s.premium;
  s.w.players[actor.player_id].budgets.compute = s.compute - 1;
  const { help, affordance } = await affordabilityAdvertisement(s);
  expect(affordance.requires).toEqual({ ...COSTS.ORG_CREATE, influence: s.base + s.premium });
  expect(affordance.available).toBe(false);
  expect(affordance.reason).toContain(`compute ${s.compute}`);
  expect(help.observation?.available_actions).not.toContain("ORG_CREATE");
  expect(help.observation?.consequence).not.toContain(affordance.cmd);
  const before = affordabilityProjection(s);
  const rejected = await s.send(affordance.cmd);
  expect(rejected.ok).toBe(false);
  expect(rejected.error?.code).toBe("BUDGET_EXCEEDED");
  expect(rejected.events ?? []).toEqual([]);
  expect(affordabilityProjection(s)).toEqual(before);
  expect(s.settle).not.toHaveBeenCalled();
});

affordabilityCase("P01 a fresh world advertises executable base price", async () => {
  const w: WorldRuntime = {
    world_id: "world.org.base", world_name: "Base", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public hub.", exits: [], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settle = vi.fn<Parameters<typeof applyWorldCommand>[3]>(async () => true);
  const send = (line: string, key: string) => applyWorldCommand(w, actor, {
    command: "LOOK", arguments: { line }, request_id: key, idempotency_key: key,
  }, settle, { admission: "developer" });
  expect((await applyWorldCommand(w, actor, {
    command: "ENTER_WORLD", arguments: {}, request_id: "base.enter", idempotency_key: "base.enter",
  }, settle, { admission: "developer" })).ok).toBe(true);
  w.players[actor.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), ...COSTS.ORG_CREATE };
  settle.mockClear();
  const help = await send("help", "base.help");
  const offer = help.observation?.affordances?.find((a) => a.action === "ORG_CREATE");
  expect(orgCreateExtraInfluence(w)).toBe(0);
  expect(offer?.requires).toEqual(COSTS.ORG_CREATE);
  expect(offer?.available).toBe(true);
  expect(help.observation?.available_actions).toContain("ORG_CREATE");
  expect(help.observation?.consequence).toContain(offer!.cmd);
  const result = await send(offer!.cmd, "base.form");
  expect(result.ok).toBe(true);
  expect(result.events?.find((e) => e.event_type === "BUDGET_CONSUMED")?.payload?.cost_paid).toEqual(COSTS.ORG_CREATE);
  expect(settle).toHaveBeenCalledTimes(1);
});

affordabilityCase("P01 formation advances the observed price immediately", async () => {
  const s = await affordabilityScene();
  s.w.players[actor.player_id].budgets.influence = s.base + s.premium;
  s.w.players[actor.player_id].budgets.compute = s.compute;
  const prior = s.premium;
  const offer = await affordabilityAdvertisement(s);
  expect((await s.send(offer.affordance.cmd)).ok).toBe(true);
  const next = orgCreateExtraInfluence(s.w);
  expect(next).toBeGreaterThan(prior);
  const after = await affordabilityAdvertisement(s);
  expect(after.affordance.requires).toEqual({ ...COSTS.ORG_CREATE, influence: s.base + next });
  expect(after.affordance.available).toBe(false);
  expect(after.help.observation?.available_actions).not.toContain("ORG_CREATE");
  expect(after.affordance.reason).toContain(`influence ${s.base + next}`);
});
