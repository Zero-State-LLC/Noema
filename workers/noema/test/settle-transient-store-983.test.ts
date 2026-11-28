/** Noema#983, third occurrence (2026-11-28 07:05Z): a player-action settle failed on a transient Postgres error
 * (`canceling statement due to statement timeout`, SQLSTATE 57014). The rejection reached the client with that message as
 * its error code, and the whole world went to INCIDENT. The durable head was unchanged (DO revision == head revision),
 * so nothing was lost; an operator `recover` (restore) was always safe.
 *
 * A statement timeout rolls back the RPC transaction: the head did not move. Treat it like a lost race: reject the actor
 * with a retryable code, resync from the durable head, stay ACTIVE.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorldHead } from "../src/settle";
import { isTransientStoreSettlementFail } from "../src/settle-fence";
import type { WorldRuntime } from "../src/world-actions";
import { harness, WORLD } from "./agent-http-do-fixture";

afterEach(() => vi.unstubAllGlobals());

describe("transient store settlement failure (Noema#983, statement timeout)", () => {
  it("classifies a Postgres statement timeout as transient, not as an integrity failure", () => {
    expect(isTransientStoreSettlementFail("canceling statement due to statement timeout")).toBe(true);
    expect(isTransientStoreSettlementFail("57014")).toBe(true);
    expect(isTransientStoreSettlementFail("STATE_DIGEST_MISMATCH")).toBe(false);
    expect(isTransientStoreSettlementFail("SETTLEMENT_UNCERTAIN")).toBe(false);
  });

  it.each([
    [{ code: "57014", message: "canceling statement due to statement timeout" }, 500],
    [{ message: "canceling statement due to statement timeout" }, 500],
  ])("keeps the world ACTIVE and resyncs from the head (%j)", async (failure, status) => {
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const energy = before.players["player.boundary"].budgets.energy;
    const head: WorldHead = { world_id: WORLD, cycle: before.cycle, sequence: before.sequence,
      revision: 0, status: "ACTIVE", settlement_health: "HEALTHY", state_json: structuredClone(before) };
    let commits = 0;
    h.env.SUPABASE_URL = "https://settlement.invalid";
    h.env.SUPABASE_SERVICE_ROLE_KEY = "local-fixture-only-not-a-service-key";
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/rest/v1/noema_world_heads") return Response.json([structuredClone(head)]);
      if (url.pathname === "/rest/v1/rpc/noema_commit_canonical_settlement") {
        commits += 1;
        void init;
        return Response.json(failure, { status });
      }
      throw new Error(`Unexpected fake settlement route ${url.pathname}`);
    }));
    const body = { request_id: "timeout-move", idempotency_key: "timeout-move", command: "MOVE", arguments: { target_id: "east" } };
    const rejected = await h.hit("/v1/command", body, token);
    expect(rejected.status).toBe(200);
    const result = await rejected.json() as { ok: boolean; error?: { code?: string } };
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("SETTLEMENT_RETRY");
    expect(commits).toBe(1);
    const meta = (await h.persistedMeta())!;
    expect(meta.status).toBe("ACTIVE");
    expect(meta.settlement_health).toBe("HEALTHY");
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.a");
    expect(after.players["player.boundary"].budgets.energy).toBe(energy);
    expect(after.seen_idempotency["player.boundary::timeout-move"]).toBeUndefined();
  });

  it("still enters INCIDENT for a non-transient settle failure", async () => {
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const head: WorldHead = { world_id: WORLD, cycle: before.cycle, sequence: before.sequence,
      revision: 0, status: "ACTIVE", settlement_health: "HEALTHY", state_json: structuredClone(before) as WorldRuntime };
    h.env.SUPABASE_URL = "https://settlement.invalid";
    h.env.SUPABASE_SERVICE_ROLE_KEY = "local-fixture-only-not-a-service-key";
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/rest/v1/noema_world_heads") return Response.json([structuredClone(head)]);
      if (url.pathname === "/rest/v1/rpc/noema_commit_canonical_settlement") {
        return Response.json({ ok: false, code: "STATE_DIGEST_MISMATCH" }, { status: 409 });
      }
      throw new Error(`Unexpected fake settlement route ${url.pathname}`);
    }));
    const body = { request_id: "digest-move", idempotency_key: "digest-move", command: "MOVE", arguments: { target_id: "east" } };
    const res = await (await h.hit("/v1/command", body, token)).json() as { ok: boolean };
    expect(res.ok).toBe(false);
    expect((await h.persistedMeta())!.status).toBe("INCIDENT");
  });
});
