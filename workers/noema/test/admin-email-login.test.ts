import { describe, expect, it } from "vitest";
import { adminCallbackHtml, adminHtml, adminLoginHtml } from "../src/admin";
import {
  ADMIN_OPERATOR_EMAIL,
  GENERIC_LOGIN_MESSAGE,
  LoginThrottle,
  adminAllowlist,
  clientIp,
  consumeAdminMagicLink,
  mintAdminSession,
  normalizeEmail,
  parseAllowlist,
  requestAdminMagicLink,
  resolveAdmin,
  type AdminFetch,
} from "../src/admin-auth";
import {
  ADMIN_MAIL_SUBJECT,
  adminMagicLinkHref,
  composeAdminMail,
  renderAdminMailHtml,
} from "../src/admin-mail";
import { resolvePrincipal } from "../src/auth";
import { verifyHs256 } from "../src/jwt";
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

  it("always allows the hardcoded operator mailbox", () => {
    expect(ADMIN_OPERATOR_EMAIL).toBe("zer0state@zer0state.com");
    expect(adminAllowlist(env({ ADMIN_ALLOWLIST_EMAILS: "" }))).toEqual([
      "zer0state@zer0state.com",
    ]);
    expect(adminAllowlist(env())).toEqual([
      "zer0state@zer0state.com",
      "ops@example.com",
    ]);
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

describe("admin mail render", () => {
  it("builds an /admin/callback href and privilege copy", () => {
    const href = adminMagicLinkHref("https://noema.guru", "abc+hash", "magiclink");
    expect(href).toBe(
      "https://noema.guru/admin/callback?token_hash=abc%2Bhash&type=magiclink",
    );
    const html = renderAdminMailHtml(href);
    expect(html).toContain("OPEN ADMIN");
    expect(html).toContain("Do not forward or share this message.");
    expect(html).toContain(href.replace(/&/g, "&amp;"));
    const mail = composeAdminMail(href);
    expect(mail.subject).toBe("NOEMA Admin Access");
    expect(mail.to).toBe("zer0state@zer0state.com");
    expect(mail.text).toContain("Operator Plane");
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

  it("sends otp to the hardcoded operator even when the secret is empty", async () => {
    const calls: string[] = [];
    await requestAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      new Request("https://noema.guru/x"),
      { email: "" },
      {
        fetch: async (url) => {
          calls.push(url);
          return new Response("{}");
        },
      },
    );
    expect(calls).toEqual(["https://example.supabase.co/auth/v1/otp"]);
  });

  it("does not call Supabase for a non-operator mailbox when the secret is empty", async () => {
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
    const body = (await sixth.json()) as { error: { code: string; retryable: boolean } };
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.retryable).toBe(true);
  });

  it("reads hashed_token from generate_link properties (Supabase admin shape)", async () => {
    const sent: Array<{ href: string }> = [];
    const res = await requestAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      new Request("https://noema.guru/x"),
      { email: ADMIN_OPERATOR_EMAIL },
      {
        fetch: async () =>
          new Response(
            JSON.stringify({
              properties: {
                hashed_token: "nested_tok",
                verification_type: "magiclink",
              },
            }),
            { status: 200 },
          ),
        sendAdmin: async (mail) => {
          sent.push(mail);
        },
      },
    );
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].href).toContain("token_hash=nested_tok");
  });

  it("worker-sends the Admin letter via generate_link when a mailer is provided", async () => {
    const calls: string[] = [];
    const sent: Array<{ to: string; subject: string; html: string; href: string }> = [];
    const fetchImpl: AdminFetch = async (url, init) => {
      calls.push(url);
      const body = JSON.parse(String(init?.body || "{}")) as { type?: string; email?: string };
      expect(body.type).toBe("magiclink");
      expect(body.email).toBe(ADMIN_OPERATOR_EMAIL);
      return new Response(
        JSON.stringify({ hashed_token: "tok_admin_1", verification_type: "magiclink" }),
        { status: 200 },
      );
    };
    const res = await requestAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      new Request("https://noema.guru/x"),
      { email: ADMIN_OPERATOR_EMAIL },
      {
        fetch: fetchImpl,
        sendAdmin: async (mail) => {
          sent.push(mail);
        },
      },
    );
    expect(res.status).toBe(200);
    expect(calls).toEqual(["https://example.supabase.co/auth/v1/admin/generate_link"]);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(ADMIN_OPERATOR_EMAIL);
    expect(sent[0].subject).toBe(ADMIN_MAIL_SUBJECT);
    expect(sent[0].html).toContain("OPEN ADMIN");
    expect(sent[0].html).toContain("privileged administrative access");
    expect(sent[0].href).toBe(
      "https://noema.guru/admin/callback?token_hash=tok_admin_1&type=magiclink",
    );
    expect(sent[0].html).toContain(sent[0].href.replace(/&/g, "&amp;"));
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

describe("consumeAdminMagicLink", () => {
  it("mints admin-access for the hardcoded operator when the secret is empty", async () => {
    const minted = await consumeAdminMagicLink(
      env({ ADMIN_ALLOWLIST_EMAILS: "" }),
      { token_hash: "h", type: "magiclink" },
      {
        fetch: async () =>
          new Response(JSON.stringify({ user: { email: ADMIN_OPERATOR_EMAIL } }), {
            status: 200,
          }),
      },
    );
    expect(minted).not.toBeInstanceOf(Response);
    expect((minted as { role: string }).role).toBe("ADMIN");
  });

  it("400s without token_hash or code", async () => {
    const res = await consumeAdminMagicLink(env(), {});
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(400);
  });

  it("401s when verified email is not allowlisted and returns no access_token", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "stranger@x.io" } }), { status: 200 });
    const res = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
    const body = (await (res as Response).json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    expect(body.access_token).toBeUndefined();
    expect(body.refresh_token).toBeUndefined();
  });

  it("mints admin-access for allowlisted verify and omits supabase tokens", async () => {
    const fetchImpl: AdminFetch = async (url) => {
      expect(url).toContain("/auth/v1/verify");
      return new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    };
    const minted = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "email" },
      { fetch: fetchImpl },
    );
    expect(minted).not.toBeInstanceOf(Response);
    const ok = minted as { access_token: string; role: string; session_id: string };
    expect(ok.role).toBe("ADMIN");
    expect(ok.session_id.startsWith("asess.")).toBe(true);
    expect("refresh_token" in ok).toBe(false);
    expect("provider_token" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, "test-signing-secret");
    expect(claims.typ).toBe("admin-access");
    expect(claims.amr).toBe("email_magic_link");
  });

  it("401s when supabase verify returns 400 and returns no access_token", async () => {
    const res = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response("expired", { status: 400 }) },
    );
    expect((res as Response).status).toBe(401);
    const body = (await (res as Response).json()) as {
      access_token?: string;
      error?: { code: string };
    };
    expect(body.access_token).toBeUndefined();
    expect(body.error?.code).toBe("NOT_AUTHORIZED");
  });

  it("502s when supabase verify fails upstream", async () => {
    const res = await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response("down", { status: 500 }) },
    );
    expect((res as Response).status).toBe(502);
  });
});

describe("admin isolation", () => {
  it("resolveAdmin accepts email-minted token and labels amr", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    const minted = (await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    )) as { access_token: string; session_id: string };
    const admin = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${minted.access_token}` },
      }),
      env(),
    );
    expect(admin).not.toBeInstanceOf(Response);
    expect((admin as { authentication_context: string }).authentication_context).toBe(
      "email_magic_link",
    );
  });

  it("GET /v1/me path rejects admin-access (resolvePrincipal 401)", async () => {
    const fetchImpl: AdminFetch = async () =>
      new Response(JSON.stringify({ user: { email: "ops@example.com" } }), { status: 200 });
    const minted = (await consumeAdminMagicLink(
      env(),
      { token_hash: "h", type: "magiclink" },
      { fetch: fetchImpl },
    )) as { access_token: string };
    const me = await resolvePrincipal(
      new Request("https://noema.guru/v1/me", {
        headers: { Authorization: `Bearer ${minted.access_token}` },
      }),
      env(),
    );
    expect(me).toBeInstanceOf(Response);
    expect((me as Response).status).toBe(401);
  });

  it("CLI mint still works and resolveAdmin reports operator_token", async () => {
    const minted = await mintAdminSession(env({ ADMIN_OPERATOR_TOKEN: "op-secret-token" }), "op-secret-token");
    expect(minted).not.toBeInstanceOf(Response);
    const tok = (minted as { access_token: string }).access_token;
    const admin = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${tok}` },
      }),
      env(),
    );
    expect((admin as { authentication_context: string }).authentication_context).toBe(
      "operator_token",
    );
  });
});

describe("admin login HTML", () => {
  it("splits live players and system actors", () => {
    const html = adminHtml();
    expect(html).toContain('id="live-player-list"');
    expect(html).toContain('id="system-actor-list"');
    expect(html).toMatch(/Live players/);
    expect(html).toMatch(/System actors/);
  });

  it("does not assign attention messages or actor labels via unescaped innerHTML", () => {
    const html = adminHtml();
    expect(html).not.toMatch(/li\.innerHTML\s*=\s*"<strong>"\s*\+\s*\(m\.message/);
    expect(html).not.toMatch(/li\.innerHTML\s*=\s*"<strong>"\s*\+\s*label/);
    expect(html).toMatch(/strong\.textContent\s*=\s*strongText/);
    expect(html).toMatch(/pairLi\(m\.message,\s*m\.level\)/);
    expect(html).toMatch(/pairLi\(label,\s*note\)/);
  });

  it("is email-only and locked to the operator mailbox", () => {
    const html = adminLoginHtml();
    expect(html).toContain('id="email"');
    expect(html).toContain("zer0state@zer0state.com");
    expect(html).toContain("/v1/admin/login/request");
    expect(html).not.toContain("admin_token");
    expect(html).not.toContain("Operator token");
    expect(html.toLowerCase()).toContain("not a player");
  });

  it("shows a generic notice when error=1", () => {
    const html = adminLoginHtml();
    expect(html).toContain('get("error")');
    expect(html).toContain("expired or invalid");
    expect(html).not.toContain("token_hash");
    expect(html).not.toContain("refresh_token");
  });

  it("callback posts token_hash to consume", () => {
    const html = adminCallbackHtml();
    expect(html).toContain("/v1/admin/login/consume");
    expect(html).toContain("token_hash");
    expect(html).toContain("location.hash");
    expect(html).toContain("noema.admin.token");
    expect(html).toContain("/admin/login?error=1");
    expect(html).not.toContain("refresh_token");
    expect(html).not.toContain("provider_token");
  });
});
