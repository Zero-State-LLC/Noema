import { describe, expect, it } from "vitest";
import {
  CONDITION_DELTA,
  FIRST_CYCLE,
  MIN_CONDITION_AFTER,
  PREFERRED_RELAY_ID,
  isMild,
  previewAfter,
  scheduleDue,
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
    const repair = await run(w, p, "COMMIT", {
      operation: "REPAIR",
      entity_id: PREFERRED_RELAY_ID,
    });
    expect(repair.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBe(50);
    expect(repair.observation?.culture_lines || []).not.toContain(CUSTOM_LINE);
  });
});
