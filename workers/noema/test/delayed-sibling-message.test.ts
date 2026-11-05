import { expect, test as delayedSiblingCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { DELAYED_MESSAGE } from "../src/communication";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

type Verb = "report" | "repeat" | "pass" | "share";
type Carrier = "line" | "outer";
const BODY = "DELAYED_SIBLING_PRIVATE_BODY";
const principal = (name: string): PlayerPrincipal => ({
  player_id: `player.${name}`, agent_id: `agent.${name}`,
  session_id: `session.${name}`, controller_id: `controller.${name}`,
  controller_type: "agent", protocol_version: "1", authentication_context: "test",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
});
const sender = principal("delay-sender");
const recipient = principal("delay-recipient");
const bystander = principal("delay-bystander");
let serial = 0;
async function run(w: WorldRuntime, p: PlayerPrincipal, command: string,
  args: Record<string, unknown> = {}, developer = false) {
  const key = `delay.${++serial}`;
  return applyWorldCommand(w, p,
    { request_id: key, idempotency_key: key, command, arguments: args },
    async () => true, developer ? { admission: "developer" } : undefined);
}
async function scene(): Promise<{ w: WorldRuntime; held: string }> {
  const w: WorldRuntime = {
    world_id: "test.delayed-sibling", world_name: "Delayed sibling fixture",
    cycle: 0, sequence: 0, entry_room_id: "room.hub",
    rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Open hub.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [enrichEntity({ entity_id: "entity.delayed-relay", label: "relay",
          entity_type: "INFRASTRUCTURE", condition: 25 })] },
      "room.east": { room_id: "room.east", name: "East", description: "Open east.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {},
    seen_idempotency: {}, unsettled: [],
  };
  for (const p of [sender, recipient, bystander]) {
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
  }
  expect((await run(w, recipient, "MOVE", { direction: "east" })).ok).toBe(true);
  const seeded = await run(w, sender, "MESSAGE", {
    recipient_id: sender.player_id, text: BODY, as_claim: true,
  });
  expect(seeded.ok).toBe(true);
  const held = seeded.events?.find(e => e.event_type === "MESSAGE")?.payload?.claim_id;
  expect(typeof held).toBe("string");
  if (typeof held !== "string") throw new Error("Fixture did not create a held claim");
  expect(w.rumor?.claims[held]?.content).toBe(BODY);
  expect(w.rumor?.holders[sender.player_id]).toContain(held);
  for (const p of [sender, recipient, bystander]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  return { w, held };
}
function action(verb: Verb, carrier: Carrier, held: string, structured: boolean): CommandEnvelope {
  const forwarding = verb === "pass" || verb === "share";
  const args: Record<string, unknown> = forwarding
    ? { recipient_id: recipient.player_id, text: held, parent_claim_id: held, as_claim: true }
    : { recipient_id: recipient.player_id, text: BODY, as_claim: true };
  const phrase = forwarding
    ? `${verb} ${recipient.player_id} ${held}`
    : `${verb} ${recipient.player_id} "${BODY}"`;
  return {
    request_id: "delay.action", idempotency_key: "delay.action",
    command: structured ? "MESSAGE" : carrier === "line" ? "LOOK" : phrase,
    arguments: structured ? args : carrier === "line" ? { line: phrase } : {},
  };
}
function effects(w: WorldRuntime) {
  return structuredClone({
    cycle: w.cycle, sequence: w.sequence, messages: w.messages,
    pending: w.pending_messages ?? [], rumor: w.rumor,
    budgets: Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.budgets])),
    unsettled: w.unsettled,
  });
}
async function queue(verb: Verb, carrier: Carrier, structured: boolean) {
  const { w, held } = await scene();
  const env = action(verb, carrier, held, structured);
  const computeBefore = w.players[sender.player_id].budgets.compute;
  const beforeSequence = w.sequence;
  const accepted = await applyWorldCommand(w, sender, env, async () => true,
    structured ? undefined : { admission: "developer" });
  expect(accepted.ok, accepted.error?.code).toBe(true);
  // Distinguishing assertion precedes the positive receipt checks.
  expect(accepted.events?.map(e => e.event_type)).toEqual(["MESSAGE"]);
  expect(accepted.observation?.consequence).toBe(DELAYED_MESSAGE);
  expect(w.messages.filter(m => m.recipient_id === recipient.player_id)).toEqual([]);
  expect(w.pending_messages).toHaveLength(1);
  const pending = w.pending_messages![0];
  expect(pending).toMatchObject({ sender_id: sender.player_id,
    recipient_id: recipient.player_id, text: BODY, sent_cycle: w.cycle,
    deliver_at_cycle: w.cycle + 1 });
  expect(pending.claim?.content).toBe(BODY);
  const claim = pending.claim!;
  expect(w.rumor?.claims[claim.claim_id]?.content).toBe(BODY);
  expect(w.rumor?.holders[sender.player_id]).toContain(claim.claim_id);
  expect(w.rumor?.holders[recipient.player_id] ?? []).not.toContain(claim.claim_id);
  if (verb === "pass" || verb === "share") {
    expect(claim.claim_id).toBe(held);
    expect(claim.origin_claim_id).toBe(held);
  } else {
    expect(claim.origin_claim_id).toBe(claim.claim_id);
    expect(claim.originator_ref).toBe(sender.player_id);
  }
  const beforeRead = await run(w, recipient, "LOOK");
  expect(beforeRead.ok).toBe(true);
  expect(JSON.stringify(beforeRead.observation?.messages ?? [])).not.toContain(BODY);
  // LOOK emits observation events without advancing ledger sequence.
  expect(w.sequence - beforeSequence).toBe(accepted.events?.length);
  expect(w.cycle).toBe(pending.sent_cycle);
  const receipt = {
    events: accepted.events!.map(e => e.event_type),
    sequenceDelta: w.sequence - beforeSequence,
    computeDebit: computeBefore - w.players[sender.player_id].budgets.compute,
    recipient: pending.recipient_id, text: pending.text,
    delay: pending.deliver_at_cycle - pending.sent_cycle,
    claimContent: claim.content, claimOrigin: claim.originator_ref,
    forwarding: claim.claim_id === held,
  };
  return { w, held, env, accepted, pending, receipt, developer: !structured };
}
type Queued = Awaited<ReturnType<typeof queue>>;
async function advance(w: WorldRuntime, target: number) {
  for (const p of [sender, recipient, bystander]) w.players[p.player_id].wait_until_cycle = target;
  const r = await run(w, sender, "WAIT");
  expect(r.ok).toBe(true);
  expect(w.cycle).toBe(target);
  return r;
}
async function arrive(q: Queued) {
  const { w, pending } = q;
  const due = await advance(w, pending.deliver_at_cycle);
  const delivered = due.events?.filter(e => e.event_type === "MESSAGE_DELIVERED"
    && e.payload?.message_id === pending.message_id) ?? [];
  expect(delivered).toHaveLength(1);
  expect(delivered[0].payload).toMatchObject({ recipient_id: recipient.player_id,
    claim_id: pending.claim!.claim_id, delivered_cycle: pending.deliver_at_cycle });
  expect(w.pending_messages ?? []).toEqual([]);
  expect(w.messages.filter(m => m.message_id === pending.message_id)).toHaveLength(1);
  expect(w.messages.find(m => m.message_id === pending.message_id)).toMatchObject({
    recipient_id: recipient.player_id, sender_id: sender.player_id, text: BODY,
    status: "DELIVERED", delivered_cycle: pending.deliver_at_cycle,
  });
  const receiver = await run(w, recipient, "LOOK");
  const other = await run(w, bystander, "LOOK");
  expect(receiver.ok).toBe(true);
  expect(other.ok).toBe(true);
  expect(receiver.observation?.messages).toContainEqual(expect.objectContaining({
    message_id: pending.message_id, sender_id: sender.player_id, text: BODY,
  }));
  expect(JSON.stringify(other.observation?.messages ?? [])).not.toContain(BODY);
  // Sender legitimately owns the seeded claim; never forbid its retained copy.
  expect(w.rumor?.holders[recipient.player_id]).toContain(pending.claim!.claim_id);
  expect(w.rumor?.holders[bystander.player_id] ?? []).not.toContain(pending.claim!.claim_id);
  const tx = w.rumor?.transmissions.filter(t => t.message_id === pending.message_id) ?? [];
  expect(tx).toHaveLength(1);
  expect(tx[0]).toMatchObject({ claim_id: pending.claim!.claim_id,
    sender_ref: sender.player_id, recipient_ref: recipient.player_id,
    received_cycle: pending.deliver_at_cycle });
  const receipt = { recipient: recipient.player_id, text: BODY,
    deliveredAt: pending.deliver_at_cycle, deliveryEvents: delivered.length,
    deliveries: w.messages.filter(m => m.message_id === pending.message_id).length,
    transmissions: tx.length, queueLength: (w.pending_messages ?? []).length };
  return receipt;
}
async function replay(q: Queued) {
  const before = effects(q.w);
  let settlements = 0;
  const r = await applyWorldCommand(q.w, sender, q.env, async () => {
    settlements++;
    throw new Error("A cached replay must not settle again");
  }, q.developer ? { admission: "developer" } : undefined);
  expect(r.ok).toBe(true);
  expect(settlements).toBe(0);
  expect(effects(q.w)).toEqual(before);
  // A cached result may contain historical send events; they are not new settlement.
}
async function scenario(verb: Verb, carrier: Carrier) {
  const text = await queue(verb, carrier, false);
  const canonical = await queue(verb, carrier, true);
  expect(text.receipt).toEqual(canonical.receipt);
  await replay(text);
  await replay(canonical);
  expect(await arrive(text)).toEqual(await arrive(canonical));
  await replay(text);
  await replay(canonical);
  for (const q of [text, canonical]) {
    const next = await advance(q.w, q.w.cycle + 1);
    expect(next.events?.filter(e => e.event_type === "MESSAGE_DELIVERED"
      && e.payload?.message_id === q.pending.message_id) ?? []).toEqual([]);
    expect(q.w.messages.filter(m => m.message_id === q.pending.message_id)).toHaveLength(1);
    expect(q.w.rumor?.transmissions.filter(t => t.message_id === q.pending.message_id)).toHaveLength(1);
  }
}

delayedSiblingCase("[D1] structured report queues once and replay cannot debit twice", async () => {
  const q = await queue("report", "line", true);
  expect(q.receipt.delay).toBe(1);
  expect(q.receipt.computeDebit).toBe(1);
  await replay(q);
});

delayedSiblingCase("[D2] structured claim arrives once at due cycle with recipient-only lineage", async () => {
  const q = await queue("report", "line", true);
  await arrive(q);
  await replay(q);
  const next = await advance(q.w, q.w.cycle + 1);
  expect(next.events?.filter(e => e.event_type === "MESSAGE_DELIVERED"
    && e.payload?.message_id === q.pending.message_id) ?? []).toEqual([]);
  expect(q.w.messages.filter(m => m.message_id === q.pending.message_id)).toHaveLength(1);
  expect(q.w.rumor?.transmissions.filter(t => t.message_id === q.pending.message_id)).toHaveLength(1);
});

delayedSiblingCase("[D3] report line matches delayed structured claim delivery", async () => {
  await scenario("report", "line");
});

delayedSiblingCase("[D4] report outer command matches delayed structured claim delivery", async () => {
  await scenario("report", "outer");
});
