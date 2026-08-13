import { describe, expect, it } from "vitest";
import {
  CONFLICT_LINE,
  applyInspectEvidence,
  discoveryLines,
  emptyDiscovery,
  explicitArchiveRecord,
} from "../src/discovery";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("GC6-S0 mapper", () => {
  it("requires both explicit ARTIFACT fields and ignores flavor text", () => {
    expect(
      explicitArchiveRecord({
        entity_type: "ARTIFACT",
        archive_subject_entity_id: "entity.relay-7",
        archive_claim: "DESTROYED",
      }),
    ).toEqual({ subject_entity_id: "entity.relay-7", claim: "DESTROYED" });
    expect(
      explicitArchiveRecord({
        entity_type: "ARTIFACT",
        archive_subject_entity_id: "entity.relay-7",
      }),
    ).toBeNull();
    expect(
      explicitArchiveRecord({
        entity_id: "entity.archive-ledger",
        entity_type: "ARTIFACT",
        label: "This archive says Relay Seven was destroyed",
      } as { entity_type: string }),
    ).toBeNull();
    expect(
      explicitArchiveRecord({
        entity_type: "INFRASTRUCTURE",
        archive_subject_entity_id: "entity.relay-7",
        archive_claim: "DESTROYED",
      }),
    ).toBeNull();
  });

  it("projects the conflict line only when archive and inspect disagree", () => {
    let state = emptyDiscovery();
    expect(discoveryLines(state)).toEqual([]);
    state = applyInspectEvidence(state, {
      entity_id: "entity.archive-ledger",
      entity_type: "ARTIFACT",
      archive_subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(discoveryLines(state)).toEqual([]);
    state = applyInspectEvidence(state, {
      entity_id: "entity.relay-7",
      entity_type: "INFRASTRUCTURE",
    });
    expect(discoveryLines(state)).toEqual([CONFLICT_LINE]);
    expect(CONFLICT_LINE).not.toMatch(/known_truth|quest|oracle|you are wrong|the answer/i);
  });

  it("stays silent when claims agree", () => {
    let state = emptyDiscovery();
    state = applyInspectEvidence(state, {
      entity_id: "entity.archive-ledger",
      entity_type: "ARTIFACT",
      archive_subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
    });
    state = applyInspectEvidence(state, {
      entity_id: "entity.relay-7",
      entity_type: "INFRASTRUCTURE",
    });
    expect(discoveryLines(state)).toEqual([]);
  });
});

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

function fixtureWorld(opts?: { withClaim?: boolean }) {
  const archive = enrichEntity({
    entity_id: "entity.archive-ledger",
    label: "black-archive says the relay was destroyed",
    entity_type: "ARTIFACT",
    ...(opts?.withClaim
      ? { archive_subject_entity_id: "entity.relay-7", archive_claim: "DESTROYED" as const }
      : {}),
  });
  const relay = enrichEntity({
    entity_id: "entity.relay-7",
    label: "relay-7",
    entity_type: "INFRASTRUCTURE",
  });
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Relay Quarter",
        description: "A live relay and a fragmentary archive.",
        exits: [],
        entities: [relay, archive],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  } as WorldRuntime;
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

describe("GC6-S0 world projection", () => {
  it("shows the conflict line only after both named members exist", async () => {
    const w = fixtureWorld({ withClaim: true });
    const nacre = principal("player.nacre");
    const vesper = principal("player.vesper");
    await run(w, nacre, "ENTER_WORLD");
    await run(w, vesper, "ENTER_WORLD");
    w.players[nacre.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const inspectOnly = await run(w, nacre, "INSPECT", { entity_id: "entity.relay-7" });
    expect(inspectOnly.ok).toBe(true);
    expect(inspectOnly.observation?.discovery_lines || []).toEqual([]);

    const both = await run(w, nacre, "INSPECT", { entity_id: "entity.archive-ledger" });
    expect(both.ok).toBe(true);
    expect(both.observation?.discovery_lines).toEqual([CONFLICT_LINE]);
    expect((both.observation?.discovery_lines || []).join(" ")).not.toMatch(
      /known_truth|quest|oracle|you are wrong|the answer|matches_world_truth/i,
    );
    expect(both.events?.some((e) => /DISCOVERY|QUEST/i.test(e.event_type))).toBe(false);

    const other = await run(w, vesper, "LOOK");
    expect(other.observation?.discovery_lines || []).toEqual([]);
  });

  it("does not infer a claim from Perihelion-like archive flavor text", async () => {
    const w = fixtureWorld({ withClaim: false });
    const nacre = principal("player.nacre");
    await run(w, nacre, "ENTER_WORLD");
    w.players[nacre.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    await run(w, nacre, "INSPECT", { entity_id: "entity.relay-7" });
    const r = await run(w, nacre, "INSPECT", { entity_id: "entity.archive-ledger" });
    expect(r.ok).toBe(true);
    expect(r.observation?.discovery_lines || []).toEqual([]);
  });
});
