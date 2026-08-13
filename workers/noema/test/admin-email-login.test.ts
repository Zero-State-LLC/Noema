import { describe, expect, it } from "vitest";
import {
  GENERIC_LOGIN_MESSAGE,
  LoginThrottle,
  clientIp,
  normalizeEmail,
  parseAllowlist,
} from "../src/admin-auth";

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
