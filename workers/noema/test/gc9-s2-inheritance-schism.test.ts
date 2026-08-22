/**
 * GC9-S2 (RFC-0125) — practice inheritance and schism.
 * Mirrors the ten fixtures in Noema-Specs examples/gc9-schism/.
 */
import { describe, expect, it } from "vitest";
import {
  COMPETING_LINE,
  DORMANT_LINE,
  INHERITED_LINE,
  SCHISM_LINE,
  TRADITION_LINE,
  WATCH_INHERITED_PULSE,
  WATCH_SCHISM_PULSE,
  WATCH_TRADITION_PULSE,
  applyCultureEvents,
  cultureLines,
  emptyCulture,
  ensureCulture,
  publicCulturePulses,
  type CultureState,
  type PublicCultureRecon,
} from "../src/culture";

const ENT = "entity.relay-7";

/** One REPAIR by one actor at one cycle. applyCultureEvents takes a single actor. */
function repair(state: CultureState, eventId: string, actor: string, cycle: number): CultureState {
  return applyCultureEvents(
    state,
    [{ event_id: eventId, event_type: "ENTITY_UPDATE", payload: { entity_id: ENT, operation: "REPAIR" } }],
    actor,
    cycle,
  );
}

function recon(claim: string, author: string, visibility = "PUBLIC", epistemic = "OPEN"): PublicCultureRecon {
  return { subject_ref: ENT, visibility, claim, epistemic, author_id: author };
}

/** Founders nacre stop at cycle 5; oriole carries the practice on at cycle 7. */
function inheritedSite(): CultureState {
  let s = emptyCulture();
  s = repair(s, "e1", "player.nacre", 1);
  s = repair(s, "e2", "player.nacre", 3);
  s = repair(s, "e3", "player.nacre", 5);
  s = repair(s, "e4", "player.oriole", 7);
  return s;
}

const lines = (s: CultureState, cycle: number, recons: PublicCultureRecon[] = [], who = "player.nacre") =>
  cultureLines(s, [ENT], who, cycle, recons);

describe("GC9-S2 inheritance", () => {
  it("marks a tradition inherited once a successor repairs after the founders stop", () => {
    expect(lines(inheritedSite(), 8)).toEqual([TRADITION_LINE, INHERITED_LINE]);
  });

  it("does not mark inheritance when every actor is an originator", () => {
    let s = emptyCulture();
    s = repair(s, "e1", "player.nacre", 1);
    s = repair(s, "e2", "player.oriole", 3);
    s = repair(s, "e3", "player.nacre", 5);
    s = repair(s, "e4", "player.oriole", 7);
    expect(lines(s, 8)).toEqual([TRADITION_LINE]);
  });

  it("treats a co-practitioner as a co-practitioner, not an heir", () => {
    // vesper repairs at cycle 4 but nacre continues to cycle 6. The practice
    // has not outlived its founders.
    let s = emptyCulture();
    s = repair(s, "e1", "player.nacre", 1);
    s = repair(s, "e2", "player.nacre", 2);
    s = repair(s, "e3", "player.nacre", 3);
    s = repair(s, "e4", "player.vesper", 4);
    s = repair(s, "e5", "player.nacre", 6);
    expect(lines(s, 7)).toEqual([TRADITION_LINE]);
  });

  it("carries per-repair attribution across a state rebuild", () => {
    const rebuilt = ensureCulture(JSON.parse(JSON.stringify(inheritedSite())));
    expect(lines(rebuilt, 8)).toEqual([TRADITION_LINE, INHERITED_LINE]);
  });

  it("degrades to no mark on a site persisted before GC9-S2", () => {
    // Old blobs have repair_ids but no `repairs`, so attribution is absent.
    const legacy = ensureCulture({
      catalog_id: "culture-catalog/gc9-s0",
      sites: {},
    } as unknown as CultureState);
    legacy.sites[ENT] = {
      repair_ids: ["e1", "e2", "e3", "e4"],
      accessors: ["player.nacre", "player.oriole"],
      repair_cycles: [1, 3, 5, 7],
      last_observed_cycle: 7,
    };
    expect(lines(legacy, 8)).toEqual([TRADITION_LINE]);
  });
});

describe("GC9-S2 schism", () => {
  const rival = [recon("The relay was held.", "player.nacre"), recon("The relay was abandoned.", "player.oriole")];

  it("marks a schism when two practitioners keep rival public accounts", () => {
    expect(lines(inheritedSite(), 8, rival)).toEqual([
      TRADITION_LINE,
      COMPETING_LINE,
      INHERITED_LINE,
      SCHISM_LINE,
    ]);
  });

  it("does not mark a schism on a single account", () => {
    expect(lines(inheritedSite(), 8, [recon("The relay was held.", "player.nacre")])).toEqual([
      TRADITION_LINE,
      INHERITED_LINE,
    ]);
  });

  it("does not mark a schism for accounts by non-practitioners", () => {
    const outsiders = [
      recon("The relay was held.", "player.kestrel"),
      recon("The relay was abandoned.", "player.wren"),
    ];
    expect(lines(inheritedSite(), 8, outsiders)).toEqual([TRADITION_LINE, COMPETING_LINE, INHERITED_LINE]);
  });

  it("treats one practitioner revising themselves as a revision, not a division", () => {
    const revision = [
      recon("The relay was held.", "player.nacre"),
      recon("The relay was abandoned.", "player.nacre"),
    ];
    expect(lines(inheritedSite(), 8, revision)).toEqual([TRADITION_LINE, COMPETING_LINE, INHERITED_LINE]);
  });

  it("does not mark a schism on unpublished accounts", () => {
    const unpublished = [
      recon("The relay was held.", "player.nacre", "PRIVATE"),
      recon("The relay was abandoned.", "player.oriole", "INSTITUTIONAL"),
    ];
    expect(lines(inheritedSite(), 8, unpublished)).toEqual([TRADITION_LINE, INHERITED_LINE]);
  });
});

describe("GC9-S2 marks attach only to a live tradition", () => {
  it("attaches nothing below TRADITION", () => {
    let s = emptyCulture();
    s = repair(s, "e1", "player.nacre", 1);
    s = repair(s, "e2", "player.oriole", 3);
    const rival = [
      recon("The relay was held.", "player.nacre"),
      recon("The relay was abandoned.", "player.oriole"),
    ];
    expect(lines(s, 4, rival)).toEqual([]);
  });

  it("attaches nothing to a dormant tradition", () => {
    const rival = [
      recon("The relay was held.", "player.nacre"),
      recon("The relay was abandoned.", "player.oriole"),
    ];
    expect(lines(inheritedSite(), 20, rival)).toEqual([DORMANT_LINE]);
  });
});

describe("GC9-S2 visibility", () => {
  it("emits aggregate WATCH pulses that name no site and no agent", () => {
    const rival = [
      recon("The relay was held.", "player.nacre"),
      recon("The relay was abandoned.", "player.oriole"),
    ];
    const pulses = publicCulturePulses(inheritedSite(), 8, rival);
    expect(pulses).toEqual([WATCH_TRADITION_PULSE, WATCH_INHERITED_PULSE, WATCH_SCHISM_PULSE]);
    const blob = pulses.join(" ");
    expect(blob).not.toContain("relay-7");
    expect(blob).not.toContain("nacre");
    expect(blob).not.toContain("oriole");
  });

  it("never names a founder, successor, or account holder in a play line (RFC-0125 hard rule 6)", () => {
    const rival = [
      recon("The relay was held.", "player.nacre"),
      recon("The relay was abandoned.", "player.oriole"),
    ];
    const blob = lines(inheritedSite(), 8, rival).join(" ");
    for (const handle of ["nacre", "oriole", "player.", "entity."]) {
      expect(blob).not.toContain(handle);
    }
  });

  it("shows nothing to an agent who has never accessed the site", () => {
    expect(lines(inheritedSite(), 8, [], "player.stranger")).toEqual([]);
  });
});
