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

  it("text-line MOVE success uses the same public four-beat result and one settlement", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets };
    let settlements = 0;
    const envl: CommandEnvelope = {
      request_id: "r.text-move-east",
      idempotency_key: "i.text-move-east",
      command: "MOVE",
      arguments: { line: "move east" },
    };
    const moved = await applyWorldCommand(w, p, envl, async () => { settlements += 1; return true; });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.play_text).toMatch(/HAPPENED\nYou move east\.\nok\nYou arrive at Coldline\. Energy −1\./);
    expect(moved.observation?.location?.name).toBe("Coldline");
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 1);
    expect(w.players[p.player_id].budgets.attention).toBe(before.attention);
    expect(settlements).toBe(1);
    expect(moved.events?.some((e) => e.event_type === "LOOK")).toBe(false);
    const replay = await applyWorldCommand(w, p, envl, async () => { throw new Error("replay must not settle"); });
    expect(replay).toEqual(moved);
    expect(settlements).toBe(1);
  });

  it("text-line MOVE rejection keeps code, current affordances, and no debit", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const current = (await run(w, p, "OBSERVE")).observation;
    const before = { ...w.players[p.player_id].budgets };
    const sequence = w.sequence;
    const failed = await run(w, p, "MOVE", { line: "move north" });
    expect(failed.ok).toBe(false);
    expect(failed.error?.code).toBe("MOVE_REJECTED");
    expect(failed.observation?.play_text).toMatch(/HAPPENED\nYou try to move north\.\nfail\nThere is no exit north from here\. Nothing moves\./);
    expect(failed.observation?.affordances).toEqual(current?.affordances);
    expect(failed.observation?.available_actions).toEqual(current?.available_actions);
    expect(failed.observation?.play_text).not.toMatch(/room\.|player\.|ctrl\.|HAPPENED[\s\S]*You arrive at Coldline/);
    expect(failed.events?.length ?? 0).toBe(0);
    expect(w.players[p.player_id].room_id).toBe("room.hub");
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.sequence).toBe(sequence);
  });

  it("text-line MOVE without direction has a code and bounded failed four-beat", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const current = (await run(w, p, "OBSERVE")).observation;
    const before = { ...w.players[p.player_id].budgets };
    const sequence = w.sequence;
    for (const line of ["move", "go", "walk"]) {
      const failed = await run(w, p, "MOVE", { line });
      expect(failed.ok).toBe(false);
      expect(failed.error?.code).toBe("INVALID_REQUEST");
      expect(failed.observation?.play_text).toMatch(/HAPPENED\nYou try to move\.\nfail\nChoose a direction to move\. Nothing moves\./);
      expect(failed.observation?.affordances).toEqual(current?.affordances);
      expect(failed.observation?.available_actions).toEqual(current?.available_actions);
      expect(failed.observation?.play_text).not.toMatch(/room\.|player\.|ctrl\.|HAPPENED[\s\S]*You arrive at Coldline/);
      expect(failed.events?.length ?? 0).toBe(0);
      expect(w.players[p.player_id].budgets).toEqual(before);
      expect(w.players[p.player_id].room_id).toBe("room.hub");
      expect(w.sequence).toBe(sequence);
    }
  });

  it("LOOK-carried direction aliases preserve MOVE presentation and cost", async () => {
    for (const line of ["go east", "walk e", "e"]) {
      const w = world();
      const p = principal();
      expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
      const before = { ...w.players[p.player_id].budgets };
      const moved = await run(w, p, "LOOK", { line });
      expect(moved.ok).toBe(true);
      expect(moved.observation?.play_text).toMatch(/HAPPENED\nYou move east\.\nok\nYou arrive at Coldline\. Energy −1\./);
      expect(moved.observation?.location?.name).toBe("Coldline");
      expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 1);
      expect(w.players[p.player_id].budgets.attention).toBe(before.attention);
      expect(moved.events?.filter((e) => e.event_type === "MOVE")).toHaveLength(1);
      expect(moved.events?.some((e) => e.event_type === "LOOK")).toBe(false);
    }
  });

  it("LOOK-carried missing MOVE lines keep a coded, bounded failure", async () => {
    const w = world();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const current = (await run(w, p, "OBSERVE")).observation;
    const before = { ...w.players[p.player_id].budgets };
    const sequence = w.sequence;
    for (const line of ["move", "go", "walk"]) {
      const failed = await run(w, p, "LOOK", { line });
      expect(failed.ok).toBe(false);
      expect(failed.error?.code).toBe("INVALID_REQUEST");
      expect(failed.observation?.play_text).toMatch(/HAPPENED\nYou try to move\.\nfail\nChoose a direction to move\. Nothing moves\./);
      expect(failed.observation?.affordances).toEqual(current?.affordances);
      expect(failed.observation?.available_actions).toEqual(current?.available_actions);
      expect(failed.observation?.play_text).not.toMatch(/room\.|player\.|ctrl\.|HAPPENED[\s\S]*You arrive at Coldline/);
      expect(failed.events?.length ?? 0).toBe(0);
      expect(w.players[p.player_id].room_id).toBe("room.hub");
      expect(w.players[p.player_id].budgets).toEqual(before);
      expect(w.sequence).toBe(sequence);
    }
    const other = await run(w, p, "LOOK", { line: "dance" });
    expect(other.ok).toBe(false);
    expect(other.observation?.play_text).toBeUndefined();
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

  it("missing INSPECT target has bounded four-beat failure", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const current = (await run(w, p, "OBSERVE")).observation;
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const beforeIdempotency = JSON.stringify(w.seen_idempotency);
    const r = await run(w, p, "INSPECT", { entity_id: "entity.not-here" });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("INSPECT_FAILED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to inspect\.\nfail\nYou do not see that here\. Nothing changes\./);
    expect(r.observation?.affordances).toEqual(current?.affordances);
    expect(r.observation?.available_actions).toEqual(current?.available_actions);
    expect(r.observation?.play_text).not.toMatch(/entity\.not-here|room\.|ctrl\./);
    expect(r.events?.length ?? 0).toBe(0);
    expect(w.sequence).toBe(seq); expect(w.players[p.player_id].budgets).toEqual(before);
    expect(JSON.stringify(w.seen_idempotency)).toBe(beforeIdempotency);
  });

  it("sealed INSPECT stays FORBIDDEN and reveals no sealed detail", async () => {
    const w = world(); const p = principal();
    w.rooms["room.hub"].entities[0].inspect_restricted_until = 10;
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to inspect\.\nfail\nThe record is sealed\. Nothing changes\./);
    expect(r.observation?.play_text).not.toMatch(/entity\.relay-7|ctrl\.|restricted_until/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("INSPECT attention rejection does not debit or create events", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), attention: 0 };
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to inspect\.\nfail\nYou do not have enough attention\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
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
