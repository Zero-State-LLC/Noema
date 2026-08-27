import { describe, expect, it } from "vitest";
import { mintControllerToken, resolvePrincipal } from "../src/auth";
import type { Env } from "../src/types";

const env = {
  TOKEN_SIGNING_SECRET: "test-signing-secret-for-operator-mint",
  NOEMA_ENV: "production",
  NOEMA_PROTOCOL_VERSION: "1",
  DEFAULT_WORLD_ID: "world-01",
} as unknown as Env;

describe("operator-minted controller tokens", () => {
  it("human mint is a platform token, not a Player", async () => {
    const m = await mintControllerToken(env, {
      handle: "alice",
      controllerType: "human",
      expiresIn: 7200,
      issuedByAdmin: true,
    });
    expect(m.player_id).toBe("");
    expect(m.controller_type).toBe("human");
    expect(m.identity_id).toBe("id.alice");
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

  it("stamps operator_id only on admin mint when provided", async () => {
    const owned = await mintControllerToken(env, {
      handle: "hermes",
      issuedByAdmin: true,
      operatorId: "op.mail.aaaaaaaaaaaaaaaa",
    });
    const { verifyHs256 } = await import("../src/jwt");
    const ownedClaims = await verifyHs256(owned.access_token, env.TOKEN_SIGNING_SECRET as string);
    expect(ownedClaims.issued_by).toBe("admin");
    expect(ownedClaims.operator_id).toBe("op.mail.aaaaaaaaaaaaaaaa");

    const unowned = await mintControllerToken(env, { handle: "devbot", issuedByAdmin: false, operatorId: "op.token" });
    const unownedClaims = await verifyHs256(unowned.access_token, env.TOKEN_SIGNING_SECRET as string);
    expect(unownedClaims.issued_by).toBeUndefined();
    expect(unownedClaims.operator_id).toBeUndefined();

    const adminBare = await mintControllerToken(env, { handle: "bare", issuedByAdmin: true });
    const bareClaims = await verifyHs256(adminBare.access_token, env.TOKEN_SIGNING_SECRET as string);
    expect(bareClaims.issued_by).toBe("admin");
    expect(bareClaims.operator_id).toBeUndefined();
  });

  it("resolvePrincipal copies operator_id from admin-minted tokens", async () => {
    const m = await mintControllerToken(env, {
      handle: "scoped",
      issuedByAdmin: true,
      operatorId: "op.mail.cccccccccccccccc",
    });
    const principal = await resolvePrincipal(
      new Request("https://noema.guru/v1/me", { headers: { Authorization: `Bearer ${m.access_token}` } }),
      env,
    );
    expect(principal).not.toBeInstanceOf(Response);
    expect((principal as { operator_id?: string; issued_by?: string }).operator_id).toBe("op.mail.cccccccccccccccc");
    expect((principal as { issued_by?: string }).issued_by).toBe("admin");
  });
});
