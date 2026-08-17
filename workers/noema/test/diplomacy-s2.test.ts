import { describe, expect, it } from "vitest";
import { helpText, parseHumanCommand, cloneBudgets, DEFAULT_BUDGETS } from "../src/actions";
import {
  DEFAULT_DEFENSE_MILLIPOINTS,
  DIPLOMACY_CATALOG_ID,
  defenseSupportFor,
  parseAgreementType,
} from "../src/diplomacy";
import { scoreContest } from "../src/contest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

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
    world_id: "test.hosted-canonical.diplomacy-s2",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.civic" }],
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "Relay 7",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          },
        ],
      },
      "room.civic": {
        room_id: "room.civic",
        name: "Civic",
        description: "Trade.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function enterPair(w: WorldRuntime, a: PlayerPrincipal, b: PlayerPrincipal) {
  await run(w, a, "ENTER_WORLD");
  await run(w, b, "ENTER_WORLD");
  w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

async function formType(w: WorldRuntime, a: PlayerPrincipal, b: PlayerPrincipal, typ: string) {
  expect((await run(w, a, "AGREEMENT_FORM", { agreement_type: typ, party_ids: [b.player_id] })).ok).toBe(true);
  expect((await run(w, b, "AGREEMENT_FORM", { agreement_type: typ, party_ids: [a.player_id] })).ok).toBe(true);
}

describe("Diplomacy S2 mapper", () => {
  it("hosts five types and names AGREEMENT on help", () => {
    expect(DIPLOMACY_CATALOG_ID).toBe("diplomacy-catalog/s2");
    expect(parseAgreementType("non-aggression")).toBe("NON_AGGRESSION");
    expect(parseAgreementType("commitment")).toBe("RESOURCE_COMMITMENT");
    expect(parseAgreementType("defense")).toBe("MUTUAL_DEFENSE");
    expect(helpText()).toMatch(/\bAGREEMENT\b/);
    expect(helpText("agreement")).toMatch(/form agreement/);
    expect(helpText("agreement")).toMatch(/terminate/);
    expect(helpText("agreement")).toMatch(/non_aggression/);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    const parsed = parseHumanCommand("form agreement defense with player.vesper");
    expect(parsed.ok).toBe(true);
  });
});

describe("Diplomacy S2 live effects", () => {
  it("breaks NON_AGGRESSION when a party declares a forbidden contest", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await enterPair(w, a, b);
    await formType(w, a, b, "NON_AGGRESSION");
    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(declared.ok).toBe(true);
    expect((declared.events || []).some((e) => e.event_type === "CONTEST_DECLARED")).toBe(true);
    const broken = declared.events?.find((e) => e.event_type === "AGREEMENT_BROKEN");
    expect(broken?.payload?.breach_type).toBe("CONTEST_VIOLATION");
    expect(Object.values(w.agreements || {})[0].status).toBe("BROKEN");
  });

  it("lets an ACCESS party pass a matching restriction", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.other");
    await enterPair(w, a, b);
    await run(w, c, "ENTER_WORLD");
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await formType(w, a, b, "ACCESS");
    w.access_restrictions = [
      {
        restriction_id: "restr.east",
        scope: "EXIT",
        mode: "DENY",
        applies_to: "*",
        room_id: "room.hub",
        exit_id: "east",
        expires_cycle: 99,
      },
    ];
    expect((await run(w, a, "MOVE", { direction: "east" })).ok).toBe(true);
    expect((await run(w, c, "MOVE", { direction: "east" })).ok).toBe(false);
  });

  it("breaks RESOURCE_COMMITMENT after the deadline", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.agreements = {
      "agreement.due": {
        agreement_id: "agreement.due",
        agreement_type: "RESOURCE_COMMITMENT",
        party_ids: ["player.nacre", "player.vesper"],
        status: "ACTIVE",
        offered_by: "player.nacre",
        cost_payer_id: "player.nacre",
        visibility: "PUBLIC",
        terms: {
          machine: {
            resource_commitments: [
              { from_id: "player.nacre", to_id: "player.vesper", resource: "energy", amount: 1, by_cycle: 0 },
            ],
          },
        },
      },
    };
    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.agreements["agreement.due"].status).toBe("BROKEN");
    expect((waited.events || []).some((e) => e.event_type === "AGREEMENT_BROKEN")).toBe(true);
  });

  it("adds MUTUAL_DEFENSE millipoints to defender score", () => {
    const agreements = {
      "agreement.def": {
        agreement_id: "agreement.def",
        agreement_type: "MUTUAL_DEFENSE" as const,
        party_ids: ["player.nacre", "player.vesper"],
        status: "ACTIVE" as const,
        offered_by: "player.vesper",
        cost_payer_id: "player.vesper",
        visibility: "PUBLIC" as const,
        terms: { machine: { defense_support_millipoints: DEFAULT_DEFENSE_MILLIPOINTS } },
      },
    };
    expect(defenseSupportFor(agreements, "player.nacre")).toBe(50);
    const bare = scoreContest({
      form: "INFRASTRUCTURE_DISRUPTION",
      declarer_stake: { energy: 12, influence: 8 },
      defender_stake: { energy: 10, influence: 6 },
      infra_condition: 70,
      seed_perturbation: 0,
    });
    const backed = scoreContest({
      form: "INFRASTRUCTURE_DISRUPTION",
      declarer_stake: { energy: 12, influence: 8 },
      defender_stake: { energy: 10, influence: 6 },
      infra_condition: 70,
      org_defense_support_millipoints: defenseSupportFor(agreements, "player.nacre"),
      seed_perturbation: 0,
    });
    expect(backed.score).toBe(bare.score - 50);
  });
});
