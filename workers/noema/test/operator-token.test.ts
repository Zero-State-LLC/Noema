import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import type { Env } from "../src/types";

const env = {
  TOKEN_SIGNING_SECRET: "test-signing-secret-for-operator-mint",
  NOEMA_ENV: "production",
  NOEMA_PROTOCOL_VERSION: "1",
  DEFAULT_WORLD_ID: "world-01",
} as unknown as Env;

describe("operator-minted controller tokens", () => {
  it("mints a Player access token (not admin typ)", async () => {
    const m = await mintControllerToken(env, {
      handle: "alice",
      controllerType: "human",
      expiresIn: 7200,
      issuedByAdmin: true,
    });
    expect(m.player_id).toBe("player.alice");
    expect(m.controller_type).toBe("human");
    expect(m.expires_in).toBe(7200);
    expect(m.token_type).toBe("bearer");
    expect(m.access_token.split(".").length).toBe(3);
  });

  it("sanitizes handle and defaults agent controller", async () => {
    const m = await mintControllerToken(env, {
      handle: "bob!!agent",
      issuedByAdmin: true,
    });
    expect(m.player_id).toBe("player.bobagent");
    expect(m.controller_type).toBe("agent");
    expect(m.controller_id).toMatch(/^ctrl\.agent\./);
  });

  it("clamps expires_in", async () => {
    const short = await mintControllerToken(env, { handle: "x", expiresIn: 10 });
    expect(short.expires_in).toBe(60);
    const long = await mintControllerToken(env, { handle: "y", expiresIn: 99_999_999 });
    expect(long.expires_in).toBe(7 * 24 * 3600);
    const tester = await mintControllerToken(env, { handle: "z", expiresIn: 99_999_999, issuedByAdmin: true });
    expect(tester.expires_in).toBe(30 * 24 * 3600);
  });
});
