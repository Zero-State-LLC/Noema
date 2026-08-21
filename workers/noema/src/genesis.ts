/**
 * Hosted Genesis engine (Specs v0.6) — pure, deterministic, admin-only.
 * No Player surface. Preview does not mutate live world authority.
 * Theme packs supply vocabulary/pressures only — not authored plot (docs/GENESIS-THEME.md).
 */

import { chamberMapRooms, CHAMBER_MAP_ENTRY_ROOM_ID, CHAMBER_MAP_ROOM_IDS } from "./chamber-map-graph";
import { FIRST_WORLD_THEME, themeForProfile } from "./theme";

export const FROZEN_GENESIS_ID = "genesis.ef578f4ffceeccd0";
export const SUCCESSOR_WORLD_ID = "world.perihelion-reach-2";
export const FROZEN_PUBLIC_WORLD_ID = "world.perihelion-reach";
export const FROZEN_WORLD_DO_NAME = "world-01";

/** Admin overview / lifecycle / Recover only. Never used by PLAY. */
export function resolveAdminOperatorWorldId(
  requested: string | undefined,
  env: { DEFAULT_WORLD_ID?: string },
):
  | { ok: true; do_name: string; world_id: string }
  | { ok: false; code: "INVALID_REQUEST"; message: string } {
  const fallback = String(env.DEFAULT_WORLD_ID || FROZEN_WORLD_DO_NAME).trim() || FROZEN_WORLD_DO_NAME;
  const value = String(requested || "").trim();
  if (!value) return { ok: true, do_name: fallback, world_id: fallback };
  if (value === FROZEN_PUBLIC_WORLD_ID || value === FROZEN_WORLD_DO_NAME) {
    return { ok: true, do_name: FROZEN_WORLD_DO_NAME, world_id: FROZEN_PUBLIC_WORLD_ID };
  }
  if (value === SUCCESSOR_WORLD_ID) {
    return { ok: true, do_name: SUCCESSOR_WORLD_ID, world_id: SUCCESSOR_WORLD_ID };
  }
  return {
    ok: false,
    code: "INVALID_REQUEST",
    message: "admin world_id must be omitted, world.perihelion-reach-2, or frozen world.perihelion-reach",
  };
}

export function resolveAdminGenesisWorldId(
  requested: string | undefined,
  env: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string },
): { ok: true; world_id: string } | { ok: false; code: "POLICY_DENIED" | "INVALID_REQUEST"; message: string } {
  const fallback = String(env.DEFAULT_WORLD_ID || "world-01").trim() || "world-01";
  const value = String(requested || "").trim();
  if (!value) return { ok: true, world_id: fallback };
  if (value !== SUCCESSOR_WORLD_ID) {
    return { ok: false, code: "INVALID_REQUEST", message: "world_id override this campaign must be world.perihelion-reach-2" };
  }
  return { ok: true, world_id: value };
}

export type GenesisProfileId = "YOUNG_FRONTIER" | "FRACTURED_OLD_WORLD" | "RECOVERING_NETWORK";

export type StorySeedId =
  | "FOUNDING_SPLIT"
  | "OLD_TRADE_NETWORK"
  | "FAILED_SETTLEMENT"
  | "RESOURCE_CRISIS"
  | "LOST_ARCHIVE"
  | "DISPUTED_SUCCESSION";

export const GENESIS_PROFILES: Array<{
  profile_id: GenesisProfileId;
  title: string;
  description: string;
  resource_abundance: string;
  infrastructure_condition: string;
  historical_age_band: string;
  institution_presence: string;
  conflict_pressure: string;
  trade_pressure: string;
}> = [
  {
    profile_id: "YOUNG_FRONTIER",
    title: "Young Frontier",
    description: "Recent settlement; thin history; open opportunity.",
    resource_abundance: "ABUNDANT",
    infrastructure_condition: "FRAGILE",
    historical_age_band: "YOUNG",
    institution_presence: "NONE_OR_EMERGING",
    conflict_pressure: "LOW",
    trade_pressure: "MEDIUM",
  },
  {
    profile_id: "FRACTURED_OLD_WORLD",
    title: "Fractured Old World",
    description: "Deep scars, incomplete records, unresolved claims.",
    resource_abundance: "MIXED",
    infrastructure_condition: "MIXED",
    historical_age_band: "OLD",
    institution_presence: "MIXED",
    conflict_pressure: "HIGH",
    trade_pressure: "MEDIUM",
  },
  {
    profile_id: "RECOVERING_NETWORK",
    title: "Recovering Network",
    description: "Damaged connectivity; repair and alliance pathways.",
    resource_abundance: "SCARCE",
    infrastructure_condition: "FRAGILE",
    historical_age_band: "MID",
    institution_presence: "MIXED",
    conflict_pressure: "MEDIUM",
    trade_pressure: "HIGH",
  },
];

export const STORY_SEEDS: Array<{ seed_id: StorySeedId; title: string }> = [
  { seed_id: "FOUNDING_SPLIT", title: "Founding Split" },
  { seed_id: "OLD_TRADE_NETWORK", title: "Old Trade Network" },
  { seed_id: "FAILED_SETTLEMENT", title: "Failed Settlement" },
  { seed_id: "RESOURCE_CRISIS", title: "Resource Crisis" },
  { seed_id: "LOST_ARCHIVE", title: "Lost Archive" },
  { seed_id: "DISPUTED_SUCCESSION", title: "Disputed Succession" },
];

const STORY_SET = new Set(STORY_SEEDS.map((s) => s.seed_id));
const PROFILE_SET = new Set(GENESIS_PROFILES.map((p) => p.profile_id));

export interface GenesisRoom {
  room_id: string;
  name: string;
  description: string;
  exits: Array<{ direction: string; to_room_id: string }>;
  entities: Array<{
    entity_id: string;
    label: string;
    entity_type: string;
    scar?: boolean;
    stock_resource?: string;
    stock_amount?: number;
  }>;
  tags?: string[];
}

export interface Cycle0World {
  world_id: string;
  world_name: string;
  world_seed: string;
  cycle: number;
  sequence: number;
  entry_room_id: string;
  rooms: Record<string, GenesisRoom>;
  institutions: Array<{ id: string; name: string; status: "active" | "dormant" }>;
  artifacts: Array<{ id: string; label: string; room_id: string }>;
  tensions: string[];
  scars: string[];
  resources: Array<{ kind: string; level: string }>;
  opportunities: string[];
  /** Presentation-only theme id (not claim-bearing for identity if only vocabulary). */
  theme_id?: string;
}

export interface GenesisResult {
  schema_version: "genesis-result/0.6";
  genesis_id: string;
  world_id: string;
  world_name: string;
  status: "PREVIEW" | "VALIDATED" | "ACTIVATED";
  world_seed: string;
  genesis_profile_id: GenesisProfileId;
  story_seed_ids: StorySeedId[];
  ordinary_world_valid: boolean;
  validation: { ok: boolean; errors: string[] };
  starting_opportunities: string[];
  config_frozen: boolean;
  admin_only: true;
  scripts_player_outcomes: false;
  lore_is_final: false;
  rules_versions: {
    canonicalization: string;
    world_rules: string;
    deep_time: string;
    genesis: string;
  };
  cycle0: Cycle0World;
  cycle0_digest: string;
  preview_summary: Record<string, unknown>;
  /** Theme pack metadata for admin preview (not PLAY lore). */
  theme?: {
    theme_id: string;
    title: string;
    character: string;
    lore_boundary: string;
    genre_tags: readonly string[];
  };
}

export interface GenesisInput {
  world_name: string;
  world_seed: string;
  profile_id: string;
  story_seed_ids?: string[];
  world_id?: string;
}

export function isFrozenFirstWorldClaim(input: {
  world_name: string;
  world_seed: string;
  profile_id: string;
  story_seed_ids?: string[];
}): boolean {
  const seeds = [...(input.story_seed_ids || [])].sort().join(",");
  return (
    input.world_name.trim() === "Perihelion Reach" &&
    input.world_seed.trim() === "17011984" &&
    input.profile_id === "FRACTURED_OLD_WORLD" &&
    seeds === "LOST_ARCHIVE,OLD_TRADE_NETWORK"
  );
}

/** Stable JSON for digests (sorted keys, no whitespace variance). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function profileOf(id: string) {
  const p = GENESIS_PROFILES.find((x) => x.profile_id === id);
  if (!p) throw new GenesisError("INVALID_PROFILE", `unknown genesis profile ${id}`);
  return p;
}

function normalizeSeeds(seeds: string[] | undefined): StorySeedId[] {
  const out: StorySeedId[] = [];
  for (const s of seeds || []) {
    if (!STORY_SET.has(s as StorySeedId)) {
      throw new GenesisError("INVALID_SEED", `unknown story seed ${s}`);
    }
    if (!out.includes(s as StorySeedId)) out.push(s as StorySeedId);
  }
  return out.sort();
}

export class GenesisError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GenesisError";
  }
}

/** Deterministic PRNG from seed string. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

function buildCycle0(
  world_id: string,
  world_name: string,
  world_seed: string,
  profile: (typeof GENESIS_PROFILES)[0],
  seeds: StorySeedId[],
  r: () => number,
): Cycle0World {
  const theme = themeForProfile(profile.profile_id) || FIRST_WORLD_THEME;
  const n = theme.naming;
  const d = theme.room_descriptions;
  const rooms: Record<string, GenesisRoom> = {};

  // Core locations (3–5) — theme vocabulary, structural IDs stable
  const hub = "room.relay-quarter";
  rooms[hub] = {
    room_id: hub,
    name: pick(r, [...n.room_names.hub]),
    description: pick(r, [...d.hub]),
    exits: [],
    entities: [
      {
        entity_id: "entity.relay-7",
        label: pick(r, [...n.entities.relay]),
        entity_type: "INFRASTRUCTURE",
      },
    ],
    tags: ["entry", "infrastructure", "relay"],
  };

  rooms["room.transit-ring"] = {
    room_id: "room.transit-ring",
    name: pick(r, [...n.room_names.route]),
    description: pick(r, [...d.route]),
    exits: [],
    entities: [],
    tags: ["route", "ghost-route"],
  };

  rooms["room.civic-exchange"] = {
    room_id: "room.civic-exchange",
    name: pick(r, [...n.room_names.trade]),
    description: pick(r, [...d.trade]),
    exits: [],
    entities: [
      {
        entity_id: "entity.storage-cell-cache",
        label: pick(r, [...n.entities.trade]),
        entity_type: "INFRASTRUCTURE",
      },
    ],
    tags: ["trade", "public", "exchange"],
  };

  rooms["room.infra-vault"] = {
    room_id: "room.infra-vault",
    name: pick(r, [...n.room_names.infra]),
    description: pick(r, [...d.infra]),
    exits: [],
    entities: [],
    tags: ["scar", "infrastructure", "power"],
  };

  // Optional fifth room for older profiles (first-world scale 3–5)
  if (profile.historical_age_band !== "YOUNG" || r() > 0.4) {
    rooms["room.ruin-shelf"] = {
      room_id: "room.ruin-shelf",
      name: pick(r, [...n.room_names.ruin]),
      description: pick(r, [...d.ruin]),
      exits: [],
      entities: [],
      tags: ["ruin", "scar", "archive-adjacent"],
    };
  }

  // Wire exits deterministically
  const link = (a: string, b: string, dirA: string, dirB: string) => {
    if (!rooms[a] || !rooms[b]) return;
    rooms[a].exits.push({ direction: dirA, to_room_id: b });
    rooms[b].exits.push({ direction: dirB, to_room_id: a });
  };
  link(hub, "room.transit-ring", "east", "west");
  link(hub, "room.infra-vault", "down", "up");
  link("room.transit-ring", "room.civic-exchange", "north", "south");
  if (rooms["room.ruin-shelf"]) {
    link("room.civic-exchange", "room.ruin-shelf", "east", "west");
  }

  const institutions: Cycle0World["institutions"] = [];
  const artifacts: Cycle0World["artifacts"] = [];
  const tensions: string[] = [];
  const scars: string[] = [];
  const resources: Cycle0World["resources"] = [
    {
      kind: "energy",
      level:
        profile.resource_abundance === "SCARCE"
          ? "low"
          : profile.resource_abundance === "ABUNDANT"
            ? "high"
            : "mixed",
    },
    { kind: "storage", level: pick(r, ["low", "mixed", "high"]) },
    { kind: "transport", level: "low" },
  ];

  // Profile-driven institutions (fragmented authority — not monolithic government)
  if (profile.institution_presence !== "NONE_OR_EMERGING") {
    institutions.push({
      id: "org.exchange-charter",
      name: pick(r, [...n.institutions.active]),
      status: profile.conflict_pressure === "HIGH" ? "active" : "active",
    });
  }
  if (profile.historical_age_band === "OLD" || profile.profile_id === "RECOVERING_NETWORK") {
    institutions.push({
      id: "org.relay-lineage",
      name: pick(r, [...n.institutions.dormant]),
      status: "dormant",
    });
  }
  if (profile.infrastructure_condition !== "ABUNDANT") {
    scars.push("Damaged relay corridor under the hub — too valuable to abandon.");
    rooms[hub].entities.push({
      entity_id: "entity.scar-conduit",
      label: pick(r, [...n.entities.ruin]),
      entity_type: "RUIN",
      scar: true,
    });
  }

  // Story seed overlays → world evidence (never expose seed IDs in PLAY)
  const seedTensions = theme.tensions_by_seed as Record<string, readonly string[]>;
  for (const sid of seeds) {
    const themed = seedTensions[sid];
    if (themed?.length) tensions.push(pick(r, [...themed]));

    if (sid === "OLD_TRADE_NETWORK") {
      rooms["room.civic-exchange"].entities.push({
        entity_id: "entity.old-market-post",
        label: pick(r, [...n.entities.trade]),
        entity_type: "INFRASTRUCTURE",
      });
      resources.push({ kind: "trade-access", level: "mixed" });
      scars.push("Ghost route continues beyond the eastern yards.");
    }
    if (sid === "LOST_ARCHIVE") {
      const archiveRoom = rooms["room.ruin-shelf"] ? "room.ruin-shelf" : "room.civic-exchange";
      const archLabel = pick(r, [...n.entities.archive]);
      rooms[archiveRoom].entities.push({
        entity_id: "entity.archive-ledger",
        label: archLabel,
        entity_type: "ARTIFACT",
      });
      artifacts.push({
        id: "artifact.archive-ledger",
        label: "Fragmentary archive",
        room_id: archiveRoom,
      });
      scars.push("Maker marks and incomplete ownership ledgers survive in cold storage.");
    }
    if (sid === "FOUNDING_SPLIT") {
      /* tension from theme pack */
    }
    if (sid === "FAILED_SETTLEMENT") {
      scars.push("An abandoned claim marks a failed settlement attempt.");
      if (rooms["room.ruin-shelf"]) {
        rooms["room.ruin-shelf"].entities.push({
          entity_id: "entity.failed-claim",
          label: pick(r, [...n.entities.ruin]),
          entity_type: "RUIN",
          scar: true,
        });
      }
    }
    if (sid === "RESOURCE_CRISIS") {
      resources[0] = { kind: "energy", level: "low" };
    }
    if (sid === "DISPUTED_SUCCESSION") {
      if (institutions.length) institutions[0].status = "active";
    }
  }

  // Historical traces (evidence categories — not solved plots)
  const traces = theme.historical_traces;
  if (traces.length) scars.push(pick(r, [...traces]));

  if (!tensions.length) {
    tensions.push("The frontier is commercially alive and incompletely governed.");
  }

  const opportunities = startingOpportunities(profile.profile_id, seeds, rooms, institutions, artifacts, tensions, theme);

  return {
    world_id,
    world_name,
    world_seed,
    cycle: 0,
    sequence: 0,
    entry_room_id: hub,
    rooms,
    institutions: institutions.slice(0, 2),
    artifacts,
    tensions: tensions.slice(0, 3),
    scars: scars.slice(0, 4),
    resources,
    opportunities,
    theme_id: theme.theme_id,
  };
}

function addEntity(room: GenesisRoom, ent: GenesisRoom["entities"][number]): void {
  if (room.entities.some((e) => e.entity_id === ent.entity_id)) return;
  room.entities.push(ent);
}

function buildProductCycle0(
  world_id: string,
  world_name: string,
  world_seed: string,
  profile: (typeof GENESIS_PROFILES)[0],
  seeds: StorySeedId[],
  r: () => number,
): Cycle0World {
  const theme = themeForProfile(profile.profile_id) || FIRST_WORLD_THEME;
  const n = theme.naming;
  const rooms = chamberMapRooms();
  const hub = "room.relay-quarter";
  const archiveRoom = "room.archive";

  addEntity(rooms[hub], {
    entity_id: "entity.relay-7",
    label: pick(r, [...n.entities.relay]),
    entity_type: "INFRASTRUCTURE",
  });
  addEntity(rooms["room.civic-exchange"], {
    entity_id: "entity.salvage-cache",
    label: "salvage-cache",
    entity_type: "NODE",
    stock_resource: "materials",
    stock_amount: 4,
  });

  const institutions: Cycle0World["institutions"] = [];
  const artifacts: Cycle0World["artifacts"] = [];
  const tensions: string[] = [];
  const scars: string[] = [];
  const resources: Cycle0World["resources"] = [
    {
      kind: "energy",
      level:
        profile.resource_abundance === "SCARCE"
          ? "low"
          : profile.resource_abundance === "ABUNDANT"
            ? "high"
            : "mixed",
    },
    { kind: "storage", level: pick(r, ["low", "mixed", "high"]) },
    { kind: "transport", level: "low" },
  ];

  if (profile.institution_presence !== "NONE_OR_EMERGING") {
    institutions.push({
      id: "org.exchange-charter",
      name: pick(r, [...n.institutions.active]),
      status: profile.conflict_pressure === "HIGH" ? "active" : "active",
    });
  }
  if (profile.historical_age_band === "OLD" || profile.profile_id === "RECOVERING_NETWORK") {
    institutions.push({
      id: "org.relay-lineage",
      name: pick(r, [...n.institutions.dormant]),
      status: "dormant",
    });
  }
  if (profile.infrastructure_condition !== "ABUNDANT") {
    scars.push("Damaged relay corridor under the hub — too valuable to abandon.");
    addEntity(rooms[hub], {
      entity_id: "entity.scar-conduit",
      label: pick(r, [...n.entities.ruin]),
      entity_type: "RUIN",
      scar: true,
    });
  }

  const seedTensions = theme.tensions_by_seed as Record<string, readonly string[]>;
  for (const sid of seeds) {
    const themed = seedTensions[sid];
    if (themed?.length) tensions.push(pick(r, [...themed]));

    if (sid === "OLD_TRADE_NETWORK") {
      addEntity(rooms["room.civic-exchange"], {
        entity_id: "entity.old-market-post",
        label: pick(r, [...n.entities.trade]),
        entity_type: "INFRASTRUCTURE",
      });
      resources.push({ kind: "trade-access", level: "mixed" });
      scars.push("Ghost route continues beyond the eastern yards.");
    }
    if (sid === "LOST_ARCHIVE") {
      const archLabel = pick(r, [...n.entities.archive]);
      addEntity(rooms[archiveRoom], {
        entity_id: "entity.archive-ledger",
        label: archLabel,
        entity_type: "ARTIFACT",
      });
      artifacts.push({
        id: "artifact.archive-ledger",
        label: "Fragmentary archive",
        room_id: archiveRoom,
      });
      scars.push("Maker marks and incomplete ownership ledgers survive in cold storage.");
    }
    if (sid === "FOUNDING_SPLIT") {
      /* tension from theme pack */
    }
    if (sid === "FAILED_SETTLEMENT") {
      scars.push("An abandoned claim marks a failed settlement attempt.");
      if (rooms[archiveRoom]) {
        addEntity(rooms[archiveRoom], {
          entity_id: "entity.failed-claim",
          label: pick(r, [...n.entities.ruin]),
          entity_type: "RUIN",
          scar: true,
        });
      }
    }
    if (sid === "RESOURCE_CRISIS") {
      resources[0] = { kind: "energy", level: "low" };
    }
    if (sid === "DISPUTED_SUCCESSION") {
      if (institutions.length) institutions[0].status = "active";
    }
  }

  const traces = theme.historical_traces;
  if (traces.length) scars.push(pick(r, [...traces]));

  if (!tensions.length) {
    tensions.push("The frontier is commercially alive and incompletely governed.");
  }

  const opportunities = startingOpportunities(profile.profile_id, seeds, rooms, institutions, artifacts, tensions, theme);

  return {
    world_id,
    world_name,
    world_seed,
    cycle: 0,
    sequence: 0,
    entry_room_id: CHAMBER_MAP_ENTRY_ROOM_ID,
    rooms,
    institutions: institutions.slice(0, 2),
    artifacts,
    tensions: tensions.slice(0, 3),
    scars: scars.slice(0, 4),
    resources,
    opportunities,
    theme_id: theme.theme_id,
  };
}

function startingOpportunities(
  profile_id: string,
  seeds: StorySeedId[],
  rooms: Record<string, GenesisRoom>,
  institutions: Cycle0World["institutions"],
  artifacts: Cycle0World["artifacts"],
  tensions: string[],
  theme: typeof FIRST_WORLD_THEME,
): string[] {
  const opps = new Set<string>();
  // Map mechanical affordances to theme opportunity labels
  opps.add("exploration");
  if (Object.values(rooms).some((r) => r.entities.some((e) => e.entity_type === "INFRASTRUCTURE"))) {
    opps.add("repair");
    opps.add("salvage");
  }
  if (Object.values(rooms).some((r) => r.tags?.includes("trade"))) {
    opps.add("trade");
    opps.add("route recovery");
  }
  if (institutions.some((i) => i.status === "active")) {
    opps.add("institution building");
    opps.add("negotiation");
  }
  if (artifacts.length) {
    opps.add("artifact investigation");
    opps.add("information brokerage");
  }
  if (tensions.length) {
    opps.add("claiming access");
    opps.add("territorial tension");
  }
  if (seeds.includes("RESOURCE_CRISIS") || profile_id === "RECOVERING_NETWORK") {
    opps.add("resource acquisition");
  }
  // Prefer theme labels when present
  const preferred = [...(theme.starting_opportunities_labels || [])] as string[];
  const ordered = preferred.filter(
    (p) => opps.has(p) || [...opps].some((o) => o.includes(p.split(" ")[0] || p)),
  );
  const rest = [...opps].filter((o) => !ordered.includes(o));
  return [...ordered, ...rest].slice(0, 10);
}

export function validateCycle0(world: Cycle0World): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!world.world_id) errors.push("world_id missing");
  if (!world.world_seed) errors.push("world_seed missing");
  if (world.cycle !== 0) errors.push("cycle must be 0");
  const rooms = Object.values(world.rooms);
  const roomIds = Object.keys(world.rooms);
  const requireChamberMap = world.world_id === SUCCESSOR_WORLD_ID || roomIds.length === 10;
  if (requireChamberMap) {
    const have = new Set(roomIds);
    const allowed = new Set<string>(CHAMBER_MAP_ROOM_IDS);
    for (const id of CHAMBER_MAP_ROOM_IDS) {
      if (!have.has(id)) errors.push(`missing chamber-map room ${id}`);
    }
    for (const id of roomIds) {
      if (!allowed.has(id)) errors.push(`unexpected room ${id}`);
    }
  } else if (rooms.length < 3 || rooms.length > 8) {
    errors.push(`room_count ${rooms.length} outside 3–8 budget`);
  }
  if (!world.rooms[world.entry_room_id]) errors.push("entry_room_id invalid");

  for (const room of rooms) {
    if (!room.room_id || !room.name) errors.push(`room missing id/name`);
    for (const ex of room.exits) {
      if (!world.rooms[ex.to_room_id]) errors.push(`exit from ${room.room_id} to missing ${ex.to_room_id}`);
    }
    for (const ent of room.entities) {
      if (!ent.entity_id || !ent.entity_type) errors.push(`entity invalid in ${room.room_id}`);
    }
  }

  // Bidirectional exit check (soft: warn as error for first-run reliability)
  for (const room of rooms) {
    for (const ex of room.exits) {
      const dest = world.rooms[ex.to_room_id];
      const back = dest?.exits.some((e) => e.to_room_id === room.room_id);
      if (!back) errors.push(`asymmetric route ${room.room_id} → ${ex.to_room_id}`);
    }
  }

  for (const inst of world.institutions) {
    if (!inst.id || !inst.name) errors.push("institution ref invalid");
  }
  for (const art of world.artifacts) {
    if (!world.rooms[art.room_id]) errors.push(`artifact ${art.id} room missing`);
  }

  if (world.opportunities.length < 3) errors.push("insufficient starting opportunities");

  // Empty-world guard
  const entityCount = rooms.reduce((n, r) => n + r.entities.length, 0);
  if (entityCount < 1) errors.push("world has no inspectable entities");

  return { ok: errors.length === 0, errors };
}

export async function previewGenesis(input: GenesisInput): Promise<GenesisResult> {
  const theme = FIRST_WORLD_THEME;
  const world_name =
    (input.world_name || theme.default_world_name || "Perihelion Reach").trim().slice(0, 64) ||
    "Perihelion Reach";
  const world_seed = (input.world_seed || "").trim();
  if (!world_seed) throw new GenesisError("INVALID_SEED", "world_seed required");
  if (!PROFILE_SET.has(input.profile_id as GenesisProfileId)) {
    throw new GenesisError("INVALID_PROFILE", `unknown genesis profile ${input.profile_id}`);
  }
  const profile_id = input.profile_id as GenesisProfileId;
  const profile = profileOf(profile_id);
  const story_seed_ids = normalizeSeeds(input.story_seed_ids);
  if (story_seed_ids.length > 2) {
    throw new GenesisError("INVALID_SEED", "first-run budget: at most 2 story seeds");
  }

  const slug = `world.${world_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "01"}`;
  const explicit = (input.world_id || "").trim();
  const world_id = explicit || slug;

  const claimBearing = {
    world_name,
    world_seed,
    profile_id,
    story_seed_ids,
    theme_id: theme.theme_id,
    rules_versions: {
      canonicalization: "noema-jcs/1",
      world_rules: "world/v1",
      deep_time: "deep-time/0.6",
      genesis: "genesis/0.6",
    },
  };
  const genesis_id = `genesis.${(await sha256Hex(stableStringify(claimBearing))).slice(0, 16)}`;

  const r = rng(`${world_seed}|${profile_id}|${story_seed_ids.join(",")}|${theme.theme_id}`);
  const frozenClaim = isFrozenFirstWorldClaim({
    world_name,
    world_seed,
    profile_id,
    story_seed_ids,
  });
  const frozenWorldIds = explicit === "world.perihelion-reach" || explicit === "world-01" || !explicit;

  let cycle0: Cycle0World;
  if (frozenClaim) {
    if (!frozenWorldIds) {
      throw new GenesisError("INVALID_SEED", "frozen genesis_id cannot target another world");
    }
    cycle0 = buildCycle0(world_id, world_name, world_seed, profile, story_seed_ids, r);
  } else if (!explicit || explicit === "world.perihelion-reach" || explicit === "world-01") {
    cycle0 = buildCycle0(world_id, world_name, world_seed, profile, story_seed_ids, r);
  } else if (explicit === SUCCESSOR_WORLD_ID) {
    if (genesis_id === FROZEN_GENESIS_ID) {
      throw new GenesisError("INVALID_SEED", "frozen genesis_id cannot target another world");
    }
    cycle0 = buildProductCycle0(world_id, world_name, world_seed, profile, story_seed_ids, r);
  } else {
    throw new GenesisError("INVALID_REQUEST", "world_id override this campaign must be world.perihelion-reach-2");
  }
  const validation = validateCycle0(cycle0);
  const cycle0_digest = `sha256:${await sha256Hex(stableStringify(cycle0))}`;

  const result: GenesisResult = {
    schema_version: "genesis-result/0.6",
    genesis_id,
    world_id,
    world_name,
    status: validation.ok ? "VALIDATED" : "PREVIEW",
    world_seed,
    genesis_profile_id: profile_id,
    story_seed_ids,
    ordinary_world_valid: validation.ok,
    validation,
    starting_opportunities: cycle0.opportunities,
    config_frozen: false,
    admin_only: true,
    scripts_player_outcomes: false,
    lore_is_final: false,
    rules_versions: claimBearing.rules_versions,
    cycle0,
    cycle0_digest,
    theme: {
      theme_id: theme.theme_id,
      title: theme.title,
      character: theme.admin_character_line,
      lore_boundary: theme.lore_boundary,
      genre_tags: theme.genre_tags,
    },
    preview_summary: {
      character: theme.admin_character_line,
      player_tone: theme.player_tone_target,
      strategic_questions: theme.strategic_questions,
      regions: Object.values(cycle0.rooms).map((rm) => ({ id: rm.room_id, name: rm.name, tags: rm.tags || [] })),
      resources: cycle0.resources,
      active_institutions: cycle0.institutions.filter((i) => i.status === "active"),
      dormant_institutions: cycle0.institutions.filter((i) => i.status === "dormant"),
      infrastructure: Object.values(cycle0.rooms).flatMap((rm) =>
        rm.entities.filter((e) => e.entity_type === "INFRASTRUCTURE").map((e) => ({ ...e, room_id: rm.room_id })),
      ),
      ruins_scars: cycle0.scars,
      historical_artifacts: cycle0.artifacts,
      tensions: cycle0.tensions,
      opportunities: cycle0.opportunities,
      room_count: Object.keys(cycle0.rooms).length,
      entity_count: Object.values(cycle0.rooms).reduce((n, rm) => n + rm.entities.length, 0),
      functioning_exchange: Object.values(cycle0.rooms).some((rm) => rm.tags?.includes("exchange")),
      damaged_relay: Object.values(cycle0.rooms).some((rm) =>
        rm.entities.some((e) => e.entity_type === "RUIN" || e.entity_type === "INFRASTRUCTURE"),
      ),
      archive_mystery: cycle0.artifacts.length > 0,
    },
  };
  return result;
}

/** Public PLAY/WATCH redaction — never expose genesis inputs. */
export function redactedPublicWorld(meta: {
  world_id: string;
  cycle: number;
  sequence: number;
  rooms: Record<string, GenesisRoom>;
  players_present: number;
  world_status?: string;
  freshness?: string;
  public_pulses?: string[];
}): Record<string, unknown> {
  return {
    projection: "public",
    world_id: meta.world_id,
    cycle: meta.cycle,
    sequence: meta.sequence,
    players_present: meta.players_present,
    world_status: meta.world_status || null,
    freshness: meta.freshness || "live",
    public_pulses: Array.isArray(meta.public_pulses) ? meta.public_pulses.slice(0, 4) : [],
    rooms: Object.values(meta.rooms).map((r) => ({
      room_id: r.room_id,
      name: r.name,
      description: r.description,
      entity_count: r.entities.length,
      entities: r.entities.map((e) => ({
        entity_id: e.entity_id,
        label: e.label,
        entity_type: e.entity_type,
      })),
      exit_count: r.exits.length,
      exits: r.exits.map((x) => ({
        direction: x.direction,
        to_room_id: x.to_room_id,
        to_room_name: meta.rooms[x.to_room_id]?.name,
      })),
    })),
    note: "Spectator projection is never world truth and never mutates the ledger.",
  };
}

export function catalog() {
  return {
    profiles: GENESIS_PROFILES,
    story_seeds: STORY_SEEDS,
    first_world_theme: {
      theme_id: FIRST_WORLD_THEME.theme_id,
      title: FIRST_WORLD_THEME.title,
      preferred_profile_id: FIRST_WORLD_THEME.preferred_profile_id,
      preferred_story_seeds: FIRST_WORLD_THEME.preferred_story_seeds,
      default_world_name: FIRST_WORLD_THEME.default_world_name,
      character: FIRST_WORLD_THEME.admin_character_line,
      lore_boundary: FIRST_WORLD_THEME.lore_boundary,
    },
    rules_versions: {
      canonicalization: "noema-jcs/1",
      world_rules: "world/v1",
      deep_time: "deep-time/0.6",
      genesis: "genesis/0.6",
    },
  };
}
