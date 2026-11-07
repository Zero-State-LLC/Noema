import { describe, expect, it } from "vitest";
import { ATTEST_WORLD_ID, attestChamberState, miniChamberState } from "../src/mini-chamber";
import { bootstrapWorldState } from "../src/world-do";
import { enrichEntity } from "../src/actions";
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
    expect(mini.rooms["room.anchor"].entities.map((e) => e.entity_id)).toEqual(["entity.way-lamp", "entity.acceptance-source", "entity.acceptance-relay"]);
    // D5: the attest seed does not inherit the acceptance additions.
    expect(ids).not.toContain("entity.acceptance-relay");
    expect(ids).not.toContain("entity.acceptance-source");
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

  it("LOOK in an archive-only room still names public infrastructure as ATTEST subject", async () => {
    const w = attestChamberState();
    const a = agent("sable");
    await run(w, a, "ENTER_WORLD");
    w.rooms["room.hall"].entities.push(
      enrichEntity({
        entity_id: "entity.far-ledger",
        label: "far-ledger",
        entity_type: "ARTIFACT",
      }),
    );
    w.players[a.player_id].room_id = "room.hall";
    const look = await run(w, a, "LOOK");
    const hit = (look.observation?.affordances || []).find(
      (x) => x.operation === "ATTEST" && x.target_id === "entity.far-ledger",
    );
    expect(hit?.subject_id).toBe("entity.relay-7");
  });
});

// Local reducer evidence: retain discoverable distant subjects without promising
// executable ATTEST; direct execution must keep the existing refusal policy.
it.each([
  ["distant", "text", "OPERATING"], ["distant", "structured", "OPERATING"],
  ["distant", "text", "DESTROYED"], ["distant", "structured", "DESTROYED"],
  ["colocated", "text", "OPERATING"], ["colocated", "structured", "OPERATING"],
] as const)("#780 %s subject ATTEST through %s with %s has truthful locality", async (placement, route, claim) => {
  const w = attestChamberState();
  const a = agent("attest-subject-probe");
  expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
  w.rooms["room.hall"].entities.push(enrichEntity({ entity_id: "entity.far-ledger", label: "far-ledger", entity_type: "ARTIFACT" }));
  if (placement === "colocated") {
    const at = w.rooms["room.anchor"].entities.findIndex((e) => e.entity_id === "entity.relay-7");
    expect(at).toBeGreaterThanOrEqual(0);
    w.rooms["room.hall"].entities.push(w.rooms["room.anchor"].entities.splice(at, 1)[0]);
  }
  w.players[a.player_id].room_id = "room.hall";
  const look = await run(w, a, "LOOK");
  expect(look.ok).toBe(true);
  const hit = look.observation?.affordances?.find((x) => x.operation === "ATTEST"
    && x.target_id === "entity.far-ledger" && x.subject_id === "entity.relay-7"
    && x.archive_claim === claim);
  expect(hit?.available).toBe(placement === "colocated");
  if (placement === "distant") expect(hit?.reason).toBe("You must be in the same room to attest.");
  expect(hit?.cmd).toBeTruthy();
  const project = () => structuredClone({ sequence: w.sequence, rooms: w.rooms,
    budgets: w.players[a.player_id].budgets, discovery: w.players[a.player_id].discovery,
    evidence_fragments: w.evidence_fragments, unsettled: w.unsettled });
  const before = project();
  const settled: unknown[] = [];
  const result = await applyWorldCommand(w, a, { request_id: "distant-attest-follow", idempotency_key: "distant-attest-follow",
    command: route === "text" ? "LOOK" : "COMMIT",
    arguments: route === "text" ? { line: hit!.cmd } : { operation: hit!.operation,
      entity_id: hit!.target_id, subject_id: hit!.subject_id, archive_claim: hit!.archive_claim },
  }, async (ev) => { settled.push(ev); return true; }, { admission: route === "text" ? "developer" : "hosted" });
  expect(result.ok).toBe(placement === "colocated");
  if (!result.ok) {
    expect(result.error?.code).toBe("NOT_COLOCATED");
    expect(result.events || []).toEqual([]);
    expect(settled).toHaveLength(0);
    expect(project()).toEqual(before);
    return;
  }
  const artifact = w.rooms["room.hall"].entities.find((e) => e.entity_id === hit!.target_id);
  expect(artifact?.archive_subject_entity_id).toBe(hit!.subject_id);
  expect(artifact?.archive_claim).toBe(hit!.archive_claim);
  expect(settled).toHaveLength(1);
  expect(settled[0]).toEqual(expect.objectContaining({ event_type: "ENTITY_UPDATE", payload: expect.objectContaining({
    entity_id: hit!.target_id, subject_entity_id: hit!.subject_id, archive_claim: hit!.archive_claim,
  }) }));
});

it.each(["local", "distant"] as const)("#780 %s ATTEST with no attention preserves the relevant unavailable reason", async (placement) => {
  const w = attestChamberState();
  const a = agent("attest-budget-probe");
  expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
  if (placement === "distant") {
    w.rooms["room.hall"].entities.push(enrichEntity({ entity_id: "entity.far-ledger", label: "far-ledger", entity_type: "ARTIFACT" }));
    w.players[a.player_id].room_id = "room.hall";
  }
  expect((await run(w, a, "LOOK")).ok).toBe(true);
  w.players[a.player_id].budgets.attention = 0;
  const before = structuredClone({ budgets: w.players[a.player_id].budgets, rooms: w.rooms, sequence: w.sequence });
  const observed = await run(w, a, "OBSERVE"); // Actual zero-cost read, not LOOK.
  expect(observed.ok).toBe(true);
  const target = placement === "local" ? "entity.archive-ledger" : "entity.far-ledger";
  const hit = observed.observation?.affordances?.find((x) => x.operation === "ATTEST" && x.target_id === target
    && x.subject_id === "entity.relay-7" && x.archive_claim === "OPERATING");
  expect(hit).toBeDefined();
  expect(hit?.available).toBe(false);
  expect(hit?.reason).toBe(placement === "local" ? "You do not have enough attention." : "You must be in the same room to attest.");
  expect({ budgets: w.players[a.player_id].budgets, rooms: w.rooms, sequence: w.sequence }).toEqual(before);
});
