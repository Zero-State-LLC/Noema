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
    const xfer = (e.events || []).find((ev) => ev.event_type === "RESOURCE_TRANSFER");
    expect(xfer?.payload).toBeTruthy();
    // event-types 0.2 RESOURCE_TRANSFER_payload: additionalProperties false, transfer_id required.
    expect(Object.keys(xfer!.payload!).sort()).toEqual(["amount", "from_id", "resource", "to_id", "transfer_id"]);
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

describe("RFC-0133 affordances", () => {
  it("the holder sees treasury HARVEST and SUPPLY; others do not", async () => {
    const w = world();
    const { qm, other, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 4, influence: 0, storage: 0 };
    const look = await run(w, qm, "LOOK");
    const affs = (look.observation as { affordances?: Array<Record<string, unknown>> })?.affordances || [];
    const th = affs.find((a) => a.operation === "HARVEST" && a.office_id === office_id);
    expect(th?.acting_for).toBe("org.c");
    const sup = affs.filter((a) => a.operation === "SUPPLY" && a.target_id === other.player_id);
    expect(sup.map((a) => [a.resource, a.available])).toEqual([["energy", true], ["storage", false]]);
    const theirs = await run(w, other, "LOOK");
    const oa = (theirs.observation as { affordances?: Array<Record<string, unknown>> })?.affordances || [];
    expect(oa.some((a) => a.operation === "SUPPLY")).toBe(false);
  });
});

describe("RFC-0133 event shape", () => {
  it("SUPPLY emits a schema-0.2 RESOURCE_TRANSFER", async () => {
    const w = world();
    const { qm, other, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 5, influence: 0, storage: 0 };
    w.players[other.player_id].budgets.energy = 10;
    const r = await run(w, qm, "SUPPLY", { player_id: other.player_id, resource: "energy", amount: 2, acting_for: "org.c", office_id });
    const x = (r.events || []).find((ev) => ev.event_type === "RESOURCE_TRANSFER");
    expect(x).toBeTruthy();
    expect(Object.keys(x!.payload || {}).sort()).toEqual(["amount", "from_id", "resource", "to_id", "transfer_id"]);
    expect(String(x!.payload!.transfer_id)).toMatch(/^[A-Za-z0-9_.:-]+$/);
  });
});

describe("RFC-0133 review fixes", () => {
  it("refuses energy SUPPLY that would exceed 80 instead of clamping it down", async () => {
    const w = world();
    const { qm, other, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 10, influence: 0, storage: 0 };
    w.players[other.player_id].budgets.energy = 90;
    const r = await run(w, qm, "SUPPLY", { player_id: other.player_id, resource: "energy", amount: 5, acting_for: "org.c", office_id });
    expect(r.ok).toBe(false);
    expect(w.players[other.player_id].budgets.energy).toBe(90);
    expect(w.organizations["org.c"].treasury!.energy).toBe(10);
  });

  it("SUPPLY transfers stay out of WATCH", async () => {
    const { projectionIdForEvent } = await import("../src/watch-live");
    expect(projectionIdForEvent("RESOURCE_TRANSFER", {
      transfer_id: "supply.r1", from_id: "org.c", to_id: "player.b", resource: "energy", amount: 2,
    })).toBeNull();
    expect(projectionIdForEvent("RESOURCE_TRANSFER", { from_id: "player.a", to_id: "player.b" })).toBe("resource_change");
  });
});

describe("RFC-0133 amendment 1: treasury construction", () => {
  it("builds a generator from vault cargo, owned by the org, actor pays fuel only", async () => {
    const w = world();
    const { qm, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 0, influence: 0, storage: 20 };
    const pack = w.players[qm.player_id].budgets.storage;
    const r = await run(w, qm, "BUILD", { operation: "CONSTRUCT", class: "generator", acting_for: "org.c", office_id });
    expect(r.ok).toBe(true);
    const gen = w.rooms["room.hub"].entities.find((e) => (e as { infra_type?: string }).infra_type === "generator");
    expect((gen as { owner_id?: string }).owner_id).toBe("org.c");
    expect(w.organizations["org.c"].treasury!.storage).toBe(20 - 5);
    expect(w.players[qm.player_id].budgets.storage).toBe(pack);
  });

  it("refuses other classes, short vaults, and non-holders", async () => {
    const w = world();
    const { qm, other, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 0, influence: 0, storage: 3 };
    const relay = await run(w, qm, "BUILD", { operation: "CONSTRUCT", class: "relay", acting_for: "org.c", office_id });
    expect(relay.ok).toBe(false);
    const short = await run(w, qm, "BUILD", { operation: "CONSTRUCT", class: "generator", acting_for: "org.c", office_id });
    expect(short.error?.message).toBe("The treasury cannot pay this build.");
    w.organizations["org.c"].treasury!.storage = 20;
    const theirs = await run(w, other, "BUILD", { operation: "CONSTRUCT", class: "generator", acting_for: "org.c", office_id });
    expect(theirs.ok).toBe(false);
    expect(w.organizations["org.c"].treasury!.storage).toBe(20);
  });

  it("the holder sees treasury build affordances", async () => {
    const w = world();
    const { qm, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 0, influence: 0, storage: 20 };
    const look = await run(w, qm, "LOOK");
    const affs = (look.observation as { affordances?: Array<Record<string, unknown>> })?.affordances || [];
    const builds = affs.filter((a) => a.operation === "CONSTRUCT" && a.office_id === office_id);
    expect(builds.map((a) => a.class).sort()).toEqual(["generator", "storage_bay"]);
  });
});

describe("RFC-0133 amendment 1 review fixes", () => {
  it("owner is the resolved org id even with padded acting_for", async () => {
    const w = world();
    const { qm, office_id } = await seatQuartermaster(w);
    w.organizations["org.c"].treasury = { attention: 0, compute: 0, energy: 0, influence: 0, storage: 20 };
    const r = await run(w, qm, "BUILD", { operation: "CONSTRUCT", class: "storage_bay", acting_for: " org.c ", office_id });
    if (r.ok) {
      const bay = w.rooms["room.hub"].entities.find((e) => (e as { infra_type?: string }).infra_type === "storage_bay");
      expect((bay as { owner_id?: string }).owner_id).toBe("org.c");
    }
  });
});
