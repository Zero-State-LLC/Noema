import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  isRepairable,
  parseHumanCommand,
} from "../src/actions";
import { resolveOfficeConflict } from "../src/offices";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${controller_type}.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Test hub.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 35,
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
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC4-S1 mapper", () => {
  it("does not treat unlabeled-condition infrastructure as repairable", () => {
    expect(
      isRepairable(
        enrichEntity({
          entity_id: "entity.relay",
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
        }),
      ),
    ).toBe(false);
    expect(
      isRepairable(
        enrichEntity({
          entity_id: "entity.relay",
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
          condition: 35,
        }),
      ),
    ).toBe(true);
  });

  it("parses office create/assign/resign without adding help verbs", () => {
    const created = parseHumanCommand('office create org.x name="Treasurer" profile=PUBLISH_NOTICE');
    expect(created.ok).toBe(true);
    if (created.ok && created.action.verb === "COMMIT") {
      expect(created.action.verb).toBe("COMMIT");
      expect(created.action.arguments.operation).toBe("ORG_OFFICE_CREATE");
    }
    const scoped = parseHumanCommand(
      'office create org.x name="Relay" profile=OPERATE_NAMED_ASSET object_set=entity.relay,entity.vault precedence=lead',
    );
    expect(scoped.ok).toBe(true);
    if (scoped.ok && scoped.action.verb === "COMMIT") {
      expect(scoped.action.arguments.object_set).toEqual(["entity.relay", "entity.vault"]);
      expect(scoped.action.arguments.office_precedence).toBe("lead");
    }
    const aliased = parseHumanCommand(
      'office create org.x name="Relay" profile=OPERATE_NAMED_ASSET scope=entity.relay office_precedence=append',
    );
    expect(aliased.ok).toBe(true);
    if (aliased.ok && aliased.action.verb === "COMMIT") {
      expect(aliased.action.arguments.object_set).toEqual(["entity.relay"]);
      expect(aliased.action.arguments.office_precedence).toBe("append");
    }
    const text = helpText();
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).not.toMatch(/\boffice\b/i);
    expect(text).not.toMatch(/\btreasurer\b/i);
    expect(text).not.toMatch(/\bconstruct\b|\battest\b|\bwed\b/i);
    const orgHelp = helpText("org");
    expect(orgHelp).toMatch(/object_set=/);
    expect(orgHelp).toMatch(/precedence=append\|lead/);
  });
});

describe("GC4-S1 world integration", () => {
  it("creates, assigns, acts, resigns, and reassigns the same office", async () => {
    const w = world();
    const a = principal("player.nacre", "human");
    const b = principal("player.vesper", "agent");
    const c = principal("player.oriole", "human");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[b.player_id].handle = "Vesper";
    w.players[c.player_id].handle = "Oriole";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const formed = await run(w, a, "ORG_CREATE", {
      name: "Nacre Compact",
      charter: "local coordination",
    });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: c.player_id, role: "member" });

    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Treasurer",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    expect(created.events?.map((e) => e.event_type)).toContain("ENTITY_CREATE");
    expect(created.events?.some((e) => String(e.event_type).startsWith("ROLE_"))).toBe(false);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");

    const assigned = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: b.player_id,
    });
    expect(assigned.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(b.player_id);

    const acted = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "Ledger open." });
    expect(acted.ok).toBe(true);
    expect(w.organizations[orgId].public_notice).toBe("Ledger open.");

    const look = await run(w, a, "LOOK");
    expect(look.observation?.office_lines?.join(" ")).toMatch(/Treasurer — Vesper/);
    expect(look.observation?.organizations?.[0]?.offices?.[0]?.holder_handle).toBe("Vesper");

    const resigned = await run(w, b, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(resigned.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBeUndefined();

    const former = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "still me" });
    expect(former.ok).toBe(false);
    expect(former.error?.code).toBe("FORBIDDEN");

    const again = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: c.player_id,
    });
    expect(again.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.office_id).toBe(officeId);
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(c.player_id);
    expect(w.organizations[orgId].offices?.[officeId]?.history.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects unauthorized create, double assign, missing player, and retired act", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, a, "ORG_CREATE", { name: "Compact", charter: "work" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });

    const memberCreate = await run(w, b, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Archivist",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(memberCreate.ok).toBe(false);
    expect(memberCreate.error?.code).toBe("FORBIDDEN");

    await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Archivist",
      authority_profile: "PUBLISH_NOTICE",
    });
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: b.player_id });
    const doubled = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: a.player_id,
    });
    expect(doubled.ok).toBe(false);
    expect(doubled.error?.code).toBe("FORBIDDEN");

    const missing = await run(w, a, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: "player.ghost",
      replace: true,
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");

    await run(w, a, "ORG_OFFICE_RETIRE", { office_id: officeId });
    const retiredAct = await run(w, b, "ORG_OFFICE_ACT", { org_id: orgId, notice: "no" });
    expect(retiredAct.ok).toBe(false);
    expect(retiredAct.error?.code).toBe("FORBIDDEN");
  });

  it("vacates offices when the holder leaves and does not charge extra TREASURER power", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, a, "ORG_CREATE", { name: "Compact", charter: "work" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, a, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: b.player_id, role: "member" });
    await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Envoy",
      authority_profile: "PUBLISH_NOTICE",
    });
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: b.player_id });
    const computeBefore = w.players[b.player_id].budgets.compute;
    const left = await run(w, b, "ORG_MEMBER_REMOVE", {
      org_id: orgId,
      agent_id: b.player_id,
      reason: "SELF_LEAVE",
    });
    expect(left.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(w.players[b.player_id].budgets.compute).toBe(computeBefore - COSTS.ORG_MEMBER_REMOVE.compute!);
    expect(left.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
  });
});

describe("office conflict-precedence", () => {
  function seat(id: string, extra: Record<string, unknown> = {}) {
    return {
      office_id: id,
      institution_id: "org.line",
      display_name: id,
      status: "OCCUPIED" as const,
      holder_player_id: `player.${id}`,
      authority_profile: "OPERATE_NAMED_ASSET" as const,
      created_cycle: 0,
      history: [],
      ...extra,
    };
  }

  it("fails closed when two offices overlap with no published rule", () => {
    const r = resolveOfficeConflict(
      { offices: { a: seat("a"), b: seat("b") } },
      "a",
      "entity.relay",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("AUTHORITY_CONFLICT");
  });

  it("follows published office_precedence and does not let founder identity win", () => {
    const org = {
      office_precedence: ["b", "a"],
      offices: { a: seat("a"), b: seat("b") },
    };
    expect(resolveOfficeConflict(org, "b", "entity.relay").ok).toBe(true);
    const later = resolveOfficeConflict(org, "a", "entity.relay");
    expect(later.ok).toBe(false);
    if (!later.ok) expect(later.code).toBe("AUTHORITY_CONFLICT");
  });

  it("lets the strict-subset object_set act and forbids the broader grant", () => {
    const org = {
      offices: {
        a: seat("a", { object_set: ["entity.relay"] }),
        b: seat("b", { object_set: ["entity.relay", "entity.vault"] }),
      },
    };
    expect(resolveOfficeConflict(org, "a", "entity.relay").ok).toBe(true);
    const broad = resolveOfficeConflict(org, "b", "entity.relay");
    expect(broad.ok).toBe(false);
    if (!broad.ok) expect(broad.code).toBe("AUTHORITY_CONFLICT");
  });

  it("blocks institution REPAIR when two custodians overlap with no rule", async () => {
    const w = world();
    w.world_id = "test.hosted-canonical.office-prec";
    const founder = principal("player.nacre");
    const a = principal("player.alpha");
    const b = principal("player.beta");
    await run(w, founder, "ENTER_WORLD");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_CREATE", { name: "Line", charter: "grid", org_id: "org.line" });
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: "org.line", agent_id: a.player_id, role: "member" });
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: "org.line", agent_id: b.player_id, role: "member" });
    await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: "org.line",
      display_name: "Custodian A",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: "org.line",
      display_name: "Custodian B",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    const ids = Object.keys(w.organizations["org.line"].offices || {});
    expect(ids.length).toBe(2);
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: ids[0], agent_id: a.player_id });
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: ids[1], agent_id: b.player_id });
    w.organizations["org.line"].treasury = {
      attention: 0,
      compute: 20,
      energy: 20,
      influence: 0,
      storage: 10,
    };
    const blocked = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
      office_id: ids[0],
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("AUTHORITY_CONFLICT");

    w.organizations["org.line"].office_precedence = [ids[0], ids[1]];
    const allowed = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
      office_id: ids[0],
    });
    expect(allowed.ok).toBe(true);
  });

  it("ORG_OFFICE_CREATE publishes object_set and appends office_precedence", async () => {
    const w = world();
    w.world_id = "test.hosted-canonical.office-pub";
    const founder = principal("player.nacre");
    const a = principal("player.alpha");
    const b = principal("player.beta");
    await run(w, founder, "ENTER_WORLD");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_CREATE", { name: "Line", charter: "grid", org_id: "org.pub" });
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: "org.pub", agent_id: a.player_id, role: "member" });
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: "org.pub", agent_id: b.player_id, role: "member" });
    await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: "org.pub",
      display_name: "Narrow",
      authority_profile: "OPERATE_NAMED_ASSET",
      object_set: ["entity.relay"],
      office_precedence: "lead",
    });
    await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: "org.pub",
      display_name: "Broad",
      authority_profile: "OPERATE_NAMED_ASSET",
      object_set: ["entity.relay", "entity.vault"],
      office_precedence: "append",
    });
    const offices = Object.values(w.organizations["org.pub"].offices || {});
    const narrow = offices.find((o) => o.display_name === "Narrow")!;
    const broad = offices.find((o) => o.display_name === "Broad")!;
    expect(narrow.object_set).toEqual(["entity.relay"]);
    expect(w.organizations["org.pub"].office_precedence).toEqual([narrow.office_id, broad.office_id]);
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: narrow.office_id, agent_id: a.player_id });
    await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: broad.office_id, agent_id: b.player_id });
    w.organizations["org.pub"].treasury = {
      attention: 0,
      compute: 20,
      energy: 20,
      influence: 0,
      storage: 10,
    };
    const ok = await run(w, a, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.pub",
      office_id: narrow.office_id,
    });
    expect(ok.ok).toBe(true);
    const denied = await run(w, b, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.pub",
      office_id: broad.office_id,
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("AUTHORITY_CONFLICT");
  });

  it("human office create line publishes the same object_set and precedence as structured create", async () => {
    const w = world();
    w.world_id = "test.hosted-canonical.office-play-copy";
    const founder = principal("player.nacre");
    await run(w, founder, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, founder, "ORG_CREATE", { name: "Line", charter: "grid", org_id: "org.play" });
    const parsed = parseHumanCommand(
      'office create org.play name="Narrow" profile=OPERATE_NAMED_ASSET object_set=entity.relay precedence=lead',
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.action.verb !== "COMMIT") throw new Error("expected COMMIT");
    const applied = await run(w, founder, "COMMIT", parsed.action.arguments as Record<string, unknown>);
    expect(applied.ok).toBe(true);
    const office = Object.values(w.organizations["org.play"].offices || {}).find(
      (o) => o.display_name === "Narrow",
    );
    expect(office?.object_set).toEqual(["entity.relay"]);
    expect(w.organizations["org.play"].office_precedence).toEqual([office?.office_id]);
  });
});
