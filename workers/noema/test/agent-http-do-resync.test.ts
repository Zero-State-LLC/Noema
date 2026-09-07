/** Actual HTTP/DO settlement recovery, with an entirely local fake Postgres REST boundary.
 * Not WS delivery-position resync. That scope is reserved by the accepted protocol sweep.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorldHead } from "../src/settle";
import type { WorldRuntime } from "../src/world-actions";
import { harness, WORLD } from "./agent-http-do-fixture";

afterEach(() => vi.unstubAllGlobals());

describe("mounted command settlement resynchronization", () => {
  it.each(["SEQUENCE_GAP", "REVISION_MISMATCH"])("restores the authoritative head after %s and re-executes the same key exactly once", async (code) => {
    const h = harness();
    const token = (await h.agent()).access_token;
    // Establish an entered Player via the real Worker, before enabling the fake settlement service.
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const energy = before.players["player.boundary"].budgets.energy;
    let head: WorldHead = { world_id: WORLD, cycle: before.cycle, sequence: before.sequence,
      revision: 0, status: "ACTIVE", settlement_health: "HEALTHY", state_json: structuredClone(before) };
    const commits: Array<{ p_settlement_id: string; p_expected_revision: number; p_state_json: WorldRuntime; p_events: Array<{ event_type: string; sequence: number }> }> = [];
    let acceptedEvents: Array<{ event_type: string; sequence: number }> = [];
    const unexpected: string[] = [];
    h.env.SUPABASE_URL = "https://settlement.invalid";
    h.env.SUPABASE_SERVICE_ROLE_KEY = "local-fixture-only-not-a-service-key";
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin !== "https://settlement.invalid") {
        unexpected.push(url.origin + url.pathname);
        throw new Error("External network forbidden");
      }
      if (url.pathname === "/rest/v1/noema_world_heads") {
        expect(url.searchParams.get("world_id")).toBe(`eq.${WORLD}`);
        return Response.json([structuredClone(head)]);
      }
      if (url.pathname === "/rest/v1/rpc/noema_commit_canonical_settlement") {
        const body = JSON.parse(String(init?.body)) as typeof commits[number];
        commits.push(body);
        if (commits.length === 1) {
          // Simulate a concurrent committed head advancing while this candidate was evaluated.
          const restored = structuredClone(before);
          restored.sequence = before.sequence + 10;
          head = { ...head, revision: 7, sequence: restored.sequence, state_json: restored };
          return Response.json({ ok: false, code }, { status: 409 });
        }
        if (commits.length > 2) {
          expect(body.p_settlement_id).toBe(commits[1].p_settlement_id);
          expect(body.p_events).toEqual(commits[1].p_events);
          return Response.json({ ok: true, revision: head.revision, sequence: head.sequence, idempotent: true });
        }
        acceptedEvents = body.p_events;
        head = { ...head, revision: 8, sequence: body.p_state_json.sequence, state_json: structuredClone(body.p_state_json) };
        return Response.json({ ok: true, revision: head.revision, sequence: head.sequence, idempotent: false });
      }
      unexpected.push(url.pathname);
      throw new Error("Unexpected fake settlement route");
    }));
    const body = { request_id: "resync-move", idempotency_key: "resync-move", command: "MOVE", arguments: { target_id: "east" } };
    const rejected = await h.hit("/v1/command", body, token);
    expect(rejected.status).toBe(200);
    expect(await rejected.json()).toMatchObject({ ok: false, error: { code: "SETTLEMENT_RESYNC" } });
    const restored = (await h.persistedWorld())!;
    expect(restored.sequence).toBe(before.sequence + 10);
    expect(restored.players["player.boundary"].room_id).toBe("room.a");
    expect(restored.players["player.boundary"].budgets.energy).toBe(energy);
    expect(restored.seen_idempotency["player.boundary::resync-move"]).toBeUndefined();
    expect(acceptedEvents).toEqual([]);
    h.restart();
    const retried = await h.hit("/v1/command", body, token);
    expect(retried.status).toBe(200);
    const result = await retried.json();
    expect(result).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
    expect(commits).toHaveLength(2);
    expect(commits[1].p_expected_revision).toBe(7);
    expect(acceptedEvents.filter(event => event.event_type === "MOVE")).toHaveLength(1);
    expect(acceptedEvents[0].sequence).toBe(before.sequence + 11);
    const accepted = (await h.persistedWorld())!;
    expect(accepted.players["player.boundary"].budgets.energy).toBe(energy - 1);
    const replay = await h.hit("/v1/command", body, token);
    expect(await replay.json()).toEqual(result);
    expect(commits).toHaveLength(3); // RPC replays the same settlement, fake RPC deduplicates like SQL.
    expect(acceptedEvents.filter(event => event.event_type === "MOVE")).toHaveLength(1);
    expect((await h.persistedWorld())!.players["player.boundary"].budgets.energy).toBe(energy - 1);
    expect(unexpected).toEqual([]);
  });
});
