import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id = "player.nacre"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.r1",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.r1-move",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 80,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route east of the anchor.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
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
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("R1 MOVE destination orientation", () => {
  it("successful MOVE includes dest Feature B text and does not debit LOOK attention", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = { ...w.players[p.player_id].budgets };
    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(w.players[p.player_id].room_id).toBe("room.east");
    expect(w.players[p.player_id].budgets.attention).toBe(before.attention);
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 1);
    expect(moved.events?.some((e) => e.event_type === "LOOK")).toBe(false);
    expect(moved.observation?.location?.name).toBe("Coldline");
    expect(moved.observation?.location?.exits?.some((e) => e.direction === "west")).toBe(true);
    const text = moved.observation?.play_text || "";
    expect(text).toMatch(/Coldline/);
    expect(text).toMatch(/EXITS/);
    expect(text).toMatch(/STATUS/);
    expect(text).toMatch(/Energy /);
    expect(text).toMatch(/HAPPENED/);
    expect(text).not.toMatch(/entity\.relay-7/);
  });

  it("failed MOVE has no destination bundle and charges no LOOK", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const beforeAtt = w.players[p.player_id].budgets.attention;
    const failed = await run(w, p, "MOVE", { direction: "north" });
    expect(failed.ok).toBe(false);
    expect(failed.error?.code).toBe("MOVE_REJECTED");
    expect(w.players[p.player_id].room_id).toBe("room.hub");
    expect(w.players[p.player_id].budgets.attention).toBe(beforeAtt);
    expect(failed.observation?.location?.name).not.toBe("Coldline");
    expect(failed.observation?.play_text || "").not.toMatch(/Coldline/);
  });
});
