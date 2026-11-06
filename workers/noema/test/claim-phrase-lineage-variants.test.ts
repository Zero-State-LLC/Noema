import { expect, test as lineageCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

// Public reducer seam: text grammar via developer admission versus structured MESSAGE.
// Local fixture settlement is not hosted persistence or canonical database settlement.
const SUBJECT = "entity.signal-relay";
const ORIGINAL = "Signal relay needs repair";
const CHANGED = "Signal relay is ready";
const person = (handle: string): PlayerPrincipal => ({
  player_id: `player.${handle}`, agent_id: `agent.${handle}`,
  session_id: `session.${handle}`, controller_id: `controller.${handle}`,
  controller_type: "agent", protocol_version: "1", authentication_context: "test",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
});
const sender = person("lineage-sender");
const receiver = person("lineage-receiver");
const observer = person("lineage-observer");
let serial = 0;
async function act(w: WorldRuntime, p: PlayerPrincipal, command: string,
  args: Record<string, unknown> = {}, developer = false) {
  const id = `lineage.${++serial}`;
  return applyWorldCommand(w, p, { request_id: id, idempotency_key: id,
    command, arguments: args }, async () => true,
  developer ? { admission: "developer" } : undefined);
}
async function scene() {
  const w: WorldRuntime = {
    world_id: "test.claim-lineage", world_name: "Lineage fixture", cycle: 0,
    sequence: 0, entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Open hub.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [enrichEntity({ entity_id: SUBJECT, label: "signal relay",
          entity_type: "INFRASTRUCTURE", condition: 25 })] },
      "room.east": { room_id: "room.east", name: "East", description: "Open east.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    }, players: {}, trades: {}, messages: [], organizations: {},
    seen_idempotency: {}, unsettled: [],
  };
  for (const p of [sender, receiver, observer]) {
    expect((await act(w, p, "ENTER_WORLD")).ok).toBe(true);
  }
  expect((await act(w, receiver, "MOVE", { direction: "east" })).ok).toBe(true);
  for (const p of [sender, receiver, observer]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  return w;
}
type Variant = "report-about" | "repeat-same" | "repeat-changed";
type Carrier = "line" | "outer";
async function exercise(variant: Variant, carrier: Carrier, structured: boolean) {
  const w = await scene();
  let parent: string | undefined;
  let parentTx: string | undefined;
  if (variant !== "report-about") {
    // A genuinely held root, minted at the same public command seam (not injected state).
    const seed = await act(w, sender, "MESSAGE", {
      recipient_id: sender.player_id, text: ORIGINAL, as_claim: true, subject_ref: SUBJECT,
    });
    expect(seed.ok, seed.error?.code).toBe(true);
    const minted = seed.events?.find(e => e.event_type === "MESSAGE")?.payload?.claim_id;
    parent = typeof minted === "string" ? minted : undefined;
    expect(typeof parent).toBe("string");
    if (typeof parent !== "string") throw new Error("Seed claim missing");
    expect(w.rumor?.holders[sender.player_id]).toContain(parent);
    parentTx = w.rumor?.transmissions.find(t => t.claim_id === parent
      && t.recipient_ref === sender.player_id)?.transmission_id;
    expect(typeof parentTx).toBe("string");
    w.players[sender.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  const body = variant === "repeat-changed" ? CHANGED : ORIGINAL;
  const phrase = variant === "report-about"
    ? `report ${receiver.player_id} "${body}" about ${SUBJECT}`
    : `repeat ${receiver.player_id} "${body}" from ${parent}`;
  const args: Record<string, unknown> = { recipient_id: receiver.player_id,
    text: body, as_claim: true,
    ...(variant === "report-about" ? { subject_ref: SUBJECT } : { parent_claim_id: parent }) };
  const env: CommandEnvelope = {
    request_id: `lineage.send.${++serial}`, idempotency_key: `lineage.send.${serial}`,
    command: structured ? "MESSAGE" : carrier === "line" ? "LOOK" : phrase,
    arguments: structured ? args : carrier === "line" ? { line: phrase } : {},
  };
  const before = w.sequence;
  const compute = w.players[sender.player_id].budgets.compute;
  const accepted = await applyWorldCommand(w, sender, env, async () => true,
    structured ? undefined : { admission: "developer" });
  expect(accepted.ok, accepted.error?.code).toBe(true);
  expect(accepted.events?.map(e => e.event_type)).toEqual(["MESSAGE"]);
  expect(w.sequence - before).toBe(1);
  expect(compute - w.players[sender.player_id].budgets.compute).toBe(1);
  const pending = w.pending_messages?.[0];
  expect(w.pending_messages).toHaveLength(1);
  expect(pending).toMatchObject({ sender_id: sender.player_id,
    recipient_id: receiver.player_id, text: body, sent_cycle: w.cycle,
    deliver_at_cycle: w.cycle + 1 });
  const claim = pending!.claim!;
  expect(claim).toMatchObject({ subject_ref: SUBJECT, content: body,
    originator_ref: sender.player_id, visibility: "PRIVATE" });
  expect(accepted.events?.[0]?.payload).toMatchObject({
    message_id: pending!.message_id, claim_id: claim.claim_id,
    origin_claim_id: claim.origin_claim_id, recipient_id: receiver.player_id });
  if (variant === "report-about") {
    expect(claim.origin_claim_id).toBe(claim.claim_id);
    expect(claim.derived_from).toBeUndefined();
  } else if (variant === "repeat-same") {
    expect(claim.claim_id).toBe(parent);
    expect(claim.origin_claim_id).toBe(parent);
    expect(claim.derived_from).toBeUndefined();
    expect(claim.parent_transmission_id).toBe(parentTx);
  } else {
    expect(claim.claim_id).not.toBe(parent);
    expect(claim.derived_from).toBe(parent);
    expect(claim.origin_claim_id).toBe(parent);
    expect(claim.parent_transmission_id).toBe(parentTx);
  }
  expect(w.rumor?.claims[claim.claim_id]).toMatchObject({
    claim_id: claim.claim_id, subject_ref: SUBJECT, origin_claim_id: claim.origin_claim_id });
  expect(w.rumor?.holders[sender.player_id]).toContain(claim.claim_id);
  expect(w.rumor?.holders[receiver.player_id] ?? []).not.toContain(claim.claim_id);
  expect(w.rumor?.holders[observer.player_id] ?? []).not.toContain(claim.claim_id);
  expect(w.messages.filter(m => m.message_id === pending!.message_id)).toEqual([]);
  const early = await act(w, receiver, "LOOK");
  expect(JSON.stringify(early.observation?.messages ?? [])).not.toContain(body);
  for (const p of [sender, receiver, observer]) {
    w.players[p.player_id].wait_until_cycle = pending!.deliver_at_cycle;
  }
  const due = await act(w, sender, "WAIT");
  expect(due.ok).toBe(true);
  const delivered = due.events?.filter(e => e.event_type === "MESSAGE_DELIVERED"
    && e.payload?.message_id === pending!.message_id) ?? [];
  expect(delivered).toHaveLength(1);
  expect(delivered[0].payload).toMatchObject({ claim_id: claim.claim_id,
    recipient_id: receiver.player_id, delivered_cycle: pending!.deliver_at_cycle });
  expect(w.pending_messages ?? []).toEqual([]);
  expect(w.messages.filter(m => m.message_id === pending!.message_id)).toHaveLength(1);
  expect(w.messages.find(m => m.message_id === pending!.message_id)).toMatchObject({
    text: body, recipient_id: receiver.player_id, status: "DELIVERED" });
  const received = await act(w, receiver, "LOOK");
  const unseen = await act(w, observer, "LOOK");
  expect(received.observation?.messages).toContainEqual(expect.objectContaining({
    message_id: pending!.message_id, text: body }));
  expect(JSON.stringify(unseen.observation?.messages ?? [])).not.toContain(body);
  expect(w.rumor?.holders[receiver.player_id]).toContain(claim.claim_id);
  expect(w.rumor?.holders[observer.player_id] ?? []).not.toContain(claim.claim_id);
  const tx = w.rumor?.transmissions.filter(t => t.message_id === pending!.message_id) ?? [];
  expect(tx).toHaveLength(1);
  expect(tx[0]).toMatchObject({ claim_id: claim.claim_id, sender_ref: sender.player_id,
    recipient_ref: receiver.player_id, parent_transmission_id: parentTx,
    received_cycle: pending!.deliver_at_cycle });
  expect(w.rumor?.claims[claim.claim_id]).toMatchObject({ subject_ref: SUBJECT,
    derived_from: variant === "repeat-changed" ? parent : undefined,
    origin_claim_id: variant === "report-about" ? claim.claim_id : parent });
  return { text: body, subject: claim.subject_ref, origin: claim.origin_claim_id === claim.claim_id
    ? "root" : "forwarded", derived: Boolean(claim.derived_from),
    sameClaim: variant === "repeat-same" ? claim.claim_id === parent : undefined,
    parentTx: Boolean(tx[0].parent_transmission_id),
    deliveryCount: delivered.length, transmissionCount: tx.length,
    recipientCount: w.messages.filter(m => m.message_id === pending!.message_id).length };
}
for (const variant of ["report-about", "repeat-same", "repeat-changed"] as const) {
  for (const carrier of ["line", "outer"] as const) {
    lineageCase(`[lineage] ${variant} ${carrier} matches structured delayed claim`, async () => {
      const text = await exercise(variant, carrier, false);
      const typed = await exercise(variant, carrier, true);
      expect(text).toEqual(typed);
    });
  }
}
