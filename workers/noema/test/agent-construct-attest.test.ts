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
    world_id: "test.hosted-canonical.construct-attest",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A live relay and a fragmentary archive.",
        exits: [
          { direction: "east", to_room_id: "room.vault" },
          { direction: "south", to_room_id: "room.south" },
          { direction: "west", to_room_id: "room.oneway" },
        ],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            infra_type: "relay",
            condition: 40,
          }),
          enrichEntity({
            entity_id: "entity.archive-ledger",
            label: "cold-ledger",
            entity_type: "ARTIFACT",
          }),
        ],
      },
      "room.south": {
        room_id: "room.south",
        name: "South Court",
        description: "Open.",
        exits: [{ direction: "north", to_room_id: "room.hub" }],
        entities: [],
      },
      "room.oneway": {
        room_id: "room.oneway",
        name: "Dead End",
        description: "No way back.",
        exits: [],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Sealed Vault",
        description: "Not for construction.",
        hidden: true,
        tags: ["hidden"],
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
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("agent CONSTRUCT and ATTEST affordances", () => {
  it("LOOK lists missing construct classes and skips live relay", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    const aff = look.observation?.affordances || [];
    const constructs = aff.filter((x) => x.operation === "CONSTRUCT");
    expect(constructs.some((x) => x.class === "relay")).toBe(false);
    expect(constructs.some((x) => x.class === "workshop")).toBe(true);
    const shop = constructs.find((x) => x.class === "workshop");
    expect(shop?.verb).toBe("BUILD");
    expect(shop?.available).toBe(true);
    expect(look.observation?.available_actions).toContain("CONSTRUCT");
  });

  it("structured BUILD.CONSTRUCT workshop from the affordance class", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.some((e) => e.infra_type === "workshop")).toBe(true);
    const look = await run(w, a, "LOOK");
    expect((look.observation?.affordances || []).some((x) => x.class === "workshop")).toBe(false);
  });

  it("LOOK lists ATTEST pairs for an unclaimed artifact; structured COMMIT stamps the claim", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, a, "LOOK");
    const attests = (look.observation?.affordances || []).filter((x) => x.operation === "ATTEST");
    expect(attests.length).toBeGreaterThan(0);
    const hit = attests.find(
      (x) => x.target_id === "entity.archive-ledger" && x.archive_claim === "DESTROYED",
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
    const art = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.archive-ledger");
    expect(art?.archive_claim).toBe("DESTROYED");
    expect(art?.archive_subject_entity_id).toBe("entity.relay-7");
    const after = await run(w, a, "LOOK");
    expect((after.observation?.affordances || []).some((x) => x.operation === "ATTEST")).toBe(false);
  });

  it("hidden rooms do not advertise CONSTRUCT or ATTEST", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].room_id = "room.vault";
    const look = await run(w, a, "LOOK");
    expect(look.ok).toBe(true);
    const aff = look.observation?.affordances || [];
    expect(aff.some((x) => x.operation === "CONSTRUCT" || x.operation === "ATTEST")).toBe(false);
    expect(
      aff.some((x) =>
        ["DISMANTLE", "UPGRADE", "REPURPOSE", "RESTORE", "VEST", "SHARE", "CONNECT"].includes(x.operation || ""),
      ),
    ).toBe(false);
  });

  it("owned workshop advertises UPGRADE, REPURPOSE, and DISMANTLE; UPGRADE then drops", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop");
    expect(shop).toBeTruthy();
    shop!.in_progress = undefined;
    const look = await run(w, a, "LOOK");
    const aff = look.observation?.affordances || [];
    expect(aff.some((x) => x.operation === "UPGRADE" && x.target_id === shop?.entity_id)).toBe(true);
    expect(aff.some((x) => x.operation === "REPURPOSE" && x.target_id === shop?.entity_id)).toBe(true);
    expect(aff.some((x) => x.operation === "DISMANTLE" && x.target_id === shop?.entity_id)).toBe(true);
    const upgraded = await run(w, a, "BUILD", { operation: "UPGRADE", entity_id: shop!.entity_id });
    expect(upgraded.ok).toBe(true);
    const after = await run(w, a, "LOOK");
    expect((after.observation?.affordances || []).some((x) => x.operation === "UPGRADE")).toBe(false);
    expect((after.observation?.affordances || []).some((x) => x.operation === "REPURPOSE")).toBe(true);
  });

  it("unclaimed owned infra advertises RESTORE; stranger does not see UPGRADE", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.rooms["room.hub"].entities.push(
      enrichEntity({
        entity_id: "entity.workshop-abandoned",
        label: "abandoned-workshop",
        entity_type: "INFRASTRUCTURE",
        infra_type: "workshop",
        owner_id: a.player_id,
        unclaimed: true,
        condition: 20,
      }),
    );
    const lookA = await run(w, a, "LOOK");
    expect(
      (lookA.observation?.affordances || []).some(
        (x) => x.operation === "RESTORE" && x.target_id === "entity.workshop-abandoned",
      ),
    ).toBe(true);
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "UPGRADE")).toBe(false);
    expect(
      (lookB.observation?.affordances || []).some((x) => x.operation === "RESTORE"),
    ).toBe(false);
  });

  it("LOOK lists VEST for a sole-owned workshop once a named-asset office is occupied", async () => {
    const w = world();
    const a = agent("nacre");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    shop.in_progress = undefined;

    const formed = await run(w, a, "ORG_CREATE", { name: "Nacre Compact", charter: "works" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Works",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const vacantLook = await run(w, a, "LOOK");
    expect((vacantLook.observation?.affordances || []).some((x) => x.operation === "VEST")).toBe(false);

    const assigned = await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: a.player_id });
    expect(assigned.ok).toBe(true);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const look = await run(w, a, "LOOK");
    const vest = (look.observation?.affordances || []).find(
      (x) => x.operation === "VEST" && x.target_id === shop.entity_id,
    );
    expect(vest?.org_id).toBe(orgId);
    expect(vest?.verb).toBe("BUILD");
    expect(look.observation?.available_actions).toContain("VEST");

    const vested = await run(w, a, "BUILD", {
      operation: "VEST",
      entity_id: shop.entity_id,
      org_id: vest?.org_id,
    });
    expect(vested.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)?.owner_id).toBe(orgId);
    const after = await run(w, a, "LOOK");
    expect((after.observation?.affordances || []).some((x) => x.operation === "VEST")).toBe(false);
    expect(
      (after.observation?.affordances || []).some(
        (x) => x.operation === "UPGRADE" && x.target_id === shop.entity_id,
      ),
    ).toBe(true);
  });

  it("LOOK lists SHARE with an entered partner; co-owning hides VEST", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    shop.in_progress = undefined;

    const lookA = await run(w, a, "LOOK");
    const share = (lookA.observation?.affordances || []).find(
      (x) => x.operation === "SHARE" && x.target_id === shop.entity_id,
    );
    expect(share?.player_id).toBe(b.player_id);
    expect(lookA.observation?.available_actions).toContain("SHARE");
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "SHARE")).toBe(false);

    const shared = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: shop.entity_id,
      player_id: share?.player_id,
    });
    expect(shared.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === shop.entity_id)?.co_owner_id).toBe(
      b.player_id,
    );
    const after = await run(w, a, "LOOK");
    expect(
      (after.observation?.affordances || []).some(
        (x) => x.operation === "SHARE" && x.player_id === b.player_id,
      ),
    ).toBe(false);
    expect((after.observation?.affordances || []).some((x) => x.operation === "VEST")).toBe(false);
  });

  it("LOOK lists CONNECT on a steward route_link for a public two-way dest only", async () => {
    const w = world();
    const a = agent("nacre");
    const b = agent("sable");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 8;
    w.players[a.player_id].budgets.energy = 40;
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    const link = w.rooms["room.hub"].entities.find((e) => e.infra_type === "route_link")!;
    link.in_progress = undefined;

    const lookA = await run(w, a, "LOOK");
    const connects = (lookA.observation?.affordances || []).filter(
      (x) => x.operation === "CONNECT" && x.target_id === link.entity_id,
    );
    expect(connects.map((x) => x.dest).sort()).toEqual(["south"]);
    expect(lookA.observation?.available_actions).toContain("CONNECT");
    const lookB = await run(w, b, "LOOK");
    expect((lookB.observation?.affordances || []).some((x) => x.operation === "CONNECT")).toBe(false);

    const pinned = await run(w, a, "BUILD", {
      operation: "CONNECT",
      entity_id: link.entity_id,
      dest: connects[0]?.dest,
    });
    expect(pinned.ok).toBe(true);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === link.entity_id)?.dest_room_id).toBe(
      "room.south",
    );
  });
});
