import { expect, it as clarificationMaterialityCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity, resolveVisibleEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";
type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
const BODY = "MATERIALITY_BODY_NOT_FOR_REPLAY";
function principal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", authentication_context: "test",
    protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"] };
}
async function scene() {
  const w: WorldRuntime = { world_id: "test.hosted-canonical.clarify-materiality", world_name: "Materiality",
    cycle: 0, sequence: 0, entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public.", exits: [], entities: [
        enrichEntity({ entity_id: "entity.relay-a", label: "relay-a", entity_type: "INFRASTRUCTURE", condition: 100 }),
        enrichEntity({ entity_id: "entity.relay-b", label: "relay-b", entity_type: "INFRASTRUCTURE", condition: 100 }),
      ] } }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [] };
  const actor = principal("sender"), a = principal("a"), b = principal("b"), settled: Settled[] = []; let key = 0;
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false) => {
    const id = `materiality-${++key}`;
    return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
      async (ev) => { settled.push(ev); return true; }, { admission: developer ? "developer" : "hosted" });
  };
  const ask = (line: string) => send(actor, "LOOK", { line }, true);
  for (const p of [actor, a, b]) expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
  w.players[a.player_id].handle = "local-a"; w.players[b.player_id].handle = "local-b";
  for (const p of [actor, a, b]) {
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await send(p, "OBSERVE")).ok).toBe(true);
  }
  expect(settled.length).toBeGreaterThan(0);
  return { w, actor, a, b, settled, send, ask };
}
type Rig = Awaited<ReturnType<typeof scene>>;
function projection(s: Rig) {
  // Exclude replay/activity/pending-choice/observation caches; include relevant canonical collections.
  const w = s.w;
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms, trades: w.trades,
    organizations: w.organizations, messages: w.messages, pending_messages: w.pending_messages ?? [],
    rumor: w.rumor, unsettled: w.unsettled, access_restrictions: w.access_restrictions ?? [],
    players: Object.fromEntries(Object.entries(w.players).map(([id,p]) => [id, {
      entered: p.entered, room_id: p.room_id, budgets: p.budgets, discovery: p.discovery, practice: p.practice }])) });
}
async function messageControl(s: Rig, recipient = s.b.player_id) {
  s.settled.length = 0;
  const r = await s.send(s.actor, "MESSAGE", { recipient_id: recipient, text: "control" });
  expect(r.ok).toBe(true);
  expect(s.settled).toContainEqual(expect.objectContaining({ event_type: "MESSAGE",
    payload: expect.objectContaining({ recipient_id: recipient }) }));
}
async function offerMessage(s: Rig) {
  await messageControl(s); s.settled.length = 0;
  const before = projection(s), r = await s.ask(`message local "${BODY}"`);
  expect(r.error?.code).toBe("AMBIGUOUS_TARGET"); expect(r.events ?? []).toEqual([]);
  expect(s.settled).toEqual([]); expect(projection(s)).toEqual(before);
  const pending = s.w.players[s.actor.player_id].pending_clarify;
  expect([...(pending?.choices ?? [])].sort()).toEqual(["local-a", "local-b"]);
  expect(JSON.stringify({ r, pending })).not.toContain(BODY);
  const label = pending!.choices[0];
  const selected = [s.a, s.b].filter((p) => s.w.players[p.player_id].handle === label);
  expect(selected).toHaveLength(1); return { pick: "1", selected: selected[0], label };
}
async function safeMessagePick(s: Rig, pick: string) {
  const before = projection(s); s.settled.length = 0;
  const r = await s.ask(pick);
  expect(r.ok).toBe(false); expect(r.error?.code).toBe("INVALID_REQUEST");
  expect(r.error?.message).toBe("Write the message again to the chosen Player.");
  expect(r.events ?? []).toEqual([]); expect(s.settled).toEqual([]);
  expect(projection(s)).toEqual(before);
  expect(s.w.players[s.actor.player_id].pending_clarify).toBeUndefined();
  expect(JSON.stringify({ r, players: s.w.players, messages: s.w.messages,
    replay: s.w.seen_idempotency })).not.toContain(BODY);
  await messageControl(s, s.w.players[s.b.player_id].entered ? s.b.player_id : s.a.player_id); // Fresh connected mutation.
}
function entity(s: Rig, id: string) {
  const e = s.w.rooms["room.hub"].entities.find((e) => e.entity_id === id);
  expect(e).toBeDefined(); return e!;
}
async function offerInspect(s: Rig) {
  const r = await s.ask("inspect relay"); expect(r.error?.code).toBe("AMBIGUOUS_TARGET");
  const choices = s.w.players[s.actor.player_id].pending_clarify?.choices ?? [];
  expect(choices).toHaveLength(2);
  const index = choices.findIndex((label) => {
    const r = resolveVisibleEntity(label, s.w.rooms["room.hub"].entities);
    return r.ok && r.entity.entity_id === "entity.relay-a";
  });
  expect(index).toBeGreaterThanOrEqual(0); return String(index + 1);
}
async function inspected(s: Rig, pick: string) {
  s.settled.length = 0; const r = await s.ask(pick); expect(r.ok).toBe(true);
  expect(r.events).toContainEqual(expect.objectContaining({ event_type: "INSPECT",
    payload: expect.objectContaining({ entity_id: "entity.relay-a" }) }));
  expect(s.settled).toContainEqual(expect.objectContaining({ event_type: "INSPECT",
    payload: expect.objectContaining({ entity_id: "entity.relay-a" }) }));
}
async function sealedPick(s: Rig, pick: string) {
  const before = projection(s); s.settled.length = 0; const r = await s.ask(pick);
  expect(r.ok).toBe(false);
  // Either stale invalidation or the existing executor's seal refusal is safe; neither may act.
  expect(["FORBIDDEN", "STALE_CLARIFICATION"]).toContain(r.error?.code);
  expect(r.events ?? []).toEqual([]); expect(s.settled).toEqual([]);
  expect(projection(s)).toEqual(before); return r.error!.code;
}

clarificationMaterialityCase("C25R01 unchanged recipient choices request body re-entry without replay", async () => {
  const s = await scene(), offered = await offerMessage(s);
  await safeMessagePick(s, offered.pick);
});

clarificationMaterialityCase("C25R02 selected recipient leaving cannot replay the discarded private body", async () => {
  const s = await scene(), offered = await offerMessage(s);
  expect((await s.send(offered.selected, "LEAVE_WORLD")).ok).toBe(true);
  expect(s.w.players[offered.selected.player_id].entered).toBe(false);
  expect(s.w.players[s.actor.player_id].pending_clarify).toBeDefined();
  await safeMessagePick(s, offered.pick);
});

clarificationMaterialityCase("C25R03 recycled recipient label cannot redirect a numeric pick into a MESSAGE", async () => {
  const s = await scene(), offered = await offerMessage(s);
  s.w.players[offered.selected.player_id].handle = "renamed-original";
  const replacement = principal("replacement");
  expect((await s.send(replacement, "ENTER_WORLD")).ok).toBe(true);
  s.w.players[replacement.player_id].handle = offered.label;
  expect((await s.send(replacement, "OBSERVE")).ok).toBe(true);
  await safeMessagePick(s, offered.pick);
});

clarificationMaterialityCase("C25S01 unchanged entity choice inspects the actual selected canonical entity", async () => {
  const s = await scene(), pick = await offerInspect(s);
  await inspected(s, pick);
});

clarificationMaterialityCase("C25S02 sealing the selected same-ID entity blocks numeric inspection without effects", async () => {
  const s = await scene(), pick = await offerInspect(s);
  entity(s, "entity.relay-a").inspect_restricted_until = s.w.cycle + 2;
  await sealedPick(s, pick);
  delete entity(s, "entity.relay-a").inspect_restricted_until;
  await inspected(s, await offerInspect(s));
});

clarificationMaterialityCase("C25S03 inspection seal blocks before expiry and permits a fresh pick at expiry", async () => {
  const s = await scene(); s.w.cycle = 9;
  const pick = await offerInspect(s);
  entity(s, "entity.relay-a").inspect_restricted_until = 10;
  await sealedPick(s, pick);
  s.w.cycle = 10;
  await inspected(s, await offerInspect(s));
});
