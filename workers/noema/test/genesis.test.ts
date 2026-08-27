import { describe, expect, it } from "vitest";
import {
  catalog,
  previewGenesis,
  redactedPublicWorld,
  stableStringify,
  validateCycle0,
  validateEWMProfile,
} from "../src/genesis";

const REHEARSAL = {
  world_name: "Perihelion Reach",
  world_seed: "perihelion-rehearsal-01",
  profile_id: "FRACTURED_OLD_WORLD",
  story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
};

describe("hosted genesis", () => {
  it("catalog has canonical profiles plus EWM_ENHANCED", () => {
    const c = catalog();
    expect(c.profiles.map((p) => p.profile_id).sort()).toEqual([
      "EWM_ENHANCED",
      "FRACTURED_OLD_WORLD",
      "RECOVERING_NETWORK",
      "YOUNG_FRONTIER",
    ]);
  });

  it("same inputs → same genesis_id and cycle0_digest", async () => {
    const a = await previewGenesis(REHEARSAL);
    const b = await previewGenesis(REHEARSAL);
    expect(a.genesis_id).toBe(b.genesis_id);
    expect(a.cycle0_digest).toBe(b.cycle0_digest);
    expect(a.validation.ok).toBe(true);
    expect(a.ordinary_world_valid).toBe(true);
  });

  it("different world seed → different but valid cycle0", async () => {
    const a = await previewGenesis(REHEARSAL);
    const b = await previewGenesis({ ...REHEARSAL, world_seed: "99999999" });
    expect(a.validation.ok).toBe(true);
    expect(b.validation.ok).toBe(true);
    expect(a.genesis_id).not.toBe(b.genesis_id);
    expect(a.cycle0_digest).not.toBe(b.cycle0_digest);
  });

  it("rejects unknown profile and >2 story seeds", async () => {
    await expect(
      previewGenesis({ ...REHEARSAL, profile_id: "NOT_A_PROFILE" }),
    ).rejects.toMatchObject({ code: "INVALID_PROFILE" });
    await expect(
      previewGenesis({
        ...REHEARSAL,
        story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE", "FOUNDING_SPLIT"],
      }),
    ).rejects.toMatchObject({ code: "INVALID_SEED" });
  });

  it("cycle0 validation requires entry routes and opportunities", async () => {
    const a = await previewGenesis(REHEARSAL);
    const v = validateCycle0(a.cycle0);
    expect(v.ok).toBe(true);
    expect(a.starting_opportunities.length).toBeGreaterThanOrEqual(3);
  });

  it("EWM_ENHANCED validation is part of canonical Cycle 0 acceptance", async () => {
    const result = await previewGenesis({
      ...REHEARSAL,
      world_id: "test.hosted-canonical.ewm-cutover",
      world_seed: "ewm-validation-01",
      profile_id: "EWM_ENHANCED",
    });
    expect(result.validation.ok).toBe(true);
    expect(validateEWMProfile(result.cycle0)).toEqual({ ok: true, warnings: [] });

    const invalid = structuredClone(result.cycle0);
    for (const room of Object.values(invalid.rooms)) {
      room.entities = room.entities.filter(
        (entity) => entity.entity_type !== "PRODUCTION" && entity.stock_resource !== "materials",
      );
    }
    invalid.institutions = invalid.institutions.filter(
      (institution) => !institution.id.startsWith("archetype."),
    );
    invalid.initial_beliefs = { expected_regen: 0.1 };

    const validation = validateCycle0(invalid);
    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        "EWM_ENHANCED: missing harvestable nodes",
        "EWM_ENHANCED: missing production nodes",
        "EWM_ENHANCED: insufficient archetypes",
        "EWM_ENHANCED: weak expected_regen",
      ]),
    );
  });

  it("redacted public world never includes genesis inputs", async () => {
    const a = await previewGenesis(REHEARSAL);
    const pub = redactedPublicWorld({
      world_id: a.world_id,
      cycle: 0,
      sequence: 0,
      rooms: a.cycle0.rooms,
      players_present: 0,
    });
    const s = stableStringify(pub);
    expect(s).not.toContain("OLD_TRADE_NETWORK");
    expect(s).not.toContain("LOST_ARCHIVE");
    expect(s).not.toContain("world_seed");
    expect(s).not.toContain("FRACTURED_OLD_WORLD");
    expect(pub.rooms).toBeTruthy();
    const rooms = pub.rooms as Array<{ exits?: Array<{ direction: string; to_room_id: string }> }>;
    expect(rooms.some((r) => Array.isArray(r.exits) && r.exits.length > 0)).toBe(true);
    expect(s).toContain("to_room_id");
  });

  it("stableStringify is order-independent for objects", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  const FROZEN = {
    world_name: "Perihelion Reach",
    world_seed: "17011984",
    profile_id: "FRACTURED_OLD_WORLD",
    story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
  };

  it("frozen first-world candidate keeps genesis_id and 5-room graph", async () => {
    const a = await previewGenesis(FROZEN);
    expect(a.genesis_id).toBe("genesis.ef578f4ffceeccd0");
    expect(Object.keys(a.cycle0.rooms).sort()).toEqual(
      ["room.civic-exchange", "room.infra-vault", "room.relay-quarter", "room.ruin-shelf", "room.transit-ring"].sort(),
    );
    expect(a.cycle0.rooms["room.archive"]).toBeUndefined();
    expect(a.validation.ok).toBe(true);
  });

  it("theme pack applies frontier vocabulary without seed IDs in public projection", async () => {
    const a = await previewGenesis(REHEARSAL);
    expect(a.theme?.theme_id).toBe("perihelion-reach");
    expect(a.world_name).toBe("Perihelion Reach");
    expect(a.preview_summary.character).toMatch(/frontier|infrastructure/i);
    const names = Object.values(a.cycle0.rooms).map((r) => r.name).join(" ");
    // Theme names are short terminal-friendly labels from the pack
    expect(names.length).toBeGreaterThan(5);
    const pub = redactedPublicWorld({
      world_id: a.world_id,
      cycle: 0,
      sequence: 0,
      rooms: a.cycle0.rooms,
      players_present: 1,
    });
    const s = stableStringify(pub);
    expect(s).not.toContain("OLD_TRADE_NETWORK");
    expect(s).not.toContain("LOST_ARCHIVE");
    expect(s).not.toContain("theme_id");
    expect(s).not.toContain("FRACTURED_OLD_WORLD");
    expect(pub).not.toHaveProperty("theme_id");
  });
});
