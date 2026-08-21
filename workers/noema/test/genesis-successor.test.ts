import { describe, expect, it } from "vitest";
import { previewGenesis, validateCycle0 } from "../src/genesis";
import { CHAMBER_MAP_ROOM_IDS } from "../src/chamber-map-graph";

const SUCCESSOR = {
  world_name: "Perihelion Reach",
  world_seed: "perihelion-successor-rehearsal-01",
  profile_id: "FRACTURED_OLD_WORLD" as const,
  story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
  world_id: "world.perihelion-reach-2",
};

describe("genesis successor product path", () => {
  it("emits 10 CHAMBER-MAP rooms on world.perihelion-reach-2", async () => {
    const a = await previewGenesis(SUCCESSOR);
    expect(a.world_id).toBe("world.perihelion-reach-2");
    expect(a.genesis_id).not.toBe("genesis.ef578f4ffceeccd0");
    expect(a.world_name).toBe("Perihelion Reach");
    expect(a.cycle0.entry_room_id).toBe("room.civic-exchange");
    expect(Object.keys(a.cycle0.rooms).sort()).toEqual([...CHAMBER_MAP_ROOM_IDS].sort());
    expect(a.cycle0.rooms["room.civic-exchange"].name).toBe("Civic Exchange");
    expect(a.cycle0.rooms["room.infra-vault"]).toBeUndefined();
    expect(a.cycle0.rooms["room.ruin-shelf"]).toBeUndefined();
    expect(validateCycle0(a.cycle0).ok).toBe(true);
    expect(a.validation.ok).toBe(true);
  });

  it("same successor inputs are deterministic", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const b = await previewGenesis(SUCCESSOR);
    expect(a.genesis_id).toBe(b.genesis_id);
    expect(a.cycle0_digest).toBe(b.cycle0_digest);
  });

  it("refuses product-path hash collision with the frozen genesis", async () => {
    await expect(
      previewGenesis({
        ...SUCCESSOR,
        world_seed: "17011984",
      }),
    ).rejects.toMatchObject({ code: "INVALID_SEED" });
  });

  it("refuses unknown explicit world_id this campaign", async () => {
    await expect(
      previewGenesis({ ...SUCCESSOR, world_id: "world.other" }),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("lands overlays on chamber rooms", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const ids = (room: string) => a.cycle0.rooms[room].entities.map((e) => e.entity_id);
    expect(ids("room.relay-quarter")).toContain("entity.relay-7");
    expect(ids("room.civic-exchange")).toContain("entity.old-market-post");
    expect(ids("room.archive")).toContain("entity.archive-ledger");
    expect(a.cycle0.rooms["room.archive"].entities.find((e) => e.entity_id === "entity.archive-ledger")?.entity_type).toBe(
      "ARTIFACT",
    );
  });

  it("seed entity_id wins on overlay collision", async () => {
    const a = await previewGenesis(SUCCESSOR);
    const n = a.cycle0.rooms["room.archive"].entities.filter((e) => e.entity_id === "entity.archive-ledger").length;
    expect(n).toBe(1);
  });
});
