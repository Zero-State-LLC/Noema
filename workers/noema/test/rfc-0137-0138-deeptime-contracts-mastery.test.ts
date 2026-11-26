import { describe, expect, it } from "vitest";
import { applyWorldCommand, runCommittedCycleWorldOps, type WorldRuntime } from "../src/world-actions";
import {
  ARCHIVIST_TRACK,
  HERALD_TRACK,
  applyPracticeCredits,
  archivistAttentionDiscount,
  creditsFromEvent,
  emptyPractice,
  heraldComputeDiscount,
  isTrackRecognized,
  publicTitleLine,
} from "../src/practice";
import { parseFocusTrack } from "../src/focus";
import { ensureTreasury } from "../src/offices";
import { buildWatchLive } from "../src/watch-live";
import type { PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "agent-token",
  };
}

function makePhase3World(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.phase3",
    world_name: "Perihelion Reach",
    cycle: 50,
    sequence: 100,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Civic Exchange",
        description: "Central hall.",
        exits: [],
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "relay-7",
            entity_type: "INFRASTRUCTURE",
            infra_type: "relay",
            condition: 85,
          },
          {
            entity_id: "entity.annex.inprog",
            label: "archive-annex",
            entity_type: "INFRASTRUCTURE",
            infra_type: "archive_annex",
            condition: 100,
            in_progress: true,
            ready_cycle: 51,
          },
          {
            entity_id: "entity.scar.ruin1",
            label: "scarred-relay",
            entity_type: "RUIN",
            condition: 0,
            scar: true,
          },
          {
            entity_id: "entity.salvage-cache",
            label: "salvage-cache",
            entity_type: "RESOURCE_NODE",
            stock_resource: "materials",
            stock_amount: 10,
            regen_rate: 0.5,
          },
        ],
      },
    },
    players: {},
    trades: {},
    organizations: {},
    messages: [],
    seen_idempotency: {},
    unsettled: [],
    co_evolution: {
      harvest_pressure: { "room.hub": 5 },
      regen_mod: { "entity.salvage-cache": 0.6 },
      protocol_strength: {},
    },
    scars: [
      {
        scar_id: "scar.econ.1",
        room_id: "room.hub",
        domain: "economic",
        strength: 0.4,
        decay_rate: 0.02,
        cycle_born: 45,
        visibility: "public",
        reconstruction_confidence: 0.2,
        fossilized: false,
      },
      {
        scar_id: "scar.fossil.1",
        room_id: "room.hub",
        domain: "economic",
        strength: 0.6,
        decay_rate: 0.02,
        cycle_born: 1,
        visibility: "public",
        reconstruction_confidence: 0.3,
        fossilized: true,
      },
    ],
    lore_attractors: [
      {
        attractor_id: "lore.hub.1",
        room_id: "room.hub",
        label: "The First Perihelion Surge",
        weight: 0.9,
        basin: "crystallized",
      },
    ],
  };
}

const okSettle = async () => true;

describe("RFC-0137: COMMEMORATE, REMEDIATE, and BUILD_CONTRIBUTE", () => {
  it("commemorates crystallized lore into a permanent MONUMENT and refuses duplicates", async () => {
    const w = makePhase3World();
    const p = principal("player.vellum");
    await applyWorldCommand(w, p, { request_id: "e1", command: "ENTER_WORLD" }, okSettle);
    w.players[p.player_id].budgets.influence = 5;

    const r1 = await applyWorldCommand(
      w,
      p,
      { request_id: "c1", command: "COMMEMORATE", arguments: { attractor_id: "lore.hub.1" } },
      okSettle,
    );
    expect(r1.ok).toBe(true);
    const mon = w.rooms["room.hub"].entities.find((e) => e.entity_type === "MONUMENT");
    expect(mon).toBeDefined();
    expect(mon?.commemorated_ref).toBe("lore.hub.1");

    const r2 = await applyWorldCommand(
      w,
      p,
      { request_id: "c2", command: "COMMEMORATE", arguments: { attractor_id: "lore.hub.1" } },
      okSettle,
    );
    expect(r2.ok).toBe(false);
  });

  it("remediates un-fossilized economic scars, restores regen_mod, and refuses RFC-0051 dismantle ruins", async () => {
    const w = makePhase3World();
    const p = principal("player.tallow");
    await applyWorldCommand(w, p, { request_id: "e1", command: "ENTER_WORLD" }, okSettle);
    // Load 4 cargo into hold (storage = 16 - 4 = 12)
    w.players[p.player_id].budgets.storage = 12;

    // RFC-0051 dismantle ruin MUST be refused
    const bad = await applyWorldCommand(
      w,
      p,
      { request_id: "r-bad", command: "REMEDIATE", arguments: { scar_id: "entity.scar.ruin1" } },
      okSettle,
    );
    expect(bad.ok).toBe(false);

    // Pre-fossilization economic scar succeeds
    const good = await applyWorldCommand(
      w,
      p,
      { request_id: "r-ok", command: "REMEDIATE", arguments: { scar_id: "scar.econ.1" } },
      okSettle,
    );
    expect(good.ok).toBe(true);
    const updatedScar = (w.scars || []).find((s) => s.scar_id === "scar.econ.1");
    expect(updatedScar?.strength).toBeCloseTo(0.15, 3);
    expect(w.co_evolution?.harvest_pressure["room.hub"]).toBe(3);
    expect(w.co_evolution?.regen_mod["entity.salvage-cache"]).toBeCloseTo(0.7, 3);
  });

  it("allows an ally to BUILD_CONTRIBUTE and complete an in-progress structure", async () => {
    const w = makePhase3World();
    const p = principal("player.rivet");
    await applyWorldCommand(w, p, { request_id: "e1", command: "ENTER_WORLD" }, okSettle);
    w.players[p.player_id].budgets.storage = 14; // 2 cargo aboard

    const res = await applyWorldCommand(
      w,
      p,
      { request_id: "bc1", command: "BUILD_CONTRIBUTE", arguments: { entity_id: "entity.annex.inprog" } },
      okSettle,
    );
    expect(res.ok).toBe(true);
    const annex = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.annex.inprog");
    expect(annex?.in_progress).toBeUndefined();
    expect(annex?.contributors).toContain("player.rivet");
  });
});

describe("RFC-0138: WS06 Civic Contracts and Archivist / Herald Mastery Tracks", () => {
  it("escrows treasury cargo on CONTRACT_POST, pays fulfiller on CONTRACT_FULFILL, and refunds on expiry", async () => {
    const w = makePhase3World();
    const founder = principal("player.aphelia");
    const helper = principal("player.helper");
    await applyWorldCommand(w, founder, { request_id: "e1", command: "ENTER_WORLD" }, okSettle);
    await applyWorldCommand(w, helper, { request_id: "e2", command: "ENTER_WORLD" }, okSettle);
    w.organizations["org.compact"] = {
      org_id: "org.compact",
      name: "Reach Compact",
      charter: "Stand",
      status: "ACTIVE",
      creator_id: founder.player_id,
      members: [{ agent_id: founder.player_id, role: "founder" }],
      created_cycle: 1,
      treasury: { energy: 0, compute: 0, attention: 0, storage: 10, influence: 0 },
    };

    const posted = await applyWorldCommand(
      w,
      founder,
      {
        request_id: "cp1",
        command: "CONTRACT_POST",
        arguments: {
          org_id: "org.compact",
          contract_kind: "REPAIR_TARGET",
          entity_id: "entity.relay-7",
          target_condition: 80,
          reward_resource: "storage",
          reward_amount: 3,
        },
      },
      okSettle,
    );
    expect(posted.ok).toBe(true);
    expect(ensureTreasury(w.organizations["org.compact"]).storage).toBe(7);

    const cid = Object.keys(w.contracts || {})[0];
    // Poster cannot fulfill own contract
    const selfFulfill = await applyWorldCommand(
      w,
      founder,
      { request_id: "cf-self", command: "CONTRACT_FULFILL", arguments: { contract_id: cid } },
      okSettle,
    );
    expect(selfFulfill.ok).toBe(false);

    // Helper with insufficient free hold cannot fulfill storage contract (preserves escrow)
    w.players[helper.player_id].budgets.storage = 1;
    const noRoom = await applyWorldCommand(
      w,
      helper,
      { request_id: "cf-noroom", command: "CONTRACT_FULFILL", arguments: { contract_id: cid } },
      okSettle,
    );
    expect(noRoom.ok).toBe(false);
    expect(w.contracts?.[cid].status).toBe("OPEN");

    // Helper fulfills contract (relay-7 is at 85 >= 80) and receives 3 cargo (free storage 16 -> 13)
    w.players[helper.player_id].budgets.storage = 16;
    const fulfilled = await applyWorldCommand(
      w,
      helper,
      { request_id: "cf-ok", command: "CONTRACT_FULFILL", arguments: { contract_id: cid } },
      okSettle,
    );
    expect(fulfilled.ok).toBe(true);
    expect(w.players[helper.player_id].budgets.storage).toBe(13);
    expect(w.contracts?.[cid].status).toBe("FULFILLED");

    // Second contract expires and refunds escrowed cargo to treasury
    const posted2 = await applyWorldCommand(
      w,
      founder,
      {
        request_id: "cp2",
        command: "CONTRACT_POST",
        arguments: {
          org_id: "org.compact",
          contract_kind: "ATTEST_ROOM",
          target_count: 3,
          reward_resource: "storage",
          reward_amount: 2,
        },
      },
      okSettle,
    );
    expect(posted2.ok).toBe(true);
    expect(ensureTreasury(w.organizations["org.compact"]).storage).toBe(5);
    w.cycle += 30;
    await runCommittedCycleWorldOps(w, () => ({} as never), async () => {});
    expect(ensureTreasury(w.organizations["org.compact"]).storage).toBe(7);
  });

  it("recognizes archivist and herald mastery tracks, focus tokens, discounts, and WATCH projection", () => {
    expect(parseFocusTrack("archivist")).toBe("archivist");
    expect(parseFocusTrack("herald")).toBe("herald");

    let arch = emptyPractice();
    const hostedEvents = [
      { event_id: "ev.a1", event_type: "ENTITY_UPDATE", payload: { actor_id: "player.vellum", operation: "ATTEST", subject_ref: "entity.s1" } },
      { event_id: "ev.a2", event_type: "ENTITY_CREATE", payload: { actor_id: "player.vellum", entity_id: "recon.2", subject_ref: "entity.s2" } },
      { event_id: "ev.a3", event_type: "ENTITY_UPDATE", payload: { actor_id: "player.vellum", entity_id: "recon.3", subject_ref: "entity.s3", set: { reconstruction_kind: "PLAYER_RECONSTRUCTION" } } },
    ];
    for (let i = 0; i < hostedEvents.length; i++) {
      const credits = creditsFromEvent(hostedEvents[i]);
      arch = applyPracticeCredits(arch, credits, 11 + i);
    }
    expect(isTrackRecognized(arch, ARCHIVIST_TRACK)).toBe(true);
    expect(archivistAttentionDiscount(arch, 15)).toBe(1);
    expect(publicTitleLine("Vellum-Archivist", arch, 15)).toBe("Vellum-Archivist keeps the Reach's record.");

    let herald = emptyPractice();
    for (let i = 1; i <= 3; i++) {
      const credits = creditsFromEvent({
        event_id: `ev.h${i}`,
        event_type: "MESSAGE",
        payload: { sender_id: "player.cantor", surface: "BOARD", room_id: `room.r${i}` },
      });
      herald = applyPracticeCredits(herald, credits, 10 + i);
    }
    expect(isTrackRecognized(herald, HERALD_TRACK)).toBe(true);
    expect(heraldComputeDiscount(herald, 15)).toBe(1);
    expect(publicTitleLine("Cantor-Speaker", herald, 15)).toBe("Cantor-Speaker carries the Reach's word.");

    const snap = buildWatchLive({
      world_id: "world.phase3",
      cycle: 50,
      sequence: 200,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Civic Exchange",
          description: "Hall",
          exits: [],
          entities: [{ entity_id: "entity.memorial.1", label: "memorial-surge", entity_type: "MONUMENT" }],
        },
      },
      players: [
        {
          player_id: "player.vellum",
          handle: "Vellum-Archivist",
          room_id: "room.hub",
          entered: true,
          last_seen_ms: Date.now(),
          public_activity: true,
        },
      ],
      events: [
        {
          event_type: "ENTITY_CREATE",
          sequence: 199,
          cycle: 50,
          player_id: "player.vellum",
          handle: "Vellum-Archivist",
          payload: { room_id: "room.hub", label: "memorial-surge", operation: "COMMEMORATE" },
        },
        {
          event_type: "RESOURCE_TRANSFER",
          sequence: 200,
          cycle: 50,
          player_id: "player.vellum",
          handle: "Vellum-Archivist",
          payload: { room_id: "room.hub", kind: "contract", amount: 3 },
        },
      ],
    });
    const acts = ((snap.rooms as Array<Record<string, unknown>>)[0].room_activity || []) as Array<Record<string, unknown>>;
    expect(acts.some((a) => a.verb === "commemorate")).toBe(true);
    expect(acts.some((a) => a.verb === "contract")).toBe(true);
  });
});
