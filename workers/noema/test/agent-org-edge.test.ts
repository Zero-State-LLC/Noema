import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.org-edge-look",
    world_name: "Test Reach",
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
            condition: 10,
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
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
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function formCompact(w: WorldRuntime, founder: PlayerPrincipal, member?: PlayerPrincipal) {
  await run(w, founder, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, founder, "ORG_CREATE", { name: "Compact", charter: "work" })).ok).toBe(true);
  const orgId = Object.keys(w.organizations)[0];
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(
    (
      await run(w, founder, "ORG_OFFICE_CREATE", {
        org_id: orgId,
        display_name: "Works",
        authority_profile: "OPERATE_NAMED_ASSET",
      })
    ).ok,
  ).toBe(true);
  if (member) {
    await run(w, member, "ENTER_WORLD");
    w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect(
      (await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: member.player_id, role: "member" })).ok,
    ).toBe(true);
  }
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return orgId;
}

describe("agent institutional-edge affordances", () => {
  it("LOOK lists RETIRE for an officer; member does not see it; structured COMMIT retires", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    const orgId = await formCompact(w, a, b);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];

    const lookA = await run(w, a, "LOOK");
    const retire = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "ORG_OFFICE_RETIRE" && x.office_id === officeId,
    );
    expect(retire?.verb).toBe("COMMIT");
    expect(lookA.observation?.available_actions).toContain("ORG_OFFICE_RETIRE");
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "ORG_OFFICE_RETIRE")).toBe(false);

    const retired = await run(w, a, "ORG_OFFICE_RETIRE", { office_id: retire?.office_id });
    expect(retired.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("RETIRED");
    const after = await run(w, a, "LOOK");
    expect((after.observation?.affordances || []).some((x) => x.operation === "ORG_OFFICE_RETIRE")).toBe(false);
  });

  it("LOOK lists SUCCESSION_RULE and DESIGNATE; structured COMMIT publishes the rule", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    const orgId = await formCompact(w, a, b);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    const look = await run(w, a, "LOOK");
    const rule = (look.observation?.affordances || []).find(
      (x) => x.operation === "ORG_SUCCESSION_RULE" && x.office_id === officeId,
    );
    expect(rule?.rule_id).toBe("MEMBER_ORDER");
    const designate = (look.observation?.affordances || []).find(
      (x) => x.operation === "ORG_SUCCESSION_DESIGNATE" && x.office_id === officeId,
    );
    expect(designate?.successors).toEqual([b.player_id]);
    const published = await run(w, a, "ORG_SUCCESSION_RULE", {
      office_id: rule?.office_id,
      rule_id: rule?.rule_id,
    });
    expect(published.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.succession?.rule_id).toBe("MEMBER_ORDER");
  });

  it("LOOK lists emergency ACTIVATE on damaged infra, then REVOKE after it is live", async () => {
    const w = world();
    const a = agent("nacre");
    const orgId = await formCompact(w, a);
    w.rooms["room.hub"].entities[0].owner_id = a.player_id;
    const look = await run(w, a, "LOOK");
    const activate = (look.observation?.affordances || []).find(
      (x) =>
        x.operation === "ORG_EMERGENCY_ACTIVATE" &&
        x.template_id === "emrule.repair" &&
        x.target_ref === "entity.relay-7",
    );
    expect(activate?.org_id).toBe(orgId);
    expect(look.observation?.available_actions).toContain("ORG_EMERGENCY_ACTIVATE");
    const started = await run(w, a, "ORG_EMERGENCY_ACTIVATE", {
      org_id: activate?.org_id,
      template_id: activate?.template_id,
      target_ref: activate?.target_ref,
      office_id: activate?.office_id,
    });
    expect(started.ok).toBe(true);
    const scopeId = w.organizations[orgId].emergency_scopes?.[0]?.scope_id;
    expect(scopeId).toBeTruthy();
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const after = await run(w, a, "LOOK");
    const revoke = (after.observation?.affordances || []).find(
      (x) => x.operation === "ORG_EMERGENCY_REVOKE" && x.emergency_scope_id === scopeId,
    );
    expect(revoke).toBeTruthy();
    const closed = await run(w, a, "ORG_EMERGENCY_REVOKE", {
      emergency_scope_id: revoke?.emergency_scope_id,
    });
    expect(closed.ok).toBe(true);
    expect(w.organizations[orgId].emergency_scopes?.[0]?.status).toBe("REVOKED");
  });
});
