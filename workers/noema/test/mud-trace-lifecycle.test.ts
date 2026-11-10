import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildObservation } from "../src/world-actions";
import { emptyRumor, type ClaimRecord } from "../src/rumor";
import type { CommandResult, PlayerPrincipal } from "../src/types";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden"); })));
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

const observer: PlayerPrincipal = {
  player_id: "player.observer", agent_id: "agent.observer", session_id: "sess.observer",
  controller_id: "ctrl.observer", controller_type: "agent", protocol_version: "1",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"], authentication_context: "test",
};

function texts(result: CommandResult) {
  const traces = result.observation?.location?.traces;
  expect(traces).toBeDefined();
  expect(JSON.stringify(traces)).not.toContain("source_state_ref");
  return traces!.map(t => t.text);
}

// These tests exercise the real authoritative observation builder against changing
// synthetic canonical state. They do NOT establish a PUBLIC rumor command writer,
// SQL persistence, or a hosted eviction. MESSAGE creates PRIVATE claims today.
describe("projection-only later-family deterministic lifecycle", () => {
  it("recomputes public and contested rumor traces as roots, locality and visibility change", () => {
    const w = fixtureWorld();
    w.rumor = emptyRumor();
    const claim = (id: string, root: string): ClaimRecord => ({
      claim_id: id, originator_ref: "player.source", subject_ref: "room.a",
      content: "SOURCE_BODY_NOT_PUBLIC", created_cycle: 0, origin_class: "PLAYER_MESSAGE",
      visibility: "PUBLIC", origin_claim_id: root,
    });
    const read = () => {
      const before = structuredClone(w.rumor);
      const obs = buildObservation(w, observer);
      // buildObservation normalizes unrelated runtime defaults. The rumor source is read-only.
      expect(w.rumor).toEqual(before);
      expect(JSON.stringify(obs)).not.toContain("SOURCE_BODY_NOT_PUBLIC");
      return obs.location?.traces?.map(t => t.text);
    };
    const report = "A public report concerns this site.";
    const contested = "Accounts of this differ.";
    w.rumor.claims.a = claim("claim.a", "claim.root-a");
    expect(read()).toEqual([report]);
    w.rumor.claims.b = claim("claim.b", "claim.root-a");
    expect(read()).toEqual([report]);
    w.rumor.claims.b.origin_claim_id = "claim.root-b";
    expect(read()).toEqual([report, contested]);
    w.rumor.claims.b.subject_ref = "room.b";
    expect(read()).toEqual([report]);
    w.rumor.claims.b.subject_ref = "entity.box";
    expect(read()).toEqual([report, contested]);
    w.rooms["room.a"].entities[0].hidden = true;
    expect(read()).toEqual([report]);
    w.rumor.claims.a.visibility = "PRIVATE";
    expect(read()).toEqual([]);
    delete w.rumor.claims.a;
    delete w.rumor.claims.b;
    expect(read()).toEqual([]);
  });

  it("removes insignia and vacancy when their canonical ownership or office sources disappear", () => {
    const w = fixtureWorld();
    w.rooms["room.a"].entities[0].owner_id = "org.line";
    w.organizations["org.line"] = {
      org_id: "org.line", name: "Line", charter: "Synthetic projection setup", status: "ACTIVE",
      creator_id: "player.source", members: [], created_cycle: 0,
      offices: { "office.line": { office_id: "office.line", institution_id: "org.line",
        display_name: "Crier", status: "VACANT", authority_profile: "PUBLISH_NOTICE", created_cycle: 0, history: [] } },
    };
    const read = () => buildObservation(w, observer).location?.traces?.map(t => t.text);
    const mark = "Marks of Line remain here.";
    expect(read()).toEqual([mark, "Crier of Line stands vacant."]);
    w.organizations["org.line"].offices!["office.line"].status = "OCCUPIED";
    expect(read()).toEqual([mark]);
    w.organizations["org.line"].offices!["office.line"].status = "VACANT";
    delete w.organizations["org.line"].offices!["office.line"];
    expect(read()).toEqual([mark]);
    w.rooms["room.a"].entities[0].owner_id = undefined;
    expect(read()).toEqual([]);
    w.rooms["room.a"].entities[0].owner_id = "org.line";
    expect(read()).toEqual([mark]);
    delete w.organizations["org.line"];
    expect(read()).toEqual([]);
  });
});

// Real authenticated Worker -> DO handlers with the existing fake platform KV.
// restart() reconstructs the application DO from retained fixture storage only.
describe("command-written notices through authenticated Worker/DO readback", () => {
  it("reads back command-written vacancy removal and rejects org-subject public claims as room rumors", async () => {
    const world = fixtureWorld();
    // Seed only an owned asset for spatial projection. This is not evidence of BUILD.VEST.
    world.rooms["room.a"].entities[0].owner_id = "org.seed";
    world.organizations["org.seed"] = {
      org_id: "org.seed", name: "Line", charter: "fixture spatial ownership", status: "ACTIVE",
      creator_id: "player.boundary", members: [{ agent_id: "player.boundary", role: "founder" }], created_cycle: 0,
    };
    const h = harness(world);
    const agent = await h.agent();
    const send = async (command: string, args: Record<string, unknown> = {}) => {
      const response = await h.command(agent.access_token, command, args);
      expect(response.status).toBe(200);
      const result = await response.json() as CommandResult;
      expect(result.ok, JSON.stringify(result.error)).toBe(true);
      return result;
    };
    await send("ENTER_WORLD");
    const created = await send("ORG_OFFICE_CREATE", { org_id: "org.seed", display_name: "Crier", authority_profile: "PUBLISH_NOTICE" });
    expect(texts(created)).toEqual(["Marks of Line remain here.", "Crier of Line stands vacant."]);
    const officeId = Object.keys((await h.persistedWorld())!.organizations["org.seed"].offices!)[0];
    await send("ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: agent.player_id });
    h.restart();
    expect(texts(await send("LOOK"))).toEqual(["Marks of Line remain here."]);
    await send("ORG_OFFICE_ACT", { office_id: officeId, notice: "An institutional public claim" });
    const claims = Object.values((await h.persistedWorld())!.rumor!.claims);
    expect(claims).toContainEqual(expect.objectContaining({ visibility: "PUBLIC", subject_ref: "org.seed" }));
    expect(texts(await send("LOOK"))).toEqual(["Marks of Line remain here."]);
    expect(texts(await send("ORG_OFFICE_VACATE", { office_id: officeId })))
      .toEqual(["Marks of Line remain here.", "Crier of Line stands vacant."]);
    h.restart();
    expect(texts(await send("LOOK"))).toEqual(["Marks of Line remain here.", "Crier of Line stands vacant."]);
    await send("ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: agent.player_id });
    h.restart();
    expect(texts(await send("LOOK"))).toEqual(["Marks of Line remain here."]);
  });

  it.each([
    ["BOARD", "board"], ["SHOUT", "shout"], ["NOTICE", "institution_notice"], ["TRADE_NOTICE", "trade_notice"],
  ] as const)("updates and removes %s after the existing committed-cycle boundary", async (surface, field) => {
    const h = harness();
    const agent = await h.agent();
    const send = async (command: string, args: Record<string, unknown> = {}) => {
      const response = await h.command(agent.access_token, command, args);
      expect(response.status).toBe(200);
      const result = await response.json() as CommandResult;
      expect(result.ok, JSON.stringify(result.error)).toBe(true);
      return result;
    };
    await send("ENTER_WORLD");
    if (surface === "NOTICE") {
      await send("ORG_CREATE", { name: "Nacre Compact", charter: "local coordination" });
      const orgId = Object.keys((await h.persistedWorld())!.organizations)[0];
      await send("ORG_OFFICE_CREATE", { org_id: orgId, display_name: "Crier", authority_profile: "PUBLISH_NOTICE" });
      const officeId = Object.keys((await h.persistedWorld())!.organizations[orgId].offices!)[0];
      await send("ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: agent.player_id });
      await send("WAIT");
    }
    const old = `Earlier ${surface} trace`;
    const current = `Current ${surface} trace`;
    expect(texts(await send("MESSAGE", { surface, text: old }))).toEqual([old]);
    expect(texts(await send("MESSAGE", { surface, text: current }))).toEqual([current]);
    const stored = (await h.persistedWorld())!;
    const residue = stored.rooms["room.a"][field];
    if (field === "board") expect(residue).toEqual([{ text: old, cycle: stored.cycle }, { text: current, cycle: stored.cycle }]);
    else expect(residue).toMatchObject({ text: current, cycle: stored.cycle });
    h.restart();
    const look = await send("LOOK");
    expect(texts(look)).toEqual([current]);
    expect(look.observation?.play_text).toContain(`TRACES\n${current}`);
    expect(look.observation?.play_text).not.toContain(old);
    expect(look.observation?.play_text?.length).toBeLessThanOrEqual(4096);
    const waited = await send("WAIT");
    expect(waited.observation?.cycle).toBe(stored.cycle + 1);
    expect(texts(waited)).toEqual([]);
    expect((await h.persistedWorld())!.rooms["room.a"][field]).toBeUndefined();
    h.restart();
    const after = await send("LOOK");
    expect(texts(after)).toEqual([]);
    expect(after.observation?.play_text).not.toContain(current);
    expect(h.calls.filter(c => c.path === "/command").every(c => c.name === WORLD)).toBe(true);
  });
});
