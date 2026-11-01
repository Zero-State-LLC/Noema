import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { harness } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => {
  throw new Error("External network forbidden in local DO fixture");
})));
afterEach(() => { vi.unstubAllGlobals(); });

describe("Agent HTTP bounded rejections", () => {
  it("HTTP MESSAGE missing recipient is bounded and has no durable debit", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const r = await h.command(token, "MESSAGE", { text: "PRIVATE_MISSING_SENTINEL" });
    expect(r.status).toBe(200);
    const body = await r.json() as any;
    expect(body).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(body.observation?.play_text).toContain("HAPPENED\nYou try to message.\nfail");
    expect(JSON.stringify(body)).not.toContain("PRIVATE_MISSING_SENTINEL");
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.messages).toEqual(before.messages);
    expect(body.events ?? []).toEqual([]);
  });

  it("HTTP MESSAGE unknown recipient hides guessed ID and private body", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const r = await h.command(token, "MESSAGE", {
      recipient_id: "player.private-guess", text: "PRIVATE_UNKNOWN_SENTINEL",
    });
    expect(r.status).toBe(200);
    const body = await r.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("FORBIDDEN");
    expect(body.observation?.play_text).toContain("HAPPENED\nYou try to message.\nfail");
    expect(JSON.stringify(body)).not.toMatch(/player\.private-guess|PRIVATE_UNKNOWN_SENTINEL/);
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.messages).toEqual(before.messages);
    expect(body.events ?? []).toEqual([]);
  });
});
