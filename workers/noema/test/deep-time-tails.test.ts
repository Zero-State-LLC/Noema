import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { enrichEntity } from "../src/actions";
import {
  ORG_RATCHET_CAP,
  orgCreateExtraInfluence,
  pathDependenceIndex,
  ratchetOnAttest,
  ratchetOnOrgCreate,
  type DeepTimeSlice,
  type ScarRecord,
} from "../src/deep-time";
import { buildWatchLive } from "../src/watch-live";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

const HERE = new URL(".", import.meta.url).pathname;
const SRC = join(HERE, "../src");

/**
 * Specs RESEARCH-ASSIMILATION-2026-08-24-ENGINEERING Slice A records four
 * OBSERVED claims about the Deep Time tails and asks for fixtures that pin
 * them, so the concordance cannot silently rot. Each test names the claim it
 * pins. If one fails, the runtime moved and the Specs document is now wrong —
 * fix both or neither.
 */

function slice(): DeepTimeSlice {
  return {} as DeepTimeSlice;
}

function scar(strength: number): ScarRecord {
  return {
    scar_id: `scar.econ.${strength}`,
    domain: "economic",
    room_id: "room.hub",
    strength,
    decay_rate: 0.01,
    cycle_born: 1,
    reconstruction_confidence: 0.5,
    visibility: "public",
  };
}

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.deep-time-tails",
    world_name: "Deep Time Tails",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Hub.",
        exits: [],
        entities: [enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE" })],
      },
      "room.remote": { room_id: "room.remote", name: "Remote", description: "Remote.", exits: [], entities: [] },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("Deep Time tails — Specs #285 Slice A concordance", () => {
  it("path_dependence_index is the clamped MAX of scar mean and ratchet mean", () => {
    // Claim: "folded into LOOK path_dependence_index (max of scar-strength
    // mean and ratchet mean)". Max, not sum, not product — a quiet change to
    // the fold changes every LOOK in the world.
    expect(pathDependenceIndex(undefined, undefined)).toBe(0);
    expect(pathDependenceIndex([scar(0.2), scar(0.6)], undefined)).toBeCloseTo(0.4);

    const w = slice();
    for (let i = 0; i < 3; i++) ratchetOnOrgCreate(w, i + 1); // strength 3/5
    const ratchets = (w as { norm_ratchets?: Record<string, never> }).norm_ratchets;
    expect(pathDependenceIndex(undefined, ratchets)).toBeCloseTo(0.6);
    // scar mean 0.4 vs ratchet mean 0.6 → the max wins.
    expect(pathDependenceIndex([scar(0.2), scar(0.6)], ratchets)).toBeCloseTo(0.6);
    // and it is clamped, never above 1 even with a corrupt strength.
    expect(pathDependenceIndex([scar(5)], ratchets)).toBe(1);
  });

  it("LOOK pins the exact path_dependence_index projection", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.scars = [scar(0.2), scar(0.6)];
    w.norm_ratchets = {
      org_create: {
        key: "org_create",
        reversal_cost: 3,
        path_dependence_strength: 0.75,
        established_cycle: 1,
        hits: 4,
      },
      attest: {
        key: "attest",
        reversal_cost: 0,
        path_dependence_strength: 0.4,
        established_cycle: 2,
        hits: 2,
      },
    };

    const look = await run(w, p, "LOOK");

    expect(look.ok).toBe(true);
    expect(look.observation?.path_dependence_index).toBe(0.575);
  });

  it("LOOK pins exact lore-attractor labels for local and global tails", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.lore_attractors = [
      { attractor_id: "lore.burnt-relay", label: "Burnt Relay", weight: 0.7, room_id: "room.hub", basin: "forming" },
      { attractor_id: "lore.shared-nacre", label: "Shared Nacre", weight: 0.4, basin: "crystallized" },
      { attractor_id: "lore.remote-echo", label: "Remote Echo", weight: 0.9, room_id: "room.remote", basin: "forming" },
    ];

    const look = await run(w, p, "LOOK");

    expect(look.ok).toBe(true);
    expect((look.observation?.lore_attractors || []).map((a) => a.label)).toEqual(["Burnt Relay", "Shared Nacre"]);
  });

  it("WATCH projection omits path_dependence_index even when Deep Time tails exist", () => {
    const watch = buildWatchLive({
      world_id: "world.deep-time-tails",
      cycle: 12,
      sequence: 2,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Hub",
          description: "Hub.",
          exits: [],
          entities: [
            { entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE", scar: true },
          ],
        },
      },
      players: [{ player_id: "player.nacre", handle: "nacre", room_id: "room.hub", entered: true, last_seen_ms: 123 }],
      events: [
        {
          event_type: "SCAR_FORMED",
          sequence: 2,
          cycle: 12,
          payload: { room_id: "room.hub", summary: "relay scar formed" },
        },
      ],
    });

    expect(JSON.stringify(watch)).not.toContain("path_dependence_index");
  });

  it("reversal_cost is the cost driver; path_dependence_strength drives nothing", () => {
    // Claim: "It is not a cost driver. reversal_cost is."
    const w = slice();
    const r1 = ratchetOnOrgCreate(w, 1);
    expect(orgCreateExtraInfluence(w as never)).toBe(r1.reversal_cost);
    for (let i = 2; i <= 9; i++) ratchetOnOrgCreate(w, i);
    // Cost saturates at the RFC-0123 cap...
    expect(orgCreateExtraInfluence(w as never)).toBe(ORG_RATCHET_CAP);
    // ...while path_dependence_strength saturates independently at 1 —
    // the two travel together only by coincidence of small numbers.
    const org = (w as { norm_ratchets?: { org_create?: { path_dependence_strength: number } } })
      .norm_ratchets?.org_create;
    expect(org?.path_dependence_strength).toBe(1);

    // ATTEST establishes path dependence with reversal_cost pinned to 0:
    // strength without surcharge, the cleanest proof the two fields are
    // different things.
    const wa = slice();
    for (let i = 0; i < 4; i++) ratchetOnAttest(wa, i + 1);
    const attest = (wa as { norm_ratchets?: { attest?: { reversal_cost: number; path_dependence_strength: number } } })
      .norm_ratchets?.attest;
    expect(attest?.reversal_cost).toBe(0);
    expect(attest?.path_dependence_strength).toBeCloseTo(0.5);
  });

  it("the scar domain set is closed and no myth producer exists", () => {
    // Claim: "Myth scars have no domain (economic / social / territorial only)
    // and no producer." The union type enforces the set at compile time; this
    // pins the absence at the token level so a 'myth' domain or producer cannot
    // land without failing here first.
    const read = (dir: string): string =>
      readdirSync(dir, { withFileTypes: true })
        .map((e) => (e.isDirectory() ? read(join(dir, e.name)) : e.name.endsWith(".ts") ? readFileSync(join(dir, e.name), "utf8") : ""))
        .join("\n");
    const src = read(SRC);
    expect(src).toContain('"economic" | "social" | "territorial"');
    expect(src.toLowerCase()).not.toContain("myth");
  });

  it("lore attractors and the index stay off the cost and signaling paths", () => {
    // Claim: attractors "do not change harvest or signaling", and the index is
    // display-only. Neither identifier may appear in the modules that price
    // actions or compute signal quality.
    for (const file of ["actions.ts", "cargo.ts", "resource-production.ts", "signal.ts", "curvature.ts"]) {
      const text = readFileSync(join(SRC, file), "utf8");
      expect(text, `${file} must not consume lore_attractors`).not.toContain("lore_attractors");
      expect(text, `${file} must not consume path_dependence`).not.toContain("path_dependence");
    }
  });
});
