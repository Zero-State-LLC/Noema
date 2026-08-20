import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.reconstruct-look",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A live relay and a fragmentary archive.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
          }),
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "black-archive",
            entity_type: "ARTIFACT",
          }),
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    reconstructions: {},
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

async function gatherEvidence(w: WorldRuntime, p: PlayerPrincipal) {
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect(
    (
      await run(w, p, "ATTEST", {
        entity_id: "entity.archive-ledger",
        subject_entity_id: "entity.relay-7",
        archive_claim: "DESTROYED",
      })
    ).ok,
  ).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, p, "INSPECT", { entity_id: "entity.relay-7" })).ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

describe("agent RECONSTRUCT affordances", () => {
  it("LOOK lists RECONSTRUCT only after evidence; structured COMMIT records it", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = await run(w, a, "LOOK");
    expect((before.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT")).toBe(false);

    await gatherEvidence(w, a);
    const look = await run(w, a, "LOOK");
    const hit = (look.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT" && x.subject_ref === "entity.relay-7",
    );
    expect(hit?.claim).toBeTruthy();
    expect(hit?.evidence?.length).toBeGreaterThan(0);
    expect(look.observation?.available_actions).toContain("RECONSTRUCT");
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT")).toBe(false);

    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: hit?.subject_ref,
      claim: hit?.claim,
      evidence: hit?.evidence,
      visibility: hit?.visibility,
    });
    expect(recorded.ok).toBe(true);
    const rec = Object.values(w.reconstructions || {})[0];
    expect(rec.subject_ref).toBe("entity.relay-7");
    expect(rec.status).toBe("RECORDED");
  });

  it("LOOK lists PUBLISH and SUPERSEDE for the author; stranger cannot", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await gatherEvidence(w, a);
    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "The relay appears abandoned after damage.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PRIVATE",
    });
    expect(recorded.ok).toBe(true);
    const recId = Object.keys(w.reconstructions || {})[0];

    const lookA = await run(w, a, "LOOK");
    const publish = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT_PUBLISH" && x.reconstruction_id === recId,
    );
    const revise = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "RECONSTRUCT_SUPERSEDE" && x.reconstruction_id === recId,
    );
    expect(publish?.visibility).toBe("PUBLIC");
    expect(revise?.claim).toBeTruthy();
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT_PUBLISH")).toBe(false);
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "RECONSTRUCT_SUPERSEDE")).toBe(false);

    const published = await run(w, a, "RECONSTRUCT_PUBLISH", {
      reconstruction_id: publish?.reconstruction_id,
      visibility: publish?.visibility,
    });
    expect(published.ok).toBe(true);
    expect(w.reconstructions?.[recId]?.visibility).toBe("PUBLIC");

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const revised = await run(w, a, "RECONSTRUCT_SUPERSEDE", {
      reconstruction_id: revise?.reconstruction_id,
      claim: revise?.claim,
      evidence: revise?.evidence,
    });
    expect(revised.ok).toBe(true);
    expect(w.reconstructions?.[recId]?.status).toBe("SUPERSEDED");
  });
});
