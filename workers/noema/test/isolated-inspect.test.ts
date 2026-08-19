import { describe, expect, it } from "vitest";
import { miniChamberState } from "../src/mini-chamber";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id = "player.inspect"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.inspect-s0",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
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

describe("isolated inspect-s0", () => {
  it("ENTER LOOK INSPECT way-lamp on mini chamber, not Perihelion", async () => {
    const w = miniChamberState("test.hosted-canonical.inspect-s0");
    const p = principal();
    expect(w.world_id).toBe("test.hosted-canonical.inspect-s0");
    expect(w.world_id.startsWith("test.hosted-canonical.")).toBe(true);
    expect(w.world_id).not.toBe("world.perihelion-reach");
    expect(w.world_id).not.toMatch(/perihelion/i);

    const entered = await run(w, p, "ENTER_WORLD");
    expect(entered.ok).toBe(true);
    expect(entered.observation?.location?.room_id).toBe("room.anchor");

    const looked = await run(w, p, "LOOK");
    expect(looked.ok).toBe(true);
    expect(looked.observation?.location?.entities.map((e) => e.entity_id)).toContain("entity.way-lamp");

    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.way-lamp" });
    expect(inspected.ok).toBe(true);
    expect(w.world_id).toBe("test.hosted-canonical.inspect-s0");
  });
});
