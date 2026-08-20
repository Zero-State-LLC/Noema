import { describe, expect, it } from "vitest";
import { ATTEST_WORLD_ID, attestChamberState, miniChamberState } from "../src/mini-chamber";
import { bootstrapWorldState } from "../src/world-do";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id = "nacre"): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.attest-${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
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
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("isolated attest-s0", () => {
  it("bootstraps a colocated archive pair and is not Perihelion", () => {
    const w = bootstrapWorldState(ATTEST_WORLD_ID);
    expect(w.world_id).toBe(ATTEST_WORLD_ID);
    expect(w.world_id).not.toMatch(/perihelion/i);
    const ids = w.rooms["room.anchor"].entities.map((e) => e.entity_id);
    expect(ids).toContain("entity.archive-ledger");
    expect(ids).toContain("entity.relay-7");
    const mini = miniChamberState("test.hosted-canonical.c04");
    expect(mini.rooms["room.anchor"].entities.map((e) => e.entity_id)).toEqual(["entity.way-lamp"]);
  });

  it("LOOK advertises ATTEST; structured COMMIT stamps a public claim", async () => {
    const w = attestChamberState();
    const a = agent();
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    const look = await run(w, a, "LOOK");
    const hit = (look.observation?.affordances || []).find(
      (x) =>
        x.operation === "ATTEST" &&
        x.target_id === "entity.archive-ledger" &&
        x.archive_claim === "OPERATING",
    );
    expect(hit?.subject_id).toBe("entity.relay-7");
    expect(look.observation?.available_actions).toContain("ATTEST");
    const stamped = await run(w, a, "COMMIT", {
      operation: "ATTEST",
      entity_id: hit?.target_id,
      subject_id: hit?.subject_id,
      archive_claim: hit?.archive_claim,
    });
    expect(stamped.ok).toBe(true);
    const art = w.rooms["room.anchor"].entities.find((e) => e.entity_id === "entity.archive-ledger");
    expect(art?.archive_claim).toBe("OPERATING");
    expect(art?.archive_subject_entity_id).toBe("entity.relay-7");
    const after = await run(w, a, "LOOK");
    expect((after.observation?.affordances || []).some((x) => x.operation === "ATTEST")).toBe(false);
  });
});
