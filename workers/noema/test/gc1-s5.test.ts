import { describe, expect, it } from "vitest";
import {
  BROKER_TRACK,
  ENGINEER_TRACK,
  LATENT_AFTER_CYCLES,
  applyPracticeCredits,
  emptyPractice,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc1-s5",
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

describe("GC1-S5 mapper", () => {
  it("parses requires=engineer and keeps titles off help", () => {
    const parsed = parseHumanCommand(
      'office create org.x name="Works" profile=OPERATE_NAMED_ASSET requires=engineer',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.requires_track).toBe("engineer");
    }
    const bad = parseHumanCommand(
      'office create org.x name="Scout" profile=PUBLISH_NOTICE requires=explorer',
    );
    expect(bad.ok).toBe(false);
    expect(helpText()).not.toMatch(/\brequires=/);
    expect(helpText("org")).not.toMatch(/\brequires=/);
    expect(helpText()).not.toMatch(/\bEngineer\b|\bBroker\b/);
    expect(helpText("org")).not.toMatch(/\bEngineer\b|\bBroker\b/);
  });
});

describe("GC1-S5 world path", () => {
  it("lets recognized Engineer/Broker sit matching offices and rejects others", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const engineer = principal("player.forge");
    const broker = principal("player.ledger");
    const none = principal("player.hand");
    await run(w, founder, "ENTER_WORLD");
    await run(w, engineer, "ENTER_WORLD");
    await run(w, broker, "ENTER_WORLD");
    await run(w, none, "ENTER_WORLD");
    for (const p of [founder, engineer, broker, none]) {
      w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    }
    w.players[engineer.player_id].practice = recognize(ENGINEER_TRACK);
    w.players[broker.player_id].practice = recognize(BROKER_TRACK);

    const formed = await run(w, founder, "ORG_CREATE", { name: "Works", charter: "keep the grid" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    for (const p of [engineer, broker, none]) {
      await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: p.player_id, role: "member" });
      w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    }

    const works = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Works",
      authority_profile: "OPERATE_NAMED_ASSET",
      requires_track: "engineer",
    });
    expect(works.ok).toBe(true);
    const desk = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Factor",
      authority_profile: "OPERATE_RESOURCE_ACCOUNT",
      requires_track: "broker",
    });
    expect(desk.ok).toBe(true);
    const open = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Notice",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(open.ok).toBe(true);
    const offices = w.organizations[orgId].offices || {};
    const worksId = Object.values(offices).find((o) => o.display_name === "Works")!.office_id;
    const deskId = Object.values(offices).find((o) => o.display_name === "Factor")!.office_id;
    const openId = Object.values(offices).find((o) => o.display_name === "Notice")!.office_id;
    expect(offices[worksId].requires_track).toBe("engineer");

    const denied = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: worksId,
      agent_id: none.player_id,
    });
    expect(denied.ok).toBe(false);
    expect(denied.error?.code).toBe("FORBIDDEN");
    expect(denied.error?.message).toMatch(/recognized Engineer/);
    expect(w.organizations[orgId].offices?.[worksId]?.status).toBe("VACANT");

    const wrong = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: worksId,
      agent_id: broker.player_id,
    });
    expect(wrong.ok).toBe(false);
    expect(wrong.error?.code).toBe("FORBIDDEN");

    const seated = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: worksId,
      agent_id: engineer.player_id,
    });
    expect(seated.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[worksId]?.holder_player_id).toBe(engineer.player_id);

    const factor = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: deskId,
      agent_id: broker.player_id,
    });
    expect(factor.ok).toBe(true);

    const notice = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: openId,
      agent_id: none.player_id,
    });
    expect(notice.ok).toBe(true);

    const look = await run(w, founder, "LOOK");
    const lines = look.observation?.office_lines?.join(" ") || "";
    expect(lines).toMatch(/Works/);
    expect(lines).not.toMatch(/Engineer|Broker|requires/);
    expect(JSON.stringify(look.observation || {})).not.toMatch(/ROLE_/);
  });

  it("lets a LATENT recognized Engineer sit and skips ineligible succession", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const rusted = principal("player.forge");
    const ready = principal("player.anvil");
    const green = principal("player.hand");
    await run(w, founder, "ENTER_WORLD");
    await run(w, rusted, "ENTER_WORLD");
    await run(w, ready, "ENTER_WORLD");
    await run(w, green, "ENTER_WORLD");
    for (const p of [founder, rusted, ready, green]) {
      w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    }
    w.players[rusted.player_id].practice = recognize(ENGINEER_TRACK);
    w.cycle = LATENT_AFTER_CYCLES + 1;
    w.players[ready.player_id].practice = recognize(ENGINEER_TRACK);

    await run(w, founder, "ORG_CREATE", { name: "Works", charter: "keep" });
    const orgId = Object.keys(w.organizations)[0];
    for (const p of [rusted, ready, green]) {
      await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: p.player_id, role: "member" });
      w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    }
    await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Works",
      authority_profile: "OPERATE_NAMED_ASSET",
      requires_track: "engineer",
    });
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];

    const latentSit = await run(w, founder, "ORG_OFFICE_ASSIGN", {
      office_id: officeId,
      agent_id: rusted.player_id,
    });
    expect(latentSit.ok).toBe(true);

    const blockedDesignate = await run(w, founder, "ORG_SUCCESSION_DESIGNATE", {
      office_id: officeId,
      successors: [green.player_id],
    });
    expect(blockedDesignate.ok).toBe(false);
    expect(blockedDesignate.error?.code).toBe("FORBIDDEN");

    const designated = await run(w, founder, "ORG_SUCCESSION_DESIGNATE", {
      office_id: officeId,
      successors: [green.player_id, ready.player_id],
    });
    expect(designated.ok).toBe(false);

    const okDesignate = await run(w, founder, "ORG_SUCCESSION_DESIGNATE", {
      office_id: officeId,
      successors: [ready.player_id],
    });
    expect(okDesignate.ok).toBe(true);
    w.players[rusted.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const vacated = await run(w, rusted, "ORG_OFFICE_VACATE", { office_id: officeId });
    expect(vacated.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[officeId]?.holder_player_id).toBe(ready.player_id);
  });
});
