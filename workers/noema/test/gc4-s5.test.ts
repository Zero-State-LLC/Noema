import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
import { WATCH_SUCCESSION_PULSE, consensusThreshold } from "../src/succession";
import { projectionIdForEvent } from "../src/watch-live";
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
    world_id: "test.hosted-canonical.gc4-s5",
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
        entities: [],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC4-S5 mapper", () => {
  it("parses consent and keeps help quiet", () => {
    const parsed = parseHumanCommand("consent office.x player.sable");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("ORG_SUCCESSION_CONSENT");
    }
    expect(consensusThreshold(3)).toBe(2);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "CONSENT" })).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "CONSENSUS" })).toBeNull();
    expect(helpText()).not.toMatch(/\bconsent\b/i);
    expect(helpText("org")).not.toMatch(/\bconsent\b/i);
  });
});

describe("GC4-S5 world path", () => {
  it("seats a vacant office at ceil-half consents and rejects occupied or outsiders", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const sable = principal("player.sable");
    const vesper = principal("player.vesper");
    const outsider = principal("player.hand");
    await run(w, founder, "ENTER_WORLD");
    await run(w, sable, "ENTER_WORLD");
    await run(w, vesper, "ENTER_WORLD");
    await run(w, outsider, "ENTER_WORLD");
    for (const p of [founder, sable, vesper, outsider]) {
      w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    }
    await run(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep", org_id: "org.line" });
    const orgId = Object.keys(w.organizations)[0];
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: sable.player_id, role: "member" });
    await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: vesper.player_id, role: "member" });
    w.organizations[orgId].treasury = { ...emptyTreasury(), compute: 8 };
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const created = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Notice",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];

    const first = await run(w, sable, "ORG_SUCCESSION_CONSENT", {
      office_id: officeId,
      agent_id: vesper.player_id,
    });
    expect(first.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("VACANT");
    expect(first.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);
    expect(w.institution_pulses || []).not.toContain(WATCH_SUCCESSION_PULSE);

    const second = await run(w, founder, "ORG_SUCCESSION_CONSENT", {
      office_id: officeId,
      agent_id: vesper.player_id,
    });
    expect(second.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.status).toBe("OCCUPIED");
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(vesper.player_id);
    expect(w.institution_pulses).toContain(WATCH_SUCCESSION_PULSE);
    expect(second.events?.some((e) => String(e.event_type).startsWith("SUCCESSION_"))).toBe(false);

    const occupied = await run(w, sable, "ORG_SUCCESSION_CONSENT", {
      office_id: officeId,
      agent_id: sable.player_id,
    });
    expect(occupied.ok).toBe(false);
    expect(occupied.error?.code).toBe("FORBIDDEN");

    const created2 = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Second",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created2.ok).toBe(true);
    const vacantId = Object.keys(w.organizations[orgId].offices || {}).find((id) => id !== officeId)!;
    const stranger = await run(w, outsider, "ORG_SUCCESSION_CONSENT", {
      office_id: vacantId,
      agent_id: vesper.player_id,
    });
    expect(stranger.ok).toBe(false);
    expect(stranger.error?.code).toBe("FORBIDDEN");
  });
});
