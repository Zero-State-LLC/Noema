import { expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

type Settle = Parameters<typeof applyWorldCommand>[3];
type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
function world(): WorldRuntime {
  return { world_id: "test.hosted-canonical.attest-next10", world_name: "Boundary Reach",
    cycle: 0, sequence: 0, entry_room_id: "room.a",
    rooms: {
      "room.a": { room_id: "room.a", name: "Archive", description: "Local records.", exits: [], entities: [
        enrichEntity({ entity_id: "entity.ledger", label: "local-ledger", entity_type: "ARTIFACT" }),
        enrichEntity({ entity_id: "entity.local", label: "local-relay", entity_type: "INFRASTRUCTURE", condition: 80 }),
      ] },
      "room.b": { room_id: "room.b", name: "Distant Yard", description: "Public infrastructure.", exits: [], entities: [
        enrichEntity({ entity_id: "entity.remote", label: "remote-relay", entity_type: "INFRASTRUCTURE", condition: 80 }),
      ] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [] };
}
async function scene() {
  const w = world();
  const p: PlayerPrincipal = { player_id: "player.boundary", agent_id: "agent.boundary", session_id: "sess.boundary",
    controller_id: "ctrl.agent.boundary", controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"], protocol_version: "1", authentication_context: "test" };
  let key = 0;
  const envelope = (command: string, args: Record<string, unknown> = {}): CommandEnvelope => {
    const id = `boundary-${++key}`;
    return { request_id: id, idempotency_key: id, command, arguments: args };
  };
  const send = (command: string, args: Record<string, unknown> = {}, settle: Settle = async () => true) =>
    applyWorldCommand(w, p, envelope(command, args), settle);
  expect((await send("ENTER_WORLD")).ok).toBe(true);
  expect((await send("OBSERVE")).ok).toBe(true); // Finish discovery initialization before snapshots.
  return { w, p, envelope, send };
}
function rows(r: Result) { return (r.observation?.affordances || []).filter((a) => a.operation === "ATTEST"); }
function pick(r: Result, subject = "entity.local") {
  const hit = rows(r).find((a) => a.target_id === "entity.ledger" && a.subject_id === subject && a.archive_claim === "OPERATING");
  expect(hit).toBeDefined();
  return hit!;
}
function projection(w: WorldRuntime) {
  // Excludes replay caches, activity, pending-choice bookkeeping and all unlisted world fields.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms, unsettled: w.unsettled,
    evidence_fragments: w.evidence_fragments, players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])) });
}
type Scene = Awaited<ReturnType<typeof scene>>;
async function follow(s: Scene, cmd: string, settle: Settle = async () => true, outer = false) {
  return applyWorldCommand(s.w, s.p, s.envelope(outer ? cmd : "LOOK", outer ? {} : { line: cmd }), settle, { admission: "developer" });
}

it("N10.01 distant-only available_actions excludes ATTEST", async () => {
  const s = await scene();
  s.w.rooms["room.a"].entities = s.w.rooms["room.a"].entities.filter((e) => e.entity_id !== "entity.local");
  const r = await s.send("OBSERVE");
  const hit = pick(r, "entity.remote");
  expect(hit.available).toBe(false);
  expect(hit.reason).toBe("You must be in the same room to attest.");
  expect(r.observation?.available_actions || []).not.toContain("ATTEST");
});

it("N10.02 mixed subjects preserve the executable local choice", async () => {
  const s = await scene();
  const r = await s.send("OBSERVE");
  expect(pick(r, "entity.remote").available).toBe(false);
  const local = pick(r);
  expect(local.available).toBe(true);
  expect(r.observation?.available_actions).toContain("ATTEST");
  const out = await follow(s, local.cmd);
  expect(out.ok).toBe(true);
  expect(s.w.rooms["room.a"].entities.find((e) => e.entity_id === "entity.ledger")?.archive_subject_entity_id).toBe("entity.local");
  expect(out.events?.find((e) => e.event_type === "ENTITY_UPDATE")?.payload?.subject_entity_id).toBe("entity.local");
});

it("N10.03 hidden-room infrastructure is absent from subject suggestions", async () => {
  const s = await scene();
  s.w.rooms["room.b"].hidden = true;
  s.w.rooms["room.b"].tags = ["hidden"];
  const r = await s.send("OBSERVE");
  expect(rows(r).some((a) => a.subject_id === "entity.remote")).toBe(false);
  expect(JSON.stringify(rows(r))).not.toContain("remote-relay");
  expect(pick(r).available).toBe(true);
});

it("N10.04 ATTEST cap stays six without promoting distant subjects", async () => {
  const s = await scene();
  for (const n of [2, 3]) s.w.rooms["room.a"].entities.push(enrichEntity({
    entity_id: `entity.ledger-${n}`, label: `ledger-${n}`, entity_type: "ARTIFACT" }));
  const r = await s.send("OBSERVE");
  expect(rows(r)).toHaveLength(6);
  expect(rows(r).some((a) => a.subject_id === "entity.remote")).toBe(true);
  expect(rows(r).filter((a) => a.subject_id === "entity.remote").every((a) => !a.available)).toBe(true);
  expect(pick(r).available).toBe(true);
});

it("N10.05 exact base attention price permits one local ATTEST", async () => {
  const s = await scene();
  s.w.players[s.p.player_id].budgets.attention = 2; // RFC-0020 base price, no annex.
  const hit = pick(await s.send("OBSERVE"));
  expect(hit.requires?.attention).toBe(2);
  expect(hit.available).toBe(true);
  const settled: unknown[] = [];
  const r = await follow(s, hit.cmd, async (e) => { settled.push(e); return true; });
  expect(r.ok).toBe(true);
  expect(s.w.players[s.p.player_id].budgets.attention).toBe(0);
  expect(settled).toHaveLength(1);
  expect(settled[0]).toEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE", payload: expect.objectContaining({
    entity_id: "entity.ledger", subject_entity_id: "entity.local", archive_claim: "OPERATING" }) }));
});
