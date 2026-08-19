/**
 * P0 GC textures already in contract, visible in PLAY observation.
 * No new verbs. No Admin spawn. Isolated fixture worlds only.
 */
import { describe, expect, it } from "vitest";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { CUSTOM_LINE } from "../src/culture";
import { DELAYED_MESSAGE, UNREACHABLE_MESSAGE, UNREACHABLE_REASON } from "../src/communication";
import { renderLookHtml } from "../src/play-ui";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.p0",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `p0.${command}.${Math.random().toString(36).slice(2, 7)}`,
    idempotency_key: `p0.${command}.${Math.random().toString(36).slice(2, 7)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function twoRoomWorld(condition: number): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc-texture-p0",
    world_name: "Texture",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Here.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "East",
        description: "Away.",
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

describe("P0 GC5 relay MESSAGE bands in PLAY", () => {
  it("same-room MESSAGE is immediate; worn relay delays long-range; dead relay is UNREACHABLE", async () => {
    const worn = twoRoomWorld(25);
    const a = principal("player.a");
    const b = principal("player.b");
    await run(worn, a, "ENTER_WORLD");
    await run(worn, b, "ENTER_WORLD");
    const local = await run(worn, a, "MESSAGE", { recipient_id: b.player_id, text: "here" });
    expect(local.ok).toBe(true);
    expect(local.observation?.consequence).not.toBe(DELAYED_MESSAGE);

    await run(worn, a, "MOVE", { direction: "east" });
    const delayed = await run(worn, a, "MESSAGE", { recipient_id: b.player_id, text: "hold" });
    expect(delayed.ok).toBe(true);
    expect(delayed.observation?.consequence).toBe(DELAYED_MESSAGE);

    const dead = twoRoomWorld(24);
    await run(dead, a, "ENTER_WORLD");
    await run(dead, b, "ENTER_WORLD");
    await run(dead, a, "MOVE", { direction: "east" });
    const unreachable = await run(dead, a, "MESSAGE", { recipient_id: b.player_id, text: "hold" });
    expect(unreachable.ok).toBe(false);
    expect(unreachable.error?.code).toBe(UNREACHABLE_REASON);
    expect(unreachable.error?.message).toBe(UNREACHABLE_MESSAGE);
  });
});

describe("P0 GC9 maintenance custom in PLAY", () => {
  it("three REPAIRs put CUSTOM_LINE on LOOK; play-ui renders it", async () => {
    const w = twoRoomWorld(40);
    const p = principal("player.fixer");
    await run(w, p, "ENTER_WORLD");
    for (let i = 0; i < 3; i++) {
      w.players[p.player_id].budgets = cloneBudgets({
        ...DEFAULT_BUDGETS,
        energy: 80,
        compute: 64,
        storage: 16,
      });
      const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-7" });
      expect(r.ok).toBe(true);
    }
    const look = await run(w, p, "LOOK");
    expect(look.observation?.culture_lines).toEqual([CUSTOM_LINE]);
    const html = renderLookHtml({
      name: "Hub",
      description: "Here.",
      cultureLine: (look.observation?.culture_lines || [])[0],
    });
    expect(html).toContain(CUSTOM_LINE);
    expect(html).toContain('id="loc-custom"');
    expect(html).not.toMatch(/id="loc-custom" hidden/);
    expect(COSTS.REPAIR).toBeTruthy();
  });
});
