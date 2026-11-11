import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewGenesis } from "../src/genesis";
import { cycle0ToWorld } from "../src/world-do";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { CONSTRUCT_COSTS, STORAGE_CAPACITY } from "../src/construction";
import type { CommandResult, PlayerPrincipal } from "../src/types";

// #781 slice4: supported writers -> canonical runtime -> authoritative LOOK.
// Earlier mud-trace-lifecycle tests seed org ownership. Here neither ownership,
// offices, claims, cargo nor budgets are injected. Genesis supplies its real cache.
// Settlement is an accepting local callback, NOT SQL. JSON rehydration below is
// serialization coverage, NOT a DO eviction, authenticated HTTP or hosted proof.
// Production persistence seam: world-do.ts NoemaWorldDO.save stores the whole
// runtime at key "world". These tests do not invoke that seam.
// Reader: buildObservation -> laterTraceInputs -> projectRoomTraces/publicTraces.
// Writers: BUILD CONSTRUCT/PROMOTE/VEST/DISMANTLE, ORG_OFFICE_*, MESSAGE.

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden"); })));
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

const actor: PlayerPrincipal = {
  player_id: "player.trace-builder", agent_id: "agent.trace-builder", session_id: "sess.trace-builder",
  controller_id: "ctrl.trace-builder", controller_type: "agent", protocol_version: "1",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"], authentication_context: "test",
};

function traceTexts(result: CommandResult) {
  const traces = result.observation?.location?.traces;
  expect(traces).toBeDefined();
  for (const trace of traces!) expect(Object.keys(trace).sort()).toEqual(["kind", "text", "visibility"]);
  expect(JSON.stringify(traces)).not.toContain("source_state_ref");
  return traces!.map(t => t.text);
}
const mark = "Marks of Trace Compact remain here.";
const vacancy = "Works of Trace Compact stands vacant.";

async function rig() {
  const genesis = await previewGenesis({
    world_id: "test.hosted-canonical.ewm-cutover", world_name: "Trace Lifecycle",
    world_seed: "trace-supported-lifecycle-781", profile_id: "FRACTURED_OLD_WORLD",
    story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
  });
  expect(genesis.validation.ok).toBe(true);
  let w: WorldRuntime = cycle0ToWorld(genesis.cycle0);
  let sequence = 0;
  const settled: string[] = [];
  async function send(command: string, args: Record<string, unknown> = {}) {
    const id = `trace-supported-${++sequence}`;
    const result = await applyWorldCommand(w, actor,
      { request_id: id, idempotency_key: id, command, arguments: args },
      async event => { settled.push(event.event_type); return true; });
    expect(result.ok, `${command}: ${JSON.stringify(result.error)}`).toBe(true);
    return result;
  }
  await send("ENTER_WORLD");
  expect(w.players[actor.player_id].budgets.storage).toBe(STORAGE_CAPACITY);
  const source = w.rooms[w.entry_room_id].entities.find(e => e.entity_id === "entity.salvage-cache")!;
  expect(source.stock_amount).toBe(4);
  const cargo = CONSTRUCT_COSTS.relay.storage!;
  await send("HARVEST", { entity_id: source.entity_id, amount: cargo });
  expect(w.players[actor.player_id].budgets.storage).toBe(STORAGE_CAPACITY - cargo);
  const built = await send("BUILD", { operation: "CONSTRUCT", class: "relay" });
  const entityId = String(built.events!.find(e => e.event_type === "ENTITY_CREATE")!.payload!.entity_id);
  expect(w.players[actor.player_id].budgets.storage).toBe(STORAGE_CAPACITY);
  expect(w.rooms[w.entry_room_id].entities.find(e => e.entity_id === entityId)?.in_progress).toBe(true);
  await send("WAIT");
  expect(w.rooms[w.entry_room_id].entities.find(e => e.entity_id === entityId)?.in_progress).not.toBe(true);
  await send("ORG_CREATE", { name: "Trace Compact", charter: "Maintain public works" });
  const orgId = Object.keys(w.organizations)[0];
  await send("ORG_OFFICE_CREATE", { org_id: orgId, display_name: "Works", authority_profile: "OPERATE_NAMED_ASSET" });
  const officeId = Object.keys(w.organizations[orgId].offices!)[0];
  expect(traceTexts(await send("LOOK"))).not.toContain(mark);
  expect(traceTexts(await send("LOOK"))).not.toContain(vacancy);
  await send("ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: actor.player_id });
  const vested = await send("BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
  expect(vested.events).toContainEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE",
    payload: expect.objectContaining({ entity_id: entityId, operation: "VEST", set: expect.objectContaining({ owner_id: orgId }) }) }));
  expect(traceTexts(await send("LOOK"))).toContain(mark);
  return { send, settled, orgId, officeId, entityId, world: () => w,
    rehydrate: () => { w = JSON.parse(JSON.stringify(w)) as WorldRuntime; } };
}

describe("supported local later-family trace lifecycles (#781)", () => {
  it("creates insignia only after lawful vesting, vacates/reassigns, and removes both when the last org work is dismantled", async () => {
    const s = await rig();
    expect(traceTexts(await s.send("LOOK"))).not.toContain(vacancy);
    await s.send("ORG_OFFICE_VACATE", { office_id: s.officeId });
    expect(s.world().organizations[s.orgId].offices![s.officeId].status).toBe("VACANT");
    expect(traceTexts(await s.send("LOOK"))).toEqual(expect.arrayContaining([mark, vacancy]));
    s.rehydrate();
    expect(traceTexts(await s.send("LOOK"))).toEqual(expect.arrayContaining([mark, vacancy]));
    await s.send("ORG_OFFICE_ASSIGN", { office_id: s.officeId, agent_id: actor.player_id });
    const reassigned = traceTexts(await s.send("LOOK"));
    expect(reassigned).toContain(mark);
    expect(reassigned).not.toContain(vacancy);
    const dismantled = await s.send("BUILD", { operation: "DISMANTLE", entity_id: s.entityId });
    expect(dismantled.events).toContainEqual(expect.objectContaining({ event_type: "ENTITY_DESTROY",
      payload: expect.objectContaining({ entity_id: s.entityId, reason: "DISMANTLED" }) }));
    await s.send("ORG_OFFICE_VACATE", { office_id: s.officeId });
    // Vacancy remains canonical but has no visible org-owned work to anchor it.
    expect(s.world().organizations[s.orgId].offices![s.officeId].status).toBe("VACANT");
    expect(s.world().rooms[s.world().entry_room_id].entities.some(e => e.owner_id === s.orgId)).toBe(false);
    s.rehydrate();
    const final = traceTexts(await s.send("LOOK"));
    expect(final).not.toContain(mark);
    expect(final).not.toContain(vacancy);
    expect(s.settled).toContain("ENTITY_DESTROY");
  });

  it("removes and restores the same insignia/vacancy on supported movement without deleting canonical sources", async () => {
    const s = await rig();
    await s.send("ORG_OFFICE_VACATE", { office_id: s.officeId });
    expect(traceTexts(await s.send("LOOK"))).toEqual(expect.arrayContaining([mark, vacancy]));
    const home = s.world().entry_room_id;
    const exit = s.world().rooms[home].exits.find(e => !e.hidden &&
      s.world().rooms[e.to_room_id].exits.some(back => back.to_room_id === home))!;
    expect(exit).toBeDefined();
    await s.send("MOVE", { direction: exit.direction });
    const away = traceTexts(await s.send("LOOK"));
    expect(away).not.toContain(mark);
    expect(away).not.toContain(vacancy);
    expect(s.world().rooms[home].entities.find(e => e.entity_id === s.entityId)?.owner_id).toBe(s.orgId);
    s.rehydrate();
    const back = s.world().rooms[exit.to_room_id].exits.find(e => e.to_room_id === home)!;
    await s.send("MOVE", { direction: back.direction });
    expect(traceTexts(await s.send("LOOK"))).toEqual(expect.arrayContaining([mark, vacancy]));
  });

  it("keeps supported private local claims and public institution claims out of local public-rumor traces", async () => {
    const s = await rig();
    await s.send("MESSAGE", { recipient_id: actor.player_id, text: "PRIVATE_LOCAL_REPORT", as_claim: true,
      subject_ref: s.entityId });
    expect(Object.values(s.world().rumor!.claims)).toContainEqual(expect.objectContaining({
      subject_ref: s.entityId, visibility: "PRIVATE", content: "PRIVATE_LOCAL_REPORT" }));
    const privateRead = traceTexts(await s.send("LOOK"));
    expect(privateRead).not.toContain("A public report concerns this site.");
    expect(privateRead).not.toContain("Accounts of this differ.");
    expect(privateRead.join(" ")).not.toContain("PRIVATE_LOCAL_REPORT");
    await s.send("ORG_OFFICE_CREATE", { org_id: s.orgId, display_name: "Crier", authority_profile: "PUBLISH_NOTICE" });
    const crier = Object.values(s.world().organizations[s.orgId].offices!).find(o => o.display_name === "Crier")!;
    await s.send("ORG_OFFICE_ASSIGN", { office_id: crier.office_id, agent_id: actor.player_id });
    for (const notice of ["FIRST_PUBLIC_ORG_REPORT", "SECOND_PUBLIC_ORG_REPORT"]) {
      await s.send("ORG_OFFICE_ACT", { office_id: crier.office_id, notice });
    }
    const publicClaims = Object.values(s.world().rumor!.claims).filter(c => c.visibility === "PUBLIC");
    expect(publicClaims).toHaveLength(2);
    expect(new Set(publicClaims.map(c => c.origin_claim_id)).size).toBe(2);
    expect(publicClaims.every(c => c.subject_ref === s.orgId)).toBe(true);
    s.rehydrate();
    const texts = traceTexts(await s.send("LOOK"));
    expect(texts).toContain(mark);
    expect(texts).not.toContain("A public report concerns this site.");
    expect(texts).not.toContain("Accounts of this differ.");
    expect(texts.join(" ")).not.toMatch(/PRIVATE_LOCAL_REPORT|PUBLIC_ORG_REPORT/);
    // No supported writer currently originates a PUBLIC room/entity ClaimRecord:
    // MESSAGE originates PRIVATE, office ACT originates PUBLIC with org subject,
    // and RECONSTRUCT stores separate reconstructions, not rumor claims.
    // Positive/contested public-room lifecycle therefore remains projection-only
    // in mud-trace-lifecycle.test.ts. No invented publication verb or rumor TTL.
  });
});
