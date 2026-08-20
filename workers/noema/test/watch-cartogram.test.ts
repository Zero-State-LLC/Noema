/** §4.B.1 ASCII cartogram — TEXT-mode map from the shared Phosphor layout. */

import { describe, expect, it } from "vitest";
import {
  asciiCartogram,
  CARTOGRAM_COLS,
  CARTOGRAM_MAX_SITES,
  createPhosphorSession,
  layoutPublicTopology,
} from "../src/watch-phosphor";
import { watchHtml } from "../src/watch";

const ROOMS = [
  { room_id: "room.hub", name: "Relay Hub", players_present: 3, active: true,
    exits: [
      { direction: "east", to_room_id: "room.market" },
      { direction: "south", to_room_id: "room.cache" },
    ] },
  { room_id: "room.market", name: "Chamber Market", players_present: 1, active: true,
    exits: [{ direction: "west", to_room_id: "room.hub" }] },
  { room_id: "room.cache", name: "Storage Cache", players_present: 0,
    exits: [{ direction: "north", to_room_id: "room.hub" }] },
];

describe("ascii cartogram", () => {
  it("is deterministic and spatial: identical layout → identical text, sites placed apart", () => {
    const layout = layoutPublicTopology(ROOMS);
    const a = asciiCartogram(layout);
    const b = asciiCartogram(layout);
    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).toContain("[RELAY HUB]*3");
    expect(a).toContain("[CHAMBER MARKET]*1");
    expect(a).toContain("[STORAGE CACHE]");
    // east neighbor sits on a different column, south neighbor on a lower row
    const lines = (a as string).split("\n");
    const rowOf = (s: string) => lines.findIndex((l) => l.includes(s));
    expect(rowOf("[STORAGE CACHE]")).toBeGreaterThan(rowOf("[RELAY HUB]"));
    // route connectors exist and every line fits the budget
    expect(a).toMatch(/[-|\\/.]/);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(CARTOGRAM_COLS);
  });

  it("marks the MAJOR-headline site and the picked site", () => {
    const layout = layoutPublicTopology(ROOMS);
    const art = asciiCartogram(layout, { majorRoomId: "room.cache", pickedRoomId: "room.market" });
    expect(art).toContain("[STORAGE CACHE]!");
    expect(art).toContain("[CHAMBER MARKET]*1+");
  });

  it("never shows hidden rooms or hidden exits at any stage", () => {
    const layout = layoutPublicTopology([
      ...ROOMS,
      { room_id: "room.vault", name: "Hidden Vault", hidden: true,
        exits: [{ direction: "down", to_room_id: "room.hub" }] },
    ]);
    const art = asciiCartogram(layout);
    expect(art).not.toContain("VAULT");
  });

  it("sanitizes labels through the safe-label path", () => {
    const layout = layoutPublicTopology([
      { room_id: "room.x", name: "<b>`Spooky`&", players_present: 0, exits: [] },
    ]);
    const art = asciiCartogram(layout) || "";
    expect(art).not.toMatch(/[<>`&]/);
    expect(art).toContain("BSPOOKY");
  });

  it("returns null over budget so the caller can fall back", () => {
    const many = Array.from({ length: CARTOGRAM_MAX_SITES + 1 }, (_, i) => ({
      room_id: "room.r" + String(i).padStart(2, "0"),
      name: "Site " + i,
      players_present: 0,
      exits: [],
    }));
    expect(asciiCartogram(layoutPublicTopology(many))).toBeNull();
    expect(asciiCartogram({ nodes: [], edges: [] })).toBeNull();
    expect(asciiCartogram(null)).toBeNull();
  });

  it("is exposed on the session and wired into the page with the line-list fallback", () => {
    const session = createPhosphorSession({ canvas: null });
    session.update({ sequence: 1, rooms: ROOMS, recent_events: [] });
    const art = session.ascii();
    expect(art).toContain("[RELAY HUB]");
    const html = watchHtml();
    expect(html).toContain("NoemaPhosphor.ascii");
    expect(html).toContain("const asciiCartogram =");
    expect(html).toContain("if (!art && shouldPre(rooms)) art = drawPre(rooms);");
    expect(html).toContain('aria-hidden="true" hidden></pre>');
  });
});
