import { afterEach, beforeEach, expect, it as traceCase, vi } from "vitest";
import type { CommandResult } from "../src/types";
import type { WorldRuntime } from "../src/world-actions";
import { emptyRumor, type ClaimRecord } from "../src/rumor";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("trace fixture forbids external network"); }));
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

let s3ReadRequest = 0;
async function readS3TraceSnapshot(seed: WorldRuntime) {
  const h = harness(structuredClone(seed));
  const token = (await h.agent()).access_token;
  if (!seed.players["player.boundary"]?.entered) {
    const entered = await h.command(token, "ENTER_WORLD");
    expect(entered.status).toBe(200);
    expect((await entered.json() as CommandResult).ok).toBe(true);
  }
  h.restart(); // Local fixture reconstruction, never hosted eviction.
  const res = await h.command(token, "LOOK", {}, { request_id: `s3.look.${++s3ReadRequest}` });
  expect(res.status).toBe(200);
  const result = await res.json() as CommandResult;
  expect(result.ok).toBe(true);
  const traces = result.observation?.location?.traces;
  expect(Array.isArray(traces)).toBe(true);
  const retained = await h.persistedWorld();
  expect(retained).toBeDefined();
  return { result, traces: traces!, retained: retained! };
}

function s3TraceTexts(snapshot: Awaited<ReturnType<typeof readS3TraceSnapshot>>) {
  return snapshot.traces.map((trace) => trace.text);
}
function s3RumorWorld(visibility: ClaimRecord["visibility"], subject = "room.a") {
  const w = fixtureWorld();
  w.rumor = emptyRumor();
  w.rumor.claims["claim.s3.note"] = {
    claim_id: "claim.s3.note", originator_ref: "player.source", subject_ref: subject,
    content: "Synthetic source text", created_cycle: w.cycle,
    origin_class: "PLAYER_MESSAGE", visibility, origin_claim_id: "claim.s3.note",
  };
  return w;
}
function s3InstitutionWorld() {
  const w = fixtureWorld();
  w.rooms["room.a"].entities[0].entity_type = "INFRASTRUCTURE";
  w.rooms["room.a"].entities[0].owner_id = "org.line";
  w.organizations["org.line"] = {
    org_id: "org.line", name: "Line", charter: "Fixture charter", status: "ACTIVE",
    creator_id: "player.source", members: [], created_cycle: 0,
  };
  return w;
}

traceCase("N01 private rumor does not become a trace; public twin does", async () => {
  const denied = await readS3TraceSnapshot(s3RumorWorld("PRIVATE"));
  expect(s3TraceTexts(denied)).toEqual([]);
  expect(JSON.stringify(denied.result)).not.toContain("Synthetic source text");
  const allowed = await readS3TraceSnapshot(s3RumorWorld("PUBLIC"));
  expect(s3TraceTexts(allowed)).toEqual(["A public report concerns this site."]);
});

traceCase("N02 public rumor must concern this room or a visible entity here", async () => {
  const elsewhere = await readS3TraceSnapshot(s3RumorWorld("PUBLIC", "room.b"));
  expect(s3TraceTexts(elsewhere)).toEqual([]);
  const local = await readS3TraceSnapshot(s3RumorWorld("PUBLIC", "entity.box"));
  expect(s3TraceTexts(local)).toEqual(["A public report concerns this site."]);
});

traceCase("N03 hidden owned work does not create an org mark; visible twin does", async () => {
  const hidden = s3InstitutionWorld();
  hidden.rooms["room.a"].entities[0].hidden = true;
  expect(s3TraceTexts(await readS3TraceSnapshot(hidden))).toEqual([]);
  expect(s3TraceTexts(await readS3TraceSnapshot(s3InstitutionWorld())))
    .toEqual(["Marks of Line remain here."]);
});

traceCase("N04 occupied office has no vacant memorial; vacancy does", async () => {
  const vacant = s3InstitutionWorld();
  vacant.organizations["org.line"].offices = {
    "office.line.steward": {
      office_id: "office.line.steward", institution_id: "org.line", display_name: "Steward",
      status: "VACANT", authority_profile: "PUBLISH_NOTICE", created_cycle: 0, history: [],
    },
  };
  const occupied = structuredClone(vacant);
  occupied.organizations["org.line"].offices!["office.line.steward"].status = "OCCUPIED";
  occupied.organizations["org.line"].offices!["office.line.steward"].holder_player_id = "player.source";
  expect(s3TraceTexts(await readS3TraceSnapshot(occupied))).toEqual(["Marks of Line remain here."]);
  expect(s3TraceTexts(await readS3TraceSnapshot(vacant)))
    .toEqual(["Marks of Line remain here.", "Steward of Line stands vacant."]);
});

traceCase("N05 only the current last board entry becomes a notice", async () => {
  const w = fixtureWorld();
  w.rooms["room.a"].board = [{ text: "Earlier board note", cycle: 0 }, { text: "Current board note", cycle: 0 }];
  const snapshot = await readS3TraceSnapshot(w);
  expect(s3TraceTexts(snapshot)).toEqual(["Current board note"]);
  expect(snapshot.retained.rooms["room.a"].board).toEqual(w.rooms["room.a"].board);
});

traceCase("N06 cleared board has no retained notice after fixture reconstruction", async () => {
  const w = fixtureWorld();
  w.rooms["room.a"].board = [{ text: "Board residue", cycle: 0 }];
  const before = await readS3TraceSnapshot(w);
  expect(s3TraceTexts(before)).toEqual(["Board residue"]);
  before.retained.rooms["room.a"].board = [];
  const after = await readS3TraceSnapshot(before.retained);
  expect(s3TraceTexts(after)).toEqual([]);
});

traceCase("N07 cleared shout has no retained notice after fixture reconstruction", async () => {
  const w = fixtureWorld();
  w.rooms["room.a"].shout = { text: "Shout residue", cycle: 0 };
  const before = await readS3TraceSnapshot(w);
  expect(s3TraceTexts(before)).toEqual(["Shout residue"]);
  delete before.retained.rooms["room.a"].shout;
  expect(s3TraceTexts(await readS3TraceSnapshot(before.retained))).toEqual([]);
});

traceCase("N08 cleared institution notice has no retained projection", async () => {
  const w = fixtureWorld();
  w.rooms["room.a"].institution_notice = { text: "Institution residue", cycle: 0, org_id: "org.line", org_name: "Line" };
  const before = await readS3TraceSnapshot(w);
  expect(s3TraceTexts(before)).toEqual(["Institution residue"]);
  delete before.retained.rooms["room.a"].institution_notice;
  expect(s3TraceTexts(await readS3TraceSnapshot(before.retained))).toEqual([]);
});

traceCase("N09 cleared trade notice has no retained projection", async () => {
  const w = fixtureWorld();
  w.rooms["room.a"].trade_notice = { text: "Trade residue", cycle: 0 };
  const before = await readS3TraceSnapshot(w);
  expect(s3TraceTexts(before)).toEqual(["Trade residue"]);
  delete before.retained.rooms["room.a"].trade_notice;
  expect(s3TraceTexts(await readS3TraceSnapshot(before.retained))).toEqual([]);
});
