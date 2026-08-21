import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  parseHumanCommand,
} from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string, controller_type: "human" | "agent" = "human"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${controller_type}.${id}`,
    controller_type,
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(): WorldRuntime {
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
        description: "A live relay and a fragmentary archive.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
            scar: true,
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
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

async function gatherEvidence(w: WorldRuntime, p: PlayerPrincipal, attest = true) {
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  if (attest) {
    const attested = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(attested.ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  const archive = await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" });
  expect(archive.ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const live = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
  expect(live.ok).toBe(true);
  w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
}

describe("GC6-S1 mapper", () => {
  it("parses reconstruct without advertising it in help", () => {
    const parsed = parseHumanCommand(
      'reconstruct entity.relay-7 "abandoned then restored" evidence=archive,inspect private',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("RECONSTRUCT");
    }
    const text = helpText();
    expect(text).toMatch(/KNOWN COMMANDS/);
    expect(text).not.toMatch(/\breconstruct\b|\bquest\b|\battest\b|\bconstruct\b/i);
  });
});

describe("GC6-S1 world integration", () => {
  it("records a contested reconstruction from ATTEST + INSPECT without mutating truth", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre", "human");
    const b = principal("player.vesper", "agent");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await gatherEvidence(w, a);

    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "The relay appears abandoned after damage, then restored later.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PRIVATE",
    });
    expect(recorded.ok).toBe(true);
    expect(recorded.events?.map((e) => e.event_type)).toContain("ENTITY_CREATE");
    expect(recorded.events?.some((e) => /^QUEST|DISCOVERY_|ROLE_/.test(e.event_type))).toBe(false);
    const rec = Object.values(w.reconstructions || {})[0];
    expect(rec.epistemic).toBe("CONTESTED");
    expect(rec.visibility).toBe("PRIVATE");
    const relay = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.relay-7");
    const archive = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.archive-ledger");
    expect(relay).toBeTruthy();
    expect(archive?.archive_claim).toBe("DESTROYED");
    expect(relay?.archive_claim).toBeUndefined();

    const lookA = await run(w, a, "LOOK");
    const lookB = await run(w, b, "LOOK");
    expect(lookA.observation?.reconstruction_lines?.join(" ")).toMatch(/Contested/);
    expect(lookA.observation?.reconstruction_lines?.join(" ")).toMatch(/restored later/);
    expect(lookA.observation?.reconstruction_lines?.join(" ")).not.toMatch(
      /known_truth|quest|oracle|the answer|mystery solved|100%/i,
    );
    expect(lookB.observation?.reconstruction_lines || []).toEqual([]);

    const published = await run(w, a, "RECONSTRUCT_PUBLISH", {
      reconstruction_id: rec.reconstruction_id,
      visibility: "PUBLIC",
    });
    expect(published.ok).toBe(true);
    const lookB2 = await run(w, b, "LOOK");
    expect(lookB2.observation?.reconstruction_lines?.join(" ")).toMatch(/Contested/);
    expect(lookB2.observation?.discovery_lines || []).toEqual([]);
  });

  it("rejects hidden, missing, and foreign-private supersede", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const hidden = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "I guessed the hidden log.",
      evidence: ["ARCHIVE_CLAIM"],
    });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("FORBIDDEN");

    await gatherEvidence(w, a);
    const recorded = await run(w, a, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "Private account.",
      evidence: ["LIVE_INSPECT"],
      visibility: "PRIVATE",
    });
    expect(recorded.ok).toBe(true);
    const recId = Object.keys(w.reconstructions || {})[0];
    const steal = await run(w, b, "RECONSTRUCT_SUPERSEDE", {
      reconstruction_id: recId,
      claim: "I overwrite you.",
    });
    expect(steal.ok).toBe(false);
    expect(steal.error?.code).toBe("FORBIDDEN");

    const revised = await run(w, a, "RECONSTRUCT_SUPERSEDE", {
      reconstruction_id: recId,
      claim: "Revised after another look.",
      evidence: ["LIVE_INSPECT"],
    });
    expect(revised.ok).toBe(true);
    expect(w.reconstructions?.[recId]?.status).toBe("SUPERSEDED");
    const next = Object.values(w.reconstructions || {}).find((r) => r.status === "RECORDED");
    expect(next?.supersedes_reconstruction_id).toBe(recId);
    expect(next?.claim).toMatch(/Revised/);
  });

  it("keeps human and agent compile rules identical", async () => {
    const w = fixtureWorld();
    const human = principal("player.nacre", "human");
    const agent = principal("player.vesper", "agent");
    await run(w, human, "ENTER_WORLD");
    await run(w, agent, "ENTER_WORLD");
    await gatherEvidence(w, human, true);
    await gatherEvidence(w, agent, false);
    const h = await run(w, human, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "Human account.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PUBLIC",
    });
    const a = await run(w, agent, "RECONSTRUCT", {
      subject_ref: "entity.relay-7",
      claim: "Agent account.",
      evidence: ["ARCHIVE_CLAIM", "LIVE_INSPECT"],
      visibility: "PUBLIC",
    });
    expect(h.ok).toBe(true);
    expect(a.ok).toBe(true);
    const recs = Object.values(w.reconstructions || {});
    expect(recs).toHaveLength(2);
    expect(new Set(recs.map((r) => r.epistemic))).toEqual(new Set(["CONTESTED"]));
  });
});
