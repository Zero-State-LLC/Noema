/**
 * RFC-0129 conformance item 3 — the runtime half.
 *
 * RFC-0129 (Accepted 2026-08-30) added optional `victim_id` and `visibility` to
 * `CRIME_DETECTED_payload` because three Accepted authorities referenced fields
 * the closed payload forbade. Its Conformance section lists five items; items 1,
 * 2, 4 and 5 landed in Noema-Specs (schema, both fixtures, both negative
 * fixtures, and the GC3-S2 / RFC-0094 gate-agreement check). Item 3 is a runtime
 * requirement and did not:
 *
 *   "Add a conformance case feeding the exact schema-valid fixture through
 *    dyadic danger memory, the public danger band, `public_social_events`,
 *    world reports, and the WATCH projection — the failure this RFC exists to
 *    prevent is a record that validates and then produces nothing."
 *
 * The RFC also asserted "no runtime change is required — all five consumers
 * already read exactly these fields." That claim was never executed. This does.
 *
 * The five consumers are covered elsewhere in isolation; nothing fed one
 * canonical record through all of them at once, which is the only way the
 * validates-but-produces-nothing failure shows up.
 *
 * Uses the exact Noema-Specs fixtures rather than hand-written payloads, so the
 * two repositories cannot drift apart silently. Checked when Noema-Specs is
 * checked out beside this repo, skipped when it is not — the closed-catalog
 * pattern.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { creditsFromDangerEvent, watchPublicDescriptorLines } from "../src/social-memory";
import { publicReportLines } from "../src/world-reports";
import { projectionIdForEvent } from "../src/watch-live";
import { recordTradeMemory, type WorldRuntime } from "../src/world-actions";

const HERE = new URL(".", import.meta.url).pathname;
const EXAMPLES = join(HERE, "../../../../Noema-Specs/examples/catalog");
const PUBLIC_FIXTURE = join(EXAMPLES, "valid-event-catalog-0.2-crime-detected-public.json");
const NEITHER_FIXTURE = join(EXAMPLES, "valid-event-catalog-0.2-crime-detected-neither.json");
const have = existsSync(PUBLIC_FIXTURE) && existsSync(NEITHER_FIXTURE);

type Fixture = {
  event_id: string;
  event_type: string;
  cycle: number;
  payload: Record<string, unknown>;
};

function fixture(path: string): Fixture {
  return JSON.parse(readFileSync(path, "utf8")) as Fixture;
}

function socialEvent(f: Fixture) {
  return {
    event_id: f.event_id,
    event_type: f.event_type,
    cycle: f.cycle,
    payload: f.payload,
  };
}

/** Minimal world carrying only what the public-social-event gate reads. */
function world(): WorldRuntime {
  return {
    world_id: "test.rfc0129",
    world_name: "Conformance Reach",
    cycle: 12,
    sequence: 20,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Relay Quarter",
        description: "A public relay quarter.",
        exits: [],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  } as unknown as WorldRuntime;
}

describe.skipIf(!have)("RFC-0129 item 3 — one canonical record reaches every consumer", () => {
  it("the fixtures are the shape RFC-0129 accepted", () => {
    const pub = fixture(PUBLIC_FIXTURE).payload;
    // Both fields are what RFC-0129 added; both are optional in the schema.
    expect(pub.victim_id).toBe("agent.vesper");
    expect(pub.visibility).toBe("PUBLIC");
    expect(pub.flags).toContain("PUBLIC_HISTORY");
    // Co-extensiveness is a producer rule: a public record carries both.
    const neither = fixture(NEITHER_FIXTURE).payload;
    expect(neither.victim_id).toBeUndefined();
    expect(neither.visibility).toBeUndefined();
    expect(neither.flags).toBeUndefined();
  });

  it("consumer 1 — dyadic danger memory credits the named victim", () => {
    const credits = creditsFromDangerEvent(socialEvent(fixture(PUBLIC_FIXTURE)) as never);
    expect(credits).toEqual([
      {
        player_id: "agent.vesper",
        other_id: "agent.nacre",
        evidence_id: "crime.rfc0129.public",
      },
    ]);
  });

  it("consumer 2 — the public danger band names the subject", () => {
    const lines = watchPublicDescriptorLines(
      [socialEvent(fixture(PUBLIC_FIXTURE)) as never],
      { "agent.nacre": "Nacre" },
    );
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join(" ")).toContain("Nacre");
  });

  it("consumer 3 — the record reaches public_social_events", () => {
    const w = world();
    recordTradeMemory(w, [fixture(PUBLIC_FIXTURE) as never]);
    const ids = (w.public_social_events || []).map((e) => e.event_id);
    expect(ids).toContain("evt.rfc0129.public");
  });

  it("consumer 4 — the world report carries one crime line", () => {
    const w = world();
    const lines = publicReportLines(
      w.rooms as never,
      {},
      {},
      [],
      12,
      [socialEvent(fixture(PUBLIC_FIXTURE)) as never],
    );
    expect(lines.join(" ").toLowerCase()).toContain("sabotage");
  });

  it("consumer 5 — the WATCH projection admits it", () => {
    expect(projectionIdForEvent("CRIME_DETECTED", fixture(PUBLIC_FIXTURE).payload)).toBe(
      "crime_detected",
    );
  });

  it("all five fire for one record — the failure RFC-0129 exists to prevent", () => {
    const f = fixture(PUBLIC_FIXTURE);
    const ev = socialEvent(f);
    const w = world();
    recordTradeMemory(w, [f as never]);

    const fired = {
      dyadic: creditsFromDangerEvent(ev as never).length > 0,
      publicDanger: watchPublicDescriptorLines([ev as never], {}).length > 0,
      publicSocialEvents: (w.public_social_events || []).some(
        (e) => e.event_id === f.event_id,
      ),
      worldReport: publicReportLines(w.rooms as never, {}, {}, [], 12, [ev as never]).some((l) =>
        l.toLowerCase().includes("sabotage"),
      ),
      watch: projectionIdForEvent("CRIME_DETECTED", f.payload) === "crime_detected",
    };
    expect(fired).toEqual({
      dyadic: true,
      publicDanger: true,
      publicSocialEvents: true,
      worldReport: true,
      watch: true,
    });
  });

  it("the non-public record stays private everywhere, and names no victim", () => {
    const f = fixture(NEITHER_FIXTURE);
    const ev = socialEvent(f);
    const w = world();
    recordTradeMemory(w, [f as never]);

    // No victim_id, so GC3-S1 credits no dyadic edge.
    expect(creditsFromDangerEvent(ev as never)).toEqual([]);
    // Neither PUBLIC_HISTORY nor visibility=PUBLIC, so nothing publishes it.
    expect(watchPublicDescriptorLines([ev as never], {})).toEqual([]);
    expect((w.public_social_events || []).map((e) => e.event_id)).not.toContain(f.event_id);
    expect(
      publicReportLines(w.rooms as never, {}, {}, [], 12, [ev as never]).join(" ").toLowerCase(),
    ).not.toContain("policy_violation");
    expect(projectionIdForEvent("CRIME_DETECTED", f.payload)).toBeNull();
  });
});
