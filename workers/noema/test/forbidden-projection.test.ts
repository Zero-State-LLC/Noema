import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { haveSpecsArtifacts } from "./specs-checkout";
import { buildWatchLive } from "../src/watch-live";

const HERE = new URL(".", import.meta.url).pathname;
const SRC = join(HERE, "../src");
const SPECS = join(HERE, "../../../../Noema-Specs/specs");
const NOW = 1_700_000_000_000;

/**
 * Sixteen slice catalogs carry `forbidden_in_projection` — tokens that must never
 * reach a player-visible surface. Thirty-four distinct ones: `hp`, `known_truth`,
 * `oracle`, `deity`, `truth_probability`, `culture score`, and so on. Nothing
 * checked them, and they are the same family as the hidden-room leak in #520:
 * a redaction rule stated in a contract and enforced only by memory.
 *
 * Two levels, because neither alone is enough. The projection modules must not
 * contain the token at all — a phrase that is not in the source cannot be
 * composed. And a built snapshot must not contain it either, which catches a
 * value arriving through a payload rather than a literal.
 */

/**
 * The unambiguous half. These are nouns from mechanics NOEMA deliberately does
 * not have — hit points, oracles, deities, truth probabilities — so an
 * occurrence anywhere in public output is a defect regardless of slice.
 */
const FORBIDDEN_GLOBAL = [
  "hitpoints",
  "known_truth",
  "oracle",
  "deity",
  "devotion",
  "heresy",
  "truth_probability",
  "rumor_score",
  "culture score",
  "mystery solved",
  "the answer",
  "you are wrong",
  "the ledger is wrong",
];

/**
 * The other half is slice-scoped and deliberately NOT asserted here. `amount`,
 * `stock`, `hidden`, `entity_id`, `reputation`, `health`, `unknown` and friends
 * are banned from *a particular slice's* projection, not from every surface —
 * `reputation_summary` is a legitimate LOOK field, `entity_id` is legitimate in
 * a WATCH room listing. Asserting them globally would be wrong, and loosening
 * them to nothing would be worse. Scoping each to its slice needs the per-slice
 * projection boundary, which no catalog states machine-readably yet.
 */
const NOT_YET_SCOPED = [
  "amount", "stock", "hidden", "entity_id", "reputation", "unknown",
  "convert", "markup", "rebate", "100%", "health", "coward", "lied",
  "deceived", "wipe", "ROLE_", "hp", "faith", "canon", "quest", "xp",
];

/** Modules that compose player-visible output. */
const PUBLIC_MODULES = ["watch-live.ts", "watch-map.ts", "world-reports.ts", "presentation"];

function publicProjectionSource(): string {
  const read = (p: string): string => {
    const stat = readdirSync(p, { withFileTypes: true });
    return stat
      .map((e) => (e.isDirectory() ? read(join(p, e.name)) : e.name.endsWith(".ts") ? readFileSync(join(p, e.name), "utf8") : ""))
      .join("\n");
  };
  return PUBLIC_MODULES.map((m) => {
    const p = join(SRC, m);
    if (!existsSync(p)) return "";
    return m.endsWith(".ts") ? readFileSync(p, "utf8") : read(p);
  }).join("\n");
}

function snapshot(): string {
  const rooms = {
    "room.market": {
      room_id: "room.market", name: "Chamber Market", description: "Open stalls.", exits: [],
      entities: [{ entity_id: "entity.relay", label: "relay", entity_type: "INFRASTRUCTURE" }],
    },
  };
  const out = buildWatchLive({
    world_id: "w", cycle: 12, sequence: 90, rooms: rooms as never,
    players: [{ player_id: "player.aaaaaaaaaaaa", handle: "Vesper-7", room_id: "room.market",
      entered: true, last_seen_ms: NOW, actor_kind: "live" }] as never,
    events: [{ event_type: "ENTITY_UPDATE", sequence: 89, cycle: 12, handle: "Vesper-7",
      player_id: "player.aaaaaaaaaaaa", actor_kind: "live", at: NOW,
      payload: { entity_id: "entity.relay", field: "condition", from: 40, to: 80, operation: "REPAIR" } }] as never,
    public_pulses: ["A practice has outlived its founders."],
    now: NOW,
  });
  return JSON.stringify(out);
}

describe("forbidden projection tokens (16 slice catalogs)", () => {
  const have = haveSpecsArtifacts(SPECS);

  it.skipIf(!have)("still reads the ban from the catalogs, not from this file", () => {
    const declared = new Set<string>();
    for (const f of readdirSync(SPECS).filter((n) => n.endsWith(".json"))) {
      const walk = (o: unknown): void => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === "object") {
          for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
            if (k === "forbidden_in_projection" && Array.isArray(v)) v.forEach((x) => declared.add(String(x)));
            walk(v);
          }
        }
      };
      walk(JSON.parse(readFileSync(join(SPECS, f), "utf8")));
    }
    // Everything this file names must still be a real ban somewhere in Specs.
    for (const t of [...FORBIDDEN_GLOBAL, ...NOT_YET_SCOPED]) expect(declared).toContain(t);
    // And nothing may quietly appear in Specs without landing in one list.
    const unaccounted = [...declared].filter(
      (t) => !FORBIDDEN_GLOBAL.includes(t) && !NOT_YET_SCOPED.includes(t),
    );
    expect(unaccounted).toEqual([]);
  });

  it("no public projection module mentions a globally forbidden token", () => {
    const src = publicProjectionSource().toLowerCase();
    expect(src.length).toBeGreaterThan(1000);
    expect(FORBIDDEN_GLOBAL.filter((t) => src.includes(t.toLowerCase()))).toEqual([]);
  });

  it("no built WATCH snapshot contains one either", () => {
    const out = snapshot().toLowerCase();
    expect(FORBIDDEN_GLOBAL.filter((t) => out.includes(t.toLowerCase()))).toEqual([]);
  });
});
