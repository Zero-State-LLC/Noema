/**
 * Defect 6: the succession-consent affordance did not match who may consent.
 *
 * RFC-0060 is a consensus vote, not self-consent: any member of an ACTIVE org
 * may consent any member onto a VACANT office, and the player named in
 * `consent <office> <player>` is the CANDIDATE, not the consenting actor. So
 * showing the founder `consent <office> tester` is correct.
 *
 * What was actually wrong: only the first eligible candidate was ever
 * advertised, so with three members the rest were unreachable; the affordance
 * ignored GC1-S5 `requires_track`, so it could advertise available:true for a
 * candidate the reducer rejects; and the label read "Consent <handle>", which
 * reads as naming the consenting actor.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
} from "../src/actions";
import {
  BROKER_TRACK,
  ENGINEER_TRACK,
  applyPracticeCredits,
  emptyPractice,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.consent",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function recognize(track: typeof ENGINEER_TRACK | typeof BROKER_TRACK, n = 3) {
  const units = Array.from({ length: n }, (_, i) => `${track}.${i}`);
  return applyPracticeCredits(
    emptyPractice(),
    units.map((unit) => ({ track_id: track, unit, recognition_unit: unit })),
    0,
  );
}

function world(): WorldRuntime {
  return {
    world_id: "test.consent.affordance",
    world_name: "Consent Reach",
    cycle: 2,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Grid.", exits: [], entities: [] },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    agreements: {},
    contests: {},
    access_restrictions: [],
    seen_idempotency: {},
    unsettled: [],
  };
}

let seq = 0;
async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  seq += 1;
  const envl: CommandEnvelope = {
    request_id: `r.${seq}`,
    idempotency_key: `i.${seq}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

const FOUNDER = principal("player.nacre");
const A = principal("player.tester");
const B = principal("player.vesper");
const OUTSIDER = principal("player.stranger");

async function orgWithVacantOffice(opts: { requiresTrack?: "engineer" } = {}) {
  const w = world();
  for (const p of [FOUNDER, A, B, OUTSIDER]) {
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  await run(w, FOUNDER, "ORG_CREATE", { name: "Compact", charter: "keep" });
  const orgId = Object.keys(w.organizations)[0];
  for (const p of [A, B]) {
    w.players[FOUNDER.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const added = await run(w, FOUNDER, "ORG_MEMBER_ADD", {
      org_id: orgId,
      agent_id: p.player_id,
      role: "member",
    });
    expect(added.ok, JSON.stringify(added.error)).toBe(true);
  }
  w.players[FOUNDER.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const created = await run(w, FOUNDER, "ORG_OFFICE_CREATE", {
    org_id: orgId,
    display_name: "Gate",
    authority_profile: "PUBLISH_NOTICE",
    ...(opts.requiresTrack ? { requires_track: opts.requiresTrack } : {}),
  });
  expect(created.ok, JSON.stringify(created.error)).toBe(true);
  const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
  expect(w.organizations[orgId].offices![officeId].status).toBe("VACANT");
  w.players[FOUNDER.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return { w, orgId, officeId };
}

async function consentAffordances(w: WorldRuntime, p: PlayerPrincipal) {
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const looked = await run(w, p, "LOOK");
  return (looked.observation?.affordances || []).filter(
    (a) => a.operation === "ORG_SUCCESSION_CONSENT",
  );
}

describe("succession consent affordance", () => {
  it("offers every eligible candidate, not only the first", async () => {
    const { w, officeId } = await orgWithVacantOffice();
    const offered = await consentAffordances(w, FOUNDER);
    const candidates = offered.map((a) => a.player_id).sort();
    expect(candidates).toEqual([A.player_id, B.player_id].sort());
    for (const a of offered) {
      expect(a.office_id).toBe(officeId);
      expect(a.available).toBe(true);
    }
  });

  it("labels the candidate as the one being consented to", async () => {
    const { w } = await orgWithVacantOffice();
    const offered = await consentAffordances(w, FOUNDER);
    const forTester = offered.find((a) => a.player_id === A.player_id);
    expect(forTester?.label).toBe("Consent to tester for Gate");
    expect(forTester?.cmd).toMatch(/^consent office\./);
    expect(forTester?.cmd).toContain("tester");
  });

  it("every advertised consent actually executes", async () => {
    const { w } = await orgWithVacantOffice();
    const offered = await consentAffordances(w, FOUNDER);
    expect(offered.length).toBeGreaterThan(0);
    const target = offered[0];
    const done = await run(w, FOUNDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: target.office_id,
      agent_id: target.player_id,
    });
    expect(done.ok, JSON.stringify(done.error)).toBe(true);
  });

  it("a non-member is neither offered consent nor allowed to consent", async () => {
    const { w, officeId } = await orgWithVacantOffice();
    expect(await consentAffordances(w, OUTSIDER)).toEqual([]);
    const denied = await run(w, OUTSIDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");
    expect(denied.error?.message).toBe("Only a member may consent.");
  });

  it("an occupied office is neither advertised nor consentable", async () => {
    const { w, officeId } = await orgWithVacantOffice();
    const assigned = await run(w, FOUNDER, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(assigned.ok, JSON.stringify(assigned.error)).toBe(true);
    expect(await consentAffordances(w, FOUNDER)).toEqual([]);
    const denied = await run(w, FOUNDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: B.player_id,
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.message).toBe("That office is occupied.");
  });

  it("a candidate who fails requires_track is not advertised, and is refused if forced", async () => {
    const { w, officeId } = await orgWithVacantOffice({ requiresTrack: "engineer" });
    // Recognize the LATER member only. An unfiltered build would advertise
    // `tester`, who comes first and cannot hold this office.
    w.players[B.player_id].practice = recognize(ENGINEER_TRACK);
    const offered = await consentAffordances(w, FOUNDER);
    expect(offered.map((a) => a.player_id)).toEqual([B.player_id]);

    const forced = await run(w, FOUNDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(forced.ok).toBe(false);
    expect(forced.error?.code).toBe("FORBIDDEN");
    expect(forced.error?.message).toContain("Engineer");
  });

  it("consensus seats a candidate at ceil(members/2)", async () => {
    const { w, orgId, officeId } = await orgWithVacantOffice();
    const members = w.organizations[orgId].members.length;
    expect(members).toBe(3);
    const first = await run(w, FOUNDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(first.ok).toBe(true);
    expect(w.organizations[orgId].offices![officeId].status).toBe("VACANT");

    w.players[B.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const second = await run(w, B, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(second.ok).toBe(true);
    expect(w.organizations[orgId].offices![officeId].status).toBe("OCCUPIED");
    expect(w.organizations[orgId].offices![officeId].holder_player_id).toBe(A.player_id);
  });

  it("once seated the office stops advertising consent", async () => {
    const { w, officeId } = await orgWithVacantOffice();
    await run(w, FOUNDER, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    w.players[B.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, B, "COMMIT", {
      operation: "ORG_SUCCESSION_CONSENT",
      office_id: officeId,
      agent_id: A.player_id,
    });
    expect(await consentAffordances(w, FOUNDER)).toEqual([]);
  });
});
