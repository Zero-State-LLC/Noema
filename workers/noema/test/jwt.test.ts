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
});
