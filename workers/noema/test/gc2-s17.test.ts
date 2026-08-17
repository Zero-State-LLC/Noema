import { describe, expect, it } from "vitest";
import {
  MULTI_CYCLE_CLASS,
  isInProgress,
  isMultiCycleClass,
  liveClassInRoom,
  readyClassInRoom,
} from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
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

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc2-s17",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.yard",
    rooms: {
      "room.yard": {
        room_id: "room.yard",
        name: "Yard",
        description: "Open ground.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [],
        hidden: true,
        tags: ["hidden"],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
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

async function resolveDisruption(w: WorldRuntime, p: PlayerPrincipal) {
  w.sequence = 40;
  const declared = await run(w, p, "CONTEST_DECLARE", {
    contest_form: "INFRASTRUCTURE_DISRUPTION",
    target: { kind: "ENTITY", entity_id: "entity.relay-7" },
    stake: { energy: 12, influence: 8, compute: 4 },
    seed_stream_id: "stream.s17",
  });
  expect(declared.ok).toBe(true);
  const waited = await run(w, p, "WAIT");
  expect(waited.ok).toBe(true);
  const resolved = waited.events?.find((e) => e.event_type === "CONTEST_RESOLVED");
  expect(resolved).toBeTruthy();
  return resolved!.payload as { score_millipoints: number; contest_id: string };
}

describe("GC2-S17 mapper", () => {
  it("keeps relay as MULTI_CYCLE_CLASS, adds defensive_work, and stays silent", () => {
    expect(MULTI_CYCLE_CLASS).toBe("relay");
    expect(isMultiCycleClass("defensive_work")).toBe(true);
    expect(isMultiCycleClass("archive_annex")).toBe(true);
    expect(isMultiCycleClass("route_link")).toBe(true);
    expect(
      liveClassInRoom(
        [{ entity_id: "w", label: "work", entity_type: "INFRASTRUCTURE", infra_type: "defensive_work", in_progress: true }],
        "defensive_work",
      ),
    ).toBe(true);
    expect(
      readyClassInRoom(
        [{ entity_id: "w", label: "work", entity_type: "INFRASTRUCTURE", infra_type: "defensive_work", in_progress: true }],
        "defensive_work",
      ),
    ).toBe(false);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "PROMOTE" })).toBeNull();
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});

describe("GC2-S17 world path", () => {
  it("constructs an IN_PROGRESS defensive work, then the same entity_id goes live after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/under construction/);
    expect(built.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_CREATE"]);
    expect(built.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    const created = w.rooms["room.yard"].entities.find((e) => e.infra_type === "defensive_work")!;
    expect(isInProgress(created)).toBe(true);
    expect(liveClassInRoom(w.rooms["room.yard"].entities, "defensive_work")).toBe(true);
    expect(readyClassInRoom(w.rooms["room.yard"].entities, "defensive_work")).toBe(false);

    const again = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("SLOT_OCCUPIED");

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const same = w.rooms["room.yard"].entities.find((e) => e.entity_id === created.entity_id)!;
    expect(isInProgress(same)).toBe(false);
    expect(readyClassInRoom(w.rooms["room.yard"].entities, "defensive_work")).toBe(true);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/STRUCTURE_/);
  });

  it("does not apply S3 contest defense until the same work is live", async () => {
    const shellWorld = world();
    const shellPlayer = principal("player.nacre");
    await run(shellWorld, shellPlayer, "ENTER_WORLD");
    shellWorld.players[shellPlayer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const shelled = await run(shellWorld, shellPlayer, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(shelled.ok).toBe(true);
    expect(isInProgress(shellWorld.rooms["room.yard"].entities.find((e) => e.infra_type === "defensive_work")!)).toBe(
      true,
    );
    const shellScore = await resolveDisruption(shellWorld, shellPlayer);

    const liveWorld = world();
    const livePlayer = principal("player.nacre");
    await run(liveWorld, livePlayer, "ENTER_WORLD");
    liveWorld.players[livePlayer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(liveWorld, livePlayer, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(built.ok).toBe(true);
    const opened = await run(liveWorld, livePlayer, "WAIT");
    expect(opened.ok).toBe(true);
    expect(isInProgress(liveWorld.rooms["room.yard"].entities.find((e) => e.infra_type === "defensive_work")!)).toBe(
      false,
    );
    const liveScore = await resolveDisruption(liveWorld, livePlayer);

    expect(shellScore.contest_id).toBe(liveScore.contest_id);
    expect(shellScore.score_millipoints - liveScore.score_millipoints).toBe(50);
  });

  it("salvages an in-progress defensive work with no scar and no live leftover", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(built.ok).toBe(true);
    const entityId = w.rooms["room.yard"].entities.find((e) => e.infra_type === "defensive_work")!.entity_id;
    const storageBefore = w.players[p.player_id].budgets.storage;
    const torn = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(torn.ok).toBe(true);
    expect(torn.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    expect(w.rooms["room.yard"].entities.find((e) => e.entity_id === entityId)).toBeUndefined();
    expect(String(torn.observation?.consequence || "")).not.toMatch(/A scar remains/);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBefore + 2);

    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "defensive_work" });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
