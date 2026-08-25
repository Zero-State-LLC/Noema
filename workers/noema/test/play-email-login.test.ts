import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { LoginThrottle, resolveAdmin } from "../src/admin-auth";
import { connectHtml } from "../src/connect";
import { landingHtml } from "../src/landing";
import {
  requestPlayMagicLink,
  consumePlayMagicLink,
  GENERIC_PLAY_LOGIN_MESSAGE,
} from "../src/play-auth";
import { playCallbackHtml, playEmailGateMarkup } from "../src/play-login-html";

import { verifyHs256 } from "../src/jwt";
import type { Env } from "../src/types";

const USER = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "Ada.Lovelace@Example.COM",
};

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ...partial,
  } as Env;
}

describe("mintControllerToken identity overrides", () => {
  it("human mint is a platform token without player_id", async () => {
    const m = await mintControllerToken(env(), {
      handle: "alice",
      controllerType: "human",
      expiresIn: 86400,
      playerId: "player.abc123def456",
      identityId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      amr: "email_magic_link",
    });
    expect(m.player_id).toBe("");
    expect(m.controller_type).toBe("human");
    expect(m.identity_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(m.expires_in).toBe(86400);
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.typ).toBe("platform");
    expect(claims.player_id).toBeUndefined();
    expect(claims.identity_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
  });

  it("admin mint still handle-based with issued_by admin", async () => {
    const m = await mintControllerToken(env(), {
      handle: "bob",
      issuedByAdmin: true,
      operatorId: "op.token",
    });
    expect(m.player_id).toBe("player.bob");
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.issued_by).toBe("admin");
    expect(claims.operator_id).toBe("op.token");
  });
});

describe("requestPlayMagicLink", () => {
  it("400s on bad email", async () => {
    const res = await requestPlayMagicLink(env(), new Request("https://noema.guru/x"), { email: "nope" });
    expect(res.status).toBe(400);
  });

  it("calls otp for any valid email with /play/callback redirect", async () => {
    let body = "";
    const fetchImpl = async (url: string, init?: RequestInit) => {
      expect(url).toContain("/auth/v1/otp");
      body = String(init?.body || "");
      return new Response("{}", { status: 200 });
    };
    const res = await requestPlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      new Request("https://noema.guru/x"),
      { email: "anyone@x.io" },
      { fetch: fetchImpl, throttle: new LoginThrottle() },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: GENERIC_PLAY_LOGIN_MESSAGE });
    const parsed = JSON.parse(body);
    expect(parsed.email).toBe("anyone@x.io");
    expect(parsed.options.email_redirect_to).toBe("https://noema.guru/play/callback");
  });

  it("uses generate_link and Resend when a play mailer is provided", async () => {
    const calls: string[] = [];
    const sent: { to: string; href: string }[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      return new Response(
        JSON.stringify({ properties: { hashed_token: "playhash", verification_type: "magiclink" } }),
        { status: 200 },
      );
    };
    const res = await requestPlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk", RESEND_API_KEY: "re_test" }),
      new Request("https://noema.guru/x"),
      { email: "anyone@x.io" },
      {
        fetch: fetchImpl,
        throttle: new LoginThrottle(),
        sendPlay: async (mail) => {
          sent.push({ to: mail.to, href: mail.href });
        },
      },
    );
    expect(res.status).toBe(200);
    expect(calls).toEqual(["https://example.supabase.co/auth/v1/admin/generate_link"]);
    expect(sent).toEqual([
      { to: "anyone@x.io", href: "https://noema.guru/play/callback?token_hash=playhash&type=magiclink" },
    ]);
  });

  it("puts next=/connect and valid connect_code on generated Supabase callbacks and custom mail links", async () => {
    const sent: string[] = [];
    let generateBody = "";
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      generateBody = String(init?.body || "");
      return new Response(
        JSON.stringify({ properties: { hashed_token: "playhash", verification_type: "magiclink" } }),
        { status: 200 },
      );
    };
    const e = env({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "srk",
      RESEND_API_KEY: "re_test",
    });
    await requestPlayMagicLink(
      e,
      new Request("https://noema.guru/x"),
      { email: "prabu.openclaw@gmail.com", next: "/connect", connect_code: "AB12-CD34" },
      {
        fetch: fetchImpl,
        throttle: new LoginThrottle(),
        sendPlay: async (mail) => {
          sent.push(mail.href);
        },
      },
    );
    const parsed = JSON.parse(generateBody);
    expect(parsed.options.redirect_to).toBe("https://noema.guru/play/callback?next=%2Fconnect&connect_code=ab12cd34");
    expect(sent[0]).toBe(
      "https://noema.guru/play/callback?token_hash=playhash&type=magiclink&next=%2Fconnect&connect_code=ab12cd34",
    );
  });

  it("omits malformed user code from callbacks and custom mail links", async () => {
    const sent: string[] = [];
    let generateBody = "";
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      generateBody = String(init?.body || "");
      return new Response(JSON.stringify({ hashed_token: "playhash" }), { status: 200 });
    };
    await requestPlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk", RESEND_API_KEY: "re_test" }),
      new Request("https://noema.guru/x"),
      { email: "prabu.openclaw@gmail.com", next: "/connect", connect_code: "not-a-code" },
      {
        fetch: fetchImpl,
        throttle: new LoginThrottle(),
        sendPlay: async (mail) => {
          sent.push(mail.href);
        },
      },
    );
    expect(JSON.parse(generateBody).options.redirect_to).toBe("https://noema.guru/play/callback?next=%2Fconnect");
    expect(sent[0]).toBe("https://noema.guru/play/callback?token_hash=playhash&type=magiclink&next=%2Fconnect");
  });

  it("falls back to Supabase otp when Resend delivery fails", async () => {
    const calls: string[] = [];
    const res = await requestPlayMagicLink(
      env({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "srk",
        RESEND_API_KEY: "re_test",
      }),
      new Request("https://noema.guru/x"),
      { email: "anyone@x.io" },
      {
        throttle: new LoginThrottle(),
        fetch: async (url) => {
          calls.push(url);
          if (url.endsWith("/admin/generate_link")) {
            return new Response(JSON.stringify({ hashed_token: "playhash" }), { status: 200 });
          }
          return new Response("{}", { status: 200 });
        },
        sendPlay: async () => {
          throw new Error("provider down");
        },
      },
    );
    expect(res.status).toBe(200);
    expect(calls).toEqual([
      "https://example.supabase.co/auth/v1/admin/generate_link",
      "https://example.supabase.co/auth/v1/otp",
    ]);
  });

  it("429s on sixth request from same IP", async () => {
    const throttle = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    const e = env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" });
    for (let i = 0; i < 5; i++) {
      expect(
        (await requestPlayMagicLink(e, new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }), { email: `n${i}@x.io` }, { fetch: fetchImpl, throttle })).status,
      ).toBe(200);
    }
    const sixth = await requestPlayMagicLink(
      e,
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "1.1.1.1" } }),
      { email: "last@x.io" },
      { fetch: fetchImpl, throttle },
    );
    expect(sixth.status).toBe(429);
  });

  it("429s when the durable WORLD_DO throttle refuses", async () => {
    const e = env({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "srk",
      WORLD_DO: {
        idFromName: (name: string) => name,
        get: () => ({
          fetch: async () => new Response(JSON.stringify({ allowed: false }), { status: 200 }),
        }),
      } as unknown as DurableObjectNamespace,
    });
    const res = await requestPlayMagicLink(
      e,
      new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "9.9.9.9" } }),
      { email: "anyone@x.io" },
      { fetch: async () => new Response("{}"), throttle: new LoginThrottle() },
    );
    expect(res.status).toBe(429);
  });

  it("PLAY throttle does not increment an admin throttle instance", async () => {
    const adminT = new LoginThrottle();
    const playT = new LoginThrottle();
    const fetchImpl = async () => new Response("{}");
    const e = env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" });
    await requestPlayMagicLink(e, new Request("https://noema.guru/x", { headers: { "CF-Connecting-IP": "2.2.2.2" } }), { email: "a@x.io" }, { fetch: fetchImpl, throttle: playT });
    expect(adminT.hit("ip:2.2.2.2")).toBe(true);
  });
});

describe("consumePlayMagicLink", () => {
  it("503s without supabase", async () => {
    const res = await consumePlayMagicLink(env(), { token_hash: "h", type: "magiclink" });
    expect((res as Response).status).toBe(503);
  });

  it("400s without hash or code", async () => {
    const res = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      {},
    );
    expect((res as Response).status).toBe(400);
  });

  it("401s on verify 400", async () => {
    const res = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response("bad", { status: 400 }) },
    );
    expect((res as Response).status).toBe(401);
    expect(((await (res as Response).json()) as { access_token?: string }).access_token).toBeUndefined();
  });

  it("mints typ access with compact sub player_id", async () => {
    const minted = await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "email" },
      { fetch: async () => new Response(JSON.stringify({ user: USER }), { status: 200 }) },
    );
    expect(minted).not.toBeInstanceOf(Response);
    const ok = minted as { access_token: string; identity_id: string; handle: string; controller_type: string };
    expect(ok.identity_id).toBe(USER.id);
    expect(ok.handle).toBe("adalovelace");
    expect(ok.controller_type).toBe("human");
    expect("refresh_token" in ok).toBe(false);
    expect("player_id" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, "test-signing-secret");
    expect(claims.typ).toBe("platform");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
    expect(claims.identity_id).toBe(USER.id);
    expect(claims.player_id).toBeUndefined();
  });
});

describe("play vs admin isolation", () => {
  it("play token resolves as HumanPrincipal and fails resolveAdmin", async () => {
    const minted = (await consumePlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk" }),
      { token_hash: "h", type: "magiclink" },
      { fetch: async () => new Response(JSON.stringify({ user: USER }), { status: 200 }) },
    )) as { access_token: string };
    const p = await resolvePrincipal(
      new Request("https://noema.guru/v1/me", { headers: { Authorization: `Bearer ${minted.access_token}` } }),
      env(),
    );
    expect(p).not.toBeInstanceOf(Response);
    expect((p as { kind: string; identity_id: string }).kind).toBe("human");
    expect((p as { identity_id: string }).identity_id).toBe(USER.id);
    expect((p as { player_id?: string }).player_id).toBeUndefined();
    const a = await resolveAdmin(
      new Request("https://noema.guru/v1/admin/overview", { headers: { Authorization: `Bearer ${minted.access_token}` } }),
      env({ TOKEN_SIGNING_SECRET: "test-signing-secret" }),
    );
    expect(a).toBeInstanceOf(Response);
    expect((a as Response).status).toBeGreaterThanOrEqual(401);
  });
});

describe("play login HTML", () => {
  it("gate posts play login request", () => {
    const html = playEmailGateMarkup();
    expect(html).toContain('id="email"');
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("Send watch link");
    expect(html).toContain("A link signs you in so you can watch");
    expect(html).toContain("URLSearchParams");
    expect(html).toContain("next");
    const visible = html.replace(/<[^>]+>/g, " ").toLowerCase();
    expect(visible).not.toContain("admin");
    expect(visible).not.toContain("operator plane");
  });
  it("Continue to WATCH is landing-only", () => {
    expect(playEmailGateMarkup()).not.toContain("play-continue");
    expect(playEmailGateMarkup({ continueToPlay: true })).toContain('id="play-continue"');
    expect(landingHtml()).toContain('id="play-continue"');
    expect(connectHtml()).not.toContain('id="play-continue"');
  });
  it("callback redirects to connect with validated connect_code and keeps the token tab-scoped", () => {
    const callback = playCallbackHtml();
    expect(callback).toContain('sessionStorage.setItem("noema.play.token"');
    expect(callback).not.toContain('localStorage.setItem("noema.play.token"');
    expect(callback).toContain('return /^[0-9a-f]{8}$/.test(raw) ? raw : ""');
    expect(callback).toContain('const authCode = search.get("code") || hash.get("code") || ""');
    expect(callback).toContain('const rawConnectCode = search.get("connect_code") || hash.get("connect_code") || ""');
    expect(callback).toContain('body: JSON.stringify({ token_hash, type, code: authCode })');
    expect(callback).toContain('if (connectCode) next = "/connect?connect_code=" + encodeURIComponent(connectCode)');
    expect(callback).not.toContain('authCode || "").trim().replace');
    expect(callback).not.toContain('search.get("device_code")');
    expect(callback).not.toContain('localStorage.getItem("noema.connect.code"');

    const connect = connectHtml();
    expect(connect).toContain('body: JSON.stringify({ email: cEmail.value, next: "connect", connect_code: currentCode() })');
    expect(connect).toContain('new URLSearchParams(location.search).get("connect_code")');
    expect(connect).toContain('localStorage.setItem("noema.connect.code"');
    expect(connect).toContain('localStorage.removeItem("noema.connect.code"');
    expect(connect).toContain('sessionStorage.setItem("noema.connect.code"');
  });
  it("callback reads hash and does not store refresh_token", () => {
    const html = playCallbackHtml();
    expect(html).toContain("/v1/play/login/consume");
    expect(html).toContain("location.hash");
    expect(html).toContain("noema.play.token");
    expect(html).not.toContain("refresh_token");
  });
  it("homepage and play include email gate; homepage is not admin login", () => {
    expect(landingHtml()).toContain("/v1/play/login/request");
    expect(landingHtml()).not.toContain("/v1/admin/login/request");
    expect(landingHtml()).not.toMatch(/Operator token/);
    expect(connectHtml()).toContain("/v1/play/login/request");
  });
  it("landing keeps the email gate as the single primary production path", () => {
    const html = landingHtml();
    expect(html).not.toContain("wiz-token");
    expect(html).not.toContain('class="wizard"');
    expect(html).toMatch(/getElementById\("email"\)/);
    expect(html).not.toContain("path-rail");
    expect(html).not.toContain("The world is the text.");
  });
  it("CONNECT is task-first: sign up, get a code, then play", () => {
    const html = connectHtml();
    expect(html).toContain("Sign up here with a watch link. That's your account.");
    expect(html).toContain("It prints a short code. Enter that code below.");
    expect(html).toContain("On the agent machine, run <code>noema play</code>.");
  });
});
