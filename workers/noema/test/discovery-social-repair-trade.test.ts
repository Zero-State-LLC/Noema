import { expect, test as socialDiscoveryCase, vi } from "vitest";
import { cloneBudgets, COSTS, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { STORAGE_CAPACITY } from "../src/construction";
import { applyPracticeCredits, emptyPractice, ENGINEER_TRACK } from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

let serial = 0;
const socialPrincipal = (name: string): PlayerPrincipal => ({
  player_id: `player.social-${name}`, agent_id: `agent.social-${name}`,
  session_id: `session.social-${name}`, controller_id: `controller.social-${name}`,
  controller_type: "agent", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1", authentication_context: "test",
});
async function socialScene() {
  const proposer = socialPrincipal("proposer"), counter = socialPrincipal("counter"), outsider = socialPrincipal("outsider");
  const w: WorldRuntime = {
    world_id: "test.social-discovery", world_name: "Social discovery", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: { "room.hub": {
      room_id: "room.hub", name: "Hub", description: "Public room", exits: [],
      entities: [
        enrichEntity({ entity_id: "entity.social-relay", label: "social-relay", entity_type: "INFRASTRUCTURE", infra_type: "generator", condition: 40, owner_id: outsider.player_id }),
        enrichEntity({ entity_id: "entity.social-node", label: "social-node", entity_type: "RESOURCE", stock_resource: "materials", stock_amount: 4, max_stock: 4, regen_rate: 0 }),
      ],
    } }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settled = vi.fn<Parameters<typeof applyWorldCommand>[3]>(async () => true);
  const dispatch = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = true) => {
    const key = `social.${++serial}`;
    return applyWorldCommand(w, p, { command, arguments: args, request_id: key, idempotency_key: key }, settled,
      developer ? { admission: "developer" } : undefined);
  };
  for (const p of [proposer, counter, outsider]) expect((await dispatch(p, "ENTER_WORLD", {}, false)).ok).toBe(true);
  for (const p of [proposer, counter, outsider]) w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(settled.mock.calls.length).toBeGreaterThan(0);
  settled.mockClear();
  const line = (p: PlayerPrincipal, text: string) => dispatch(p, "LOOK", { line: text });
  const affordance = async (p: PlayerPrincipal, action: string) => {
    const help = await line(p, "help");
    expect(help.ok).toBe(true);
    expect(help.events).toEqual([]);
    return help.observation!.affordances!.find((a) => a.action === action)!;
  };
  const projection = () => structuredClone({ sequence: w.sequence, players: Object.fromEntries(Object.entries(w.players).map(([id, pl]) => [id, { budgets: pl.budgets, room_id: pl.room_id }])), trades: w.trades, rooms: w.rooms, messages: w.messages, unsettled: w.unsettled });
  const refused = async (p: PlayerPrincipal, text: string, code: string) => {
    const before = projection(), calls = settled.mock.calls.length;
    const result = await line(p, text);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(code);
    expect(result.events ?? []).toEqual([]);
    expect(projection()).toEqual(before);
    expect(settled.mock.calls.length).toBe(calls);
  };
  return { w, proposer, counter, outsider, settled, line, affordance, refused };
}

socialDiscoveryCase("P03 trade offer and exact phase advertisements select the same trade and enforce roles", async () => {
  for (const phase of ["accept", "reject", "cancel"] as const) {
    const s = await socialScene();
    const offered = await s.affordance(s.proposer, "TRADE");
    expect(offered.target_id).toBe(s.counter.player_id);
    expect(offered.cmd).toBe("trade social-counter offer=energy:1 want=energy:1");
    const beforeProposer = { ...s.w.players[s.proposer.player_id].budgets };
    const proposal = await s.line(s.proposer, offered.cmd!);
    expect(proposal.ok).toBe(true);
    const trade = Object.values(s.w.trades)[0];
    expect(trade).toMatchObject({ proposer_id: s.proposer.player_id, counterparty_id: s.counter.player_id, status: "OPEN", reserved: { energy: 1 } });
    expect(s.w.players[s.proposer.player_id].budgets.energy).toBe(beforeProposer.energy - 1);
    expect(s.w.players[s.proposer.player_id].budgets.compute).toBe(beforeProposer.compute - 1);
    const actor = phase === "cancel" ? s.proposer : s.counter;
    const wrong = phase === "cancel" ? s.counter : s.proposer;
    const advertised = await s.affordance(actor, `TRADE_${phase.toUpperCase()}`);
    const topic = (await s.line(actor, "help trade")).observation!.consequence!.split("\n");
    const phaseForms = topic.find((x) => x.includes("accept <trade_id>"))!.trim().split(" · ");
    expect(phaseForms.find((x) => x.startsWith(`${phase} `))!.replace("<trade_id>", trade.trade_id)).toBe(advertised.cmd);
    expect(advertised.target_id).toBe(trade.trade_id);
    expect(advertised.cmd).toBe(`${phase} ${trade.trade_id}`);
    await s.refused(wrong, advertised.cmd!, "FORBIDDEN");
    await s.refused(s.outsider, advertised.cmd!, "FORBIDDEN");
    const beforeCounter = { ...s.w.players[s.counter.player_id].budgets };
    if (phase === "accept") {
      s.w.players[s.counter.player_id].budgets.compute = 0;
      await s.refused(actor, advertised.cmd!, "BUDGET_EXCEEDED");
      s.w.players[s.counter.player_id].budgets.compute = beforeCounter.compute;
    }
    const calls = s.settled.mock.calls.length;
    const result = await s.line(actor, advertised.cmd!);
    expect(result.ok).toBe(true);
    expect(trade.status).toBe(phase === "accept" ? "SETTLED" : phase === "reject" ? "REJECTED" : "CANCELLED");
    expect(trade.reserved).toEqual({});
    expect(result.events?.some((e) => e.event_type === `TRADE_${phase === "accept" ? "ACCEPTED" : phase === "reject" ? "REJECTED" : "CANCELLED"}` && e.payload?.trade_id === trade.trade_id)).toBe(true);
    expect(s.settled.mock.calls.length - calls).toBe(phase === "accept" ? 3 : 1);
    expect(s.w.players[s.counter.player_id].budgets.compute).toBe(beforeCounter.compute - (phase === "accept" ? 1 : 0));
    await s.refused(actor, advertised.cmd!, "TRADE_FAILED");
  }
});

socialDiscoveryCase("P03 trade topic offer and phase alternatives retain reservation and storage bounds", async () => {
  const s = await socialScene();
  const help = await s.line(s.proposer, "help trade");
  const lines = help.observation!.consequence!.split("\n");
  const offer = lines.find((x) => x.includes("trade <player> offer="))!.trim().replace("<player>", "social-counter");
  const phases = lines.find((x) => x.includes("accept <trade_id>"))!.trim().split(" · ");
  expect(phases).toEqual(["accept <trade_id>", "reject <trade_id>", "cancel <trade_id>"]);
  s.w.players[s.counter.player_id].budgets.storage = STORAGE_CAPACITY; // empty hold: no requested storage cargo
  const proposed = await s.line(s.proposer, offer);
  expect(proposed.ok).toBe(true);
  const trade = Object.values(s.w.trades)[0];
  expect(trade).toMatchObject({ offered: { energy: 3 }, requested: { storage: 1 }, reserved: { energy: 3 } });
  await s.refused(s.counter, phases[0].replace("<trade_id>", trade.trade_id), "BUDGET_EXCEEDED");
  expect(trade.status).toBe("OPEN");
  s.w.players[s.counter.player_id].budgets.storage = STORAGE_CAPACITY - 1;
  // storage: on a request is occupied cargo, so this actor can now give one unit.
  const accepted = await s.line(s.counter, phases[0].replace("<trade_id>", trade.trade_id));
  expect(accepted.ok).toBe(true);
  expect(trade.status).toBe("SETTLED");
  expect(s.w.players[s.proposer.player_id].budgets.storage).toBe(DEFAULT_BUDGETS.storage! - 1);
  expect(s.w.players[s.counter.player_id].budgets.energy).toBe(DEFAULT_BUDGETS.energy! + 3);
});

socialDiscoveryCase("P03 live danger raises advertised trade compute and preserves discoverability below cost", async () => {
  const s = await socialScene();
  const pl = s.w.players[s.proposer.player_id];
  // Controlled read-time danger evidence, not proof of permission to mint it.
  pl.danger_memory = { catalog_id: "social-memory-catalog/gc3-s1", edges: { [s.counter.player_id]: ["danger.p03"] }, at: { [s.counter.player_id]: { "danger.p03": s.w.cycle } } };
  pl.budgets.compute = 1;
  const offered = await s.affordance(s.proposer, "TRADE");
  expect(offered.cmd).toBe("trade social-counter offer=energy:1 want=energy:1");
  expect(offered.available).toBe(true); // discoverability is intentional even below executable cost
  expect(offered.requires?.compute).toBe(2);
  expect(offered.reason).toContain("TRADE_CAUTION");
  await s.refused(s.proposer, offered.cmd!, "BUDGET_EXCEEDED");
  pl.budgets.compute = 2;
  const result = await s.line(s.proposer, offered.cmd!);
  expect(result.ok).toBe(true);
  expect(result.events?.some((e) => e.event_type === "TRADE_PROPOSED" && e.payload?.counterparty_id === s.counter.player_id && e.payload?.caution === "TRADE_CAUTION")).toBe(true);
  expect(pl.budgets.compute).toBe(0);
  expect(Object.values(s.w.trades)[0].reserved).toEqual({ energy: 1 });
});

socialDiscoveryCase("P03 advertised overhaul requires practiced Engineer, held cargo and exact energy", async () => {
  const s = await socialScene();
  const pl = s.w.players[s.proposer.player_id];
  pl.budgets.storage = STORAGE_CAPACITY - 1;
  await s.refused(s.proposer, "repair social-relay overhaul", "FORBIDDEN");
  pl.practice = applyPracticeCredits(emptyPractice(), [
    { track_id: ENGINEER_TRACK, unit: "e1", recognition_unit: "entity.one" },
    { track_id: ENGINEER_TRACK, unit: "e2", recognition_unit: "entity.two" },
    { track_id: ENGINEER_TRACK, unit: "e3", recognition_unit: "entity.three" },
  ], s.w.cycle);
  const a = await s.affordance(s.proposer, "REPAIR");
  const overhaul = (await s.line(s.proposer, "help")).observation!.affordances!.find((x) => x.cmd === "repair social-relay overhaul")!;
  expect(a.target_id).toBe("entity.social-relay");
  expect(overhaul).toMatchObject({ target_id: "entity.social-relay", extent: "overhaul", available: true });
  const topic = (await s.line(s.proposer, "help repair")).observation!.consequence!.split("\n");
  expect(topic).toContain("  repair <visible infrastructure>");
  expect(topic).toContain("  repair <visible infrastructure> overhaul");
  const ordinary = topic.find((x) => x.trim() === "repair <visible infrastructure>")!.trim().replace("<visible infrastructure>", "social-relay");
  const ordinaryBefore = { ...pl.budgets }, ordinaryCalls = s.settled.mock.calls.length;
  const ordinaryResult = await s.line(s.proposer, ordinary);
  expect(ordinaryResult.ok).toBe(true);
  // No workshop is present: independent ordinary personal price, including held cargo.
  expect(pl.budgets.energy).toBe(ordinaryBefore.energy! - 3);
  expect(pl.budgets.compute).toBe(ordinaryBefore.compute! - 2);
  expect(pl.budgets.storage).toBe(ordinaryBefore.storage! + 1);
  expect(ordinaryResult.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
  expect(ordinaryResult.events?.[0].payload).toMatchObject({ player_id: s.proposer.player_id, reason: "REPAIR", cost_paid: { energy: 3, compute: 2, storage: 1 } });
  expect(ordinaryResult.events?.[1].payload).toMatchObject({ entity_id: "entity.social-relay", operation: "REPAIR" });
  expect(s.settled.mock.calls.slice(ordinaryCalls).map(([e]) => e.event_id)).toEqual([ordinaryResult.events![1].event_id]);
  expect(s.w.rooms["room.hub"].entities![0].condition).toBeGreaterThan(40);
  const conditionBeforeOverhaul = s.w.rooms["room.hub"].entities![0].condition!;
  pl.budgets.storage = STORAGE_CAPACITY - 1; // replenish one held unit after normal repair
  pl.budgets.energy = (overhaul.requires?.energy || 0) - 1;
  await s.refused(s.proposer, overhaul.cmd!, "BUDGET_EXCEEDED");
  pl.budgets.energy = overhaul.requires!.energy!;
  pl.budgets.storage = STORAGE_CAPACITY;
  await s.refused(s.proposer, overhaul.cmd!, "BUDGET_EXCEEDED");
  pl.budgets.storage = STORAGE_CAPACITY - 1;
  const before = { ...pl.budgets }, calls = s.settled.mock.calls.length;
  const done = await s.line(s.proposer, overhaul.cmd!);
  expect(done.ok).toBe(true);
  expect(done.events?.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.entity_id === "entity.social-relay" && e.payload?.operation === "REPAIR")).toBe(true);
  expect(s.w.rooms["room.hub"].entities![0].condition).toBeGreaterThan(conditionBeforeOverhaul);
  expect(pl.budgets.energy).toBe(before.energy! - overhaul.requires!.energy!);
  expect(pl.budgets.compute).toBe(before.compute! - overhaul.requires!.compute!);
  expect(pl.budgets.storage).toBe(before.storage! + 1);
  expect(s.settled.mock.calls.length).toBe(calls + 1);
  // Personal REPAIR is permitted on a visible asset owned by another Player.
  expect(s.w.rooms["room.hub"].entities![0].owner_id).toBe(s.outsider.player_id);
});

socialDiscoveryCase("P03 duplicate entity labels refuse target selection without settling", async () => {
  const s = await socialScene();
  s.w.rooms["room.hub"].entities!.push(enrichEntity({ entity_id: "entity.social-node-copy", label: "social-node", entity_type: "RESOURCE", stock_resource: "materials", stock_amount: 4, max_stock: 4, regen_rate: 0 }));
  const before = s.w.rooms["room.hub"].entities!.map((e) => ({ id: e.entity_id, stock: e.stock_amount }));
  const sequence = s.w.sequence, calls = s.settled.mock.calls.length;
  const hint = await s.line(s.proposer, "help");
  const candidates = hint.observation!.affordances!.filter((a) => a.action === "HARVEST" && a.cmd === "harvest social-node 1");
  expect(candidates.map((a) => a.target_id)).toEqual(["entity.social-node", "entity.social-node-copy"]);
  const attempt = await s.line(s.proposer, candidates[0].cmd!);
  expect(attempt.error?.code).toBe("AMBIGUOUS_TARGET");
  expect(attempt.events ?? []).toEqual([]);
  expect(s.w.sequence).toBe(sequence);
  expect(s.settled.mock.calls.length).toBe(calls);
  expect(s.w.rooms["room.hub"].entities!.map((e) => ({ id: e.entity_id, stock: e.stock_amount }))).toEqual(before);
  // The producer's identical command cannot certify either canonical ID; do not silently pick one.
});

socialDiscoveryCase("P03 harvest topic default/amount and message topic reach actual target with refusal controls", async () => {
  const s = await socialScene();
  const topic = (await s.line(s.proposer, "help harvest")).observation!.consequence!.split("\n");
  const form = topic.find((x) => x.includes("harvest <resource-node>"))!.trim();
  expect(form).toBe("harvest <resource-node> [amount]");
  const nodeId = s.w.rooms["room.hub"].entities![1].entity_id;
  const stock = () => s.w.rooms["room.hub"].entities!.find((e) => e.entity_id === nodeId)!.stock_amount;
  const a = await s.affordance(s.proposer, "HARVEST");
  expect(a).toMatchObject({ target_id: nodeId, cmd: "harvest social-node 1", available: true });
  const p = s.w.players[s.proposer.player_id];
  p.budgets.storage = 0;
  await s.refused(s.proposer, a.cmd!, "BUDGET_EXCEEDED");
  p.budgets.storage = STORAGE_CAPACITY;
  const first = await s.line(s.proposer, form.replace("<resource-node> [amount]", "social-node"));
  expect(first.ok).toBe(true);
  expect(first.events?.some((e) => e.event_type === "RESOURCE_TRANSFER" && e.payload?.from_id === nodeId && e.payload?.amount === 1)).toBe(true);
  expect(stock()).toBe(3);
  const harvestBefore = { ...p.budgets }, harvestCalls = s.settled.mock.calls.length;
  const second = await s.line(s.proposer, form.replace("<resource-node>", "social-node").replace("[amount]", "2"));
  expect(second.ok).toBe(true);
  expect(stock()).toBe(1);
  expect(p.budgets.energy).toBe(harvestBefore.energy! - 2);
  expect(p.budgets.compute).toBe(harvestBefore.compute! - 1);
  expect(p.budgets.storage).toBe(harvestBefore.storage! - 2);
  expect(second.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "RESOURCE_TRANSFER", "ENTITY_UPDATE"]);
  expect(second.events?.[0].payload).toMatchObject({ player_id: s.proposer.player_id, reason: "HARVEST", cost_paid: { energy: 2, compute: 1 } });
  expect(second.events?.[1].payload).toMatchObject({ kind: "harvest", from_id: nodeId, to_id: s.proposer.player_id, resource: "materials", amount: 2 });
  expect(second.events?.[2].payload).toMatchObject({ entity_id: nodeId, field: "stock_amount", to: 1, operation: "HARVEST" });
  expect(s.settled.mock.calls.slice(harvestCalls).map(([e]) => e.event_id)).toEqual([second.events![2].event_id]);
  // The post-harvest half-influence presentation is normalized on the next read.
  await s.line(s.proposer, "help");
  await s.refused(s.proposer, "harvest social-node 2", "FORBIDDEN");
  expect(p.budgets.storage).toBe(STORAGE_CAPACITY - 3);
  const msgForm = (await s.line(s.proposer, "help message")).observation!.consequence!.split("\n").find((x) => x.includes("message <player>"))!.trim();
  const cmd = msgForm.replace("<player>", "social-counter").replace('"text"', '"p03-note"');
  const beforeCompute = p.budgets.compute!, calls = s.settled.mock.calls.length;
  const delivered = await s.line(s.proposer, cmd);
  expect(delivered.ok).toBe(true);
  expect(delivered.events?.some((e) => e.event_type === "MESSAGE" && e.payload?.recipient_id === s.counter.player_id && e.payload?.text === "p03-note")).toBe(true);
  expect(p.budgets.compute).toBe(beforeCompute - COSTS.MESSAGE.compute!);
  expect(s.settled.mock.calls.length).toBeGreaterThan(calls);
  const sendEvent = delivered.events!.find((e) => e.event_type === "MESSAGE")!;
  const messageId = String(sendEvent.payload!.message_id);
  // Both principals occupy the same room; the real delivery boundary is this
  // command's MESSAGE_DELIVERED, not a fabricated due-cycle or a send event.
  expect(s.w.pending_messages?.find((m) => m.message_id === messageId)).toBeUndefined();
  expect(delivered.events).toContainEqual(expect.objectContaining({ event_type: "MESSAGE_DELIVERED", payload: expect.objectContaining({ message_id: messageId, recipient_id: s.counter.player_id, delivered_cycle: s.w.cycle }) }));
  const retained = s.w.messages.filter((m) => m.message_id === messageId);
  expect(retained).toHaveLength(1);
  expect(retained[0]).toMatchObject({ sender_id: s.proposer.player_id, recipient_id: s.counter.player_id, text: "p03-note", status: "DELIVERED" });
  const receiver = await s.line(s.counter, "look");
  const bystander = await s.line(s.outsider, "look");
  expect(receiver.ok).toBe(true);
  expect(bystander.ok).toBe(true);
  expect(receiver.observation?.messages).toContainEqual(expect.objectContaining({ message_id: messageId, sender_id: s.proposer.player_id, text: "p03-note" }));
  expect(bystander.observation?.messages?.some((m) => m.message_id === messageId || m.text === "p03-note")).toBe(false);
  p.budgets.compute = 0;
  await s.refused(s.proposer, cmd, "BUDGET_EXCEEDED");
});
