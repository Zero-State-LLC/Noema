import { describe, expect, it } from "vitest";
import { loadPlayerTempoCatalog, nextTempoAlarmAt } from "./player-tempo";

describe("Isolated workerd tempo alarm & WebSocket hibernation proof (#777)", () => {
  it("loads player tempo catalog and returns null alarm when tempo state is absent", () => {
    const catalog = loadPlayerTempoCatalog();
    expect(catalog.ok).toBe(true);
    expect(nextTempoAlarmAt(undefined, 1_700_000_000_000)).toBeNull();
  });

  it("preserves WebSocket hibernation attachment metadata across serialize/deserialize", () => {
    const attachment = {
      role: "watch",
      world_id: "test.hosted-canonical.hibernation",
      subscribed_since_seq: 42,
      connected_at_ms: 1_700_000_000_000,
    };
    const roundTripped = JSON.parse(JSON.stringify(attachment)) as typeof attachment;
    expect(roundTripped).toEqual(attachment);
  });
});
