import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { LoginThrottle, resolveAdmin } from "../src/admin-auth";
import { landingHtml } from "../src/landing";
import {
  requestPlayMagicLink,
  consumePlayMagicLink,
  GENERIC_PLAY_LOGIN_MESSAGE,
} from "../src/play-auth";
import { playCallbackHtml, playEmailGateMarkup } from "../src/play-login-html";
import { playHtml } from "../src/play";
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
  it("uses playerId, identityId, amr and does not set issued_by", async () => {
    const m = await mintControllerToken(env(), {
      handle: "alice",
      controllerType: "human",
      expiresIn: 86400,
      playerId: "player.abc123def456",
      identityId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      amr: "email_magic_link",
    });
    expect(m.player_id).toBe("player.abc123def456");
    expect(m.controller_type).toBe("human");
    expect(m.expires_in).toBe(86400);
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.typ).toBe("access");
    expect(claims.player_id).toBe("player.abc123def456");
    expect(claims.identity_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
  });

  it("admin mint still handle-based with issued_by admin", async () => {
    const m = await mintControllerToken(env(), {
      handle: "bob",
      issuedByAdmin: true,
    });
    expect(m.player_id).toBe("player.bob");
    const claims = await verifyHs256(m.access_token, "test-signing-secret");
    expect(claims.issued_by).toBe("admin");
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
    const ok = minted as { access_token: string; player_id: string; controller_type: string };
    expect(ok.player_id).toBe("player.111111112222");
    expect(ok.controller_type).toBe("human");
    expect("refresh_token" in ok).toBe(false);
    const claims = await verifyHs256(ok.access_token, "test-signing-secret");
    expect(claims.typ).toBe("access");
    expect(claims.amr).toBe("email_magic_link");
    expect(claims.issued_by).toBeUndefined();
    expect(claims.identity_id).toBe(USER.id);
  });
});

describe("play vs admin isolation", () => {
  it("play token resolves as Player and fails resolveAdmin", async () => {
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
    expect((p as { player_id: string }).player_id).toBe("player.111111112222");
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
    expect(html).toContain("Send play link");
  });
  it("Continue to PLAY is landing-only", () => {
    expect(playEmailGateMarkup()).not.toContain("play-continue");
    expect(playEmailGateMarkup({ continueToPlay: true })).toContain('id="play-continue"');
    expect(landingHtml()).toContain('id="play-continue"');
    expect(playHtml()).not.toContain('id="play-continue"');
  });
  it("callback reads hash and does not store refresh_token", () => {
    const html = playCallbackHtml();
    expect(html).toContain("/v1/play/login/consume");
    expect(html).toContain("location.hash");
    expect(html).toContain("noema.play.token");
    expect(html).not.toContain("refresh_token");
  });
  it("homepage and play include email gate; homepage is not admin token", () => {
    expect(landingHtml()).toContain("/v1/play/login/request");
    expect(landingHtml()).toContain("/admin/login");
    expect(landingHtml()).not.toMatch(/Operator token/);
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).toContain("Access token");
  });
  it("landing keeps the email gate as the single primary production path", () => {
    const html = landingHtml();
    expect(html).not.toContain("wiz-token");
    expect(html).not.toContain('class="wizard"');
    expect(html).toMatch(/getElementById\("email"\)/);
    expect(html).toContain('class="path-rail"');
    expect(html).toContain("Enter as a Player");
  });
  it("play production empty-token error points at email play link", () => {
    const html = playHtml();
    expect(html).not.toContain("Production requires an operator-issued access token");
    expect(html).toContain("Request a play link to enter.");
  });
});
