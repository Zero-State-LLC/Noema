import { expect, it as reconstructionVariant } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function reconstructionPrincipal(name: string): PlayerPrincipal {
  return { player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `sess.${name}`,
    controller_id: `ctrl.agent.${name}`, controller_type: "agent", protocol_version: "1",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"], authentication_context: "test" };
}
function reconstructionWorld(): WorldRuntime {
  return { world_id: "test.hosted-canonical.p10", world_name: "P10 Reach", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: { "room.hub": { room_id: "room.hub", name: "Hub",
      description: "Accessible archive.", exits: [], entities: [
        enrichEntity({ entity_id: "entity.relay", label: "scarred-relay", entity_type: "INFRASTRUCTURE", condition: 80 }),
        enrichEntity({ entity_id: "entity.ledger", label: "archive-ledger", entity_type: "ARTIFACT" }),
      ] } }, players: {}, trades: {}, messages: [], organizations: {}, reconstructions: {},
    seen_idempotency: {}, unsettled: [] };
}
async function reconstructionScene() {
  const w = reconstructionWorld();
  const author = reconstructionPrincipal("author");
  const outsider = reconstructionPrincipal("outsider");
  let n = 0;
  const invoke = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {},
    settle: Parameters<typeof applyWorldCommand>[3] = async () => true, admission: "developer" | "hosted" = "hosted") => {
    const id = `p10-${++n}`;
    const env: CommandEnvelope = { request_id: id, idempotency_key: id, command, arguments: args };
    return applyWorldCommand(w, p, env, settle, { admission });
  };
  expect((await invoke(author, "ENTER_WORLD")).ok).toBe(true);
  expect((await invoke(outsider, "ENTER_WORLD")).ok).toBe(true);
  expect((await invoke(author, "LOOK")).ok).toBe(true);
  expect((await invoke(outsider, "LOOK")).ok).toBe(true);
  const observe = (p: PlayerPrincipal) => invoke(p, "OBSERVE");
  const follow = (p: PlayerPrincipal, cmd: string, settle?: Parameters<typeof applyWorldCommand>[3]) =>
    invoke(p, "LOOK", { line: cmd }, settle, "developer");
  return { w, author, outsider, invoke, observe, follow };
}
type ReconstructionScene = Awaited<ReturnType<typeof reconstructionScene>>;
function reconstructionProjection(w: WorldRuntime) {
  // Excludes request replay cache, pending choice, activity and observation bookkeeping.
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms,
    reconstructions: w.reconstructions, unsettled: w.unsettled, evidence_fragments: w.evidence_fragments,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])) });
}
function reconstructionOffer(s: ReconstructionScene, result: Awaited<ReturnType<ReconstructionScene["observe"]>>,
  operation: string, id?: string) {
  const hit = result.observation?.affordances?.find((a) => a.operation === operation &&
    (!id || a.reconstruction_id === id || a.subject_ref === id));
  expect(hit, `missing ${operation} affordance`).toBeDefined();
  return hit!;
}
async function reconstructionEvidence(s: ReconstructionScene, kind: "inspect" | "archive" | "both") {
  if (kind !== "archive") {
    expect((await s.invoke(s.author, "INSPECT", { entity_id: "entity.relay" })).ok).toBe(true);
  }
  if (kind !== "inspect") {
    s.w.players[s.author.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await s.invoke(s.author, "ATTEST", { entity_id: "entity.ledger",
      subject_entity_id: "entity.relay", archive_claim: "OPERATING" })).ok).toBe(true);
    s.w.players[s.author.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    // An authored archive claim is not readable evidence until its artifact is inspected.
    expect((await s.invoke(s.author, "INSPECT", { entity_id: "entity.ledger" })).ok).toBe(true);
  }
  s.w.players[s.author.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

reconstructionVariant.each(["inspect", "archive", "both"] as const)(
  "P10 private %s evidence follows advertised creation without publication", async (kind) => {
    const s = await reconstructionScene();
    await reconstructionEvidence(s, kind);
    const hit = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT", "entity.relay");
    expect(hit.available).toBe(true);
    expect(hit.target_id).toBe("entity.relay");
    expect(hit.visibility).toBe("PRIVATE");
    expect(hit.evidence).toEqual(kind === "both" ? ["LIVE_INSPECT", "ARCHIVE_CLAIM"] :
      [kind === "inspect" ? "LIVE_INSPECT" : "ARCHIVE_CLAIM"]);
    const before = s.w.players[s.author.player_id].budgets.attention;
    const settled: string[] = [];
    const out = await s.follow(s.author, hit.cmd, async (ev) => { settled.push(ev.event_type); return true; });
    expect(out.ok).toBe(true);
    const records = Object.values(s.w.reconstructions || {});
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ author_player_id: s.author.player_id, subject_ref: "entity.relay",
      visibility: "PRIVATE", status: "RECORDED", claim: hit.claim });
    expect(records[0].evidence_refs.map((ref) => [ref.kind, ref.subject_ref, ref.source_entity_id])).toEqual(
      hit.evidence!.map((e) => [e, "entity.relay", "entity.relay"]));
    expect(s.w.players[s.author.player_id].budgets.attention).toBe(before! - hit.requires!.attention!);
    expect(out.events?.find((ev) => ev.event_type === "ENTITY_CREATE")?.payload?.entity_id).toBe(records[0].reconstruction_id);
    expect(settled).toEqual(["ENTITY_CREATE"]);
    const other = await s.observe(s.outsider);
    expect((other.observation?.affordances || []).some((a) => a.reconstruction_id === records[0].reconstruction_id)).toBe(false);
    expect(JSON.stringify(other.observation)).not.toContain(records[0].claim);
  });

reconstructionVariant("P10 advertised revision supersedes exactly its author-owned ID, not publication or an identical sibling", async () => {
  const s = await reconstructionScene();
  await reconstructionEvidence(s, "both");
  const create = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT", "entity.relay");
  expect((await s.follow(s.author, create.cmd)).ok).toBe(true);
  s.w.players[s.author.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await s.follow(s.author, create.cmd)).ok).toBe(true);
  const ids = Object.keys(s.w.reconstructions || {});
  expect(ids).toHaveLength(2);
  const selected = ids[1];
  const sibling = structuredClone(s.w.reconstructions![ids[0]]);
  const original = structuredClone(s.w.reconstructions![selected]);
  const offer = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT_SUPERSEDE", selected);
  expect(offer.cmd).toContain(selected);
  expect(offer.available).toBe(true);
  const attention = s.w.players[s.author.player_id].budgets.attention;
  const settled: Array<{ event_type: string; payload?: { entity_id?: string } }> = [];
  const out = await s.follow(s.author, offer.cmd, async (e) => { settled.push(e); return true; });
  expect(out.ok).toBe(true);
  const afterIds = Object.keys(s.w.reconstructions || {});
  expect(afterIds).toHaveLength(3);
  const replacement = s.w.reconstructions![afterIds.find((id) => !ids.includes(id))!];
  expect(s.w.reconstructions![selected]).toEqual({ ...original, status: "SUPERSEDED" });
  expect(s.w.reconstructions![ids[0]]).toEqual(sibling);
  expect(replacement).toMatchObject({ supersedes_reconstruction_id: selected, subject_ref: original.subject_ref,
    claim: offer.claim, visibility: "PRIVATE", author_player_id: s.author.player_id });
  expect(replacement.evidence_refs.map((ref) => ref.kind)).toEqual(original.evidence_refs.map((ref) => ref.kind));
  expect(s.w.players[s.author.player_id].budgets.attention).toBe(attention! - offer.requires!.attention!);
  expect(settled.map((e) => [e.event_type, e.payload?.entity_id])).toEqual([
    ["ENTITY_CREATE", replacement.reconstruction_id], ["ENTITY_UPDATE", selected] ]);
  expect(out.events?.filter((e) => e.event_type === "ENTITY_CREATE").map((e) => e.payload?.entity_id)).toEqual([replacement.reconstruction_id]);
});

reconstructionVariant.each(["inaccessible", "nonauthor", "budget", "alias"] as const)(
  "P10 %s reconstruction refusal has no record, debit or settlement", async (failure) => {
    const s = await reconstructionScene();
    await reconstructionEvidence(s, "both");
    const create = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT", "entity.relay");
    expect((await s.follow(s.author, create.cmd)).ok).toBe(true);
    s.w.players[s.author.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const id = Object.keys(s.w.reconstructions || {})[0];
    const revise = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT_SUPERSEDE", id);
    let line = revise.cmd;
    let principal = s.author;
    if (failure === "inaccessible") line = create.cmd.replace(/evidence=\S+/, "evidence=bogus");
    if (failure === "nonauthor") principal = s.outsider;
    if (failure === "budget") s.w.players[s.author.player_id].budgets.attention = 0;
    if (failure === "alias") line = `assemble entity.relay 'quoted alias claim' evidence=bogus private`;
    const before = reconstructionProjection(s.w);
    const out = await s.follow(principal, line, async () => { throw new Error("refusal settled"); });
    expect(out.ok).toBe(false);
    expect(out.error?.code).toBe(failure === "nonauthor" ? "FORBIDDEN" :
      failure === "budget" ? "BUDGET_EXCEEDED" : "FORBIDDEN");
    expect(out.events || []).toEqual([]);
    expect(reconstructionProjection(s.w)).toEqual(before);
    expect(Object.keys(s.w.reconstructions || {})).toEqual([id]);
    expect(s.w.reconstructions![id].visibility).toBe("PRIVATE");
  });

reconstructionVariant("P10 inaccessible evidence cannot be borrowed from another author's offered private text", async () => {
  const s = await reconstructionScene();
  await reconstructionEvidence(s, "both");
  const offered = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT", "entity.relay");
  const before = reconstructionProjection(s.w);
  const out = await s.follow(s.outsider, offered.cmd, async () => { throw new Error("foreign evidence settled"); });
  expect(out.ok).toBe(false);
  expect(out.error?.code).toBe("FORBIDDEN");
  expect(out.events || []).toEqual([]);
  expect(reconstructionProjection(s.w)).toEqual(before);
  expect(Object.keys(s.w.reconstructions || {})).toEqual([]);
});

reconstructionVariant("P10 quoted assemble alias creates only a private record from accessible inspect evidence", async () => {
  const s = await reconstructionScene();
  await reconstructionEvidence(s, "inspect");
  const offered = reconstructionOffer(s, await s.observe(s.author), "RECONSTRUCT", "entity.relay");
  const line = offered.cmd.replace(/^reconstruct /, "assemble ").replace(/"[^"]+"/, "'Quoted account: visible only to author.'");
  const result = await s.follow(s.author, line);
  expect(result.ok).toBe(true);
  expect(Object.values(s.w.reconstructions || {})).toEqual([expect.objectContaining({
    subject_ref: "entity.relay", claim: "Quoted account: visible only to author.", visibility: "PRIVATE",
    evidence_refs: [expect.objectContaining({ kind: "LIVE_INSPECT", subject_ref: "entity.relay" })] })]);
  expect(result.events?.filter((e) => e.event_type === "ENTITY_CREATE")).toHaveLength(1);
  expect((await s.observe(s.outsider)).observation?.affordances?.some((a) => a.operation === "RECONSTRUCT_PUBLISH")).toBe(false);
});

reconstructionVariant.each(["OPERATING", "DESTROYED"] as const)(
  "P10 ATTEST %s local subject ID selects one of duplicate artifact labels", async (claim) => {
    const s = await reconstructionScene();
    s.w.rooms["room.hub"].entities.push(enrichEntity({ entity_id: "entity.ledger-2", label: "archive-ledger", entity_type: "ARTIFACT" }));
    const advertised = (await s.observe(s.author)).observation?.affordances?.filter((a) =>
      a.operation === "ATTEST" && a.subject_id === "entity.relay" && a.archive_claim === claim);
    expect(advertised).toHaveLength(2);
    const chosen = advertised![1];
    expect(chosen.available).toBe(true);
    const before = reconstructionProjection(s.w);
    const result = await s.follow(s.author, chosen.cmd, async () => { throw new Error("collision must not settle"); });
    // Same text cannot designate either ID; reject instead of choosing an unintended artifact.
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(result.events || []).toEqual([]);
    expect(reconstructionProjection(s.w)).toEqual(before);
  });

reconstructionVariant.each([
  ["entity.ledger", "OPERATING"], ["entity.ledger-2", "OPERATING"],
  ["entity.ledger", "DESTROYED"], ["entity.ledger-2", "DESTROYED"],
] as const)("P10 canonical-ID COMMIT.ATTEST selects %s for %s despite identical advertised text", async (artifactId, claim) => {
  const s = await reconstructionScene();
  s.w.rooms["room.hub"].entities.push(enrichEntity({
    entity_id: "entity.ledger-2", label: "archive-ledger", entity_type: "ARTIFACT" }));
  if (claim === "DESTROYED") s.w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay")!.condition = 40;
  const rows = (await s.observe(s.author)).observation?.affordances?.filter((a) =>
    a.operation === "ATTEST" && a.subject_id === "entity.relay" && a.archive_claim === claim);
  expect(rows).toHaveLength(2);
  expect(rows!.map((a) => a.target_id)).toEqual(["entity.ledger", "entity.ledger-2"]);
  expect(rows![0].cmd).toBe(rows![1].cmd);
  expect(rows!.every((a) => a.available)).toBe(true);
  const selected = rows!.find((a) => a.target_id === artifactId)!;
  const otherId = rows!.find((a) => a.target_id !== artifactId)!.target_id!;
  const untouched = structuredClone(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === otherId));
  const attention = s.w.players[s.author.player_id].budgets.attention!;
  const settled: Array<{ event_type: string; payload?: { entity_id?: string; subject_entity_id?: string; archive_claim?: string } }> = [];
  // Structured COMMIT.ATTEST uses canonical IDs, not the ambiguous human label in cmd.
  const result = await s.invoke(s.author, "COMMIT", {
    operation: "ATTEST", entity_id: selected.target_id,
    subject_entity_id: selected.subject_id, archive_claim: selected.archive_claim,
  }, async (event) => { settled.push(event); return true; });
  expect(result.ok).toBe(true);
  expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === artifactId)).toMatchObject({
    entity_id: artifactId, archive_subject_entity_id: selected.subject_id, archive_claim: claim });
  expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === otherId)).toEqual(untouched);
  expect(result.events?.filter((e) => e.event_type === "ENTITY_UPDATE").map((e) =>
    [e.payload?.entity_id, e.payload?.subject_entity_id, e.payload?.archive_claim])).toEqual([
    [artifactId, selected.subject_id, claim] ]);
  expect(result.events?.filter((e) => e.event_type === "BUDGET_CONSUMED").map((e) => e.payload)).toEqual([
    expect.objectContaining({ player_id: s.author.player_id, reason: "ATTEST",
      cost_paid: expect.objectContaining({ attention: selected.requires!.attention }) }) ]);
  expect(settled.map((e) => [e.event_type, e.payload?.entity_id, e.payload?.subject_entity_id, e.payload?.archive_claim]))
    .toEqual([["ENTITY_UPDATE", artifactId, selected.subject_id, claim]]);
  expect(s.w.players[s.author.player_id].budgets.attention).toBe(attention - selected.requires!.attention!);
});

reconstructionVariant.each(["OPERATING", "DESTROYED"] as const)(
  "P10 ATTEST %s follows an unambiguous local subject and artifact with exact attention", async (claim) => {
    const s = await reconstructionScene();
    if (claim === "DESTROYED") s.w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay")!.condition = 40;
    const candidates = (await s.observe(s.author)).observation?.affordances?.filter((a) => a.operation === "ATTEST");
    expect(candidates).toHaveLength(2);
    const hit = candidates!.find((a) => a.archive_claim === claim)!;
    expect(hit.available).toBe(true);
    expect(hit.target_id).toBe("entity.ledger");
    expect(hit.subject_id).toBe("entity.relay");
    const attention = s.w.players[s.author.player_id].budgets.attention;
    const settled: string[] = [];
    const result = await s.follow(s.author, hit.cmd, async (e) => { settled.push(e.event_type); return true; });
    expect(result.ok).toBe(true);
    expect(result.events?.find((e) => e.event_type === "ENTITY_UPDATE")?.payload).toEqual(
      expect.objectContaining({ entity_id: hit.target_id, subject_entity_id: hit.subject_id, archive_claim: claim }));
    expect(s.w.rooms["room.hub"].entities.find((e) => e.entity_id === hit.target_id)).toMatchObject({
      archive_subject_entity_id: hit.subject_id, archive_claim: claim });
    expect(s.w.players[s.author.player_id].budgets.attention).toBe(attention! - hit.requires!.attention!);
    expect(settled).toEqual(["ENTITY_UPDATE"]);
  });

reconstructionVariant("P10 six ATTEST offers retain both claims per first three artifacts and never a seventh", async () => {
  const s = await reconstructionScene();
  for (const n of [2, 3, 4]) s.w.rooms["room.hub"].entities.push(enrichEntity({
    entity_id: `entity.ledger-${n}`, label: `ledger-${n}`, entity_type: "ARTIFACT" }));
  const rows = (await s.observe(s.author)).observation?.affordances?.filter((a) => a.operation === "ATTEST") || [];
  expect(rows).toHaveLength(6);
  expect(rows.map((a) => [a.target_id, a.subject_id, a.archive_claim])).toEqual(
    ["entity.ledger", "entity.ledger-2", "entity.ledger-3"].flatMap((id) =>
      [[id, "entity.relay", "OPERATING"], [id, "entity.relay", "DESTROYED"]]));
  expect(rows.every((a) => a.available && a.requires?.attention === 2)).toBe(true);
});
