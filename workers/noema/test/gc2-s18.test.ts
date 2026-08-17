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
    world_id: "test.hosted-canonical.gc2-s18",
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
            entity_id: "entity.tablet",
            label: "old-tablet",
            entity_type: "ARTIFACT",
            condition: 80,
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

describe("GC2-S18 mapper", () => {
  it("keeps relay as MULTI_CYCLE_CLASS, adds archive_annex, and stays silent", () => {
    expect(MULTI_CYCLE_CLASS).toBe("relay");
    expect(isMultiCycleClass("archive_annex")).toBe(true);
    expect(isMultiCycleClass("route_link")).toBe(true);
    expect(
      liveClassInRoom(
        [{ entity_id: "a", label: "annex", entity_type: "INFRASTRUCTURE", infra_type: "archive_annex", in_progress: true }],
        "archive_annex",
      ),
    ).toBe(true);
    expect(
      readyClassInRoom(
        [{ entity_id: "a", label: "annex", entity_type: "INFRASTRUCTURE", infra_type: "archive_annex", in_progress: true }],
        "archive_annex",
      ),
    ).toBe(false);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "PROMOTE" })).toBeNull();
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
  });
});

describe("GC2-S18 world path", () => {
  it("constructs an IN_PROGRESS annex, then the same entity_id goes live after one WAIT", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/under construction/);
    expect(built.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_CREATE"]);
    expect(built.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    const created = w.rooms["room.yard"].entities.find((e) => e.infra_type === "archive_annex")!;
    expect(isInProgress(created)).toBe(true);
    expect(liveClassInRoom(w.rooms["room.yard"].entities, "archive_annex")).toBe(true);
    expect(readyClassInRoom(w.rooms["room.yard"].entities, "archive_annex")).toBe(false);

    const again = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("SLOT_OCCUPIED");

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    expect(w.cycle).toBe(1);
    const same = w.rooms["room.yard"].entities.find((e) => e.entity_id === created.entity_id)!;
    expect(isInProgress(same)).toBe(false);
    expect(readyClassInRoom(w.rooms["room.yard"].entities, "archive_annex")).toBe(true);
    expect(waited.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/STRUCTURE_/);
  });

  it("does not discount INSPECT or ATTEST until the same annex is live", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(built.ok).toBe(true);
    expect(isInProgress(w.rooms["room.yard"].entities.find((e) => e.infra_type === "archive_annex")!)).toBe(true);

    const beforeShell = w.players[p.player_id].budgets.attention;
    const shelled = await run(w, p, "INSPECT", { entity_id: "entity.tablet" });
    expect(shelled.ok).toBe(true);
    expect(beforeShell - w.players[p.player_id].budgets.attention).toBe(2);

    const opened = await run(w, p, "WAIT");
    expect(opened.ok).toBe(true);
    expect(isInProgress(w.rooms["room.yard"].entities.find((e) => e.infra_type === "archive_annex")!)).toBe(false);

    const beforeLive = w.players[p.player_id].budgets.attention;
    const looked = await run(w, p, "INSPECT", { entity_id: "entity.tablet" });
    expect(looked.ok).toBe(true);
    expect(beforeLive - w.players[p.player_id].budgets.attention).toBe(1);

    const beforeAttest = w.players[p.player_id].budgets.attention;
    const attested = await run(w, p, "COMMIT", {
      operation: "ATTEST",
      entity_id: "entity.tablet",
      subject_entity_id: "entity.tablet",
      archive_claim: "OPERATING",
    });
    expect(attested.ok).toBe(true);
    expect(beforeAttest - w.players[p.player_id].budgets.attention).toBe(1);
  });

  it("salvages an in-progress annex with no scar and no live leftover", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(built.ok).toBe(true);
    const entityId = w.rooms["room.yard"].entities.find((e) => e.infra_type === "archive_annex")!.entity_id;
    const storageBefore = w.players[p.player_id].budgets.storage;
    const torn = await run(w, p, "BUILD", { operation: "DISMANTLE", entity_id: entityId });
    expect(torn.ok).toBe(true);
    expect(torn.events?.some((e) => /^STRUCTURE_/.test(e.event_type))).toBe(false);
    expect(w.rooms["room.yard"].entities.find((e) => e.entity_id === entityId)).toBeUndefined();
    expect(String(torn.observation?.consequence || "")).not.toMatch(/A scar remains/);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBefore + 2);

    w.players[p.player_id].room_id = "room.vault";
    const hidden = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "archive_annex" });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
