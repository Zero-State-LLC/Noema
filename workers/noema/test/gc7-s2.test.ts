import { describe, expect, it } from "vitest";
import { contestOfficeProfile } from "../src/contest";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  normalizeStructuredCommand,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC7-S2 isolated institution contest party (acting_for + treasury).
 * Authority: Noema-Specs docs/GC7-S2-INSTITUTION-PARTY.md / RFC-0041.
 * Isolated world id only. Chamber help names CONTEST; WED/ATTEST stay omitted.
 */

const STAKE = { energy: 12, influence: 8, compute: 4 };
const DECLARE_TOTAL = { energy: 12, influence: 9, compute: 6 };

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc7-s2",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function fundTreasury(w: WorldRuntime, orgId = "org.line") {
  const treasury = w.organizations[orgId].treasury || emptyTreasury();
  treasury.energy = 40;
  treasury.influence = 30;
  treasury.compute = 20;
  treasury.storage = 10;
  treasury.attention = 8;
  w.organizations[orgId].treasury = treasury;
}

async function createOrg(w: WorldRuntime, founder: PlayerPrincipal, orgId = "org.line") {
  await run(w, founder, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const created = await run(w, founder, "COMMIT", {
    operation: "ORG_CREATE",
    name: "Line",
    charter: "Keep the grid.",
    org_id: orgId,
  });
  expect(created.ok).toBe(true);
}

async function addMember(w: WorldRuntime, founder: PlayerPrincipal, member: PlayerPrincipal, orgId = "org.line") {
  await run(w, member, "ENTER_WORLD");
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const added = await run(w, founder, "COMMIT", {
    operation: "ORG_MEMBER_ADD",
    org_id: orgId,
    agent_id: member.player_id,
    role: "member",
  });
  expect(added.ok).toBe(true);
}

async function createOffice(
  w: WorldRuntime,
  founder: PlayerPrincipal,
  profile: "OPERATE_RESOURCE_ACCOUNT" | "OPERATE_NAMED_ASSET",
  displayName: string,
  orgId = "org.line",
) {
  const created = await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_CREATE",
    org_id: orgId,
    display_name: displayName,
    authority_profile: profile,
  });
  expect(created.ok).toBe(true);
  const office = Object.values(w.organizations[orgId].offices || {}).find((o) => o.display_name === displayName);
  expect(office).toBeTruthy();
  return office!.office_id;
}

async function assignOffice(
  w: WorldRuntime,
  founder: PlayerPrincipal,
  officeId: string,
  holder: PlayerPrincipal,
  orgId = "org.line",
) {
  const assigned = await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_ASSIGN",
    org_id: orgId,
    office_id: officeId,
    agent_id: holder.player_id,
  });
  expect(assigned.ok).toBe(true);
}

describe("GC7-S2 mapper", () => {
  it("maps forms to office profiles and parses contest/defend for org", () => {
    expect(contestOfficeProfile("RESOURCE_SEIZURE")).toBe("OPERATE_RESOURCE_ACCOUNT");
    expect(contestOfficeProfile("INFRASTRUCTURE_DISRUPTION")).toBe("OPERATE_NAMED_ASSET");
    expect(contestOfficeProfile("ACCESS_CONTEST")).toBe("OPERATE_NAMED_ASSET");
    expect(contestOfficeProfile("PRESENCE_PRESSURE")).toBe("OPERATE_NAMED_ASSET");

    const declared = parseHumanCommand(
      "contest for org.line infrastructure_disruption scarred-conduit stake=energy:12,influence:8,compute:4",
    );
    expect(declared.ok).toBe(true);
    if (declared.ok && declared.action.verb === "COMMIT") {
      expect(declared.action.arguments.operation).toBe("CONTEST_DECLARE");
      expect(declared.action.arguments.acting_for).toBe("org.line");
      expect(declared.action.arguments.contest_form).toBe("INFRASTRUCTURE_DISRUPTION");
    }

    const defended = parseHumanCommand("defend contest.0001 for org.line stake=energy:12,influence:8,compute:4");
    expect(defended.ok).toBe(true);
    if (defended.ok && defended.action.verb === "COMMIT") {
      expect(defended.action.arguments.operation).toBe("CONTEST_DEFEND");
      expect(defended.action.arguments.acting_for).toBe("org.line");
      expect(defended.action.arguments.contest_id).toBe("contest.0001");
    }

    const structured = normalizeStructuredCommand("CONTEST_DEFEND", {
      contest_id: "contest.0001",
      stake: STAKE,
      acting_for: "org.line",
      office_id: "office.line.custodian.1",
    });
    expect(structured.ok).toBe(true);
    if (structured.ok && structured.action.verb === "COMMIT") {
      expect(structured.action.arguments.acting_for).toBe("org.line");
      expect(structured.action.arguments.office_id).toBe("office.line.custodian.1");
    }
  });

  it("names CONTEST on Chamber help and keeps it off org help", () => {
    expect(helpText()).toMatch(/\bCONTEST\b/);
    expect(helpText("org")).not.toMatch(/\bcontest\b/i);
  });
});

describe("GC7-S2 institution contest party", () => {
  it("occupied OPERATE_NAMED_ASSET declares INFRASTRUCTURE_DISRUPTION from the treasury", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const custodian = principal("player.vesper");
    await createOrg(w, founder);
    await addMember(w, founder, custodian);
    const officeId = await createOffice(w, founder, "OPERATE_NAMED_ASSET", "Custodian");
    await assignOffice(w, founder, officeId, custodian);
    fundTreasury(w);
    const playerEnergy = w.players[custodian.player_id].budgets.energy;
    const playerInfluence = w.players[custodian.player_id].budgets.influence;
    const playerCompute = w.players[custodian.player_id].budgets.compute;
    const treasury = w.organizations["org.line"].treasury!;
    const before = { energy: treasury.energy, influence: treasury.influence, compute: treasury.compute };

    const declared = await run(w, custodian, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(declared.ok).toBe(true);
    const contest = Object.values(w.contests || {})[0];
    expect(contest.acting_for).toBe("org.line");
    expect(contest.declarer_id).toBe(custodian.player_id);
    expect(contest.declarer_id).not.toMatch(/^org\./);
    expect(w.organizations["org.line"].treasury!.energy).toBe(before.energy - DECLARE_TOTAL.energy);
    expect(w.organizations["org.line"].treasury!.influence).toBe(before.influence - DECLARE_TOTAL.influence);
    expect(w.organizations["org.line"].treasury!.compute).toBe(before.compute - DECLARE_TOTAL.compute);
    expect(w.players[custodian.player_id].budgets.energy).toBe(playerEnergy);
    expect(w.players[custodian.player_id].budgets.influence).toBe(playerInfluence);
    expect(w.players[custodian.player_id].budgets.compute).toBe(playerCompute);
    const declaredEv = declared.events?.find((e) => e.event_type === "CONTEST_DECLARED");
    expect(declaredEv?.payload?.acting_for).toBe("org.line");
    expect(declaredEv?.payload?.declarer_id).toBe(custodian.player_id);
  });

  it("rejects vacant office and wrong profile", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const treas = principal("player.vesper");
    await createOrg(w, founder);
    await addMember(w, founder, treas);
    await createOffice(w, founder, "OPERATE_NAMED_ASSET", "Custodian");
    const treasOffice = await createOffice(w, founder, "OPERATE_RESOURCE_ACCOUNT", "Treasurer");
    await assignOffice(w, founder, treasOffice, treas);
    fundTreasury(w);

    const vacant = await run(w, founder, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(vacant.ok).toBe(false);
    expect(vacant.error?.code).toBe("FORBIDDEN");

    const wrong = await run(w, treas, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(wrong.ok).toBe(false);
    expect(wrong.error?.code).toBe("FORBIDDEN");
    expect(w.organizations["org.line"].treasury!.energy).toBe(40);
    expect(Object.keys(w.contests || {})).toHaveLength(0);
  });

  it("rejects same-org declare and defend; personal defend against the org is allowed", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const custodian = principal("player.vesper");
    const treas = principal("player.oriel");
    await createOrg(w, founder);
    await addMember(w, founder, custodian);
    await addMember(w, founder, treas);
    const assetOffice = await createOffice(w, founder, "OPERATE_NAMED_ASSET", "Custodian");
    const treasOffice = await createOffice(w, founder, "OPERATE_RESOURCE_ACCOUNT", "Treasurer");
    await assignOffice(w, founder, assetOffice, custodian);
    await assignOffice(w, founder, treasOffice, treas);
    fundTreasury(w);

    const declared = await run(w, custodian, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];

    const sameOrg = await run(w, treas, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(sameOrg.ok).toBe(false);
    expect(sameOrg.error?.code).toBe("FORBIDDEN");
    expect(w.contests?.[contestId]?.defender_id).toBeUndefined();

    const personal = await run(w, treas, "CONTEST_DEFEND", {
      contest_id: contestId,
      stake: STAKE,
    });
    expect(personal.ok).toBe(true);
    expect(w.contests?.[contestId]?.defender_id).toBe(treas.player_id);
    expect(w.contests?.[contestId]?.defender_acting_for).toBeUndefined();
  });
});
