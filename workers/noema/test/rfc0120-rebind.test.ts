import { describe, expect, it } from "vitest";
import { playerIdFromDeviceController } from "../src/device-enrollment";
import {
  applyWorldCommand,
  evictLeftoverHumanOccupancy,
  rebindDeviceAgentOccupancy,
  type WorldRuntime,
} from "../src/world-actions";
import { miniChamberState, MINI_ENTRY_ROOM_ID } from "../src/mini-chamber";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(opts: { player_id: string; controller_id: string }): PlayerPrincipal {
  return {
    player_id: opts.player_id,
    agent_id: `agent.${opts.player_id.replace(/^player\./, "")}`,
    session_id: "sess.rebind",
    controller_id: opts.controller_id,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "controller_token",
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}`,
    idempotency_key: `i.${command}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("RFC-0120 live CONNECT rebind", () => {
  it("derives Agent Player id from a device Controller", () => {
    expect(playerIdFromDeviceController("ctrl.device.abc123def456")).toBe("player.deviceabc123def456");
    expect(playerIdFromDeviceController("ctrl.agent.nacre")).toBeNull();
  });

  it("moves leftover human occupancy onto the device Agent Player", async () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-rebind");
    const oldId = "player.ada";
    const controller_id = "ctrl.device.aabbccddeeff";
    const canonical = playerIdFromDeviceController(controller_id)!;
    w.players[oldId] = {
      room_id: MINI_ENTRY_ROOM_ID,
      entered: true,
      budgets: { attention: 8, compute: 8, energy: 8, influence: 8, storage: 8 },
      handle: "ada",
      controller_type: "agent",
    };
    const p = agent({ player_id: oldId, controller_id });
    const look = await run(w, p, "LOOK");
    expect(look.ok).toBe(true);
    expect(look.observation?.player_id).toBe(canonical);
    expect(w.players[oldId]).toBeUndefined();
    expect(w.players[canonical]?.entered).toBe(true);
    expect(w.players[canonical]?.controller_type).toBe("agent");
  });

  it("evicts leftover human/hybrid inhabit rows on migrate", () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-evict");
    w.players["player.human"] = {
      room_id: MINI_ENTRY_ROOM_ID,
      entered: true,
      budgets: { attention: 4, compute: 4, energy: 4, influence: 4, storage: 4 },
      handle: "watcher",
      controller_type: "human",
    };
    evictLeftoverHumanOccupancy(w, "player.hermes");
    expect(w.players["player.human"].entered).toBe(false);
  });

  it("rebind is a no-op for admin-minted agent controllers", () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-admin");
    const p = agent({ player_id: "player.nacre", controller_id: "ctrl.agent.nacre" });
    const next = rebindDeviceAgentOccupancy(w, p);
    expect(next.player_id).toBe("player.nacre");
  });
});
