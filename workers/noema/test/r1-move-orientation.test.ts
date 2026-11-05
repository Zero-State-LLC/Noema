import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { canonicalWorldState } from "../src/canonical-state";
import { STORAGE_CAPACITY } from "../src/construction";
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
  return applyWorldCommand(w, p, envl, async () => true, { admission: "developer" });
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
    const first = await applyWorldCommand(w, p, envl, async () => true, { admission: "developer" });
    expect(first.ok).toBe(true);
    const beforeReplay = { sequence: w.sequence, budgets: { ...w.players[p.player_id].budgets } };
    const replay = await applyWorldCommand(w, p, envl, async () => { throw new Error("replay must not settle"); }, { admission: "developer" });
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
    const moved = await applyWorldCommand(w, p, envl, async () => { settlements += 1; return true; }, { admission: "developer" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.play_text).toMatch(/HAPPENED\nYou move east\.\nok\nYou arrive at Coldline\. Energy −1\./);
    expect(moved.observation?.location?.name).toBe("Coldline");
    expect(w.players[p.player_id].budgets.energy).toBe(before.energy - 1);
    expect(w.players[p.player_id].budgets.attention).toBe(before.attention);
    expect(settlements).toBe(1);
    expect(moved.events?.some((e) => e.event_type === "LOOK")).toBe(false);
    const replay = await applyWorldCommand(w, p, envl, async () => { throw new Error("replay must not settle"); }, { admission: "developer" });
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

  it("successful INSPECT includes a public HAPPENED without a second LOOK", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const r = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou inspect\.\nok\n/);
    expect(r.events?.some((e) => e.event_type === "INSPECT")).toBe(true);
    expect(r.events?.some((e) => e.event_type === "LOOK")).toBe(false);
  });

  it("empty HARVEST is a coded no-stock failure", async () => {
    const w = world(); const p = principal();
    Object.assign(w.rooms["room.hub"].entities[0], { stock_resource: "energy", stock_amount: 0 });
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7", amount: 1 });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to harvest\.\nfail\nThat node has nothing left to take\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("insufficient HARVEST with remaining stock does not claim the node is empty", async () => {
    const w = world(); const p = principal();
    Object.assign(w.rooms["room.hub"].entities[0], { stock_resource: "energy", stock_amount: 1 });
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7", amount: 2 });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.error?.message).toBe("Not enough stock available.");
    expect(r.observation?.play_text).toContain("There is not enough left to take that much. Nothing changes.");
    expect(r.observation?.play_text).not.toContain("nothing left to take");
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(1);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("successful HARVEST presents its actual transfer", async () => {
    const w = world(); const p = principal();
    Object.assign(w.rooms["room.hub"].entities[0], { stock_resource: "energy", stock_amount: 1 });
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7", amount: 1 });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou harvest\.\nok\nHarvested 1 energy/);
    expect(r.events?.some((e) => e.event_type === "RESOURCE_TRANSFER")).toBe(true);
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(0);
  });

  it("successful REPAIR presents the real condition delta", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets({
      ...DEFAULT_BUDGETS, energy: 80, compute: 64, storage: 15,
    });
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou repair\.\nok\n.*Condition 80% → /);
    expect(r.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
  });

  it("unreachable MESSAGE explains relay failure without message text", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    w.rooms["room.hub"].entities[0].condition = 24;
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, a, "MOVE", { direction: "east" })).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[a.player_id].budgets };
    const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "secret-sentinel" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("UNREACHABLE");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to message\.\nfail\nThe destination cannot be reached\. Nothing changes\./);
    expect(JSON.stringify(r.observation)).not.toContain("secret-sentinel");
    expect(r.observation?.location?.room_id).toBe("room.east");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[a.player_id].budgets).toEqual(before);
  });

  it("MESSAGE without compute explains the rejected send", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    w.players[a.player_id].budgets.compute = 0;
    const before = { ...w.players[a.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "private-budget-sentinel" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to message\.\nfail\nYou do not have enough compute\. Nothing changes\./);
    expect(JSON.stringify(r.observation)).not.toContain("private-budget-sentinel");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[a.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it("structured MESSAGE missing recipient gets a bounded rejection", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "MESSAGE", { text: "private-missing-sentinel" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("INVALID_REQUEST");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to message\.\nfail\nName a recipient and write a message\. Nothing changes\./);
    expect(JSON.stringify(r.observation)).not.toContain("private-missing-sentinel");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it.each([
    [{ surface: "BOARD", text: "" }, "text required", "Write a message."],
    [{ surface: "CHANNEL", text: "channel-sentinel" }, "org_id required", "Name a channel institution."],
    [{ recipient_id: "player.unknown", text: "private-sentinel", signal: { certainty: 2 } }, "signal.certainty must be 0–1", "Check the message signal."],
  ])("structured MESSAGE validation %j has a bounded result", async (args, error, shown) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "MESSAGE", args);
    expect(r.ok).toBe(false); expect(r.error).toEqual({ code: "INVALID_REQUEST", message: error });
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to message.\nfail\n${shown} Nothing changes.`);
    expect(JSON.stringify(r)).not.toMatch(/channel-sentinel|private-sentinel/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it.each([
    [{ line: "message" }, "UNKNOWN_COMMAND", "Write a message to a Player."],
    [{ line: "message player.private-guess \"  \"" }, "INVALID_REQUEST", "Write a message to a Player."],
    // #791: an absent recipient is refused at admission exactly like structured MESSAGE (FORBIDDEN).
    [{ line: "message player.private-guess private-body-sentinel" }, "FORBIDDEN", "Recipient is not addressable in this world."],
    [{ surface: "CHANNEL", org_id: "org.private-guess", text: "private-body-sentinel" }, "NOT_ADDRESSABLE", "That channel is not addressable."],
    [{ surface: "NOTICE", text: "private-body-sentinel" }, "FORBIDDEN", "You do not hold a notice office here."],
    [{ surface: "NOTICE", org_id: "org.private-guess", text: "private-body-sentinel" }, "FORBIDDEN", "You do not hold a notice office here."],
  ])("MESSAGE in-scope rejection %j stays bounded", async (args, code, shown) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "MESSAGE", args);
    expect(r.ok).toBe(false); expect(r.error?.code).toBe(code);
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to message.\nfail\n${shown} Nothing changes.`);
    expect(JSON.stringify(r)).not.toMatch(/private-body-sentinel|private-guess/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it("alias-expanded MESSAGE rejection hides a guessed recipient", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].command_aliases = { whisper: "message" };
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "MESSAGE", { line: "whisper player.private-guess private-body-sentinel" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN"); // #791: refused at admission like structured
    expect(r.observation?.play_text).toContain("HAPPENED\nYou try to message.\nfail\nRecipient is not addressable in this world. Nothing changes.");
    expect(JSON.stringify(r)).not.toMatch(/private-guess|private-body-sentinel/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it.each([
    ["report player.private-guess \"private-body-sentinel\"", undefined],
    ["pass player.private-guess claim.private-body-sentinel", undefined],
    ["share player.private-guess claim.private-body-sentinel", undefined],
    ["repeat player.private-guess \"private-body-sentinel\"", undefined],
    ["brief player.private-guess \"private-body-sentinel\"", { brief: "report" }],
  ])("MESSAGE text-line %s hides unknown recipient", async (line, aliases) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    if (aliases) w.players[p.player_id].command_aliases = aliases;
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "MESSAGE", { line });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(r.observation?.play_text).toContain("HAPPENED\nYou try to message.\nfail\nRecipient is not addressable in this world. Nothing changes.");
    expect(JSON.stringify(r)).not.toMatch(/private-guess|private-body-sentinel/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  // MESSAGE carriers are refused at admission like structured MESSAGE (#791, FORBIDDEN); report/pass keep
  // their own recipient resolution (out of #791's scope) and still answer NOT_FOUND.
  it.each([
    ["LOOK", "message player.private-guess private-body-sentinel", undefined, "FORBIDDEN"],
    ["COMMIT", "report player.private-guess \"private-body-sentinel\"", undefined, "NOT_FOUND"],
    ["LOOK", "whisper player.private-guess private-body-sentinel", { whisper: "message" }, "FORBIDDEN"],
    ["message player.private-guess private-body-sentinel", undefined, undefined, "FORBIDDEN"],
    ["report player.private-guess \"private-body-sentinel\"", undefined, undefined, "NOT_FOUND"],
    ["pass player.private-guess claim.private-body-sentinel", undefined, undefined, "NOT_FOUND"],
    ["say to player.private-guess private-body-sentinel", undefined, undefined, "FORBIDDEN"],
  ])("MESSAGE rejection through %s carrier stays private", async (command, line, aliases, code) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    if (aliases) w.players[p.player_id].command_aliases = aliases;
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const nonce = Math.random().toString(16).slice(2);
    const r = await applyWorldCommand(w, p, {
      request_id: `r.carrier.${nonce}`,
      idempotency_key: `i.carrier.${nonce}`,
      command, arguments: line ? { line } : {},
    }, async () => true, { admission: "developer" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe(code);
    expect(r.observation?.play_text).toContain("HAPPENED\nYou try to message.\nfail\nRecipient is not addressable in this world. Nothing changes.");
    expect(JSON.stringify(r)).not.toMatch(/private-guess|private-body-sentinel/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before); expect(w.messages).toHaveLength(0);
  });

  it.each([
    ["LOOK", "harvest entity.private-guess", undefined, "harvest"],
    ["LOOK", "repair entity.private-guess", undefined, "repair"],
    ["MESSAGE", "harvest entity.private-guess", undefined, "harvest"],
    ["repair entity.private-guess", undefined, undefined, "repair"],
    ["harvest entity.private-guess", undefined, undefined, "harvest"],
    ["LOOK", "fixit entity.private-guess", { fixit: "repair" }, "repair"],
  ])("%s carrying %s bounds missing entity", async (command, line, aliases, attempted) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    if (aliases) w.players[p.player_id].command_aliases = aliases;
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const nonce = Math.random().toString(16).slice(2);
    const r = await applyWorldCommand(w, p, {
      request_id: `r.entity.${nonce}`, idempotency_key: `i.entity.${nonce}`,
      command, arguments: line ? { line } : {},
    }, async () => true, { admission: "developer" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to ${attempted}.\nfail\nYou do not see that here. Nothing changes.`);
    expect(JSON.stringify(r)).not.toContain("entity.private-guess");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("BUILD share is not mislabeled as MESSAGE", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const r = await run(w, p, "LOOK", { line: "share entity.private-guess with player.unknown" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(JSON.stringify(r)).not.toMatch(/Recipient is not addressable|You try to message|Write the message again/);
  });

  it("BUILD share clarification pick does not become a MESSAGE retry", async () => {
    const w = world(); const a = principal();
    const b = principal("player.dupe-one"); const c = principal("player.dupe-two");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, c, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "dupe"; w.players[c.player_id].handle = "dupe";
    const amb = await run(w, a, "LOOK", { line: "share scarred-conduit with dupe" });
    expect(amb.error?.code).toBe("AMBIGUOUS_TARGET");
    const picked = await run(w, a, "LOOK", { line: "1" });
    expect(picked.error?.message).not.toContain("message again");
    expect(JSON.stringify(picked)).not.toContain("You try to message");
  });

  it.each(["inspect", "harvest"])('MESSAGE envelope with %s line does not mislabel failure as recipient', async (verb) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const r = await run(w, p, "MESSAGE", { line: `${verb} entity.private-guess` });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(JSON.stringify(r)).not.toContain("Recipient is not addressable in this world.");
  });

  it.each([
    ["harvest", "harvest"], ["repair", "repair"],
  ])("COMMIT text-line %s hides unknown entity", async (verb, attempted) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "COMMIT", { line: `${verb} entity.private-guess` });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to ${attempted}.\nfail\nYou do not see that here. Nothing changes.`);
    expect(JSON.stringify(r)).not.toContain("entity.private-guess");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it.each([
    ["message dupe private-clarify-sentinel", undefined, "MESSAGE"],
    ["message dupe private-clarify-sentinel", undefined, "LOOK"],
    ["brief dupe \"private-clarify-sentinel\"", { brief: "report" }, "LOOK"],
  ])("MESSAGE ambiguous recipient pick from %s under %s prompts retry without retaining the body", async (line, aliases, pickCommand) => {
    const w = world(); const a = principal();
    const b = principal("player.dupe-one"); const c = principal("player.dupe-two");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, c, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "dupe"; w.players[c.player_id].handle = "dupe";
    if (aliases) w.players[a.player_id].command_aliases = aliases;
    const before = { ...w.players[a.player_id].budgets }; const seq = w.sequence;
    const amb = await run(w, a, "MESSAGE", { line });
    expect(amb.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(amb.error?.choices).toHaveLength(2);
    expect(w.players[a.player_id].pending_clarify).toBeDefined();
    const picked = await run(w, a, pickCommand, { line: "1" });
    expect(picked.ok).toBe(false); expect(picked.error?.code).toBe("INVALID_REQUEST");
    expect(picked.observation?.consequence).toBe("Write the message again to the chosen Player.");
    expect(picked.observation?.play_text).toBe("Write the message again to the chosen Player.");
    expect(picked.observation?.play_text).not.toMatch(/HAPPENED|You try to message|\nfail\n/);
    expect(JSON.stringify(picked)).not.toContain("private-clarify-sentinel");
    expect(w.players[a.player_id].pending_clarify).toBeUndefined();
    expect(picked.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[a.player_id].budgets).toEqual(before); expect(w.messages).toHaveLength(0);
  });

  it.each([
    ["not-a-claim", "That report is not known here."],
    ["claim.private-guess", "You do not hold that report."],
  ])("MESSAGE report %s rejection is bounded and private", async (parent, shown) => {
    const w = world(); const p = principal(); const recipient = principal("player.vesper");
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, recipient, "ENTER_WORLD")).ok).toBe(true);
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "MESSAGE", {
      recipient_id: recipient.player_id, text: "private-body-sentinel", parent_claim_id: parent,
    });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to message.\nfail\n${shown} Nothing changes.`);
    expect(JSON.stringify(r)).not.toMatch(/private-body-sentinel|private-guess/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it("MESSAGE to unknown player has no delivery and a bounded result", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "MESSAGE", {
      recipient_id: "player.private-unknown", text: "private-address-sentinel",
    });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to message\.\nfail\nRecipient is not addressable in this world\. Nothing changes\./);
    expect(JSON.stringify(r.observation)).not.toMatch(/private-address-sentinel|player\.private-unknown/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.messages).toHaveLength(0);
  });

  it("HARVEST non-node has a bounded forbidden result", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to harvest\.\nfail\nNothing to harvest there\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("HARVEST with no free storage reports capacity without spending", async () => {
    const w = world(); const p = principal();
    Object.assign(w.rooms["room.hub"].entities[0], { stock_resource: "energy", stock_amount: 2 });
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets.storage = 0;
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7", amount: 1 });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to harvest\.\nfail\nYou do not have enough free storage\. Nothing changes\./);
    expect(r.observation?.play_text).not.toContain("nothing left to take");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(2);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("HARVEST without energy reports real cost without changing stock", async () => {
    const w = world(); const p = principal();
    Object.assign(w.rooms["room.hub"].entities[0], { stock_resource: "energy", stock_amount: 2 });
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets.energy = 0;
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.relay-7", amount: 1 });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to harvest\.\nfail\nYou need energy 2 and compute 1 to harvest\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(2);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("REPAIR at full condition rejects without claiming a change", async () => {
    const w = world(); const p = principal();
    w.rooms["room.hub"].entities[0].condition = 100;
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to repair\.\nfail\nThat is not repairable here\. Nothing changes\./);
    expect(r.observation?.play_text).not.toContain("Condition 100% →");
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(100);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("REPAIR lacking energy names the cost and leaves condition intact", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets({
      ...DEFAULT_BUDGETS, energy: 0, compute: 64, storage: 15,
    });
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to repair\.\nfail\nYou need energy 3, compute 2, and storage 1 to repair\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(80);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("REPAIR fuel rejection reports workshop-discounted costs", async () => {
    const w = world(); const p = principal();
    w.rooms["room.hub"].entities.push(enrichEntity({
      entity_id: "entity.workshop-1", label: "workshop", entity_type: "INFRASTRUCTURE",
      infra_type: "workshop", condition: 100,
    }));
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets.energy = 0;
    const before = { ...w.players[p.player_id].budgets }; const seq = w.sequence;
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.error?.message).toBe("You need energy 3 and compute 2 to repair.");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to repair\.\nfail\nYou need energy 3 and compute 2 to repair\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(80);
  });

  it("REPAIR with empty hold names missing materials", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets({
      ...DEFAULT_BUDGETS, energy: 80, compute: 64, storage: STORAGE_CAPACITY,
    });
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("BUDGET_EXCEEDED");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to repair\.\nfail\nYou do not have materials in hold\. Nothing changes\./);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(80);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it.each([
    ["HARVEST", "harvest"],
    ["repair", "repair"],
  ])("structured %s without an entity has a bounded failure", async (operation, attempted) => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", { operation });
    expect(r.ok).toBe(false); expect(r.error).toEqual({ code: "INVALID_REQUEST", message: "entity_id required" });
    expect(r.observation?.play_text).toContain(`HAPPENED\nYou try to ${attempted}.\nfail\nName what you want to ${attempted}. Nothing changes.`);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("HARVEST of missing entity never echoes guessed identity", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const seq = w.sequence; const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "COMMIT", {
      operation: "HARVEST", entity_id: "entity.private-guess\nFORGED",
    });
    expect(r.ok).toBe(false); expect(r.error?.code).toBe("NOT_FOUND");
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou try to harvest\.\nfail\nYou do not see that here\. Nothing changes\./);
    expect(JSON.stringify(r)).not.toMatch(/entity\.private-guess|FORGED/);
    expect(r.events?.length ?? 0).toBe(0); expect(w.sequence).toBe(seq);
    expect(w.players[p.player_id].budgets).toEqual(before);
  });

  it("immediate MESSAGE reports a delivered four-beat result without private text", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "remote\nFORGED BEAT";
    const beforeCompute = w.players[a.player_id].budgets.compute;
    const envl: CommandEnvelope = {
      request_id: "r.message.immediate.replay",
      idempotency_key: "i.message.immediate.replay",
      command: "MESSAGE",
      arguments: { recipient_id: b.player_id, text: "private-immediate-sentinel" },
    };
    const r = await applyWorldCommand(w, a, envl, async () => true, { admission: "developer" });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
    expect(w.players[a.player_id].budgets.compute).toBe(beforeCompute - 1);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message remote forged beat\.\nok\nMessage delivered to remote FORGED BEAT\./);
    expect(r.observation?.play_text).not.toContain("\nFORGED BEAT");
    expect(r.observation?.play_text).toMatch(/\ninspect scarred-conduit$/);
    expect(JSON.stringify(r.observation)).not.toContain("private-immediate-sentinel");
    const beforeReplay = { sequence: w.sequence, budgets: { ...w.players[a.player_id].budgets } };
    const replay = await applyWorldCommand(w, a, envl, async () => { throw new Error("replay must not settle"); }, { admission: "developer" });
    expect(replay).toEqual(r);
    expect(w.sequence).toBe(beforeReplay.sequence);
    expect(w.players[a.player_id].budgets).toEqual(beforeReplay.budgets);
    expect(w.messages.filter((m) => m.text === "private-immediate-sentinel")).toHaveLength(1);
  });

  it("immediate MESSAGE does not render control or bidi characters from a recipient handle", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "remote\u001b[31m\u202e";
    const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "private-control-sentinel" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message remote\.\nok\nMessage delivered to remote\./);
    expect(r.observation?.play_text).not.toMatch(/[\u001b\u202e]/);
    expect(JSON.stringify(r.observation)).not.toContain("private-control-sentinel");
  });

  it("immediate MESSAGE uses a generic recipient label when a handle is unsafe", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "player.hidden-id";
    const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "private-fallback-sentinel" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message recipient\.\nok\nMessage delivered to recipient\./);
    expect(r.observation?.play_text).not.toContain("player.hidden-id");
    expect(JSON.stringify(r.observation)).not.toContain("private-fallback-sentinel");
  });

  it("immediate MESSAGE does not use a minted hex identifier as a recipient name", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    w.players[b.player_id].handle = "a1b2c3d4e5f6";
    const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "private-hex-sentinel" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message recipient\.\nok\nMessage delivered to recipient\./);
    expect(r.observation?.play_text).not.toContain("a1b2c3d4e5f6");
    expect(JSON.stringify(r.observation)).not.toContain("private-hex-sentinel");
  });

  it.each(["smoke-probe", "smoke_probe", "SMOKE-probe", "op.fixture", "operator_fixture", "operator.fixture", "operator-fixture", "\u202eop.fixture", "op\n.fixture", "smoke\n-probe", "operator \u200b.fixture", "Grid Anchor", "grid anchor", "ｏｐ.fixture", "ｓｍｏｋｅ-probe", "Ｇｒｉｄ Ａｎｃｈｏｒ", "ｏｐｅｒａｔｏｒ_fixture", "ｅｎｔｉｔｙ．hidden", "ｃｔｒｌ．hidden", "entity .hidden", "ctrl .hidden", "entity. hidden", "ｐｌａｙｅｒ．hidden", "player.remote"]) (
    "immediate MESSAGE keeps internal recipient handle %s out of HAPPENED",
    async (handle) => {
      const w = world(); const a = principal(); const b = principal("player.remote");
      expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
      expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
      w.players[b.player_id].handle = handle;
      const r = await run(w, a, "MESSAGE", { recipient_id: b.player_id, text: "private-operator-sentinel" });
      expect(r.ok).toBe(true);
      expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message recipient\.\nok\nMessage delivered to recipient\./);
      expect(r.observation?.play_text?.split("HAPPENED\n")[1]).not.toContain(handle);
      expect(JSON.stringify(r.observation)).not.toContain("private-operator-sentinel");
    },
  );

  it("delayed MESSAGE says queued rather than delivered", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    w.rooms["room.hub"].entities[0].condition = 25;
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, a, "MOVE", { direction: "east" })).ok).toBe(true);
    const envl: CommandEnvelope = {
      request_id: "r.message.delayed.replay",
      idempotency_key: "i.message.delayed.replay",
      command: "MESSAGE",
      arguments: { recipient_id: b.player_id, text: "secret-sentinel" },
    };
    const r = await applyWorldCommand(w, a, envl, async () => true, { admission: "developer" });
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou message\.\npartial\nMessage sent\. Delivery is delayed\./);
    expect(JSON.stringify(r.observation)).not.toMatch(/secret-sentinel|Message delivered/);
    expect(r.observation?.location?.room_id).toBe("room.east");
    expect(r.events?.some((e) => e.event_type === "MESSAGE_DELIVERED")).toBe(false);
    expect(w.pending_messages?.length).toBe(1);
    const beforeReplay = { sequence: w.sequence, budgets: { ...w.players[a.player_id].budgets } };
    const replay = await applyWorldCommand(w, a, envl, async () => { throw new Error("replay must not settle"); }, { admission: "developer" });
    expect(replay).toEqual(r);
    expect(w.pending_messages).toHaveLength(1);
    expect(w.sequence).toBe(beforeReplay.sequence);
    expect(w.players[a.player_id].budgets).toEqual(beforeReplay.budgets);
  });

  it("WAIT presents only the real rest delta", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), attention: 0, compute: 0 };
    const before = { ...w.players[p.player_id].budgets };
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(r.observation?.play_text).toMatch(/HAPPENED\nYou wait\.\nok\n/);
    expect(r.observation?.play_text).toMatch(/Attention \+2/);
    expect(r.observation?.play_text).toMatch(/Compute \+4/);
    expect(w.players[p.player_id].budgets.attention).toBe(before.attention + 2);
    expect(w.players[p.player_id].budgets.compute).toBe(before.compute + 4);
    expect(r.observation?.play_text).not.toMatch(/free energy|Energy \+\d/);
  });

  it("WAIT names cycle-committed spoilage alongside measured rest", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].lot_grades = { energy: "WORN" };
    w.players[p.player_id].budgets = { ...cloneBudgets(DEFAULT_BUDGETS), attention: 0, compute: 0 };
    const energyBefore = w.players[p.player_id].budgets.energy;
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect(w.players[p.player_id].budgets.energy).toBe(energyBefore - 1);
    expect(r.events?.some((e) => e.event_type === "BUDGET_CONSUMED" && e.payload?.reason === "SPOILAGE")).toBe(true);
    expect(r.observation?.play_text).toContain("Attention +2 · Compute +4.");
    expect(r.observation?.play_text).toContain("Your worn energy spoiled.");
    expect(r.observation?.lot_lines).toContain("Your worn energy spoiled.");
  });

  it("WAIT does not repeat prior spoilage without a cycle commit", async () => {
    const w = world(); const a = principal(); const b = principal("player.remote");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    w.players[a.player_id].lot_grades = { energy: "WORN" };
    expect((await run(w, a, "WAIT")).ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    const canonicalSpoilBefore = (canonicalWorldState(w).players as Record<string, { spoil_lines?: string[] }>)[a.player_id].spoil_lines;
    expect(canonicalSpoilBefore).toContain("Your worn energy spoiled.");
    const r = await run(w, a, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.cycle).toBe(1);
    expect((canonicalWorldState(w).players as Record<string, { spoil_lines?: string[] }>)[a.player_id].spoil_lines).toEqual(canonicalSpoilBefore);
    expect(r.events?.some((e) => e.payload?.reason === "SPOILAGE")).toBe(false);
    expect(r.observation?.play_text).not.toContain("Your worn energy spoiled.");
    expect(r.observation?.lot_lines).not.toContain("Your worn energy spoiled.");
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    expect(look.observation?.lot_lines).toContain("Your worn energy spoiled.");
  });

  it("WAIT formats a net compute loss as a loss", async () => {
    const w = world(); const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].lot_grades = { compute: "WORN" };
    const before = w.players[p.player_id].budgets.compute;
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.players[p.player_id].budgets.compute).toBe(before - 1);
    expect(r.observation?.play_text).toContain("Compute −1");
    expect(r.observation?.play_text).not.toContain("Compute +-1");
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
