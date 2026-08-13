import { describe, expect, it } from "vitest";
import {
  GENERIC_LOGIN_MESSAGE,
  LoginThrottle,
  clientIp,
  normalizeEmail,
  parseAllowlist,
  requestAdminMagicLink,
} from "../src/admin-auth";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ADMIN_ALLOWLIST_EMAILS: "ops@example.com",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    ...partial,
  } as Env;
}

describe("allowlist + throttle", () => {
  it("parses comma-separated mailboxes, trim + lowercase", () => {
    expect(parseAllowlist("  Ops@Example.COM, backup@x.io ")).toEqual([
      "ops@example.com",
      "backup@x.io",
    ]);
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("")).toEqual([]);
  });

  it("normalizes valid email and rejects bad shape", () => {
    expect(normalizeEmail("  Ops@Example.COM ")).toBe("ops@example.com");
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("no-at-sign")).toBeNull();
  });

  it("reads CF-Connecting-IP", () => {
    const req = new Request("https://noema.guru/v1/admin/login/request", {
      headers: { "CF-Connecting-IP": "203.0.113.9" },
    });
    expect(clientIp(req)).toBe("203.0.113.9");
    expect(clientIp(new Request("https://noema.guru/x"))).toBe("0.0.0.0");
  });

  it("allows 5 hits per key per hour then denies", () => {
    const t = new LoginThrottle();
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) expect(t.hit("ip:1.1.1.1", now)).toBe(true);
    expect(t.hit("ip:1.1.1.1", now + 1000)).toBe(false);
    expect(t.hit("ip:9.9.9.9", now)).toBe(true);
    expect(t.hit("ip:1.1.1.1", now + 3_600_001)).toBe(true);
  });

  it("exports the generic message", () => {
    expect(GENERIC_LOGIN_MESSAGE).toBe(
      "If that mailbox is authorized, a link is on the way.",
    );
  });
});

describe("requestAdminMagicLink", () => {
  it("400s on bad email", async () => {
    const res = await requestAdminMagicLink(env(), new Request("https://noema.guru/x"), {
      email: "nope",
    });
    expect(res.status).toBe(400);
  });

  it("returns the same 200 for unknown and allowlisted; only allowlisted calls otp", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      return new Response("{}", { status: 200 });
    };
    const throttle = new LoginThrottle();
    const unknown = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }),
      { email: "stranger@x.io" },
      { fetch: fetchImpl, throttle },
    );
    const known = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.2" } }),
      { email: "Ops@Example.com" },
      { fetch: fetchImpl, throttle },
    );
    expect(unknown.status).toBe(200);
    expect(known.status).toBe(200);
    const unknownBody = await unknown.json();
    const knownBody = await known.json();
    expect(unknownBody).toEqual(knownBody);
    expect(knownBody).toEqual({
      ok: true,
      message: "If that mailbox is authorized, a link is on the way.",
    });
    expect(calls).toEqual(["https://example.supabase.co/auth/v1/otp"]);
  });

  it("does not call Supabase when allowlist is empty", async () => {
    let called = false;
    await requestAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      new Request("https://noema.guru/x"),
      { email: "ops@example.com" },
      { fetch: async () => { called = true; return new Response("{}"); } },
    );
    expect(called).toBe(false);
  });

  it("429s on the sixth request from the same IP", async () => {
    const throttle = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    for (let i = 0; i < 5; i++) {
      const res = await requestAdminMagicLink(
        env(),
        new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "8.8.8.8" } }),
        { email: `n${i}@x.io` },
        { fetch: fetchImpl, throttle },
      );
      expect(res.status).toBe(200);
    }
    const sixth = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "8.8.8.8" } }),
      { email: "last@x.io" },
      { fetch: fetchImpl, throttle },
    );
    expect(sixth.status).toBe(429);
    const body = await sixth.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.retryable).toBe(true);
  });

  it("still 200 if otp send fails", async () => {
    const res = await requestAdminMagicLink(
      env(),
      new Request("https://noema.guru/x"),
      { email: "ops@example.com" },
      { fetch: async () => new Response("nope", { status: 500 }) },
    );
    expect(res.status).toBe(200);
  });
});
