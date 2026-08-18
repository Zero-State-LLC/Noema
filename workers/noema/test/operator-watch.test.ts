import { describe, expect, it } from "vitest";
import {
  appendOperatorWatchLine,
  buildOperatorWatch,
  lineFromObservation,
  OPERATOR_WATCH_PIN,
  redactOperatorWatchText,
} from "../src/operator-watch";

const NOW = 1_700_000_000_000;

describe("operator watch theater", () => {
  it("maps LOOK text to location marks and redacts ids", () => {
    const row = lineFromObservation({
      command: "LOOK",
      consequence: "You look.",
      location: { name: "Relay Quarter", description: "A worn switching floor." },
    });
    expect(row.command).toBe("LOOK");
    expect(row.glyph).toBe("loc");
    expect(row.line).toMatch(/Relay Quarter/);
    expect(row.line).toMatch(/switching floor/);
    expect(redactOperatorWatchText("see player.aaaaaaaaaaaa leave")).toBe("see a player leave");
  });

  it("never echoes MESSAGE bodies", () => {
    const row = lineFromObservation({
      command: "MESSAGE hermes hello secret",
      consequence: "hello secret",
      location: { name: "Relay Quarter" },
    });
    expect(row.glyph).toBe("comms");
    expect(row.line).toBe("sent a message");
    expect(row.line).not.toMatch(/secret/);
  });

  it("builds a glyph-mapped public map of agent Players without hidden rooms", () => {
    const snap = buildOperatorWatch({
      world_id: "world.test",
      cycle: 4,
      sequence: 12,
      now: NOW,
      rooms: {
        "room.market": {
          room_id: "room.market",
          name: "Chamber Market",
          exits: [{ direction: "north", to_room_id: "room.relay" }],
          entities: [{ label: "Trade stall", entity_type: "PROP" }],
        },
        "room.relay": {
          room_id: "room.relay",
          name: "Relay Quarter",
          exits: [{ direction: "south", to_room_id: "room.market" }],
          entities: [],
        },
        "room.vault": {
          room_id: "room.vault",
          name: "Sealed Vault",
          hidden: true,
          exits: [{ direction: "up", to_room_id: "room.market" }],
          entities: [{ label: "Core", entity_type: "INFRASTRUCTURE" }],
        },
      },
      players: {
        "player.hermes": {
          handle: "hermes",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        "player.aaaaaaaaaaaa": {
          handle: "Vesper-7",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "live",
        },
      },
      lines: appendOperatorWatchLine([], {
        at: NOW,
        handle: "hermes",
        room_id: "room.market",
        room_name: "Chamber Market",
        command: "LOOK",
        line: "Chamber Market — Open stalls.",
        glyph: "loc",
      }),
    });
    expect(snap.operator_watch).toBe(OPERATOR_WATCH_PIN);
    expect(JSON.stringify(snap)).not.toMatch(/Sealed Vault|vault/i);
    const agents = snap.agents as Array<{ handle: string }>;
    expect(agents.map((a) => a.handle)).toEqual(["hermes"]);
    const market = (snap.sites as Array<Record<string, unknown>>).find((s) => s.room_id === "room.market")!;
    expect(market.glyph).toBe("loc");
    expect(market.player_labels).toEqual(["hermes"]);
    expect(market.players_present).toBe(1);
    const exits = market.exits as Array<{ glyph: string }>;
    expect(exits[0].glyph).toBe("threshold");
    const ents = market.entities as Array<{ glyph: string; label: string }>;
    expect(ents[0]).toEqual({ label: "Trade stall", entity_type: "PROP", glyph: "trade" });
    const lines = snap.lines as Array<{ handle: string; line: string }>;
    expect(lines[0].handle).toBe("hermes");
    expect(lines[0].line).toMatch(/Open stalls/);
    expect(JSON.stringify(lines[0])).not.toMatch(/operator_id|op\./);
  });

  it("hides other operators' owned agents and keeps unowned legacy visible", () => {
    const snap = buildOperatorWatch({
      world_id: "world.test",
      cycle: 1,
      sequence: 1,
      now: NOW,
      operator_id: "op.mail.aaaaaaaaaaaaaaaa",
      rooms: {
        "room.market": {
          room_id: "room.market",
          name: "Chamber Market",
          exits: [],
          entities: [],
        },
      },
      players: {
        "player.mine": {
          handle: "mine",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          controller_type: "agent",
          operator_id: "op.mail.aaaaaaaaaaaaaaaa",
        },
        "player.theirs": {
          handle: "theirs",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          controller_type: "agent",
          operator_id: "op.mail.bbbbbbbbbbbbbbbb",
        },
        "player.legacy": {
          handle: "legacy",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        "player.smoke-human": {
          handle: "smoke-human",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          controller_type: "human",
          operator_id: "op.mail.aaaaaaaaaaaaaaaa",
        },
      },
      lines: [
        {
          at: NOW,
          handle: "mine",
          command: "LOOK",
          line: "mine looked",
          glyph: "loc",
          operator_id: "op.mail.aaaaaaaaaaaaaaaa",
        },
        {
          at: NOW + 1,
          handle: "theirs",
          command: "MOVE",
          line: "theirs moved",
          glyph: "threshold",
          operator_id: "op.mail.bbbbbbbbbbbbbbbb",
        },
        {
          at: NOW + 2,
          handle: "legacy",
          command: "LOOK",
          line: "legacy looked",
          glyph: "loc",
        },
      ],
    });
    const agents = snap.agents as Array<{ handle: string }>;
    expect(agents.map((a) => a.handle).sort()).toEqual(["legacy", "mine"]);
    const market = (snap.sites as Array<{ player_labels: string[] }>).find((s) => s.room_id === "room.market")!;
    expect(market.player_labels.sort()).toEqual(["legacy", "mine"]);
    const lines = snap.lines as Array<{ handle: string; line: string }>;
    expect(lines.map((l) => l.handle).sort()).toEqual(["legacy", "mine"]);
    expect(JSON.stringify(snap)).not.toMatch(/theirs moved|player\.theirs|"theirs"/);
    expect(JSON.stringify(snap)).not.toMatch(/smoke-human/);
  });
});
