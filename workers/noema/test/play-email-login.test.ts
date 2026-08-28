import { describe, expect, it } from "vitest";
import { mintHumanPlatformToken, mintControllerToken, resolvePrincipal } from "../src/auth";
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
    const m = await mintHumanPlatformToken(env(), {
      identityId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      handle: "alice",
      expiresIn: 86400,
      amr: "email_magic_link",
    });
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
      { email: "prabu.openclaw@gmail.com", next: "/connect", connect_code: "AB12-CD34", auth_flow: "0123456789abcdef0123456789abcdef" },
      {
        fetch: fetchImpl,
        throttle: new LoginThrottle(),
        sendPlay: async (mail) => {
          sent.push(mail.href);
        },
      },
    );
    const parsed = JSON.parse(generateBody);
    expect(parsed.options.redirect_to).toBe("https://noema.guru/play/callback?next=%2Fconnect&connect_code=ab12cd34&auth_flow=0123456789abcdef0123456789abcdef");
    expect(sent[0]).toBe(
      "https://noema.guru/play/callback?token_hash=playhash&type=magiclink&next=%2Fconnect&connect_code=ab12cd34&auth_flow=0123456789abcdef0123456789abcdef",
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
      { email: "prabu.openclaw@gmail.com", next: "/connect", connect_code: "not-a-code", auth_flow: "guessable" },
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

  it("ignores open-redirect next values on generated mail links", async () => {
    const sent: string[] = [];
    let generateBody = "";
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      generateBody = String(init?.body || "");
      return new Response(
        JSON.stringify({ properties: { hashed_token: "playhash", verification_type: "magiclink" } }),
        { status: 200 },
      );
    };
    await requestPlayMagicLink(
      env({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srk", RESEND_API_KEY: "re_test" }),
      new Request("https://noema.guru/x"),
      { email: "prabu.openclaw@gmail.com", next: "https://evil.example/phish" },
      {
        fetch: fetchImpl,
        throttle: new LoginThrottle(),
        sendPlay: async (mail) => {
          sent.push(mail.href);
        },
      },
    );
    expect(JSON.parse(generateBody).options.redirect_to).toBe("https://noema.guru/play/callback");
    expect(sent[0]).toBe("https://noema.guru/play/callback?token_hash=playhash&type=magiclink");
    expect(sent[0]).not.toMatch(/evil/);
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
    expect(callback).toContain('new BroadcastChannel("noema-play-auth:" + authFlow)');
    expect(callback).not.toContain('new BroadcastChannel("noema-play-auth")');
    expect(callback).toContain('const authFlow = /^[0-9a-f]{32}$/.test');
    expect(callback).toContain('type: "noema.play.authenticated"');
    expect(callback).not.toContain('authCode || "").trim().replace');
    expect(callback).not.toContain('search.get("device_code")');
    expect(callback).not.toContain('localStorage.getItem("noema.connect.code"');

    const connect = connectHtml();
    expect(connect).toContain('body: JSON.stringify({ email: cEmail.value, next: "connect", connect_code: currentCode(), auth_flow: authFlow })');
    expect(connect).toContain('canonicalCode(params.get("connect_code") || params.get("code"))');
    expect(connect).toContain('localStorage.setItem("noema.connect.code"');
    expect(connect).toContain('localStorage.removeItem("noema.connect.code"');
    expect(connect).toContain('sessionStorage.setItem("noema.connect.code"');
    expect(connect).toContain('sessionStorage.getItem("noema.play.token")');
    expect(connect).toContain('new BroadcastChannel("noema-play-auth:" + authFlow)');
    expect(connect).not.toContain('new BroadcastChannel("noema-play-auth")');
    expect(connect).toContain('crypto.randomUUID().replace(/-/g, "").toLowerCase()');
    expect(connect).toContain('Signed in on another tab. You can now approve this agent.');
    expect(connect).not.toContain('localStorage.setItem("noema.play.token"');
  });
  it("CONNECT restores a saved short code into the approval task", () => {
    const connect = connectHtml();
    expect(connect).toContain('sessionStorage.getItem("noema.connect.code") || localStorage.getItem("noema.connect.code")');
    expect(connect).toContain('location.replace("/connect?connect_code=" + encodeURIComponent(saved))');
    expect(connect).toContain("function clearCode()");
    expect(connect).toMatch(/clearCode\(\);[\s\S]{0,160}document\.getElementById\("d-deny"\)/);
    expect(connect).toContain('history.replaceState(null, "", "/connect")');
    expect(connect).toMatch(/catch\(e\)[\s\S]{0,500}clearCode\(\)/);
    expect(connect).toContain("Sign in is required before approval. Use the email field below, then return here to Approve.");
    expect(connect).toContain('if (approveButton) approveButton.textContent = tok ? "Approve" : "Sign in to approve"');
    expect(connect).toMatch(/function syncPlaySession\(\)[\s\S]{0,180}approveButton\.textContent = tok \? "Approve" : "Sign in to approve"/);
    expect(connect).toContain('dNotice.textContent = "Approval was not sent. Sign in first, then click Approve again."');
    expect(connect).toContain('need.scrollIntoView({ behavior: "smooth", block: "center" })');
    expect(connect).not.toContain("Sign up above, then Approve.");
    const task = connectHtml(false, "AB12-CD34");
    expect(task).toContain("Approve this agent");
    expect(task).toContain('value="ab12cd34"');
    expect(task).toContain('id="panel-approve"');
    expect(task).not.toContain('value="AB12-CD34"');
    expect(task).not.toContain("Sign up above");
  });
  it("rejects a non-hex pending code instead of painting it", () => {
    const html = connectHtml(false, '"><img src=x onerror=alert(1)>');
    expect(html).toContain("Connect an agent");
    expect(html).not.toContain("Approve this agent");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("onerror=alert");
    expect(html).not.toMatch(/value="[^"]*alert/);
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
  it("CONNECT onboard stays owner-email first when no short code is present", () => {
    const html = connectHtml();
    expect(html).toContain("Agents inhabit this world. Humans approve.");
    expect(html).toContain("noema connect --email owner@example.com");
    expect(html).toContain("After approval, the agent automatically receives its credential through polling and inhabits with <code>noema play</code>.");
    expect(html).toContain("Fallback: enter the short code");
    expect(html.indexOf("Connect an agent")).toBeLessThan(html.indexOf("Fallback: enter the short code"));
  });
  it("CONNECT with a pending short code is one approval task", () => {
    const html = connectHtml(false, "ab12-cd34");
    expect(html).toContain("Approve this agent");
    expect(html).toContain('value="ab12cd34"');
    expect(html.indexOf("Approve this agent")).toBeLessThan(html.indexOf("Sign in to approve"));
    expect(html.indexOf("Approve this agent")).toBeLessThan(html.indexOf("pipx install noema-client"));
    expect(html.indexOf('id="panel-approve"')).toBeLessThan(html.indexOf("pipx install noema-client"));
    expect(html.indexOf("Approve this agent")).toBeLessThan(html.indexOf("Advanced: use a token"));
    expect(html).toContain("Advanced: use a token");
    expect(html).toMatch(/<details[^>]*id="connect-onboard"/);
    expect(html).not.toContain("Fallback: enter the short code");
    expect(html).not.toMatch(/id="d-approve" hidden/);
    const taskHead = html.slice(0, html.indexOf("<details"));
    expect(taskHead).toContain("Approve this agent");
    expect(taskHead).toContain("Sign in to approve");
    expect(taskHead).not.toContain("pipx install noema-client");
    expect(taskHead).not.toContain("noema connect --email");
  });
});
