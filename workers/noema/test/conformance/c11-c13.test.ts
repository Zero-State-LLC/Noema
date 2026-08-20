import { describe, expect, it } from "vitest";
import { consumePlayMagicLink, GENERIC_PLAY_LOGIN_MESSAGE } from "../../src/play-auth";
import { verifyHs256 } from "../../src/jwt";
import { GAME_SCOPES } from "../../src/device-enrollment";
import { SIGNING, hit, hitWatchLive, humanToken, type DoCall } from "./harness";

const USER = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "player@example.com",
};

describe("C11 human onboarding", () => {
  it("POST /v1/play/login/request rejects a bad email and does not send mail", async () => {
    const res = await hit("/v1/play/login/request", { body: { email: "not-an-email" } }, []);
    expect(res.status).toBe(400);
  });

  it("POST /v1/play/login/request is generic when Supabase is unset", async () => {
    const res = await hit("/v1/play/login/request", { body: { email: "anyone@example.com" } }, []);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean; message: string };
    expect(j.ok).toBe(true);
    expect(j.message).toBe(GENERIC_PLAY_LOGIN_MESSAGE);
  });

  it("consume without a hash is rejected; mocked verify mints a Player token once", async () => {
    const missing = await hit("/v1/play/login/consume", { body: {} }, []);
    expect([400, 503]).toContain(missing.status);

    const minted = await consumePlayMagicLink(
      {
        TOKEN_SIGNING_SECRET: SIGNING,
        NOEMA_ENV: "production",
        NOEMA_PROTOCOL_VERSION: "1",
        DEFAULT_WORLD_ID: "world-01",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "srk",
      } as never,
      { token_hash: "h", type: "email" },
      { fetch: async () => new Response(JSON.stringify({ user: USER }), { status: 200 }) },
    );
    expect(minted).not.toBeInstanceOf(Response);
    const ok = minted as { access_token: string; identity_id: string; controller_type: string };
    expect(ok.controller_type).toBe("human");
    expect(ok.identity_id).toBeTruthy();
    expect("refresh_token" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, SIGNING);
    expect(claims.typ).toBe("platform");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
  });
});

describe("C12 agent onboarding", () => {
  it("POST /v1/auth/device → approve → token once", async () => {
    const calls: DoCall[] = [];
    const started = await hit("/v1/auth/device", { body: { metadata: { runtime: "openclaw" } } }, calls);
    expect(started.status).toBe(200);
    const enroll = (await started.json()) as {
      device_code: string;
      user_code: string;
      controller_id: string;
      access_token?: string;
    };
    expect(enroll.user_code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(enroll.controller_id).toMatch(/^ctrl\.device\.[a-f0-9]{12}$/);
    expect(enroll.access_token).toBeUndefined();

    const pending = await hit("/v1/auth/device/token", { body: { device_code: enroll.device_code } }, calls);
    expect(pending.status).toBe(200);
    expect(((await pending.json()) as { status: string }).status).toBe("authorization_pending");

    const approve = await hit(
      "/v1/auth/device/approve",
      {
        headers: { Authorization: `Bearer ${await humanToken()}` },
        body: { user_code: enroll.user_code },
      },
      calls,
    );
    expect(approve.status).toBe(200);
    expect(((await approve.json()) as { access_token?: string }).access_token).toBeUndefined();

    const first = await hit("/v1/auth/device/token", { body: { device_code: enroll.device_code } }, calls);
    expect(first.status).toBe(200);
    const minted = (await first.json()) as {
      access_token: string;
      status: string;
      controller_id: string;
      scopes: string[];
    };
    expect(minted.status).toBe("approved");
    expect(minted.controller_id).toBe(enroll.controller_id);
    expect(minted.scopes).toEqual([...GAME_SCOPES]);
    expect(minted.access_token.length).toBeGreaterThan(20);
    const claims = await verifyHs256(minted.access_token, SIGNING);
    expect(claims.typ).toBe("access");
    expect(claims.controller_type).toBe("agent");

    const second = await hit("/v1/auth/device/token", { body: { device_code: enroll.device_code } }, calls);
    expect(second.status).toBe(401);
    expect(JSON.stringify(await second.json())).not.toMatch(/access_token":"[^"]+/);
  });
});

describe("C13 spectator onboarding", () => {
  it("GET /watch and GET /v1/watch/live require no Player token", async () => {
    const page = await hit("/watch", { method: "GET" }, []);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("/v1/watch/live");
    expect(page.headers.get("content-type") || "").toMatch(/text\/html/);

    const calls: DoCall[] = [];
    const live = await hitWatchLive(calls, { method: "GET" });
    expect(live.status).toBe(200);
    const j = (await live.json()) as { watch_live?: string; sequence?: number };
    expect(j.watch_live).toBe("watch-live/1.0");
    expect(typeof j.sequence).toBe("number");
    expect(calls.every((c) => c.op !== "fetch" || String(c.url || "").includes("/watch"))).toBe(true);
  });

  it("WATCH stays non-mutating: no storage-write or command ops reach the world DO", async () => {
    // The static page never touches the DO at all.
    const pageCalls: DoCall[] = [];
    const page = await hit("/watch", { method: "GET" }, pageCalls);
    expect(page.status).toBe(200);
    expect(pageCalls.filter((c) => c.op === "fetch")).toEqual([]);

    // The live snapshot is a bodiless read of the /watch projection only.
    const calls: DoCall[] = [];
    const live = await hitWatchLive(calls, { method: "GET" });
    expect(live.status).toBe(200);
    const fetches = calls.filter((c) => c.op === "fetch");
    expect(fetches.length).toBeGreaterThan(0);
    for (const c of fetches) {
      expect(String(c.url || "")).toContain("/watch");
      expect(String(c.url || "")).not.toMatch(/command|settle|genesis|admin|entity|append|put|write|mutate/i);
      expect(c.body ?? null).toBeNull();
    }
  });
});
