/** P2.3 additions to P2.1: HTTP producer -> persisted DO -> map, and governed anonymous reads.
 * P2.1 a11ecc9/0e438ee owns live first-public/privacy selection, not this file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorldRuntime } from "../src/world-actions";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No external network"); })));
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

type Reconstruction = NonNullable<WorldRuntime["reconstructions"]>[string];
function record(id: string, visibility: "PUBLIC" | "PRIVATE", fidelity: number): Reconstruction {
  return { reconstruction_id: id, author_player_id: "player.author", subject_ref: "entity.box",
    claim: "PRIVATE_RECONSTRUCTION_SENTINEL", evidence_refs: [], created_cycle: 0,
    status: "RECORDED", epistemic: "OPEN", visibility, fidelity };
}

async function readMap(h: ReturnType<typeof harness>) {
  const response = await h.hit("/v1/watch/map");
  expect(response.status).toBe(200);
  return response.json() as Promise<{ projection: string; health: { reconstruction_fidelity: number } }>;
}

describe("persisted reconstruction HTTP boundary", () => {
  it("produces two accounts through real HTTP commands, keeps private map fidelity absent and publishes from persisted records", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    async function act(command: string, args: Record<string, unknown> = {}) {
      const response = await h.command(token, command, args);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ ok: true });
      return body;
    }
    await act("ENTER_WORLD");
    await act("INSPECT", { target_id: "entity.box" });
    await act("COMMIT", { operation: "RECONSTRUCT", subject_ref: "entity.box", claim: "PRIVATE_RECONSTRUCTION_SENTINEL", evidence: ["LIVE_INSPECT"] });
    const first = Object.values((await h.persistedWorld())!.reconstructions!)[0];
    expect(first).toMatchObject({ visibility: "PRIVATE", fidelity: 0.2 });
    expect(first).not.toHaveProperty("controllers");
    h.restart();
    expect(await readMap(h)).toMatchObject({ projection: "public-map", health: { reconstruction_fidelity: 0 } });
    await act("COMMIT", { operation: "RECONSTRUCT_PUBLISH", reconstruction_id: first.reconstruction_id, visibility: "PUBLIC" });
    await act("COMMIT", { operation: "RECONSTRUCT", subject_ref: "entity.box", claim: "A second authored account.", evidence: ["LIVE_INSPECT"], visibility: "PUBLIC" });
    const records = Object.values((await h.persistedWorld())!.reconstructions!);
    expect(records).toHaveLength(2);
    for (const rec of records) {
      expect(rec).toMatchObject({ visibility: "PUBLIC", fidelity: 0.2 });
      expect(rec).not.toHaveProperty("controllers"); // Missing producer count is evidence, not an inferred census.
    }
    h.restart();
    const map = await readMap(h);
    expect(map.health.reconstruction_fidelity).toBe(0.2);
    const live = await h.hit("/v1/watch/live");
    expect(live.status).toBe(200);
    expect(await live.json()).toMatchObject({ reconstruction_fidelity: 0.2, controllers: 1 });
    expect(JSON.stringify(map)).not.toContain(first.reconstruction_id);
    expect(JSON.stringify(map)).not.toContain(first.claim);
  });

  it.each([false, true])("keeps the existing map public average independent of private records and public insertion order (reverse=%s)", async (reverse) => {
    const world = fixtureWorld();
    const publicRecords = [record("recon.zero", "PUBLIC", 0), record("recon.high", "PUBLIC", 0.6)];
    if (reverse) publicRecords.reverse();
    world.reconstructions = Object.fromEntries([record("recon.private", "PRIVATE", 0.99), ...publicRecords].map(r => [r.reconstruction_id, r]));
    const h = harness(world);
    const map = await readMap(h);
    expect(map.health.reconstruction_fidelity).toBe(0.3);
    h.restart();
    expect(await readMap(h)).toEqual(map);
    // Live intentionally retains first-public selection (P2.1 tests), not this map average.
  });

  it.each([undefined, null, -2, "not-a-count", { private: "METADATA_SENTINEL" }])("does not publish absent or invalid legacy Controller metadata through map (%j)", async (controllers) => {
    const world = fixtureWorld();
    // Adversarial persisted legacy data, not a supported producer output or count policy.
    world.reconstructions = { "recon.public": Object.assign(record("recon.public", "PUBLIC", 0.4), { controllers }) };
    const map = await readMap(harness(world));
    expect(map.health.reconstruction_fidelity).toBe(0.4);
    expect(map).not.toHaveProperty("controllers");
    expect(map.health).not.toHaveProperty("controllers");
    expect(JSON.stringify(map)).not.toContain("METADATA_SENTINEL");
  });

  it("keeps anonymous query-selected POV/research requests public and leaves persisted world state unchanged", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = await h.persistedWorld();
    for (const path of ["/v1/watch/live", "/v1/watch/map"]) {
      const publicResponse = await h.hit(path);
      expect(publicResponse.status).toBe(200);
      const publicData = await publicResponse.json();
      const escalation = await h.hit(`${path}?mode=research&player_id=player.boundary&include_private=true`);
      expect(escalation.status).toBe(200);
      expect(await escalation.json()).toEqual(publicData);
      const serialized = JSON.stringify(publicData);
      for (const key of ["affordances", "inbox", "situation", "budgets", "player.boundary"]) expect(serialized).not.toContain(key);
    }
    expect(await h.persistedWorld()).toEqual(before);
    // SPECTATOR-ONBOARDING normative rules 2/4: no world write and no private/research partition.
    // No deployment-specific numeric request quota is invented here.
  });
});
