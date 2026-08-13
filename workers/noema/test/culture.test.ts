import { describe, expect, it } from "vitest";
import {
  CUSTOM_LINE,
  applyCultureEvents,
  cultureLines,
  emptyCulture,
} from "../src/culture";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("GC9-S0 mapper", () => {
  it("reaches CUSTOM at three distinct repairs and grants later INSPECT access", () => {
    let state = emptyCulture();
    state = applyCultureEvents(
      state,
      [
        {
          event_id: "e1",
          event_type: "ENTITY_UPDATE",
          payload: { entity_id: "entity.relay-7", operation: "REPAIR", field: "condition" },
        },
        {
          event_id: "e1",
          event_type: "ENTITY_UPDATE",
          payload: { entity_id: "entity.relay-7", operation: "REPAIR", field: "condition" },
        },
        {
          event_id: "e2",
          event_type: "ENTITY_UPDATE",
          payload: { entity_id: "entity.relay-7", operation: "REPAIR", field: "condition" },
        },
      ],
      "player.nacre",
    );
    expect(cultureLines(state, ["entity.relay-7"], "player.nacre")).toEqual([]);
    state = applyCultureEvents(
      state,
      [
        {
          event_id: "e3",
          event_type: "ENTITY_UPDATE",
          payload: { entity_id: "entity.relay-7", operation: "REPAIR", field: "condition" },
        },
      ],
      "player.nacre",
    );
    expect(cultureLines(state, ["entity.relay-7"], "player.nacre")).toEqual([CUSTOM_LINE]);
    expect(cultureLines(state, ["entity.relay-7"], "player.vesper")).toEqual([]);
    state = applyCultureEvents(
      state,
      [{ event_id: "i1", event_type: "INSPECT", payload: { entity_id: "entity.relay-7" } }],
      "player.vesper",
    );
    expect(cultureLines(state, ["entity.relay-7"], "player.vesper")).toEqual([CUSTOM_LINE]);
    expect(cultureLines(state, ["entity.other"], "player.vesper")).toEqual([]);
    expect(CUSTOM_LINE).not.toMatch(/quest|oracle|the ledger is wrong|canon/i);
  });
});

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

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Relay Quarter",
        description: "A live relay.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
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
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC9-S0 world projection", () => {
  it("shows the custom line after three repairs and later inspect", async () => {
    const w = fixtureWorld();
    const nacre = principal("player.nacre");
    const vesper = principal("player.vesper");
    await run(w, nacre, "ENTER_WORLD");
    await run(w, vesper, "ENTER_WORLD");
    w.players[nacre.player_id].budgets = cloneBudgets({
      ...DEFAULT_BUDGETS,
      energy: 80,
      compute: 64,
      storage: 16,
    });
    w.rooms["room.hub"].entities[0].condition = 40;

    for (let i = 0; i < 3; i++) {
      w.players[nacre.player_id].budgets = cloneBudgets({
        ...DEFAULT_BUDGETS,
        energy: 80,
        compute: 64,
        storage: 16,
      });
      const r = await run(w, nacre, "COMMIT", {
        operation: "REPAIR",
        entity_id: "entity.relay-7",
      });
      expect(r.ok).toBe(true);
    }
    expect(w.players[nacre.player_id].budgets.energy).toBe(
      DEFAULT_BUDGETS.energy - (COSTS.REPAIR.energy || 0),
    );
    const look = await run(w, nacre, "LOOK");
    expect(look.observation?.culture_lines).toEqual([CUSTOM_LINE]);

    const stranger = await run(w, vesper, "LOOK");
    expect(stranger.observation?.culture_lines || []).toEqual([]);

    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const inspected = await run(w, vesper, "INSPECT", { entity_id: "entity.relay-7" });
    expect(inspected.ok).toBe(true);
    expect(inspected.observation?.culture_lines).toEqual([CUSTOM_LINE]);
    expect(JSON.stringify(inspected.observation)).not.toMatch(/quest|oracle|the ledger is wrong/i);
  });
});
