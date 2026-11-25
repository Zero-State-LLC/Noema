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
async function seatQuartermaster(w: WorldRuntime) {
  const founder = principal("player.nacre");
  const qm = principal("player.qm", "agent");
  const other = principal("player.other");
  for (const p of [founder, qm, other]) {
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  await run(w, founder, "ORG_CREATE", { name: "Compact", charter: "supply", org_id: "org.c" });
  await run(w, founder, "ORG_MEMBER_ADD", { org_id: "org.c", agent_id: qm.player_id, role: "member" });
  await run(w, founder, "ORG_OFFICE_CREATE", {
    org_id: "org.c", display_name: "Quartermaster", authority_profile: "OPERATE_RESOURCE_ACCOUNT",
  });
  const office_id = Object.keys(w.organizations["org.c"].offices || {})[0];
  await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id, agent_id: qm.player_id });
  w.rooms["room.hub"].entities.push({
    entity_id: "entity.node", label: "ore-node", kind: "node",
    stock_resource: "materials", stock_amount: 40,
  } as never);
  return { founder, qm, other, office_id };
}

describe("RFC-0133 quartermaster treasury and SUPPLY", () => {
  it("harvests into the treasury, not the pack, and caps the vault", async () => {
    const w = world();
    const { qm, office_id } = await seatQuartermaster(w);
    w.players[qm.player_id].budgets.storage = 0; // pack full
    const r = await run(w, qm, "COMMIT", {
      operation: "HARVEST", entity_id: "entity.node", amount: 8, acting_for: "org.c", office_id,
    });
    expect(r.ok).toBe(true);
    expect(w.organizations["org.c"].treasury?.storage).toBe(8);
    expect(w.players[qm.player_id].budgets.storage).toBe(0);
    w.organizations["org.c"].treasury!.storage = 60;
    const full = await run(w, qm, "COMMIT", {
      operation: "HARVEST", entity_id: "entity.node", amount: 5, acting_for: "org.c", office_id,
    });
    expect(full.ok).toBe(false);
    expect(full.error?.message).toBe("The treasury vault is full.");
  });

  it("non-holders cannot treasury-harvest", async () => {
    const w = world();
    const { other, office_id } = await seatQuartermaster(w);
    const r = await run(w, other, "COMMIT", {
      operation: "HARVEST", entity_id: "entity.node", amount: 2, acting_for: "org.c", office_id,
    });
    expect(r.ok).toBe(false);
    expect(w.organizations["org.c"].treasury?.storage ?? 0).toBe(0);
  });

  it("SUPPLY moves treasury energy and cargo to a Player in the room", async () => {
    const w = world();
    const { qm, other, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 10, influence: 0, storage: 10 };
    w.players[other.player_id].budgets.energy = 1;
    const e = await run(w, qm, "SUPPLY", {
      player_id: other.player_id, resource: "energy", amount: 5, acting_for: "org.c", office_id,
    });
    expect(e.ok).toBe(true);
    expect(w.players[other.player_id].budgets.energy).toBe(6);
    expect(w.organizations["org.c"].treasury!.energy).toBe(5);
    const c = await run(w, qm, "SUPPLY", {
      player_id: other.player_id, resource: "storage", amount: 3, acting_for: "org.c", office_id,
    });
    expect(c.ok).toBe(true);
    expect(w.players[other.player_id].budgets.storage).toBe(13);
    expect(w.organizations["org.c"].treasury!.storage).toBe(7);
  });

  it("SUPPLY refuses self, over-cap, empty treasury, and non-holders", async () => {
    const w = world();
    const { qm, other, founder, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 2, influence: 0, storage: 0 };
    const base = { resource: "energy", acting_for: "org.c", office_id };
    expect((await run(w, qm, "SUPPLY", { ...base, player_id: qm.player_id, amount: 1 })).ok).toBe(false);
    expect((await run(w, qm, "SUPPLY", { ...base, player_id: other.player_id, amount: 6 })).ok).toBe(false);
    expect((await run(w, qm, "SUPPLY", { ...base, player_id: other.player_id, amount: 3 })).ok).toBe(false);
    expect((await run(w, founder, "SUPPLY", { ...base, player_id: other.player_id, amount: 1 })).ok).toBe(false);
    expect(w.organizations["org.c"].treasury!.energy).toBe(2);
  });
});
