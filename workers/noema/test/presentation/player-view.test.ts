import { describe, expect, it } from "vitest";
import { toPlayerView } from "../../src/presentation/player-view";
import { label } from "../../src/presentation/terms";

const ROOM = {
  room_id: "room.grid",
  name: "Grid Anchor",
  description: "A frontier anchor.",
  condition: "Infrastructure shows damage.",
  exits: [{ direction: "east", to_room_id: "room.b" }],
  entities: [
    {
      entity_id: "entity.relay-7",
      label: "scarred-conduit",
      entity_type: "INFRASTRUCTURE",
      condition: 83,
    },
  ],
};

describe("terms", () => {
  it("keeps schema names off the player register", () => {
    expect(label("observation", "player")).toBe("signal");
    expect(label("observation", "schema")).toBe("Observation");
    expect(label("subject", "player")).toBe("player");
    expect(label("canonical_head", "operator")).toBe("canonical head");
  });
});

describe("toPlayerView", () => {
  it("maps look and status without invented indices", () => {
    const view = toPlayerView({
      world_name: "Perihelion Reach",
      cycle: 4,
      location: ROOM,
      budgets: { energy: 10, compute: 8, storage: 2, attention: 3, influence: 1 },
      messages: [],
      trades: [{}],
      organizations: [],
      players_here: [{ player_id: "p2" }],
      report_lines: ["scarred conduit condition 83."],
    });
    expect(view.worldName).toBe("Perihelion Reach");
    expect(view.locationName).toBe("Grid Anchor");
    expect(view.cycleLabel).toBe("Cycle 4");
    expect(view.relayIntegrity).toBe(83);
    expect(view.status.find((r) => r.label === "Relay")?.value).toBe("83%");
    expect(view.status.find((r) => r.label === "Influence")?.value).toBe("1");
    expect(view.status.find((r) => r.label === "Here")?.value).toBe("1");
    expect(view.strip.find((r) => r.label === "Relay")?.value).toBe("83%");
    expect(view.strip.find((r) => r.label === "Cycle")?.value).toBe("4");
    expect(view.signals).toEqual(["scarred conduit condition 83."]);
    expect(JSON.stringify(view)).not.toMatch(/SEVERE|Population|Trade Index/i);
    expect(JSON.stringify(view)).not.toMatch(/consciousness|experiment|subject/i);
  });

  it("discloses another Player's public title on Here without invented indices", () => {
    const view = toPlayerView({
      location: ROOM,
      players_here: [
        {
          player_id: "player.sable",
          handle: "sable",
          public_practice_lines: ["sable is known for survey work."],
        },
      ],
    });
    expect(view.status.filter((r) => r.label === "Here").map((r) => r.value)).toEqual([
      "1",
      "sable is known for survey work.",
    ]);
    expect(JSON.stringify(view)).not.toMatch(/XP|Population|Trade Index/i);
  });

  it("prefers available affordances for the action rail", () => {
    const view = toPlayerView({
      location: ROOM,
      affordances: [
        { label: "Inspect Scarred Conduit", cmd: "inspect scarred-conduit", available: true },
        { label: "Hidden", cmd: "look", available: false },
      ],
    });
    expect(view.actions).toEqual([
      { label: "Inspect Scarred Conduit", cmd: "inspect scarred-conduit", available: true },
    ]);
  });

  it("hedges rumors and hides contest ids", () => {
    const view = toPlayerView({
      location: ROOM,
      rumor_lines: ["The vault is empty."],
      board_lines: ["Need fuel"],
      shout_lines: ["Hold the east"],
      reconstruction_lines: ["A record says Nacre built it."],
      contests: [
        {
          contest_form: "INFRASTRUCTURE_CONTROL",
          status: "OPEN",
          expires_cycle: 12,
        },
      ],
    });
    expect(view.systems.rumors[0]).toBe("Unconfirmed — The vault is empty.");
    expect(view.systems.comms.some((l) => l.startsWith("Board — "))).toBe(true);
    expect(view.systems.comms.some((l) => l.startsWith("Shout — "))).toBe(true);
    expect(view.systems.archive[0]).toMatch(/record says/i);
    expect(view.systems.contests[0]).toMatch(/INFRASTRUCTURE CONTROL · OPEN/);
    expect(JSON.stringify(view.systems)).not.toMatch(/contest[._]id/i);
  });

  it("does not invent relay integrity without evidence", () => {
    const view = toPlayerView({
      location: { name: "Open", description: "", exits: [], entities: [] },
    });
    expect(view.relayIntegrity).toBeNull();
    expect(view.status.some((r) => r.label === "Relay")).toBe(false);
  });
});
