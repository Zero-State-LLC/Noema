import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { harness } from "./agent-http-do-fixture";
import { mintControllerToken } from "../src/auth";

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

  it("HTTP MESSAGE malformed channel is a bounded parser refusal", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const r = await h.command(token, "MESSAGE", { surface: "CHANNEL", text: "PRIVATE_CHANNEL_SENTINEL" });
    expect(r.status).toBe(200);
    const body = await r.json() as any;
    expect(body).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(body.observation?.play_text).toContain("Name a channel institution. Nothing changes.");
    expect(JSON.stringify(body)).not.toContain("PRIVATE_CHANNEL_SENTINEL");
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.messages).toEqual(before.messages);
    expect(body.events ?? []).toEqual([]);
  });

  it("HTTP HARVEST unknown entity preserves state and hides guess", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const r = await h.command(token, "COMMIT", {
      operation: "HARVEST", entity_id: "entity.private-guess",
    });
    expect(r.status).toBe(200);
    const body = await r.json() as any;
    expect(body).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(body.observation?.play_text).toContain("HAPPENED\nYou try to harvest.\nfail");
    expect(JSON.stringify(body)).not.toContain("entity.private-guess");
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.rooms["room.a"].entities).toEqual(before.rooms["room.a"].entities);
    expect(body.events ?? []).toEqual([]);
  });

  it("HTTP REPAIR unknown entity preserves condition and budgets", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const r = await h.command(token, "COMMIT", {
      operation: "REPAIR", entity_id: "entity.private-guess",
    });
    expect(r.status).toBe(200);
    const body = await r.json() as any;
    expect(body).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(body.observation?.play_text).toContain("HAPPENED\nYou try to repair.\nfail");
    expect(JSON.stringify(body)).not.toContain("entity.private-guess");
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    expect(after.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    expect(after.rooms["room.a"].entities).toEqual(before.rooms["room.a"].entities);
    expect(body.events ?? []).toEqual([]);
  });

  it("HTTP rejected MESSAGE survives DO restart without a queued inbox entry", async () => {
    const h = harness(); const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const before = (await h.persistedWorld())!;
    const request = { request_id: "reject-restart-1", idempotency_key: "reject-restart-1",
      command: "MESSAGE", arguments: { recipient_id: "player.private-guess", text: "PRIVATE_RESTART_SENTINEL" } };
    const first = await h.hit("/v1/command", request, token);
    expect(first.status).toBe(200);
    const rejected = await first.json() as any;
    expect(rejected.ok).toBe(false);
    expect(JSON.stringify(rejected)).not.toMatch(/PRIVATE_RESTART_SENTINEL|player\.private-guess/);
    h.restart();
    const persisted = (await h.persistedWorld())!;
    expect(persisted.sequence).toBe(before.sequence);
    expect(persisted.messages).toEqual(before.messages);
    expect(persisted.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    const replay = await h.hit("/v1/command", request, token);
    expect(replay.status).toBe(200);
    expect((await replay.json() as any).error?.code).toBe(rejected.error?.code);
    const afterReplay = (await h.persistedWorld())!;
    expect(afterReplay.sequence).toBe(before.sequence);
    expect(afterReplay.messages).toEqual(before.messages);
    expect(afterReplay.players["player.boundary"].budgets).toEqual(before.players["player.boundary"].budgets);
    const look = await h.command(token, "LOOK");
    expect(look.status).toBe(200);
    expect(JSON.stringify(await look.json())).not.toContain("PRIVATE_RESTART_SENTINEL");
  });

  it("HTTP delivered MESSAGE survives restart for recipient but not WATCH", async () => {
    const h = harness(); const sender = await h.agent();
    const recipient = await mintControllerToken(h.env, {
      handle: "Receiver", controllerType: "agent", playerId: "player.receiver",
    });
    expect((await h.command(sender.access_token, "ENTER_WORLD")).status).toBe(200);
    expect((await h.command(recipient.access_token, "ENTER_WORLD")).status).toBe(200);
    const sent = await h.command(sender.access_token, "MESSAGE", {
      recipient_id: recipient.player_id, text: "PRIVATE_DELIVERED_SENTINEL",
    });
    expect(sent.status).toBe(200);
    expect((await sent.json() as any).ok).toBe(true);
    h.restart();
    const saved = (await h.persistedWorld())!;
    expect(saved.messages.length).toBeGreaterThan(0);
    const recipientLook = await h.command(recipient.access_token, "LOOK");
    expect(recipientLook.status).toBe(200);
    expect(JSON.stringify(await recipientLook.json())).toContain("PRIVATE_DELIVERED_SENTINEL");
    const senderLook = await h.command(sender.access_token, "LOOK");
    expect(JSON.stringify(await senderLook.json())).not.toContain("PRIVATE_DELIVERED_SENTINEL");
    const live = await h.hit("/v1/watch/live");
    expect(live.status).toBe(200);
    expect(JSON.stringify(await live.json())).not.toContain("PRIVATE_DELIVERED_SENTINEL");
  });
});
