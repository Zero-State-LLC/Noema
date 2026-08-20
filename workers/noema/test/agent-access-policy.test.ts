import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
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
    world_id: "test.hosted-canonical.access-look",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [
          { direction: "east", to_room_id: "room.quay" },
          { direction: "down", to_room_id: "room.vault", hidden: true },
        ],
        entities: [],
      },
      "room.quay": {
        room_id: "room.quay",
        name: "Quay",
        description: "Water.",
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

async function seatGrant(w: WorldRuntime, founder: PlayerPrincipal): Promise<string> {
  await run(w, founder, "ENTER_WORLD");
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await run(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep" });
  const orgId = Object.keys(w.organizations)[0];
  w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  const created = await run(w, founder, "ORG_OFFICE_CREATE", {
    org_id: orgId,
    display_name: "Gate",
    authority_profile: "GRANT_ACCESS",
  });
  expect(created.ok).toBe(true);
  const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
  await run(w, founder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: founder.player_id });
  const treasury = w.organizations[orgId].treasury!;
  treasury.compute = 8;
  treasury.influence = 8;
  return orgId;
}

describe("agent ACCESS_POLICY affordances", () => {
  it("LOOK lists EXIT DENY for a GRANT_ACCESS holder; structured COMMIT blocks MOVE", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    const orgId = await seatGrant(w, a);
    await run(w, b, "ENTER_WORLD");
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const look = await run(w, a, "LOOK");
    const deny = (look.observation?.affordances || []).find(
      (x) => x.operation === "ACCESS_POLICY" && x.mode === "DENY" && x.scope === "EXIT" && x.direction === "east",
    );
    expect(deny?.acting_for).toBe(orgId);
    expect(deny?.applies_to).toBe("*");
    expect(look.observation?.available_actions).toContain("ACCESS_POLICY");
    expect((look.observation?.affordances || []).some((x) => x.mode === "CLEAR")).toBe(false);

    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "ACCESS_POLICY")).toBe(false);

    const set = await run(w, a, "ACCESS_POLICY", {
      mode: deny?.mode,
      scope: deny?.scope,
      direction: deny?.direction,
      applies_to: deny?.applies_to,
      acting_for: deny?.acting_for,
    });
    expect(set.ok).toBe(true);
    expect(w.access_restrictions?.some((r) => r.exit_id === "east" && r.mode === "DENY")).toBe(true);
    const moved = await run(w, b, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(false);
    expect(moved.error?.code).toBe("MOVE_REJECTED");
  });

  it("LOOK lists CLEAR after a matching DENY; structured COMMIT restores the way", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    const orgId = await seatGrant(w, a);
    await run(w, b, "ENTER_WORLD");
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect(
      (
        await run(w, a, "ACCESS_POLICY", {
          mode: "DENY",
          scope: "EXIT",
          direction: "east",
          applies_to: "*",
          acting_for: orgId,
        })
      ).ok,
    ).toBe(true);

    const look = await run(w, a, "LOOK");
    const clear = (look.observation?.affordances || []).find(
      (x) => x.operation === "ACCESS_POLICY" && x.mode === "CLEAR" && x.direction === "east",
    );
    expect(clear?.acting_for).toBe(orgId);
    const cleared = await run(w, a, "ACCESS_POLICY", {
      mode: clear?.mode,
      scope: clear?.scope,
      direction: clear?.direction,
      applies_to: clear?.applies_to,
      acting_for: clear?.acting_for,
    });
    expect(cleared.ok).toBe(true);
    const moved = await run(w, b, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(w.players[b.player_id].room_id).toBe("room.quay");
  });

  it("hidden rooms do not advertise ACCESS_POLICY", async () => {
    const w = world();
    const a = agent("nacre");
    await seatGrant(w, a);
    w.players[a.player_id].room_id = "room.vault";
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    expect((look.observation?.affordances || []).some((x) => x.operation === "ACCESS_POLICY")).toBe(false);
  });
});
