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
    expect(text).toMatch(/HAPPENED\nYou move east\.\nok\nYou arrive at Coldline\. Energy −1\./);
    expect(text).not.toMatch(/entity\.relay-7/);
    expect(text).not.toMatch(/room\.east|ctrl\.|player\./);
  });

  it("replays the same MOVE result without another event or debit", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const envl: CommandEnvelope = {
      request_id: "r.move.replay",
      idempotency_key: "i.move.replay",
      command: "MOVE",
      arguments: { direction: "east" },
    };
    const first = await applyWorldCommand(w, p, envl, async () => true);
    expect(first.ok).toBe(true);
    const beforeReplay = { sequence: w.sequence, budgets: { ...w.players[p.player_id].budgets } };
    const replay = await applyWorldCommand(w, p, envl, async () => { throw new Error("replay must not settle"); });
    expect(replay).toEqual(first);
    expect(replay.observation?.play_text).toMatch(/HAPPENED\nYou move east\.\nok/);
    expect(w.sequence).toBe(beforeReplay.sequence);
    expect(w.players[p.player_id].budgets).toEqual(beforeReplay.budgets);
  });

  it("does not promote a malformed public exit label into MOVE narration", async () => {
    const w = world();
    const p = principal();
    w.rooms["room.hub"].exits = [{ direction: "east\nsecret-route", to_room_id: "room.east" }];
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const moved = await run(w, p, "MOVE", { direction: "room.east" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.play_text).toMatch(/HAPPENED\nYou move\.\nok/);
    expect(moved.observation?.play_text).not.toMatch(/secret-route/);
  });

  it("missing MOVE direction keeps INVALID_REQUEST and explains rejection", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const rejected = await run(w, p, "MOVE");
    expect(rejected.ok).toBe(false);
    expect(rejected.error?.code).toBe("INVALID_REQUEST");
    expect(rejected.observation?.play_text).toMatch(/HAPPENED\nYou try to move\.\nfail\nChoose a direction to move\. Nothing moves\./);
    expect(rejected.events?.length ?? 0).toBe(0);
  });

  it("never promotes an untrusted direction into four-beat text", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const rejected = await run(w, p, "MOVE", { direction: "room.vault-secret" });
    expect(rejected.error?.code).toBe("MOVE_REJECTED");
    expect(rejected.observation?.play_text).toMatch(/HAPPENED\nYou try to move\.\nfail\nThat route is unavailable\./);
    expect(rejected.observation?.play_text).not.toMatch(/vault|secret|room\.|player\.|ctrl\./i);
    expect(rejected.events?.length ?? 0).toBe(0);
    expect(w.players[p.player_id].room_id).toBe("room.hub");
  });

  it("budget-rejected MOVE keeps the machine code and changes no world state", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), energy: 0 };
    const expected = (await run(w, p, "OBSERVE")).observation;
    const expectedActions = expected?.available_actions;
    const expectedAffordances = expected?.affordances;
    const beforeSequence = w.sequence;
    const beforeRooms = JSON.stringify(w.rooms);
    const beforePlayers = JSON.stringify(w.players);
    const beforeIdempotency = JSON.stringify(w.seen_idempotency);
    const rejected = await run(w, p, "MOVE", { direction: "east" });
    expect(rejected.ok).toBe(false);
    expect(rejected.error?.code).toBe("BUDGET_EXCEEDED");
    expect(expectedActions?.length).toBeGreaterThan(0);
    expect(rejected.observation?.available_actions).toEqual(expectedActions);
    expect(rejected.observation?.affordances).toEqual(expectedAffordances);
    expect(rejected.observation?.play_text).toMatch(/HAPPENED\nYou try to move\.\nfail\nYou do not have enough energy\. Nothing moves\./);
    expect(rejected.observation?.play_text).not.toMatch(/\nmove east$/);
    expect(rejected.observation?.play_text).not.toMatch(/BUDGET_EXCEEDED|room\.|player\.|ctrl\./);
    expect(w.players[p.player_id].budgets.energy).toBe(0);
    expect(w.players[p.player_id].room_id).toBe("room.hub");
    expect(w.sequence).toBe(beforeSequence);
    expect(JSON.stringify(w.rooms)).toBe(beforeRooms);
    const playersAfter = JSON.parse(JSON.stringify(w.players));
    const playersBefore = JSON.parse(beforePlayers);
    // ensurePlayer refreshes last_seen_ms for every command, even a rejection.
    delete playersAfter[p.player_id].last_seen_ms;
    delete playersBefore[p.player_id].last_seen_ms;
    expect(playersAfter).toEqual(playersBefore);
    expect(JSON.stringify(w.seen_idempotency)).toBe(beforeIdempotency);
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
    expect(failed.observation?.play_text).toMatch(/HAPPENED\nYou try to move north\.\nfail\nThere is no exit north from here\./);
    expect(failed.observation?.play_text).not.toMatch(/MOVE_REJECTED|room\.|player\.|ctrl\./);
    expect(failed.events?.length ?? 0).toBe(0);
    expect(w.players[p.player_id].room_id).toBe("room.hub");
    expect(w.players[p.player_id].budgets.attention).toBe(beforeAtt);
    expect(failed.observation?.location?.name).toBe("Grid Anchor");
    expect(failed.observation?.play_text || "").not.toMatch(/^Coldline|HAPPENED[\s\S]*You arrive at Coldline/);
  });
});
