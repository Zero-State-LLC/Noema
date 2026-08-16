import { describe, expect, it } from "vitest";
import { applyWorldCommand, migrateWorldRuntime, type WorldRuntime } from "../../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../../src/types";
import {
  MINI_HALL_ROOM_ID,
  miniChamberState,
} from "./mini-chamber";

function principal(id = "player.probe"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.hosted-h5",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

async function run(
  w: WorldRuntime,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
  p: PlayerPrincipal = principal(),
) {
  const envl: CommandEnvelope = {
    request_id: key || `req.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `idem.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

/** Same payload world-do writes via storage.put("world"). Not a Cloudflare isolate restart. */
function reloadFromStorage(world: WorldRuntime): WorldRuntime {
  const restored = JSON.parse(JSON.stringify(world)) as WorldRuntime;
  migrateWorldRuntime(restored);
  return restored;
}

describe("C15 world persistence across restart", () => {
  it("reloads world_id, sequence, and room after a storage snapshot", async () => {
    const live = miniChamberState("test.hosted-canonical.c15");
    const p = principal();
    await run(live, "ENTER_WORLD", {}, "enter.c15", p);
    const moved = await run(live, "MOVE", { direction: "east" }, "move.c15", p);
    expect(moved.ok).toBe(true);
    expect(live.players[p.player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    const seq = live.sequence;
    const worldId = live.world_id;

    const restored = reloadFromStorage(live);
    expect(restored).not.toBe(live);
    expect(restored.world_id).toBe(worldId);
    expect(restored.world_id).toMatch(/^test\.hosted-canonical\./);
    expect(restored.sequence).toBe(seq);
    expect(restored.players[p.player_id].entered).toBe(true);
    expect(restored.players[p.player_id].room_id).toBe(MINI_HALL_ROOM_ID);
    expect(JSON.stringify(restored)).not.toMatch(/perihelion|civic-exchange/i);
  });
});

describe("C26 strategic persistence across restart", () => {
  it("keeps org and budget fields after the same isolated snapshot", async () => {
    const live = miniChamberState("test.hosted-canonical.c26");
    const p = principal();
    await run(live, "ENTER_WORLD", {}, "enter.c26", p);
    const formed = await run(
      live,
      "COMMIT",
      { operation: "ORG_CREATE", name: "Anchor Compact", charter: "local coordination" },
      "org.c26",
      p,
    );
    expect(formed.ok).toBe(true);
    const orgIds = Object.keys(live.organizations);
    expect(orgIds.length).toBe(1);
    const orgId = orgIds[0];
    const energy = live.players[p.player_id].budgets.energy;
    const influence = live.players[p.player_id].budgets.influence;

    const restored = reloadFromStorage(live);
    expect(restored.world_id).toBe("test.hosted-canonical.c26");
    expect(Object.keys(restored.organizations)).toEqual([orgId]);
    expect(restored.organizations[orgId].name).toBe("Anchor Compact");
    expect(restored.organizations[orgId].charter).toBe("local coordination");
    expect(restored.organizations[orgId].status).toBe("ACTIVE");
    expect(restored.players[p.player_id].budgets.energy).toBe(energy);
    expect(restored.players[p.player_id].budgets.influence).toBe(influence);
    expect(JSON.stringify(restored)).not.toMatch(/perihelion|civic-exchange/i);
  });
});
