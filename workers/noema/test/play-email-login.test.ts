import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import { LoginThrottle } from "../src/admin-auth";
import { requestPlayMagicLink, GENERIC_PLAY_LOGIN_MESSAGE } from "../src/play-auth";
import { verifyHs256 } from "../src/jwt";
import type { Env } from "../src/types";

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
