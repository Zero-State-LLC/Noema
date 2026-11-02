import { describe, expect, it } from "vitest";
import { NoemaWorldDO } from "../src/world-do";
import type { Env } from "../src/types";

const TARGET = "test.hosted-canonical.target-733";
const DEFAULT = "test.hosted-canonical.default-733";
function fixture(options: { production?: boolean; storedWorld?: string } = {}) {
  const reads: string[] = [];
  const writes: string[] = [];
  const aborts: Array<{ reason: string; options: unknown }> = [];
  const state = {
    storage: {
      async get(key: string) {
        reads.push(key);
        return key === "world" && options.storedWorld ? { world_id: options.storedWorld } : undefined;
      },
      async put(key: string) { writes.push(key); },
    },
    abort(reason: string, opts: unknown) {
      aborts.push({ reason, options: opts });
      throw new Error("DO_RESET_FOR_TEST");
    },
  } as unknown as DurableObjectState;
  const env = { NOEMA_ENV: options.production ? "production" : "test", DEFAULT_WORLD_ID: DEFAULT,
    ISOLATED_WATCH_WORLD_ID: TARGET } as Env;
  const object = new NoemaWorldDO(state, env);
  const request = (action: string, worldId = TARGET) => object.fetch(new Request(`https://do/isolated-instance/${action}`, {
    method: "POST", headers: { "x-noema-world-id": worldId },
  }));
  return { request, reads, writes, aborts };
}

describe("isolated DO instance controls", () => {
  it("reports a stable instance nonce without loading or writing world state", async () => {
    const h = fixture();
    const a = await h.request("probe");
    const b = await h.request("probe");
    expect(a.status).toBe(200);
    const one = await a.json() as { world_id: string; instance_id: string };
    const two = await b.json() as { world_id: string; instance_id: string };
    expect(one.world_id).toBe(TARGET);
    expect(one.instance_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(two.instance_id).toBe(one.instance_id);
    expect(h.reads).toEqual(["world", "world"]);
    expect(h.writes).toEqual([]);
  });
  it("denies production, wrong target, and mismatched retained world without a nonce", async () => {
    for (const h of [fixture({ production: true }), fixture({ storedWorld: DEFAULT })]) {
      const res = await h.request("probe");
      expect(res.status).toBe(403);
      expect(JSON.stringify(await res.json())).not.toContain("instance_id");
      expect(h.writes).toEqual([]);
    }
    const h = fixture();
    expect((await h.request("probe", DEFAULT)).status).toBe(403);
    expect(h.writes).toEqual([]);
  });
  it("aborts an admitted test instance without writing storage", async () => {
    const h = fixture();
    await expect(h.request("evict")).rejects.toThrow("DO_RESET_FOR_TEST");
    expect(h.reads).toEqual(["world"]);
    expect(h.writes).toEqual([]);
    expect(h.aborts).toEqual([{ reason: "isolated verification reset", options: { retryAlarm: false } }]);
  });
  it("never aborts production, default, or a mismatched stored world", async () => {
    for (const h of [fixture({ production: true }), fixture({ storedWorld: DEFAULT })]) {
      expect((await h.request("evict")).status).toBe(403);
      expect(h.aborts).toEqual([]);
      expect(h.writes).toEqual([]);
    }
    const h = fixture();
    expect((await h.request("evict", DEFAULT)).status).toBe(403);
    expect(h.aborts).toEqual([]);
  });
});
