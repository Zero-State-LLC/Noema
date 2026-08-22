/** PR #245 acceptance-scenario observability.
 *  Slice A (DEEP-TIME §3.4): inherited history must be observable by the successor.
 *  Slice B (INSTITUTIONAL-AUTHORITY): the published decision rule must be observable.
 *  Projection only — no new mechanics, no new events. */

import { describe, expect, it } from "vitest";
import { inheritedLines, type InheritedHistory } from "../src/deep-time";
import { precedenceLines, publicOffices, type OfficeRecord } from "../src/offices";

function scar(id: string, visibility: "public" | "institutional" | "hidden", strength = 0.4) {
  return {
    scar_id: id,
    domain: "economic" as const,
    strength,
    decay_rate: 0.08,
    room_id: "room.hub",
    cycle_born: 3,
    visibility,
    reconstruction_confidence: 0.4,
  };
}

describe("Slice A — succession inheritance is observable", () => {
  it("summarises public scars, lore labels, and prior working without leaking ids", () => {
    const inherited: InheritedHistory = {
      scar_vector: [scar("scar.a", "public"), scar("scar.b", "public")],
      trajectory_digest: [{ room_id: "room.hub", harvest_count: 4, last_cycle: 9 }],
      lore_seeds: ["scarred ground", "scarred ground", "quiet exchange"],
    };
    const lines = inheritedLines(inherited);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(3);
    const blob = lines.join(" ");
    expect(blob).toContain("2 marked sites");
    expect(blob).toContain("scarred ground");
    // deduped labels, and no identifiers of any kind on the wire
    expect(blob.match(/scarred ground/g)).toHaveLength(1);
    expect(blob).not.toMatch(/scar\.|room\.|player\.|entity\./);
  });

  it("never counts hidden or institutional scars, or sub-floor ones", () => {
    const lines = inheritedLines({
      scar_vector: [scar("scar.h", "hidden", 0.9), scar("scar.i", "institutional", 0.9), scar("scar.tiny", "public", 0.01)],
      trajectory_digest: [],
      lore_seeds: [],
    });
    expect(lines.join(" ")).not.toContain("marked site");
  });

  it("is empty for a Player who inherited nothing", () => {
    expect(inheritedLines(undefined)).toEqual([]);
    expect(inheritedLines({ scar_vector: [], trajectory_digest: [], lore_seeds: [] })).toEqual([]);
  });
});

describe("Slice B — published office precedence is observable", () => {
  const offices: Record<string, OfficeRecord> = {
    "office.warden": {
      office_id: "office.warden",
      display_name: "Warden",
      status: "OCCUPIED",
      authority_profile: "OPERATE_NAMED_ASSET",
    } as OfficeRecord,
    "office.steward": {
      office_id: "office.steward",
      display_name: "Steward",
      status: "OCCUPIED",
      authority_profile: "OPERATE_NAMED_ASSET",
    } as OfficeRecord,
  };

  it("names the order that decides AUTHORITY_CONFLICT", () => {
    const pub = publicOffices(offices, {});
    const lines = precedenceLines(pub, ["office.warden", "office.steward"]);
    expect(lines).toEqual(["Published office precedence: Warden before Steward."]);
  });

  it("says nothing when no precedence is published (fail-closed stays silent)", () => {
    const pub = publicOffices(offices, {});
    expect(precedenceLines(pub, [])).toEqual([]);
    expect(precedenceLines(pub, undefined)).toEqual([]);
    // unknown/retired ids never invent a rule
    expect(precedenceLines(pub, ["office.ghost"])).toEqual([]);
  });
});

describe("PLAY surface actually shows both (review follow-up)", () => {
  it("player-view renders inherited_lines like lot_lines", async () => {
    const { toPlayerView } = await import("../src/presentation/player-view");
    const view = toPlayerView({
      world_name: "W",
      cycle: 12,
      location: { name: "Hub", description: "", exits: [], entities: [] },
      inherited_lines: ["You inherit a record of 2 marked sites."],
    } as never);
    const row = view.status.find((r) => r.value.includes("2 marked sites"));
    expect(row).toBeDefined();
    expect(row?.label).toBe("Inherited");
  });

  it("precedence reaches PLAY through office_lines, not a machine-readable field", async () => {
    const { precedenceLines, publicOffices } = await import("../src/offices");
    const pub = publicOffices(
      {
        "office.a": { office_id: "office.a", display_name: "Warden", status: "OCCUPIED", authority_profile: "OPERATE_NAMED_ASSET" },
        "office.b": { office_id: "office.b", display_name: "Steward", status: "OCCUPIED", authority_profile: "OPERATE_NAMED_ASSET" },
      } as never,
      {},
    );
    const officeLinesOut = [
      ...precedenceLines(pub, ["office.a", "office.b"]).map((l) => `Compact: ${l}`),
    ];
    const { toPlayerView } = await import("../src/presentation/player-view");
    const view = toPlayerView({
      world_name: "W",
      location: { name: "Hub", description: "", exits: [], entities: [] },
      office_lines: officeLinesOut,
    } as never);
    expect(view.systems.offices.join(" ")).toContain("Warden before Steward");
  });

  it("§245 gate: no raw machine-readable governance field on the org projection", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("../src/world-actions.ts", import.meta.url).pathname, "utf8"),
    );
    expect(src).not.toContain("office_precedence: (o.office_precedence");
    expect(src).not.toContain("precedence_lines:");
  });
});
