/** GC4-S8 governance rule (RFC-0124 Accepted) — runtime conformance.
 *  The specs fixtures in Noema-Specs/examples/gc4-governance are the oracle:
 *  the runtime evaluator must agree with the validator on every one. */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateGovernanceDecision,
  governanceLines,
  jurisdictionSet,
  parseAppointmentMechanism,
  type GovernanceRule,
} from "../src/governance";

const FIXTURES = join(
  new URL(".", import.meta.url).pathname,
  "../../../../Noema-Specs/examples/gc4-governance",
);

const baseRule = (): GovernanceRule => ({
  rule_id: "rule.relay-council",
  org_id: "org.signal-compact",
  published: true,
  decision: { offices: ["office.warden", "office.steward"], quorum: 2 },
  appointment: { mechanism: "RULE_BASED" },
  jurisdiction: { objects: ["entity.relay-trunk"], rooms: ["room.relay-quarter"] },
  enforcement: { operation: "REPAIR" },
  failure: { on_vacancy: "SUCCEED_THEN_DECIDE", on_deadlock: "REFUSE" },
  evidence: { record: "ORG_RECORD" },
});

const KNOWN = ["REPAIR", "TRADE", "ACCESS_POLICY", "ORG_OFFICE_ACT"];

function run(over: Partial<Parameters<typeof evaluateGovernanceDecision>[0]> = {}) {
  return evaluateGovernanceDecision({
    rule: baseRule(),
    actingOffices: ["office.warden", "office.steward"],
    concurring: 2,
    target: { object_id: "entity.relay-trunk", room_id: "room.relay-quarter" },
    knownOperations: KNOWN,
    ...over,
  });
}

describe("GC4-S8 — the six dimensions gate every decision", () => {
  it("accepts a quorate decision inside jurisdiction with evidence", () => {
    expect(run()).toEqual({ ok: true, operation: "REPAIR" });
  });

  it("charter text alone is not executable authority", () => {
    const rule = { ...baseRule(), published: false };
    expect(run({ rule })).toMatchObject({ ok: false, reason: "unpublished" });
  });

  it("refuses an actor holding no deciding office", () => {
    expect(run({ actingOffices: ["office.clerk"], concurring: 1 })).toMatchObject({
      ok: false,
      reason: "not_deciding_office",
    });
  });

  it("refuses short quorum", () => {
    expect(run({ concurring: 1 })).toMatchObject({ ok: false, reason: "quorum_short" });
  });

  it("refuses outside jurisdiction, and empty jurisdiction is empty rather than universal", () => {
    expect(run({ target: { object_id: "entity.foundry-press" } })).toMatchObject({
      ok: false,
      reason: "out_of_jurisdiction",
    });
    const unbounded = { ...baseRule(), jurisdiction: {} };
    expect(run({ rule: unbounded })).toMatchObject({ ok: false, reason: "out_of_jurisdiction" });
  });

  it("refuses enforcement that names no existing operation", () => {
    const decree = { ...baseRule(), enforcement: { operation: "DECREE" } };
    expect(run({ rule: decree })).toMatchObject({ ok: false, reason: "unknown_enforcement" });
  });

  it("separates undefined failure from a written refusal", () => {
    const omitted = { ...baseRule(), failure: {} };
    expect(run({ rule: omitted })).toMatchObject({ ok: false, reason: "undefined_failure" });

    const written = { ...baseRule(), failure: { on_vacancy: "REFUSE" as const, on_deadlock: "REFUSE" as const } };
    expect(
      run({ rule: written, vacantOffices: ["office.steward"], actingOffices: ["office.warden"], concurring: 1 }),
    ).toMatchObject({ ok: false, reason: "vacancy_refused" });
  });

  it("office precedence still wins over a rule", () => {
    const org = {
      office_precedence: [],
      offices: {
        "office.warden": {
          office_id: "office.warden",
          display_name: "Warden",
          status: "OCCUPIED",
          authority_profile: "OPERATE_NAMED_ASSET",
        },
        "office.rival": {
          office_id: "office.rival",
          display_name: "Rival",
          status: "OCCUPIED",
          authority_profile: "OPERATE_NAMED_ASSET",
        },
      },
    } as never;
    expect(run({ org, actingOffices: ["office.warden"], concurring: 2 })).toMatchObject({
      ok: false,
      reason: "authority_conflict",
    });
  });

  it("grants no reach: an accepted decision only ever returns an existing operation", () => {
    const out = run();
    expect(out.ok && KNOWN.includes(out.operation)).toBe(true);
  });
});

describe("GC4-S8 — appointment uses the SUCCESSION closed set", () => {
  it("accepts the four in-scope mechanisms and rejects VACANT and aliases", () => {
    for (const m of ["DESIGNATED", "RULE_BASED", "CONSENSUS", "INHERITED_BY_ORGANIZATION"]) {
      expect(parseAppointmentMechanism(m)).toBe(m);
    }
    // VACANT is the absence of appointment, not a mechanism
    expect(parseAppointmentMechanism("VACANT")).toBeNull();
    // MEMBER_ORDER is RULE_BASED payload (GC4-S6), not a mechanism
    expect(parseAppointmentMechanism("MEMBER_ORDER")).toBeNull();
  });
});

describe("GC4-S8 — visibility stays member-scoped", () => {
  const offices = [
    { office_id: "office.warden", display_name: "Warden" },
    { office_id: "office.steward", display_name: "Steward" },
  ];

  it("summarises for members without leaking text, votes, or quorum", () => {
    const lines = governanceLines(baseRule(), offices, true);
    expect(lines).toHaveLength(1);
    const blob = lines.join(" ");
    expect(blob).toContain("Warden");
    expect(blob).not.toContain("REPAIR");
    expect(blob).not.toMatch(/quorum|vote|rule\.|entity\.|room\./);
  });

  it("says nothing to non-members or for an unpublished rule", () => {
    expect(governanceLines(baseRule(), offices, false)).toEqual([]);
    expect(governanceLines({ ...baseRule(), published: false }, offices, true)).toEqual([]);
    expect(governanceLines(undefined, offices, true)).toEqual([]);
  });

  it("counts the bounded set", () => {
    expect(jurisdictionSet(baseRule())).toHaveLength(2);
    expect(jurisdictionSet({ ...baseRule(), jurisdiction: {} })).toHaveLength(0);
  });
});

describe("GC4-S8 — agrees with the specs fixtures (conformance oracle)", () => {
  const have = existsSync(FIXTURES);
  it.skipIf(!have)("every specs fixture evaluates to its expected outcome", () => {
    const files = readdirSync(FIXTURES).filter((f) => f.startsWith("attempt-"));
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const f of files) {
      const fx = JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));
      const out = evaluateGovernanceDecision({
        rule: fx.rule,
        org: fx.office_conflict
          ? ({
              office_precedence: [],
              offices: {
                "office.warden": { office_id: "office.warden", display_name: "W", status: "OCCUPIED", authority_profile: "P" },
                "office.rival": { office_id: "office.rival", display_name: "R", status: "OCCUPIED", authority_profile: "P" },
              },
            } as never)
          : undefined,
        actingOffices: fx.acting_offices || [],
        vacantOffices: fx.vacant_offices || [],
        concurring: fx.concurring || 0,
        target: fx.target || {},
        knownOperations: fx.known_operations || [],
      });
      expect(out.ok ? "ACCEPT" : "REJECT", `${f} outcome`).toBe(fx.expected.outcome);
      if (fx.expected.reason) {
        expect(out.ok ? null : out.reason, `${f} reason`).toBe(fx.expected.reason);
      }
    }
  });
});
