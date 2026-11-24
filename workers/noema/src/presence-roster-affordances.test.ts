import { describe, expect, it } from "vitest";
import { deriveAffordances } from "./actions";

describe("Observation presence roster affordances (#793)", () => {
  const baseInput = {
    entities: [],
    exits: [],
    budgets: { energy: 10, compute: 10, storage: 0, attention: 8 },
    openTrades: [],
    selfId: "player.alice",
    observerRoomId: "room.hub",
    otherPlayers: [
      { player_id: "player.alice", handle: "alice", room_id: "room.hub" },
      { player_id: "player.bob", handle: "bob", room_id: "room.hub" },
      { player_id: "player.tamsin", handle: "tamsin", room_id: "room.east" },
    ],
  };

  it("emits MESSAGE and TRADE affordances only for co-located Players, never distant Players or self", () => {
    const affordances = deriveAffordances(baseInput);
    const socialTargets = affordances
      .filter((a) => a.action === "MESSAGE" || a.action === "TRADE")
      .map((a) => ({ action: a.action, target_id: a.target_id, label: a.label }));

    expect(socialTargets).toEqual([
      { action: "MESSAGE", target_id: "player.bob", label: "Message bob" },
      { action: "TRADE", target_id: "player.bob", label: "Trade with bob" },
    ]);
    expect(socialTargets.some((a) => a.target_id === "player.tamsin")).toBe(false);
    expect(socialTargets.some((a) => a.target_id === "player.alice")).toBe(false);
  });

  it("fails closed and emits no MESSAGE/TRADE affordances when observerRoomId is missing", () => {
    const affordances = deriveAffordances({ ...baseInput, observerRoomId: undefined });
    const social = affordances.filter((a) => a.action === "MESSAGE" || a.action === "TRADE");
    expect(social).toEqual([]);
  });
});
