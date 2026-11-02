import { describe, expect, it } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

const TARGET = "test.hosted-canonical.733-isolation-regression";

describe("isolated Agent command world binding", () => {
  it("commits only to the admitted target world, never DEFAULT_WORLD_ID", async () => {
    const h = harness(undefined, TARGET);
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const minted = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (minted instanceof Response) throw new Error("fixture admin session failed");
    const agent = await h.agent();
    const defaultBefore = await h.persistedWorld(WORLD);
    h.env.SUPABASE_URL = "https://example.supabase.co";
    h.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-only-service-role";
    const rpc: Record<string, unknown>[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/rest/v1/noema_world_heads?")) {
        expect(url).toContain(encodeURIComponent(TARGET));
        return Response.json([]);
      }
      expect(url).toContain("/rest/v1/rpc/noema_commit_canonical_settlement");
      rpc.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return Response.json({ ok: true, revision: 1, sequence: 0, idempotent: false });
    }) as typeof fetch;
    let response: Response;
    try {
      response = await h.hit(
        "/v1/operator/test-world/command",
        { request_id: "isolated-world-enter", command: "ENTER_WORLD", world_id: TARGET },
        agent.access_token,
        undefined,
        { "X-Noema-Admin-Token": minted.access_token },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(response.status).toBe(200);
    expect(rpc).toHaveLength(1);
    expect(rpc[0].p_world_id).toBe(TARGET);
    expect(rpc[0].p_allow_bootstrap).toBe(true);
    expect((rpc[0].p_events as Array<{ sequence: number; event_type: string }>).map(e => [e.sequence, e.event_type]))
      .toEqual([[0, "AGENT_ENTERED_WORLD"]]);
    const result = await response.json() as { ok: boolean; events?: Array<{ event_id: string }> };
    expect(result.ok).toBe(true);
    expect(result.events?.length).toBeGreaterThan(0);
    expect(h.calls.filter(c => c.path === "/command")).toEqual([{ name: TARGET, path: "/command" }]);
    const target = await h.persistedWorld(TARGET);
    const defaultWorld = await h.persistedWorld(WORLD);
    expect(target?.world_id).toBe(TARGET);
    expect(target?.sequence).toBe(0); // Mini Chamber starts at -1; first ENTER emits sequence 0.
    expect(target?.players[agent.player_id]?.entered).toBe(true);
    expect((await h.persistedMeta(TARGET))?.revision).toBe(1);
    expect((await h.persistedMeta(TARGET))?.settlement_health).toBe("HEALTHY");
    expect(result.events?.[0]?.event_id).toBe("evt.tw.733-isolation-regression.000000");
    expect(defaultWorld).toEqual(defaultBefore);
  });

  it("rejects a non-admitted target before DO lookup or storage writes", async () => {
    const h = harness();
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const minted = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (minted instanceof Response) throw new Error("fixture admin session failed");
    const agent = await h.agent();
    const response = await h.hit(
      "/v1/operator/test-world/command",
      { request_id: "forbidden-world-enter", command: "ENTER_WORLD", world_id: WORLD },
      agent.access_token, undefined, { "X-Noema-Admin-Token": minted.access_token },
    );
    const result = await response.json() as { error?: { code: string } };
    expect(response.status).toBe(403);
    expect(result.error?.code).toBe("WORLD_FORBIDDEN");
    expect(h.calls.filter(c => c.path === "/command")).toEqual([]);
    expect(h.writes).toEqual([]);
  });

  it("rejects a mismatched stored isolate before load-time writes or settlement", async () => {
    const wrong = fixtureWorld();
    wrong.players["player.stale"] = {
      player_id: "player.stale", handle: "Stale", room_id: wrong.entry_room_id,
      entered: true,
    } as unknown as typeof wrong.players[string];
    const h = harness(undefined, TARGET, wrong);
    h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
    const minted = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
    if (minted instanceof Response) throw new Error("fixture admin session failed");
    const agent = await h.agent();
    const response = await h.hit(
      "/v1/operator/test-world/command",
      { request_id: "mismatch-enter", command: "ENTER_WORLD", world_id: TARGET },
      agent.access_token, undefined, { "X-Noema-Admin-Token": minted.access_token },
    );
    const result = await response.json() as { ok: boolean; error?: { code: string } };
    expect(response.status).toBe(403);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("WORLD_FORBIDDEN");
    expect(h.writes).toEqual([]);
    expect(await h.persistedWorld(TARGET)).toEqual(wrong);
    expect(await h.persistedMeta(TARGET)).toMatchObject({ status: "ACTIVE", settlement_health: "HEALTHY" });
  });
});
