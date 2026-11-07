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

async function readS3TraceSnapshot(seed: WorldRuntime) {
  const h = harness(structuredClone(seed));
  const token = (await h.agent()).access_token;
  if (!seed.players["player.boundary"]?.entered) {
    const entered = await h.command(token, "ENTER_WORLD");
    expect(entered.status).toBe(200);
    expect((await entered.json() as CommandResult).ok).toBe(true);
  }
  h.restart(); // Local fixture reconstruction, never hosted eviction.
  const res = await h.command(token, "LOOK");
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
