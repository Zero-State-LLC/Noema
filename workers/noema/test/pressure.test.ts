import { describe, expect, it } from "vitest";
import {
  ACCESS_DURATION_CYCLES,
  ACCESS_FIRST_CYCLE,
  CONDITION_DELTA,
  FIRST_CYCLE,
  MIN_CONDITION_AFTER,
  MIN_STOCK_BEFORE,
  PREFERRED_NODE_ID,
  PREFERRED_RELAY_ID,
  RESOURCE_FIRST_CYCLE,
  STOCK_DELTA,
  WATCH_ACCESS_PULSE,
  WATCH_INFRA_PULSE,
  WATCH_RESOURCE_PULSE,
  adminPressureView,
  classDue,
  isMild,
  previewAfter,
  previewStockAfter,
  publicPressurePulses,
  scheduleDue,
  selectScheduleNode,
  selectScheduleRelay,
} from "../src/pressure";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { CUSTOM_LINE } from "../src/culture";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC10-S0 seeded mild relay pressure.
 * Authority: Noema-Specs docs/GC10-FIRST-SLICE.md / RFC-0014.
 */

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

function fixtureWorld(condition = 70): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: PREFERRED_RELAY_ID,
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition,
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

async function waitTo(w: WorldRuntime, p: PlayerPrincipal, cycle: number) {
  let last = await run(w, p, "LOOK");
  while (w.cycle < cycle) {
    last = await run(w, p, "WAIT");
    expect(last.ok).toBe(true);
  }
  return last;
}

describe("GC10-S0 mapper", () => {
  it("previews 70→55 and rejects a non-mild drop", () => {
    expect(previewAfter(70)).toBe(55);
    expect(previewAfter(70)).toBe(70 - CONDITION_DELTA);
    expect(isMild(55)).toBe(true);
    expect(isMild(previewAfter(39))).toBe(false);
    expect(previewAfter(39)).toBeLessThan(MIN_CONDITION_AFTER);
    expect(scheduleDue(3, 0)).toBe(false);
    expect(scheduleDue(FIRST_CYCLE, 0)).toBe(true);
    expect(scheduleDue(4, 1)).toBe(false);
    expect(
      selectScheduleRelay([
        {
          entity_id: PREFERRED_RELAY_ID,
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
          condition: 35,
          room_id: "room.hub",
        },
      ]),
    ).toBeNull();
  });

  it("does not advertise WED or the research class", () => {
    const text = helpText();
    expect(text).not.toMatch(/\bWED\b/);
    expect(text).not.toMatch(/infrastructure_failure/i);
    expect(text).not.toMatch(/Event:/i);
  });
});

describe("GC10-S0 schedule", () => {
  it("drops the seed relay 70→55 on cycle 4 via ENTITY_UPDATE once", async () => {
    const w = fixtureWorld(70);
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const early = await waitTo(w, p, 3);
    expect(w.cycle).toBe(3);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(70);
    expect(early.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(false);

    const fired = await run(w, p, "WAIT");
    expect(w.cycle).toBe(4);
    expect(fired.observation?.consequence).toBe("You wait.");
    const blob = JSON.stringify(fired.observation);
    expect(blob).not.toMatch(/WED|infrastructure_failure|Event:/i);
    const update = fired.events?.find((e) => e.event_type === "ENTITY_UPDATE");
    expect(update?.payload).toMatchObject({
      entity_id: PREFERRED_RELAY_ID,
      field: "condition",
      from: 70,
      to: 55,
      authorizer: "schedule",
      preview_after: 55,
    });
    expect(update?.event_type).not.toMatch(/^WED_|SITUATION_INJECTED$/);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(55);
    expect(w.pressure?.schedule_activations).toBe(1);

    const later = await waitTo(w, p, 6);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(55);
    expect(later.events?.filter((e) => e.event_type === "ENTITY_UPDATE")).toHaveLength(0);
    expect(w.pressure?.schedule_activations).toBe(1);
  });

  it("skips a scarred relay that would fall below 25; REPAIR still works", async () => {
    const w = fixtureWorld(35);
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 4);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(35);
    expect(w.pressure?.schedule_activations || 0).toBe(0);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].budgets.storage = 15;
    const repair = await run(w, p, "COMMIT", {
      operation: "REPAIR",
      entity_id: PREFERRED_RELAY_ID,
    });
    expect(repair.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(50);
    expect(repair.observation?.culture_lines || []).not.toContain(CUSTOM_LINE);
  });
});

function s1World(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.spoke" }],
        entities: [
          enrichEntity({
            entity_id: PREFERRED_RELAY_ID,
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.spoke": {
        room_id: "room.spoke",
        name: "East Spoke",
        description: "A public corridor.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [
          enrichEntity({
            entity_id: PREFERRED_NODE_ID,
            label: "storage-cell-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "energy",
            stock_amount: 8,
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

describe("GC10-S1 mapper", () => {
  it("previews resource 8→4 and gates access/resource windows", () => {
    expect(previewStockAfter(8)).toBe(8 - STOCK_DELTA);
    expect(previewStockAfter(8)).toBe(4);
    expect(classDue(7, "resource_scarcity", 0)).toBe(false);
    expect(classDue(RESOURCE_FIRST_CYCLE, "resource_scarcity", 0)).toBe(true);
    expect(classDue(RESOURCE_FIRST_CYCLE, "resource_scarcity", 1)).toBe(false);
    expect(classDue(11, "access_restriction", 0)).toBe(false);
    expect(classDue(ACCESS_FIRST_CYCLE, "access_restriction", 0)).toBe(true);
    expect(
      selectScheduleNode([
        {
          entity_id: PREFERRED_NODE_ID,
          label: "storage-cell-cache",
          room_id: "room.spoke",
          stock_amount: 3,
        },
      ]),
    ).toBeNull();
    expect(
      selectScheduleRelay([
        {
          entity_id: PREFERRED_RELAY_ID,
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
          condition: 70,
          room_id: "room.hub",
        },
      ])?.entity_id,
    ).toBe(PREFERRED_RELAY_ID);
  });

  it("does not advertise WED or S1 class names", () => {
    const text = helpText();
    expect(text).not.toMatch(/\bWED\b/);
    expect(text).not.toMatch(/resource_scarcity|access_restriction|infrastructure_failure/i);
    expect(text).not.toMatch(/Event:/i);
  });
});

describe("GC10-S1 schedule", () => {
  it("drops harvest stock 8→4 on cycle 8 via ENTITY_UPDATE once", async () => {
    const w = s1World();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 7);
    const node = w.rooms["room.spoke"].entities[0];
    expect(node.stock_amount).toBe(8);
    const fired = await run(w, p, "WAIT");
    expect(w.cycle).toBe(8);
    const update = fired.events?.find(
      (e) => e.event_type === "ENTITY_UPDATE" && e.payload?.field === "stock_amount",
    );
    expect(update?.payload).toMatchObject({
      entity_id: PREFERRED_NODE_ID,
      field: "stock_amount",
      from: 8,
      to: 4,
      authorizer: "schedule",
      preview_after: 4,
    });
    expect(w.rooms["room.spoke"].entities[0].stock_amount).toBe(4);
    expect(w.pressure?.class_activations?.resource_scarcity).toBe(1);
    await waitTo(w, p, 10);
    expect(w.rooms["room.spoke"].entities[0].stock_amount).toBe(4);
    expect(w.pressure?.class_activations?.resource_scarcity).toBe(1);
  });

  it("restricts the public east exit at cycle 12 and expires by world-time", async () => {
    const w = s1World();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 12);
    expect(w.pressure?.class_activations?.access_restriction).toBe(1);
    const move = await run(w, p, "MOVE", { direction: "east" });
    expect(move.ok).toBe(false);
    expect(String(move.error?.message || "")).toMatch(/restricted/i);
    await waitTo(w, p, 12 + ACCESS_DURATION_CYCLES + 1);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const later = await run(w, p, "MOVE", { direction: "east" });
    expect(later.ok).toBe(true);
    expect(w.players[p.player_id].room_id).toBe("room.spoke");
  });

  it("applies equally to human and agent controllers", async () => {
    const w = s1World();
    const human = principal("player.nacre");
    const agent: PlayerPrincipal = {
      ...principal("player.vesper"),
      controller_type: "agent",
      controller_id: "ctrl.agent.vesper",
    };
    await run(w, human, "ENTER_WORLD");
    await waitTo(w, human, 8);
    await run(w, agent, "ENTER_WORLD");
    expect(w.rooms["room.spoke"].entities[0].stock_amount).toBe(4);
    const h = await run(w, human, "LOOK");
    const a = await run(w, agent, "LOOK");
    expect(JSON.stringify(h.observation)).not.toMatch(/resource_scarcity|WED|Event:/i);
    expect(JSON.stringify(a.observation)).not.toMatch(/resource_scarcity|WED|Event:/i);
    expect(w.rooms["room.spoke"].entities[0].stock_amount).toBe(4);
  });

  it("WATCH pulses name consequences, not classes; Admin keeps provenance", async () => {
    const w = s1World();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 12);
    const pulses = publicPressurePulses(w.pressure, w.cycle);
    expect(pulses).toContain(WATCH_INFRA_PULSE);
    expect(pulses).toContain(WATCH_RESOURCE_PULSE);
    expect(pulses).toContain(WATCH_ACCESS_PULSE);
    expect(JSON.stringify(pulses) ?? "").not.toMatch(/\bWED\b|resource_scarcity|access_restriction|infrastructure_failure|gc10/i);
    const admin = adminPressureView(w.pressure);
    expect(admin.catalog_id).toBe("pressure-catalog/gc10-s1");
    expect(admin.rule_version).toBe("gc10-s1");
    expect((admin.classes as { resource_scarcity: { activations: number } }).resource_scarcity.activations).toBe(1);
    expect(w.unsettled.some((e) => /^WED_|PRESSURE_/.test(e.event_type ?? ""))).toBe(false);
  });

  it("skips a depleted node instead of adapting magnitude", async () => {
    const w = s1World();
    w.rooms["room.spoke"].entities[0].stock_amount = MIN_STOCK_BEFORE - 1;
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 8);
    expect(w.rooms["room.spoke"].entities[0].stock_amount).toBe(MIN_STOCK_BEFORE - 1);
    expect(w.pressure?.class_activations?.resource_scarcity || 0).toBe(0);
  });

  it("does not emit a contest verdict", async () => {
    const w = s1World();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    await waitTo(w, p, 11);
    const fired = await run(w, p, "WAIT");
    expect(w.cycle).toBe(12);
    const types = (fired.events || []).map((e) => e.event_type);
    expect(types).not.toContain("CONTEST_RESOLVED");
    expect(types).toContain("ACCESS_RESTRICTED");
    expect(types).not.toContain("PRESSURE_STARTED");
  });
});
