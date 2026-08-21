import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import {
  COSTS,
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  parseHumanCommand,
} from "../src/actions";
import { CONFLICT_LINE } from "../src/discovery";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * RFC-0020 hosted COMMIT.ATTEST.
 * INSPECT is not a writer. Help omits ATTEST. No Genesis pack.
 */

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
        exits: [{ direction: "east", to_room_id: "room.east" }],
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
            label: "black-archive says the relay was destroyed",
            entity_type: "ARTIFACT",
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "Empty.",
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

describe("RFC-0020 parse and help", () => {
  it("requires both subject and claim; does not infer from the label", () => {
    const ok = parseHumanCommand(
      "attest black-archive subject=entity.relay-7 claim=DESTROYED",
      {
        entities: [
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "black-archive says the relay was destroyed",
            entity_type: "ARTIFACT",
          }),
        ],
      },
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.action).toEqual({
        verb: "COMMIT",
        arguments: {
          operation: "ATTEST",
          entity_id: "entity.archive-ledger",
          subject_entity_id: "entity.relay-7",
          archive_claim: "DESTROYED",
        },
      });
    }
    const half = parseHumanCommand("attest black-archive claim=DESTROYED");
    expect(half.ok).toBe(false);
    if (!half.ok) expect(half.code).toBe("FORBIDDEN");
    const bare = parseHumanCommand("attest black-archive");
    expect(bare.ok).toBe(false);
    expect(helpText()).not.toMatch(/\battest\b/i);
    expect(helpText()).not.toMatch(/quest|discover/i);
  });
});

describe("RFC-0020 ATTEST", () => {
  it("writes both claim fields, then INSPECT can project GC6", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const attention = w.players[p.player_id].budgets.attention;
    const inspectFirst = await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" });
    expect(inspectFirst.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBeUndefined();
    expect(inspectFirst.observation?.discovery_lines || []).toEqual([]);

    const attested = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(attested.ok).toBe(true);
    expect(attested.events?.map((e) => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(attested.events?.[1]?.payload?.set).toEqual({
      archive_subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(w.players[p.player_id].budgets.attention).toBe(attention - (COSTS.INSPECT.attention || 0) - 2);
    expect(w.rooms["room.hub"].entities[1].archive_subject_entity_id).toBe("entity.relay-7");
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBe("DESTROYED");

    await run(w, p, "INSPECT", { entity_id: "entity.archive-ledger" });
    w.players[p.player_id].budgets.attention = 8;
    const live = await run(w, p, "INSPECT", { entity_id: "entity.relay-7" });
    expect(live.observation?.discovery_lines).toEqual([CONFLICT_LINE]);
    expect(JSON.stringify(live.observation?.discovery_lines)).not.toMatch(/quest|oracle|known_truth/i);
  });

  it("rejects non-artifact, already-set, remote, and over-budget without writing", async () => {
    const w = fixtureWorld();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const infra = await run(w, p, "ATTEST", {
      entity_id: "entity.relay-7",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(infra.ok).toBe(false);
    expect(infra.error?.code).toBe("FORBIDDEN");
    expect(w.rooms["room.hub"].entities[0].archive_claim).toBeUndefined();

    await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    const again = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
    });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("FORBIDDEN");
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBe("DESTROYED");

    await run(w, p, "MOVE", { direction: "east" });
    const remote = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "DESTROYED",
    });
    expect(remote.ok).toBe(false);
    expect(remote.error?.code).toBe("NOT_COLOCATED");

    w.players[p.player_id].room_id = "room.hub";
    w.rooms["room.hub"].entities[1].archive_subject_entity_id = undefined;
    w.rooms["room.hub"].entities[1].archive_claim = undefined;
    w.players[p.player_id].budgets.attention = 1;
    const poor = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
    });
    expect(poor.ok).toBe(false);
    expect(poor.error?.code).toBe("BUDGET_EXCEEDED");
    expect(w.rooms["room.hub"].entities[1].archive_claim).toBeUndefined();
  });
});
