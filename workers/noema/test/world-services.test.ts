import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";
import { resolveService, servicesAtRoom } from "../src/world-services";
import { enrichEntity } from "../src/actions";

function principal(): PlayerPrincipal {
  return {
    player_id: "player.nacre",
    agent_id: "agent.nacre",
    session_id: "sess.1",
    controller_id: "ctrl.human.nacre",
    controller_type: "human",
    scopes: ["noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Perihelion Reach",
    cycle: 1,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A damaged relay trunk.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "relay-trunk",
            entity_type: "INFRASTRUCTURE",
            condition: 22,
          }),
        ],
      },
    },
    players: {
      "player.nacre": {
        room_id: "room.hub",
        entered: true,
        budgets: { attention: 8, compute: 64, energy: 80, influence: 40, storage: 16 },
        handle: "nacre",
      },
    },
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

describe("World Services derivation", () => {
  it("places a Relay Keeper only when infrastructure has authorized damage", () => {
    const svcs = servicesAtRoom({
      room_id: "room.hub",
      name: "Grid Anchor",
      description: "Damaged relay trunk",
      entities: [{ label: "relay-trunk", entity_type: "INFRASTRUCTURE", condition: 22, repairable: true }],
    });
    expect(svcs.some((s) => s.service_id === "service.relay.01")).toBe(true);
    expect(svcs.find((s) => s.service_id === "service.relay.01")?.status).toBe("DEGRADED");
  });

  it("does not invent registry or contract desks from civic room names", () => {
    const svcs = servicesAtRoom({
      room_id: "room.town",
      name: "Contract Town",
      description: "Registry and civic desks",
      entities: [],
    });
    expect(svcs).toEqual([]);
  });

  it("resolves talk aliases when a damaged infrastructure entity is present", () => {
    const present = servicesAtRoom({
      room_id: "room.hub",
      name: "Grid Anchor",
      description: "relay",
      entities: [{ label: "relay", entity_type: "INFRASTRUCTURE", condition: 40, repairable: true }],
    });
    expect(resolveService("keeper", present)?.service_id).toBe("service.relay.01");
  });
});

describe("World Service consult is non-mutating", () => {
  it("talk relay keeper explains REPAIR and does not emit events", async () => {
    const w = world();
    const seq = w.sequence;
    const res = await applyWorldCommand(w, principal(), {
      request_id: "r1",
      command: "talk relay keeper",
      arguments: { line: "talk relay keeper" },
    }, async () => true);
    expect(res.ok).toBe(true);
    expect(res.events || []).toHaveLength(0);
    expect(w.sequence).toBe(seq);
    expect(res.observation?.consequence || "").toMatch(/Relay Keeper/);
    expect(res.observation?.consequence || "").toMatch(/will not/i);
    expect(res.observation?.services?.some((s) => s.service_id === "service.relay.01")).toBe(true);
  });
});
