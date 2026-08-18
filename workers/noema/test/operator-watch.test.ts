import { describe, expect, it } from "vitest";
import {
  appendOperatorWatchLine,
  buildOperatorWatch,
  followOperatorWatch,
  lineFromObservation,
  OPERATOR_WATCH_PIN,
  phosphorSnapshotFromOperatorWatch,
  redactOperatorWatchText,
  type OperatorWatchSite,
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
    const market = (snap.sites as Array<{ room_id: string; player_labels: string[] }>).find((s) => s.room_id === "room.market")!;
    expect(market.player_labels.sort()).toEqual(["legacy", "mine"]);
    const lines = snap.lines as Array<{ handle: string; line: string }>;
    expect(lines.map((l) => l.handle).sort()).toEqual(["legacy", "mine"]);
    expect(JSON.stringify(snap)).not.toMatch(/theirs moved|player\.theirs|"theirs"/);
    expect(JSON.stringify(snap)).not.toMatch(/smoke-human/);
  });

  it("feeds PIXEL only this operator's public occupancy", () => {
    const built = buildOperatorWatch({
      world_id: "world.test",
      cycle: 1,
      sequence: 9,
      now: NOW,
      rooms: {
        "room.a": {
          room_id: "room.a",
          name: "Relay Quarter",
          exits: [{ direction: "east", to_room_id: "room.b" }],
          entities: [],
        },
        "room.b": {
          room_id: "room.b",
          name: "Transit Ring",
          exits: [{ direction: "west", to_room_id: "room.a" }],
          entities: [],
        },
        "room.vault": { room_id: "room.vault", name: "Vault", hidden: true, exits: [], entities: [] },
      },
      players: {
        "player.mine": {
          handle: "vesper",
          room_id: "room.b",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          operator_id: "op.token",
        },
      },
      operator_id: "op.token",
      lines: [
        {
          at: NOW,
          handle: "vesper",
          room_id: "room.b",
          room_name: "Transit Ring",
          command: "MOVE",
          line: "You arrive at Transit Ring.",
          glyph: "player",
          operator_id: "op.token",
        },
      ],
    });
    const pixel = phosphorSnapshotFromOperatorWatch({
      sequence: Number(built.sequence),
      sites: built.sites as OperatorWatchSite[],
      lines: built.lines as Array<{ room_id?: string }>,
    });
    expect(pixel.rooms.map((r) => r.room_id).sort()).toEqual(["room.a", "room.b"]);
    expect(pixel.rooms.find((r) => r.room_id === "room.b")?.public_player_labels).toEqual(["vesper"]);
    expect(pixel.rooms.find((r) => r.room_id === "room.b")?.players_present).toBe(1);
    expect(pixel.recent_events[0]?.room_id).toBe("room.b");
    expect(pixel.recent_events[0]?.tier).toBe("NORMAL");
    expect(JSON.stringify(pixel)).not.toMatch(/vault/i);
  });

  it("follows one agent on live text and lights their PIXEL room", () => {
    const built = buildOperatorWatch({
      world_id: "world.test",
      cycle: 1,
      sequence: 4,
      now: NOW,
      rooms: {
        "room.a": { room_id: "room.a", name: "Relay Quarter", exits: [], entities: [] },
        "room.b": { room_id: "room.b", name: "Transit Ring", exits: [], entities: [] },
      },
      players: {
        "player.mine": {
          handle: "vesper",
          room_id: "room.b",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          operator_id: "op.token",
        },
        "player.other": {
          handle: "nacre",
          room_id: "room.a",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          operator_id: "op.token",
        },
      },
      operator_id: "op.token",
      lines: [
        {
          at: NOW,
          handle: "nacre",
          room_id: "room.a",
          room_name: "Relay Quarter",
          command: "LOOK",
          line: "Relay Quarter — a worn switching floor.",
          glyph: "loc",
          operator_id: "op.token",
        },
        {
          at: NOW + 1,
          handle: "vesper",
          room_id: "room.b",
          room_name: "Transit Ring",
          command: "MOVE",
          line: "You arrive at Transit Ring.",
          glyph: "player",
          operator_id: "op.token",
        },
      ],
    });
    const focused = followOperatorWatch(
      {
        agents: built.agents as Array<{ handle: string; room_id?: string; glyph: "player" }>,
        sites: built.sites as OperatorWatchSite[],
        lines: built.lines as Array<{ handle?: string; room_id?: string }>,
      },
      { handle: "vesper" },
    );
    expect(focused.focus_room_id).toBe("room.b");
    expect(focused.lines.map((l) => l.handle)).toEqual(["vesper"]);
    expect(focused.sites.find((s) => s.room_id === "room.b")?.active).toBe(true);
    expect(focused.sites.find((s) => s.room_id === "room.a")?.active).toBe(false);
    const pixel = phosphorSnapshotFromOperatorWatch({
      sequence: Number(built.sequence),
      sites: built.sites as OperatorWatchSite[],
      lines: built.lines as Array<{ room_id?: string; handle?: string }>,
      agents: built.agents as Array<{ handle?: string; room_id?: string }>,
      follow: { handle: "vesper" },
    });
    expect(pixel.focus_room_id).toBe("room.b");
    expect(pixel.rooms.find((r) => r.room_id === "room.b")?.active).toBe(true);
    expect(pixel.rooms.find((r) => r.room_id === "room.a")?.active).toBe(false);
    expect(pixel.recent_events.every((e) => e.room_id === "room.b")).toBe(true);
  });
});
