/**
 * T1.7 / C8 S-MARK-10 on an isolated Chamber-shaped world.
 * Never Perihelion. No Genesis. No new verbs.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { playTextFromObservation } from "../src/play-ui";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(): PlayerPrincipal {
  return {
    player_id: "player.mark",
    agent_id: "agent.mark",
    session_id: "sess.s-mark-10",
    controller_id: "ctrl.mark",
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function chamberWorld(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.s-mark-10",
    world_name: "Chamber Mark",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Relay Quarter",
        description: "A frontier relay. Advanced systems, poor maintenance.",
        exits: [{ direction: "east", to_room_id: "room.transit-ring" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            infra_type: "relay",
            condition: 70,
          }),
        ],
      },
      "room.transit-ring": {
        room_id: "room.transit-ring",
        name: "Transit Ring",
        description: "A thin route east of the relay.",
        exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("S-MARK-10 isolated Chamber", () => {
  it("reaches a rank-1 REPAIR mark in ≤10 acts without Perihelion", async () => {
    const w = chamberWorld();
    const p = principal();
    let acts = 0;

    const entered = await run(w, p, "ENTER_WORLD");
    acts += 1;
    expect(entered.ok).toBe(true);
    expect(w.world_id.startsWith("test.hosted-canonical.")).toBe(true);
    expect(w.world_id).not.toMatch(/perihelion/);

    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, storage: 15 });

    const looked = await run(w, p, "LOOK");
    acts += 1;
    expect(looked.ok).toBe(true);
    const lookText = looked.observation?.play_text || "";
    expect(lookText).toMatch(/Relay Quarter/);
    expect(lookText).toMatch(/STATUS/);
    expect(lookText).toMatch(/Energy /);
    expect(lookText).toMatch(/EXITS/);

    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    acts += 1;
    expect(inspected.ok).toBe(true);

    const repaired = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
    acts += 1;
    expect(repaired.ok).toBe(true);
    const happened = `${repaired.observation?.play_text || ""}\n${repaired.observation?.consequence || ""}`;
    expect(happened).toMatch(/Condition 70% → 8\d%/);
    expect(repaired.observation?.play_text || "").toMatch(/HAPPENED/);
    expect(w.rooms["room.relay-quarter"].entities[0].condition).toBeGreaterThan(70);

    expect(acts).toBeLessThanOrEqual(10);
    expect(acts).toBe(4);
  });

  it("MOVE after the mark still orients the destination without a second LOOK", async () => {
    const w = chamberWorld();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, storage: 15 });
    expect((await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" })).ok).toBe(true);
    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.location?.name).toBe("Transit Ring");
    const moveText = moved.observation?.play_text || "";
    expect(moveText).toMatch(/Transit Ring/);
    expect(moveText).toMatch(/STATUS/);
    // #779 T1.6: STATUS carries Energy plus at least a second budget (Storage / Compute).
    expect(moveText).toMatch(/Energy \d+/);
    expect(moveText).toMatch(/Storage \d+|Compute \d+/);
    expect(moved.events?.some((e) => e.event_type === "LOOK")).toBe(false);
  });

  it("#779 T1.7 post-LEAVE mark persists for an independent second principal entering the room", async () => {
    const w = chamberWorld();
    const p1 = principal();
    const p2: PlayerPrincipal = {
      ...principal(),
      player_id: "player.rhea",
      agent_id: "agent.rhea",
      session_id: "sess.rhea",
      controller_id: "ctrl.rhea",
    };
    expect((await run(w, p1, "ENTER_WORLD")).ok).toBe(true);
    w.players[p1.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, storage: 15 });
    expect((await run(w, p1, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" })).ok).toBe(true);
    expect((await run(w, p1, "LEAVE_WORLD")).ok).toBe(true);

    expect((await run(w, p2, "ENTER_WORLD")).ok).toBe(true);
    const look = await run(w, p2, "LOOK");
    expect(look.ok).toBe(true);
    expect(w.rooms["room.relay-quarter"].entities[0].condition).toBeGreaterThan(70);
    expect(
      (look.observation?.location?.traces || []).some((t) => /maintenance plate/i.test(t.text)),
    ).toBe(true);
  });

  it("#779 T1.2 equivalent observation renders deterministic section order (Room -> STATUS -> EXITS)", async () => {
    const w = chamberWorld();
    const p = principal();
    expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
    const looked = await run(w, p, "LOOK");
    expect(looked.ok).toBe(true);
    const obs = looked.observation!;
    const a = playTextFromObservation(obs);
    const b = playTextFromObservation({
      ...obs,
      location: obs.location
        ? {
            ...obs.location,
            exits: [...(obs.location.exits || [])].reverse(),
            entities: [...(obs.location.entities || [])].reverse(),
          }
        : undefined,
    });
    expect(a.indexOf("Relay Quarter")).toBeGreaterThanOrEqual(0);
    expect(a.indexOf("STATUS")).toBeGreaterThan(a.indexOf("Relay Quarter"));
    expect(a.indexOf("EXITS")).toBeGreaterThan(a.indexOf("STATUS"));
    expect(b.indexOf("STATUS")).toBeGreaterThan(b.indexOf("Relay Quarter"));
    expect(b.indexOf("EXITS")).toBeGreaterThan(b.indexOf("STATUS"));
  });
});
