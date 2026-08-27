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
    world_id: "test.hosted-canonical.contest-look",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [
          { direction: "east", to_room_id: "room.east" },
          { direction: "down", to_room_id: "room.vault", hidden: true },
        ],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Sealed Vault",
        description: "Unadvertised.",
        hidden: true,
        tags: ["hidden"],
        exits: [{ direction: "up", to_room_id: "room.hub" }],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
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

describe("agent CONTEST affordances", () => {
  it("LOOK lists INFRASTRUCTURE_DISRUPTION; structured DECLARE from LOOK fields succeeds", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    const hit = (look.observation?.affordances || []).find(
      (x) =>
        x.operation === "CONTEST_DECLARE" &&
        x.contest_form === "INFRASTRUCTURE_DISRUPTION" &&
        x.target_id === "entity.relay-7",
    );
    expect(hit?.verb).toBe("COMMIT");
    expect(hit?.target).toEqual({ kind: "ENTITY", entity_id: "entity.relay-7" });
    expect(hit?.stake).toEqual({ energy: 10, influence: 6, compute: 2 });
    expect(look.observation?.available_actions).toContain("CONTEST_DECLARE");

    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: hit?.contest_form,
      target: hit?.target,
      stake: hit?.stake,
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];
    expect(w.contests?.[contestId]?.contest_form).toBe("INFRASTRUCTURE_DISRUPTION");
    const after = await run(w, a, "LOOK");
    expect(
      (after.observation?.affordances || []).some(
        (x) => x.operation === "CONTEST_WITHDRAW" && x.contest_id === contestId,
      ),
    ).toBe(true);
    expect(
      (after.observation?.affordances || []).some(
        (x) => x.operation === "CONTEST_DEFEND" && x.contest_id === contestId,
      ),
    ).toBe(false);
  });

  it("LOOK lists DEFEND for a colocated other; stranger cannot withdraw", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const declared = await run(w, a, "CONTEST_DECLARE", {
      contest_form: "INFRASTRUCTURE_DISRUPTION",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: { energy: 12, influence: 8, compute: 4 },
    });
    expect(declared.ok).toBe(true);
    const contestId = Object.keys(w.contests || {})[0];

    const lookB = await run(w, b, "LOOK");
    const defend = (lookB.observation?.affordances || []).find(
      (x) => x.operation === "CONTEST_DEFEND" && x.contest_id === contestId,
    );
    expect(defend?.stake).toEqual({ energy: 10, influence: 6, compute: 2 });
    expect(lookB.observation?.available_actions).toContain("CONTEST_DEFEND");
    expect(
      (lookB.observation?.affordances || []).some(
        (x) => x.operation === "CONTEST_WITHDRAW" && x.contest_id === contestId,
      ),
    ).toBe(false);

    const defended = await run(w, b, "CONTEST_DEFEND", {
      contest_id: defend?.contest_id,
      stake: defend?.stake,
    });
    expect(defended.ok).toBe(true);
    const afterB = await run(w, b, "LOOK");
    expect(
      (afterB.observation?.affordances || []).some(
        (x) => x.operation === "CONTEST_DEFEND" && x.contest_id === contestId,
      ),
    ).toBe(false);
    expect(
      (afterB.observation?.affordances || []).some(
        (x) => x.operation === "CONTEST_WITHDRAW" && x.contest_id === contestId,
      ),
    ).toBe(true);
  });

  it("hidden rooms do not advertise CONTEST", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].room_id = "room.vault";
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    const aff = look.observation?.affordances || [];
    expect(
      aff.some((x) =>
        ["CONTEST_DECLARE", "CONTEST_DEFEND", "CONTEST_WITHDRAW"].includes(x.operation || ""),
      ),
    ).toBe(false);
  });
});
