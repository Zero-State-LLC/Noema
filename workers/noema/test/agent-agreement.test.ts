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
    world_id: "test.hosted-canonical.agreement-look",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [{ direction: "down", to_room_id: "room.vault", hidden: true }],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
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
    agreements: {},
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

describe("agent AGREEMENT affordances", () => {
  it("LOOK lists AGREEMENT_FORM with a colocated other; offer then accept from LOOK fields", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const lookA = await run(w, a, "LOOK");
    const offer = (lookA.observation?.affordances || []).find(
      (x) =>
        x.operation === "AGREEMENT_FORM" &&
        x.agreement_type === "TRADE" &&
        x.party_ids?.[0] === b.player_id,
    );
    expect(offer?.verb).toBe("COMMIT");
    expect(lookA.observation?.available_actions).toContain("AGREEMENT_FORM");

    const offered = await run(w, a, "AGREEMENT_FORM", {
      agreement_type: offer?.agreement_type,
      party_ids: offer?.party_ids,
    });
    expect(offered.ok).toBe(true);
    const agreementId = Object.keys(w.agreements || {})[0];
    expect(w.agreements?.[agreementId]?.status).toBe("OFFERED");

    const afterA = await run(w, a, "LOOK");
    expect(
      (afterA.observation?.affordances || []).some(
        (x) => x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE" && x.party_ids?.[0] === b.player_id,
      ),
    ).toBe(false);
    expect(
      (afterA.observation?.affordances || []).some(
        (x) => x.operation === "AGREEMENT_TERMINATE" && x.agreement_id === agreementId,
      ),
    ).toBe(true);

    const lookB = await run(w, b, "LOOK");
    const accept = (lookB.observation?.affordances || []).find(
      (x) => x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE" && x.party_ids?.[0] === a.player_id,
    );
    expect(accept?.label).toMatch(/Accept/i);
    const formed = await run(w, b, "AGREEMENT_FORM", {
      agreement_type: accept?.agreement_type,
      party_ids: accept?.party_ids,
    });
    expect(formed.ok).toBe(true);
    expect(w.agreements?.[agreementId]?.status).toBe("ACTIVE");
  });

  it("LOOK lists TERMINATE for a party; structured COMMIT breaks the pact", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await run(w, a, "AGREEMENT_FORM", { agreement_type: "TRADE", party_ids: [b.player_id] })).ok).toBe(true);
    expect((await run(w, b, "AGREEMENT_FORM", { agreement_type: "TRADE", party_ids: [a.player_id] })).ok).toBe(true);
    const agreementId = Object.keys(w.agreements || {})[0];

    const look = await run(w, a, "LOOK");
    const term = (look.observation?.affordances || []).find(
      (x) => x.operation === "AGREEMENT_TERMINATE" && x.agreement_id === agreementId,
    );
    expect(term?.agreement_reason).toBe("MUTUAL");
    expect(look.observation?.available_actions).toContain("AGREEMENT_TERMINATE");
    expect(
      (look.observation?.affordances || []).some(
        (x) => x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE",
      ),
    ).toBe(false);

    const broken = await run(w, a, "AGREEMENT_TERMINATE", {
      agreement_id: term?.agreement_id,
      reason: term?.agreement_reason,
    });
    expect(broken.ok).toBe(true);
    expect(w.agreements?.[agreementId]?.status).toBe("BROKEN");
    const after = await run(w, a, "LOOK");
    expect(
      (after.observation?.affordances || []).some((x) => x.operation === "AGREEMENT_TERMINATE"),
    ).toBe(false);
    expect(
      (after.observation?.affordances || []).some(
        (x) => x.operation === "AGREEMENT_FORM" && x.agreement_type === "TRADE",
      ),
    ).toBe(true);
  });

  it("hidden rooms do not advertise AGREEMENT_FORM", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].room_id = "room.vault";
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    expect((look.observation?.affordances || []).some((x) => x.operation === "AGREEMENT_FORM")).toBe(false);
  });
});
