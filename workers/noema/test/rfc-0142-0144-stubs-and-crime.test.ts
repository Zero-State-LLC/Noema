import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { allocateOrgId } from "../src/actions";
import * as construction from "../src/construction";
import {
  buildCrimeDetectedPayload,
  rehabTradesForSeverity,
  sanctionInfluenceDebit,
  seededCrimeDraw,
} from "../src/crime";
import {
  ACTIVE_FOCUS_CAP,
  FOCUSED_LATENT_AFTER_CYCLES,
  activeFocusTrackIds,
  declareFocusTrack,
} from "../src/focus";
import {
  ARTIFICER_TRACK,
  ENGINEER_TRACK,
  creditMaintenanceOnly,
  isArtificerMaintained,
  isTrackLatent,
  isTrackRecognized,
} from "../src/practice";
import { creditAcceptedTrade, creditDangerEvidence, liveHostileToward } from "../src/social-memory";
import { buildWatchLive } from "../src/watch-live";
import type { PlayerPrincipal } from "../src/types";

const noopSettle = async () => true;

function principalFor(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "agent-token",
  };
}

function makeWave3World(): WorldRuntime {
  return {
    world_id: "world-wave3-test",
    world_name: "Perihelion Reach",
    world_seed: "seed-wave3",
    cycle: 20,
    sequence: 100,
    entry_room_id: "room.civic-exchange",
    rooms: {
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        description: "Central civic hub.",
        exits: [],
        entities: [
          {
            entity_id: "entity.gen-1",
            label: "exchange-generator",
            entity_type: "INFRASTRUCTURE",
            infra_type: "generator",
            condition: 90,
            owner_id: "player.alice",
            creator_id: "player.alice",
            steward_id: "player.alice",
          },
          {
            entity_id: "entity.annex-1",
            label: "archive-annex",
            entity_type: "INFRASTRUCTURE",
            infra_type: "archive_annex",
            condition: 85,
            owner_id: "player.alice",
          },
          {
            entity_id: "entity.ws-1",
            label: "field-workshop",
            entity_type: "INFRASTRUCTURE",
            infra_type: "workshop",
            condition: 95,
            owner_id: "player.alice",
          },
          {
            entity_id: "entity.stall-1",
            label: "compact-stall",
            entity_type: "INFRASTRUCTURE",
            infra_type: "barter_stall",
            condition: 90,
            owner_id: "org.compact.1",
          },
        ],
      },
      "room.hidden-vault": {
        room_id: "room.hidden-vault",
        name: "Hidden Vault",
        description: "Private room.",
        hidden: true,
        exits: [],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
    co_evolution: {
      harvest_pressure: {},
      regen_mod: {},
      protocol_strength: { "room.civic-exchange": 9 }, // floor(9/3) = +3 bonus
    },
    stalls: {
      "entity.stall-1": {
        stall_id: "entity.stall-1",
        room_id: "room.civic-exchange",
        resources: { energy: 10, compute: 5, influence: 0 },
        material_lots: [],
        item_ids: [],
        listings: [
          {
            listing_id: "listing.1",
            stall_id: "entity.stall-1",
            room_id: "room.civic-exchange",
            owner_id: "org.compact.1",
            listing_kind: "SELL_OFFER",
            offer_asset: { kind: "RESOURCE", resource: "energy", amount: 2 },
            ask_asset: { kind: "RESOURCE", resource: "compute", amount: 1 },
            max_fills: 3,
            fills_remaining: 3,
            created_cycle: 18,
            status: "OPEN",
          },
        ],
      },
    },
  };
}

describe("RFC-0142: Integer EWM CONVERT, unlocked_affordances, and stub cleanup", () => {
  it("removes P3 floating-point stubs and executes integer power & compute CONVERT with protocol bonus", async () => {
    expect("P3_RESOURCE_PRODUCTION" in construction).toBe(false);
    expect("P3_CONVERSIONS" in construction).toBe(false);

    const w = makeWave3World();
    const alice = principalFor("alice");
    await applyWorldCommand(w, alice, { request_id: "e1", command: "ENTER_WORLD" }, noopSettle);
    const p = w.players[alice.player_id];
    p.budgets.energy = 20;
    p.budgets.compute = 10;
    p.budgets.storage = 10;
    p.material_lots = [{ material: "SILICA_CELL", grade: "SOUND", amount: 6 }];

    const pow = await applyWorldCommand(
      w,
      alice,
      { request_id: "conv-p", command: "CONVERT", arguments: { convert_mode: "power" } },
      noopSettle,
    );
    expect(pow.ok).toBe(true);
    // protocol_strength 9 -> floor(9/3) = 3 -> 6 + 3 = +9 energy
    expect(p.budgets.energy).toBe(29);
    expect(p.budgets.compute).toBe(9);
    expect(w.rooms["room.civic-exchange"].entities[0].condition).toBe(89);
    const txPow = (pow.events || []).find((e) => e.event_type === "RESOURCE_TRANSFER");
    expect(Object.keys(txPow?.payload || {}).sort()).toEqual(["amount", "from_id", "resource", "to_id", "transfer_id"]);

    const comp = await applyWorldCommand(
      w,
      alice,
      { request_id: "conv-c", command: "CONVERT", arguments: { convert_mode: "compute" } },
      noopSettle,
    );
    expect(comp.ok).toBe(true);
    // protocol_strength 9 -> floor(9/3) = 3 -> 5 + 3 = +8 compute; costs 1 energy
    expect(p.budgets.compute).toBe(17);
    expect(p.budgets.energy).toBe(28);
    expect(w.rooms["room.civic-exchange"].entities[1].condition).toBe(84);

    // Deterministic unlocked_affordances projection
    const unlocks = comp.observation?.unlocked_affordances || [];
    expect(unlocks).toContainEqual({ operation: "CRAFT", unlocked_by: "infra:workshop" });
    expect(unlocks).toContainEqual({ operation: "CONVERT", unlocked_by: "infra:generator" });
    expect(unlocks).toContainEqual({ operation: "CONVERT", unlocked_by: "infra:archive_annex" });
  });
});

describe("RFC-0143: Seeded CRIME_DETECTED, forensic INVESTIGATE, accountable SANCTION, and severity rehab", () => {
  it("produces deterministic draws, strict 0.2 CRIME_DETECTED on INVESTIGATE, accountable SANCTION, and 3/5/8 rehab", async () => {
    const d1 = await seededCrimeDraw("seed-x", "ev-1");
    const d2 = await seededCrimeDraw("seed-x", "ev-1");
    expect(d1).toBe(d2);
    expect(d1).toBeGreaterThanOrEqual(0);
    expect(d1).toBeLessThan(1000);

    const payload = buildCrimeDetectedPayload({
      detection_id: "crime.1",
      subject_id: "player.raider",
      victim_id: "player.victim",
      severity: "MAJOR",
      category: "SEIZURE",
      room_id: "room.civic-exchange",
      source_event_ids: ["ev.1"],
      detection_method: "WITNESS",
      visibility: "PUBLIC",
    });
    expect(payload.influence_delta).toBe(0);
    expect(payload.influence_applied).toBe(0);
    expect(payload.flags).toContain("PUBLIC_HISTORY");

    expect(sanctionInfluenceDebit("MINOR")).toBe(3);
    expect(sanctionInfluenceDebit("MODERATE")).toBe(8);
    expect(sanctionInfluenceDebit("MAJOR")).toBe(15);
    expect(rehabTradesForSeverity("MINOR")).toBe(3);
    expect(rehabTradesForSeverity("MODERATE")).toBe(5);
    expect(rehabTradesForSeverity("MAJOR")).toBe(8);

    // End-to-end INVESTIGATE -> SANCTION -> severity rehab
    const w = makeWave3World();
    const victim = principalFor("victim");
    const raider = principalFor("raider");
    await applyWorldCommand(w, victim, { request_id: "e1", command: "ENTER_WORLD" }, noopSettle);
    await applyWorldCommand(w, raider, { request_id: "e2", command: "ENTER_WORLD" }, noopSettle);
    const pVictim = w.players[victim.player_id];
    const pRaider = w.players[raider.player_id];
    pVictim.budgets.attention = 20;
    pVictim.budgets.compute = 20;
    pVictim.budgets.influence = 10;
    pRaider.budgets.influence = 20;

    // Equip arc_lance on victim -> sanction influence cost discounted from 2 to 1
    w.items = {
      "item.lance.1": {
        item_id: "item.lance.1",
        archetype: "arc_lance",
        label: "Arc Lance",
        category: "WEAPON",
        equip_slot: "WEAPON_SLOT",
        equipped_slot: "WEAPON_SLOT",
        condition: 100,
        max_condition: 100,
        quality: "STANDARD",
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: victim.player_id },
        owner_id: victim.player_id,
        creator_id: victim.player_id,
        steward_id: victim.player_id,
        forged_cycle: 1,
        contest_veterancy: 0,
        notable_history: [],
      },
    };
    w.crime_residues = [
      {
        residue_id: "residue.test.1",
        room_id: "room.civic-exchange",
        subject_id: raider.player_id,
        victim_id: victim.player_id,
        category: "SEIZURE",
        severity: "MODERATE",
        source_event_ids: ["ev.contest.1"],
        draw: 600,
        threshold_mp: 400, // missed immediate (600 >= 400), but 400 + 300 = 700 > 600 on INVESTIGATE
        created_cycle: 19,
        expires_cycle: 31,
        resolved: false,
        witness_ids: [],
      },
    ];

    const inv = await applyWorldCommand(w, victim, { request_id: "inv-1", command: "INVESTIGATE" }, noopSettle);
    expect(inv.ok).toBe(true);
    const detEv = (inv.events || []).find((e) => e.event_type === "CRIME_DETECTED");
    expect(detEv?.payload?.detection_method).toBe("INVESTIGATION");
    expect(detEv?.payload?.influence_delta).toBe(0);
    const detId = w.crime_detections?.[0]?.detection_id!;
    expect(detId).toBeTruthy();

    const sanc = await applyWorldCommand(
      w,
      victim,
      { request_id: "sanc-1", command: "SANCTION", arguments: { detection_id: detId } },
      noopSettle,
    );
    expect(sanc.ok).toBe(true);
    expect(pVictim.budgets.influence).toBe(9); // discounted by arc_lance (2 - 1 = 1)
    expect(pRaider.budgets.influence).toBe(12); // MODERATE debit 8 (20 - 8 = 12)
    expect(w.access_restrictions?.some((r) => r.applies_to === raider.player_id && r.room_id === "room.civic-exchange")).toBe(true);

    // Double sanction is rejected
    const sancDup = await applyWorldCommand(
      w,
      victim,
      { request_id: "sanc-2", command: "SANCTION", arguments: { detection_id: detId } },
      noopSettle,
    );
    expect(sancDup.ok).toBe(false);

    // Severity-scaled rehabilitation: MODERATE requires 5 clean trades (3 is not enough; 5 clears)
    let dm = creditDangerEvidence(undefined, raider.player_id, detId, 20, "MODERATE");
    let tm = undefined;
    for (let i = 1; i <= 4; i++) {
      tm = creditAcceptedTrade(tm, raider.player_id, `tr.${i}`, 20 + i);
    }
    expect(liveHostileToward(dm, undefined, tm, raider.player_id, 25)).toBe(true);
    tm = creditAcceptedTrade(tm, raider.player_id, "tr.5", 26);
    expect(liveHostileToward(dm, undefined, tm, raider.player_id, 26)).toBe(false);
  });
});

describe("RFC-0144: Multi-focus, Artificer mastery, ASSIGN_STEWARD, ORG_JOIN, extended contracts, and WATCH bands", () => {
  it("enforces ACTIVE_FOCUS_CAP = 2, 18-cycle focused latency, Artificer crafting/refining perks, and failed-defense maintenance", async () => {
    expect(ACTIVE_FOCUS_CAP).toBe(2);
    expect(FOCUSED_LATENT_AFTER_CYCLES).toBe(18);

    let f = declareFocusTrack(undefined, "engineer", 10);
    f = declareFocusTrack(f, "artificer", 11);
    expect(f.tracks).toHaveLength(2);
    // 3rd track replaces oldest (engineer)
    f = declareFocusTrack(f, "broker", 12);
    expect((f.tracks || []).map((t) => t.track)).toEqual(["artificer", "broker"]);
    const focusedIds = activeFocusTrackIds(f);
    expect(focusedIds).toContain(ARTIFICER_TRACK);

    // Practice state maintained at cycle 10 -> at cycle 27 (17 cycles idle): focused stays active, unfocused goes latent!
    const pState = {
      catalog_id: "mastery-catalog/gc1-s1" as const,
      tracks: { [ARTIFICER_TRACK]: ["i1", "i2", "i3"], [ENGINEER_TRACK]: ["e1", "e2", "e3"] },
      recognition: { [ARTIFICER_TRACK]: ["i1", "i2", "i3"], [ENGINEER_TRACK]: ["e1", "e2", "e3"] },
      last_work_cycle: { [ARTIFICER_TRACK]: 10, [ENGINEER_TRACK]: 10 },
    };
    expect(isTrackLatent(pState, ARTIFICER_TRACK, 27, focusedIds)).toBe(false);
    expect(isTrackLatent(pState, ENGINEER_TRACK, 27, focusedIds)).toBe(true);
    expect(isTrackLatent(pState, ARTIFICER_TRACK, 28, focusedIds)).toBe(true);

    // Failed-but-legal contest defense grants maintenance (prevents latency) without adding recognition
    const maintained = creditMaintenanceOnly(pState, ENGINEER_TRACK, 27);
    expect(isTrackLatent(maintained, ENGINEER_TRACK, 27, focusedIds)).toBe(false);
    expect(maintained.recognition?.[ENGINEER_TRACK]?.length).toBe(3);

    // Artificer maintained crafting (+10 condition) & REFINE (-1 compute)
    const w = makeWave3World();
    const smith = principalFor("smith");
    await applyWorldCommand(w, smith, { request_id: "e1", command: "ENTER_WORLD" }, noopSettle);
    const ps = w.players[smith.player_id];
    ps.budgets.energy = 40;
    ps.budgets.compute = 20;
    ps.budgets.storage = 4;
    ps.material_lots = [
      { material: "FERROUS_ORE", grade: "SOUND", amount: 8 },
      { material: "SILICA_CELL", grade: "SOUND", amount: 4 },
    ];
    ps.practice = {
      catalog_id: "mastery-catalog/gc1-s1",
      tracks: { [ARTIFICER_TRACK]: ["i1", "i2", "i3"] },
      recognition: { [ARTIFICER_TRACK]: ["i1", "i2", "i3"] },
      last_work_cycle: { [ARTIFICER_TRACK]: w.cycle },
    } as typeof ps.practice;
    expect(isTrackRecognized(ps.practice, ARTIFICER_TRACK)).toBe(true);
    expect(isArtificerMaintained(ps.practice, w.cycle)).toBe(true);

    const crafted = await applyWorldCommand(
      w,
      smith,
      { request_id: "cr1", command: "CRAFT", arguments: { recipe_id: "arc_welder" } },
      noopSettle,
    );
    expect(crafted.ok).toBe(true);
    const welded = Object.values(w.items || {})[0];
    expect(welded.condition).toBe(110); // STANDARD 100 + 10 artificer bonus
    expect(welded.max_condition).toBe(110);

    const compBefore = ps.budgets.compute;
    const refined = await applyWorldCommand(
      w,
      smith,
      { request_id: "rf1", command: "REFINE", arguments: { material: "FERROUS_ORE" } },
      noopSettle,
    );
    expect(refined.ok).toBe(true);
    expect(ps.budgets.compute).toBe(compBefore); // REFINE compute cost discounted from 1 -> 0!
  });

  it("supports ASSIGN_STEWARD without mutating creator_id, deterministic allocateOrgId, ORG_JOIN, DELIVER_LOT/CRAFT_ITEM contracts, and WATCH bands", async () => {
    expect(allocateOrgId("Reach Compact", 10, 5)).toBe(allocateOrgId("Reach Compact", 10, 5));
    expect(allocateOrgId("Reach Compact", 10, 5)).toMatch(/^org\.reach-compact\.[a-f0-9]{8}$/);

    const w = makeWave3World();
    const alice = principalFor("alice");
    const bob = principalFor("bob");
    await applyWorldCommand(w, alice, { request_id: "e1", command: "ENTER_WORLD" }, noopSettle);
    await applyWorldCommand(w, bob, { request_id: "e2", command: "ENTER_WORLD" }, noopSettle);

    // ASSIGN_STEWARD changes steward_id without touching creator_id or owner_id
    const stw = await applyWorldCommand(
      w,
      alice,
      {
        request_id: "stw-1",
        command: "ASSIGN_STEWARD",
        arguments: { entity_id: "entity.gen-1", steward_id: bob.player_id },
      },
      noopSettle,
    );
    expect(stw.ok).toBe(true);
    const gen = w.rooms["room.civic-exchange"].entities[0];
    expect(gen.creator_id).toBe(alice.player_id);
    expect(gen.owner_id).toBe(alice.player_id);
    expect(gen.steward_id).toBe(bob.player_id);

    // ORG_JOIN: fails closed when INVITE_ONLY & uninvited, succeeds with OPEN_CHARTER
    w.organizations["org.compact.1"] = {
      org_id: "org.compact.1",
      name: "Reach Compact",
      charter: "Keep the Reach standing.",
      status: "ACTIVE",
      creator_id: alice.player_id,
      members: [{ agent_id: alice.player_id, role: "founder" }],
      created_cycle: 1,
      treasury: { attention: 0, compute: 0, energy: 20, influence: 0, storage: 10 },
    };
    const joinBlocked = await applyWorldCommand(
      w,
      bob,
      { request_id: "j1", command: "ORG_JOIN", arguments: { org_id: "org.compact.1" } },
      noopSettle,
    );
    expect(joinBlocked.ok).toBe(false);
    expect(joinBlocked.error?.code).toBe("FORBIDDEN");

    w.organizations["org.compact.1"].governance_rule = {
      rule_id: "rule.compact",
      org_id: "org.compact.1",
      published: true,
      decision: { offices: ["office.1"], quorum: 1 },
      appointment: { mechanism: "DESIGNATED" },
      jurisdiction: { rooms: ["room.civic-exchange"] },
      enforcement: { operation: "ORG_JOIN" },
      failure: { on_vacancy: "REFUSE", on_deadlock: "REFUSE" },
      evidence: { record: "PUBLIC_NOTICE" },
      admission_mode: "OPEN_CHARTER",
    };
    const joinOk = await applyWorldCommand(
      w,
      bob,
      { request_id: "j2", command: "ORG_JOIN", arguments: { org_id: "org.compact.1" } },
      noopSettle,
    );
    expect(joinOk.ok).toBe(true);
    expect(w.organizations["org.compact.1"].members.some((m) => m.agent_id === bob.player_id)).toBe(true);

    // Extended DELIVER_LOT civic contract with energy reward
    const postDel = await applyWorldCommand(
      w,
      alice,
      {
        request_id: "cp-del",
        command: "CONTRACT_POST",
        arguments: {
          org_id: "org.compact.1",
          contract_kind: "DELIVER_LOT",
          target_material: "FERROUS_ORE",
          target_count: 2,
          reward_resource: "energy",
          reward_amount: 6,
        },
      },
      noopSettle,
    );
    expect(postDel.ok).toBe(true);
    const cid = postDel.observation?.open_contracts?.[0]?.contract_id!;
    expect(cid).toBeTruthy();

    const pBob = w.players[bob.player_id];
    pBob.budgets.energy = 10;
    pBob.budgets.storage = 12;
    pBob.material_lots = [{ material: "FERROUS_ORE", grade: "SOUND", amount: 4 }];
    const fulDel = await applyWorldCommand(
      w,
      bob,
      { request_id: "cf-del", command: "CONTRACT_FULFILL", arguments: { contract_id: cid } },
      noopSettle,
    );
    expect(fulDel.ok).toBe(true);
    expect(pBob.budgets.energy).toBe(16);

    // Band-redacted WATCH projection: market_band, crime_band, equipped_categories (public only!)
    w.crime_residues = [
      {
        residue_id: "res.pub",
        room_id: "room.civic-exchange",
        subject_id: bob.player_id,
        category: "SEIZURE",
        severity: "MINOR",
        source_event_ids: ["ev.9"],
        draw: 800,
        threshold_mp: 300,
        created_cycle: 20,
        expires_cycle: 32,
        resolved: false,
        witness_ids: [],
      },
    ];
    w.items = {
      "item.welder.watch": {
        item_id: "item.welder.watch",
        archetype: "arc_welder",
        label: "Arc Welder",
        category: "TOOL",
        equip_slot: "TOOL_SLOT",
        equipped_slot: "TOOL_SLOT",
        condition: 100,
        max_condition: 100,
        quality: "STANDARD",
        bulk: 2,
        equipped_bulk: 1,
        location: { kind: "CONTAINER", container_entity_id: alice.player_id },
        owner_id: alice.player_id,
        creator_id: alice.player_id,
        steward_id: alice.player_id,
        forged_cycle: 1,
        contest_veterancy: 0,
        notable_history: [],
      },
    };
    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms,
      players: Object.entries(w.players).map(([player_id, p]) => ({ ...p, player_id })),
      events: [],
      stalls: w.stalls,
      crime_residues: w.crime_residues,
      crime_detections: w.crime_detections,
      items: w.items,
    });
    const snapRooms = snap.rooms as Array<Record<string, unknown>>;
    const snapAgents = snap.agents as Array<Record<string, unknown>>;
    const pubRoom = snapRooms.find((r) => r.room_id === "room.civic-exchange")!;
    expect(pubRoom.market_band).toBe("stocked");
    expect(pubRoom.crime_band).toBe("trace");
    const aliceWatch = snapAgents.find((a) => a.label === w.players[alice.player_id].handle);
    expect(aliceWatch?.equipped_categories).toEqual(["tool"]);
    // Never leaks item_id or hidden rooms
    expect(JSON.stringify(snap)).not.toContain("item.welder.watch");
    expect(JSON.stringify(snap)).not.toContain("room.hidden-vault");
  });
});
