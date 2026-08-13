import { describe, expect, it } from "vitest";
import { mintHs256, verifyHs256, JwtError } from "../src/jwt";

describe("jwt hs256", () => {
  it("roundtrips", async () => {
    const secret = "test-secret";
    const token = await mintHs256({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 60 }, secret);
    const claims = await verifyHs256(token, secret);
    expect(claims.sub).toBe("u1");
  });

  it("rejects bad signature", async () => {
    const token = await mintHs256({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 60 }, "a");
    await expect(verifyHs256(token, "b")).rejects.toBeInstanceOf(JwtError);
  });

  it("requires an exact audience when configured", async () => {
    const secret = "aud-secret";
    const exp = Math.floor(Date.now() / 1000) + 60;
    const ok = await mintHs256({ sub: "u1", aud: "authenticated", exp }, secret);
    const claims = await verifyHs256(ok, secret, { audience: "authenticated" });
    expect(claims.sub).toBe("u1");
    const wrong = await mintHs256({ sub: "u1", aud: "anon", exp }, secret);
    await expect(verifyHs256(wrong, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
    const multi = await mintHs256({ sub: "u1", aud: ["authenticated", "service"], exp }, secret);
    await expect(verifyHs256(multi, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
    const missing = await mintHs256({ sub: "u1", exp }, secret);
    await expect(verifyHs256(missing, secret, { audience: "authenticated" })).rejects.toMatchObject({
      name: "JwtError",
      message: "audience mismatch",
    });
  });
});
