import { describe, expect, it } from "vitest";
import { anonymousWatchInlineSource, anonymousWatchView } from "../src/watch-fluid-view";

describe("anonymous WATCH presentation", () => {
  it("hides players across headline, recent events and room details without changing source facts", () => {
    const event = { sequence: 12, projection_id: "agent_move", room_id: "room.hub", actor_label: "cairn-1", line: "cairn-1 entered Hub" };
    const source = {
      projection: "public", world_id: "world.test", cycle: 3, sequence: 12,
      recent_events: [event], notable_event: event,
      narrative: { now: event, recently: [event] },
      rooms: [{ room_id: "room.hub", name: "Hub", players_present: 1, public_player_labels: ["cairn-1"] }],
      public_descriptor_lines: ["cairn-1 is known here"],
    };
    const view = anonymousWatchView(source);
    expect(JSON.stringify(view)).not.toContain("cairn-1");
    expect(view.recent_events[0].line).toBe("An agent entered Hub");
    expect(view.notable_event.actor_label).toBe("An agent");
    expect(view.narrative.recently[0].sequence).toBe(12);
    expect(view.rooms[0]).toMatchObject({ room_id: "room.hub", name: "Hub", players_present: 1 });
    expect(view.world_id).toBe(source.world_id);
    expect(view.sequence).toBe(source.sequence);
    expect(source.recent_events[0].actor_label).toBe("cairn-1");
    expect(source.rooms[0].public_player_labels).toEqual(["cairn-1"]);
  });

  it("treats punctuation in names literally and preserves unrelated text and event order", () => {
    const view = anonymousWatchView({
      rooms: [{ public_player_labels: ["alpha.+[x]", "cairn-1", "cairn-10"] }],
      recent_events: [
        { sequence: 5, line: "alpha.+[x] entered Hub", actor_label: "alpha.+[x]" },
        { sequence: 4, line: "cairn-10 met cairn-1", actor_label: "cairn-10" },
        { sequence: 3, line: "A cairn-100 marker remains" },
      ],
    });
    expect(view.recent_events.map((e: any) => e.sequence)).toEqual([5, 4, 3]);
    expect(view.recent_events.map((e: any) => e.line)).toEqual([
      "An agent entered Hub", "An agent met an agent", "A cairn-100 marker remains",
    ]);
  });

  it("survives absent public names and produces executable inline source", () => {
    expect(anonymousWatchView({ rooms: [], recent_events: [] })).toEqual({ rooms: [], recent_events: [] });
    const source = anonymousWatchInlineSource();
    expect(source).not.toContain("__name");
    const inlined = new Function(`return (${source});`)();
    expect(inlined({ rooms: [], recent_events: [] })).toEqual({ rooms: [], recent_events: [] });
  });
});
