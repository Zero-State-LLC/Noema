import { describe, expect, it } from "vitest";
import { resolvePlayWorld } from "../src/command-world";

describe("resolvePlayWorld", () => {
  it("omitted world is the default tenant", () => {
    const t = resolvePlayWorld(undefined, "world-01");
    expect(t).toEqual({ kind: "default", world_id: "world-01" });
  });

  it("perihelion aliases stay on the default tenant", () => {
    expect(resolvePlayWorld("perihelion", "world-01").kind).toBe("default");
    expect(resolvePlayWorld("world.perihelion-reach", "world-01").kind).toBe("default");
  });

  it("admits isolated test worlds", () => {
    const t = resolvePlayWorld("test.hosted-canonical.ack-s3", "world-01");
    expect(t).toEqual({ kind: "isolated", world_id: "test.hosted-canonical.ack-s3" });
  });

  it("denies arbitrary worlds", () => {
    const t = resolvePlayWorld("world.other", "world-01");
    expect(t.kind).toBe("deny");
  });
});
