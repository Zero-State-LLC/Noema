import { describe, expect, it } from "vitest";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
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
            condition: 40,
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

async function setupOrg(
  w: WorldRuntime,
  founder: PlayerPrincipal,
  member: PlayerPrincipal,
  profile: "OPERATE_RESOURCE_ACCOUNT" | "OPERATE_NAMED_ASSET",
) {
  await run(w, founder, "ENTER_WORLD");
  await run(w, member, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await run(w, founder, "COMMIT", {
    operation: "ORG_CREATE",
    name: "Line",
    charter: "Keep the grid.",
    org_id: "org.line",
  });
  await run(w, founder, "COMMIT", {
    operation: "ORG_MEMBER_ADD",
    org_id: "org.line",
    agent_id: member.player_id,
    role: "member",
  });
  await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_CREATE",
    org_id: "org.line",
    display_name: profile === "OPERATE_RESOURCE_ACCOUNT" ? "Treasurer" : "Custodian",
    authority_profile: profile,
  });
  const officeId = Object.keys(w.organizations["org.line"].offices || {})[0];
  await run(w, founder, "COMMIT", {
    operation: "ORG_OFFICE_ASSIGN",
    org_id: "org.line",
    office_id: officeId,
    agent_id: member.player_id,
  });
  const treasury = w.organizations["org.line"].treasury || emptyTreasury();
  treasury.energy = 20;
  treasury.compute = 20;
  treasury.storage = 10;
  w.organizations["org.line"].treasury = treasury;
  w.players[member.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return officeId;
}

describe("GC4-S2 institution TRADE/REPAIR", () => {
  it("parses acting-for aliases and keeps them off KNOWN COMMANDS", () => {
    const trade = parseHumanCommand("trade for org.line player.vesper offer=energy:3 want=storage:1");
    expect(trade.ok).toBe(true);
    if (trade.ok && trade.action.verb === "TRADE") {
      expect(trade.action.verb).toBe("TRADE");
      expect(trade.action.arguments.acting_for).toBe("org.line");
    }
    const known = helpText();
    expect(known).not.toMatch(/INSTITUTION_TRADE|TREASURER_POWER|BUILD|CONTEST|\bWED\b|ATTEST/);
    const orgHelp = helpText("org");
    expect(orgHelp).toMatch(/trade for <org>/);
  });

  it("authorized treasurer proposes and counterparty accepts from treasury", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const treas = principal("player.vesper");
    const buyer = principal("player.oriel");
    await setupOrg(w, founder, treas, "OPERATE_RESOURCE_ACCOUNT");
    await run(w, buyer, "ENTER_WORLD");
    w.players[buyer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const beforeTreasury = w.organizations["org.line"].treasury!.energy;
    const beforeBuyer = w.players[buyer.player_id].budgets.storage;
    const proposed = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: buyer.player_id,
      offered: { energy: 3 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(proposed.ok).toBe(true);
    expect(w.organizations["org.line"].treasury!.energy).toBe(beforeTreasury - 3);
    expect(w.players[treas.player_id].budgets.energy).toBe(DEFAULT_BUDGETS.energy);
    const tradeId = Object.keys(w.trades)[0];
    const accepted = await run(w, buyer, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(accepted.ok).toBe(true);
    expect(w.organizations["org.line"].treasury!.energy).toBe(beforeTreasury - 3);
    expect(w.organizations["org.line"].treasury!.storage).toBe(10 + 1);
    expect(w.players[buyer.player_id].budgets.energy).toBe(DEFAULT_BUDGETS.energy + 3);
    expect(w.players[buyer.player_id].budgets.storage).toBe(beforeBuyer - 1 - 0);
    expect(w.institution_pulses).toContain("An institution traded from its treasury.");
  });

  it("authorized custodian repairs from treasury", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const custodian = principal("player.vesper");
    await setupOrg(w, founder, custodian, "OPERATE_NAMED_ASSET");
    const before = w.rooms["room.hub"].entities[0].condition;
    const energy = w.organizations["org.line"].treasury!.energy;
    const r = await run(w, custodian, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
    });
    expect(r.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(Math.min(100, (before ?? 0) + 15));
    expect(w.organizations["org.line"].treasury!.energy).toBe(energy - (COSTS.REPAIR.energy || 0));
    expect(w.players[custodian.player_id].budgets.energy).toBe(DEFAULT_BUDGETS.energy);
    expect(w.institution_pulses).toContain("Institution infrastructure was repaired.");
  });

  it("member and vacant office cannot spend; former holder loses authority; treasury remains", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const treas = principal("player.vesper");
    const officeId = await setupOrg(w, founder, treas, "OPERATE_RESOURCE_ACCOUNT");
    const memberTry = await run(w, founder, "TRADE", {
      phase: "propose",
      counterparty_id: treas.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(memberTry.ok).toBe(false);
    expect(memberTry.error?.code).toBe("FORBIDDEN");

    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_VACATE",
      org_id: "org.line",
      office_id: officeId,
    });
    const vacant = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(vacant.ok).toBe(false);
    expect(w.organizations["org.line"].treasury!.energy).toBe(20);

    await run(w, founder, "COMMIT", {
      operation: "ORG_OFFICE_ASSIGN",
      org_id: "org.line",
      office_id: officeId,
      agent_id: treas.player_id,
    });
    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const again = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 2 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(again.ok).toBe(true);
    expect(w.organizations["org.line"].treasury!.energy).toBe(18);
  });

  it("rejects forged org, other-institution asset, and second treasury spend", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const treas = principal("player.vesper");
    await setupOrg(w, founder, treas, "OPERATE_RESOURCE_ACCOUNT");
    const forged = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
      acting_for: "org.forged",
    });
    expect(forged.ok).toBe(false);
    expect(forged.error?.code).toBe("NOT_FOUND");

    w.organizations["org.line"].treasury!.energy = 3;
    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const first = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 3 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(first.ok).toBe(true);
    w.players[treas.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const second = await run(w, treas, "TRADE", {
      phase: "propose",
      counterparty_id: founder.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
      acting_for: "org.line",
    });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("BUDGET_EXCEEDED");
  });

  it("human and agent officers have the same treasury rights", async () => {
    const w = world();
    const founder = principal("player.nacre", "human");
    const agent = principal("player.vesper", "agent");
    await setupOrg(w, founder, agent, "OPERATE_NAMED_ASSET");
    const r = await run(w, agent, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
    });
    expect(r.ok).toBe(true);
    const look = await run(w, agent, "LOOK");
    expect(look.observation?.office_lines?.some((l) => /repair local infrastructure/i.test(l))).toBe(true);
  });

  it("cannot repair another institution's owned asset", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const custodian = principal("player.vesper");
    await setupOrg(w, founder, custodian, "OPERATE_NAMED_ASSET");
    w.rooms["room.hub"].entities[0].owner_id = "org.other";
    const r = await run(w, custodian, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay",
      acting_for: "org.line",
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("FORBIDDEN");
  });
});
