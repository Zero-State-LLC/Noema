import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.reconstruct-look",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A live relay and a fragmentary archive.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
            scar: true,
          }),
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "black-archive",
            entity_type: "ARTIFACT",
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    reconstructions: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function gatherEvidence(w: WorldRuntime, p: PlayerPrincipal) {
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(
    (
      await run(w, p, "ATTEST", {
        entity_id: "entity.archive-ledger",
        subject_entity_id: "entity.relay-7",
        archive_claim: "DESTROYED",
      })
    ).ok,
  ).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.relay-7" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

describe("agent RECONSTRUCT affordances", () => {
  it("LOOK lists RECONSTRUCT only after evidence; structured COMMIT records it", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = await run(w, a, "LOOK");
    expect((before.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT")).toBe(false);

    await gatherEvidence(w, a);
    const look = await run(w, a, "LOOK");
    const hit = (look.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT" && x.subject_ref === "entity.relay-7",
    );
    expect(hit?.claim).toBeTruthy();
    expect(hit?.evidence?.length).toBeGreaterThan(0);
    expect(look.observation?.available_actions).toContain("RECONSTRUCT");
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT")).toBe(false);

    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: hit?.subject_ref,
      claim: hit?.claim,
      evidence: hit?.evidence,
      visibility: hit?.visibility,
    });
    expect(recorded.ok).toBe(true);
    const rec = Object.values(w.reconstructions || {})[0];
    expect(rec.subject_ref).toBe("entity.relay-7");
    expect(rec.status).toBe("RECORDED");
  });

  it("LOOK lists PUBLISH and SUPERSEDE for the author; stranger cannot", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await gatherEvidence(w, a);
    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "The relay appears abandoned after damage.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PRIVATE",
    });
    expect(recorded.ok).toBe(true);
    const recId = Object.keys(w.reconstructions || {})[0];

    const lookA = await run(w, a, "LOOK");
    const publish = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT_PUBLISH" && x.reconstruction_id === recId,
    );
    const revise = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT_SUPERSEDE" && x.reconstruction_id === recId,
    );
    expect(publish?.visibility).toBe("PUBLIC");
    expect(revise?.claim).toBeTruthy();
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT_PUBLISH")).toBe(false);
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT_SUPERSEDE")).toBe(false);

    const published = await run(w, a, "RECONSTRUCT_PUBLISH", {
      reconstruction_id: publish?.reconstruction_id,
      visibility: publish?.visibility,
    });
    expect(published.ok).toBe(true);
    expect(w.reconstructions?.[recId]?.visibility).toBe("PUBLIC");

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const revised = await run(w, a, "RECONSTRUCT_SUPERSEDE", {
      reconstruction_id: revise?.reconstruction_id,
      claim: revise?.claim,
      evidence: revise?.evidence,
    });
    expect(revised.ok).toBe(true);
    expect(w.reconstructions?.[recId]?.status).toBe("SUPERSEDED");
  });
});

// Public reducer seams: exact advertised text (developer only) and existing
// structured publication. No HTTP/SQL or whole-family equivalence is claimed.
async function publicationScene() {
  const w = world();
  const author = agent("publication-author");
  expect((await run(w, author, "ENTER_WORLD")).ok).toBe(true);
  await gatherEvidence(w, author);
  expect((await run(w, author, "RECONSTRUCT", {
    subject_ref: "entity.relay-7",
    claim: 'The relay has "visible damage"; archive and inspection differ.',
    evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"], visibility: "PRIVATE",
  })).ok).toBe(true);
  const ids = Object.keys(w.reconstructions || {});
  expect(ids).toHaveLength(1);
  const id = ids[0];
  expect(w.reconstructions![id].visibility).toBe("PRIVATE");
  const observed = await run(w, author, "LOOK");
  const advertised = observed.observation?.affordances?.find((a) =>
    a.operation === "RECONSTRUCT_PUBLISH" && a.reconstruction_id === id && a.available);
  expect(advertised?.cmd).toBeTruthy();
  expect(advertised?.visibility).toBe("PUBLIC");
  return { w, author, id, cmd: advertised!.cmd!, ids };
}

// Excludes replay caches, activity, pending choices and observation bookkeeping.
function publicationProjection(w: WorldRuntime) {
  return structuredClone({ sequence: w.sequence, cycle: w.cycle, rooms: w.rooms,
    reconstructions: w.reconstructions, organizations: w.organizations,
    unsettled: w.unsettled, messages: w.messages, trades: w.trades,
    players: Object.fromEntries(Object.entries(w.players).map(([id, p]) =>
      [id, { budgets: p.budgets, room_id: p.room_id, discovery: p.discovery }])),
  });
}

it.each(["line", "outer", "assemble", "structured"] as const)(
  "#780 publication %s preserves the retained record and count", async (carrier) => {
    const { w, author, id, cmd, ids } = await publicationScene();
    const retained = structuredClone(w.reconstructions![id]);
    const settled: unknown[] = [];
    const envelope: CommandEnvelope = { request_id: "publish-follow", idempotency_key: "publish-follow",
      command: carrier === "structured" ? "RECONSTRUCT_PUBLISH" : carrier === "outer" ? cmd : "LOOK",
      arguments: carrier === "structured" ? { reconstruction_id: id, visibility: "PUBLIC" }
        : carrier === "outer" ? {} : { line: carrier === "assemble" ? cmd.replace(/^reconstruct /, "assemble ") : cmd },
    };
    const result = await applyWorldCommand(w, author, envelope,
      async (ev) => { settled.push(ev); return true; },
      { admission: carrier === "structured" ? "hosted" : "developer" });
    expect(result.ok).toBe(true);
    expect(w.reconstructions![id]).toEqual({ ...retained, visibility: "PUBLIC" });
    expect(Object.keys(w.reconstructions || {})).toEqual(ids);
    expect(result.events?.some((e) => e.event_type === "ENTITY_CREATE")).toBe(false);
    expect(settled).toHaveLength(1);
    expect(settled[0]).toEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE",
      payload: expect.objectContaining({ entity_id: id,
        set: expect.objectContaining({ reconstruction_visibility: "PUBLIC" }) }) }));
    const after = publicationProjection(w);
    const replay = await applyWorldCommand(w, author, envelope,
      async () => { throw new Error("replay must not settle"); },
      { admission: carrier === "structured" ? "hosted" : "developer" });
    expect(replay).toEqual(result);
    expect(publicationProjection(w)).toEqual(after);
  });

it("#780 publication selects the advertised ID among identical subject/claim records", async () => {
  const { w, author, id } = await publicationScene();
  const first = structuredClone(w.reconstructions![id]);
  expect((await run(w, author, "RECONSTRUCT", { subject_ref: first.subject_ref, claim: first.claim,
    evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"], visibility: "PRIVATE" })).ok).toBe(true);
  const ids = Object.keys(w.reconstructions || {});
  expect(ids).toHaveLength(2);
  const other = ids.find((x) => x !== id)!;
  const looked = await run(w, author, "LOOK");
  const cmd = looked.observation?.affordances?.find((a) => a.operation === "RECONSTRUCT_PUBLISH"
    && a.reconstruction_id === other && a.available)?.cmd;
  expect(cmd).toBeTruthy();
  const result = await applyWorldCommand(w, author, { request_id: "publish-second", command: "LOOK",
    arguments: { line: cmd } }, async () => true, { admission: "developer" });
  expect(result.ok).toBe(true);
  expect(w.reconstructions![id]).toEqual(first);
  expect(w.reconstructions![other].visibility).toBe("PUBLIC");
  expect(Object.keys(w.reconstructions || {})).toEqual(ids);
  expect(result.events?.filter((e) => e.event_type === "ENTITY_UPDATE").map((e) => e.payload?.entity_id)).toEqual([other]);
});

it.each(["nonauthor", "unknown", "budget"] as const)(
  "#780 publication %s refusal preserves the bounded canonical projection", async (failure) => {
    const { w, author, id, cmd } = await publicationScene();
    const stranger = agent("publication-stranger");
    expect((await run(w, stranger, "ENTER_WORLD")).ok).toBe(true);
    // Normalize discovery through a real read before taking the no-change baseline.
    expect((await run(w, stranger, "LOOK")).ok).toBe(true);
    const principal = failure === "nonauthor" ? stranger : author;
    const line = failure === "unknown" ? cmd.replace(id, "recon.absent-local-fixture") : cmd;
    if (failure === "budget") w.players[author.player_id].budgets.attention = 0;
    const before = publicationProjection(w);
    const result = await applyWorldCommand(w, principal, { request_id: `publication-${failure}`, command: "LOOK",
      arguments: { line } }, async () => { throw new Error("refusal must not settle"); }, { admission: "developer" });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(failure === "nonauthor" ? "FORBIDDEN" : failure === "unknown" ? "NOT_FOUND" : "BUDGET_EXCEEDED");
    expect(result.events || []).toEqual([]);
    expect(publicationProjection(w)).toEqual(before);
  });

it.each(["reconstruct publish public", "reconstruct publish recon.absent-local-fixture public extra",
  "reconstruct publish recon.absent-local-fixture private"])(
  "#780 malformed publication does not create a record: %s", async (line) => {
    const { w, author } = await publicationScene();
    const before = publicationProjection(w);
    const result = await applyWorldCommand(w, author, { request_id: "publication-malformed", command: "LOOK",
      arguments: { line } }, async () => { throw new Error("malformed input must not settle"); }, { admission: "developer" });
    expect(result.ok).toBe(false);
    expect(result.events || []).toEqual([]);
    expect(publicationProjection(w)).toEqual(before);
  });

it.each(["line", "outer"] as const)("#780 hosted %s carrier never executes publication text", async (carrier) => {
  const { w, author, cmd } = await publicationScene();
  const before = publicationProjection(w);
  const settled: string[] = [];
  const result = await applyWorldCommand(w, author, { request_id: "publication-hosted", command: carrier === "line" ? "LOOK" : cmd,
    arguments: carrier === "line" ? { line: cmd } : {} }, async (ev) => {
      settled.push(ev.event_type); return true;
    }, { admission: "hosted" });
  expect(result.ok).toBe(carrier === "line"); // Structured LOOK ignores the text payload; outer text is refused.
  expect(result.events?.some((e) => e.event_type === "ENTITY_CREATE" || e.event_type === "ENTITY_UPDATE")).toBeFalsy();
  expect(w.reconstructions).toEqual(before.reconstructions);
  expect(settled).toEqual(carrier === "line" ? ["LOOK", "OBSERVATION_GENERATED"] : []);
  if (carrier === "line") {
    // LOOK legitimately costs attention and settles read events: compare to a normal LOOK,
    // not to a fabricated zero-cost/zero-event no-op baseline.
    const control = await publicationScene();
    expect((await run(control.w, control.author, "LOOK")).ok).toBe(true);
    expect(publicationProjection(w)).toEqual(publicationProjection(control.w));
  } else expect(publicationProjection(w)).toEqual(before);
});

it("#780 quoted reconstruct creation remains creation rather than publication", async () => {
  const { w, author, id } = await publicationScene();
  const prior = structuredClone(w.reconstructions![id]);
  const looked = await run(w, author, "LOOK");
  const cmd = looked.observation?.affordances?.find((a) => a.operation === "RECONSTRUCT" && a.available)?.cmd;
  expect(cmd).toBeTruthy();
  const result = await applyWorldCommand(w, author, { request_id: "publication-create-control", command: "LOOK",
    arguments: { line: cmd } }, async () => true, { admission: "developer" });
  expect(result.ok).toBe(true);
  expect(w.reconstructions![id]).toEqual(prior);
  expect(Object.keys(w.reconstructions || {})).toHaveLength(2);
  expect(result.events?.some((e) => e.event_type === "ENTITY_CREATE")).toBe(true);
});
