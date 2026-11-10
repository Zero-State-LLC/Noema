/** T1.1-1.3/T1.6 and craft C3/C5. Local authenticated Worker/DO acceptance,
 * not hosted execution or proof that optional session flags have a runtime producer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playTextFromObservation, roomPresentationModel } from "../src/play-ui";
import type { CommandResult, Observation } from "../src/types";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden"); })));
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

function roomWorld(reverse = false) {
  const w = fixtureWorld();
  const room = w.rooms["room.a"];
  room.entities.push(
    { entity_id: "entity.alpha", label: "Alpha stand", entity_type: "SITE", condition: 80 },
    { entity_id: "entity.hidden", label: "PRIVATE_ENTITY_SENTINEL", entity_type: "SITE", hidden: true },
  );
  room.exits.push(
    { direction: "north", to_room_id: "room.b" },
    { direction: "south", to_room_id: "room.hidden", hidden: true },
  );
  // This ordered history must not be permuted with the unordered room sets.
  room.board = [{ text: "Zebra earlier notice", cycle: 0 }, { text: "Apple latest notice", cycle: 0 }];
  if (reverse) {
    room.entities.reverse();
    room.exits.reverse();
    w.rooms = Object.fromEntries(Object.entries(w.rooms).reverse());
  }
  return w;
}

async function session(reverse = false) {
  const h = harness(roomWorld(reverse));
  const token = (await h.agent()).access_token;
  async function act(command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
    const response = await h.command(token, command, args, extra);
    expect(response.status).toBe(200);
    return response.json() as Promise<CommandResult>;
  }
  expect((await act("ENTER_WORLD")).ok).toBe(true);
  return { h, act };
}

function assertBudgetParity(obs: Observation) {
  expect(obs.budgets).toBeDefined();
  const text = obs.play_text!;
  expect(text).toContain("STATUS\n");
  for (const key of ["energy", "attention", "compute", "storage", "influence"] as const) {
    expect(typeof obs.budgets![key]).toBe("number");
    expect(text).toContain(`${key[0].toUpperCase()}${key.slice(1)} ${obs.budgets![key]}`);
  }
  expect(text).not.toMatch(/\b(?:room|entity|player|ctrl|session)\.[\w-]+|sequence|controller|settlement|research|PRIVATE_/i);
}

describe("authorized room contract", () => {
  it("LOOK produces equivalent room layers for permuted entity, exit and room insertion order", async () => {
    const observations: Observation[] = [];
    for (const reverse of [false, true]) {
      const { h, act } = await session(reverse);
      const before = (await h.persistedWorld())!;
      const looked = await act("LOOK");
      expect(looked.ok).toBe(true);
      const obs = looked.observation!;
      assertBudgetParity(obs);
      expect(obs.location!.entities.map(e => e.label).sort()).toEqual(["Alpha stand", "Box"]);
      expect(obs.location!.exits.map(e => e.direction).sort()).toEqual(["east", "north"]);
      const text = obs.play_text!;
      const ordered = ["Arrival", "A public arrival room.", "PRESSURE", "HERE", "EXITS", "STATUS", "HAPPENED"];
      for (const part of ordered) expect(text).toContain(part);
      expect(ordered.map(part => text.indexOf(part))).toEqual(ordered.map(part => text.indexOf(part)).sort((a, b) => a - b));
      expect(text.indexOf("Alpha stand")).toBeLessThan(text.indexOf("Box"));
      expect(text.indexOf("east")).toBeLessThan(text.indexOf("north"));
      expect(text).toContain("Apple latest notice");
      expect(text).not.toContain("Zebra earlier notice");
      // Preserve the current additive TRACES placement rather than deciding a new section policy.
      expect(text.indexOf("TRACES")).toBeGreaterThan(text.indexOf("STATUS"));
      expect(text.indexOf("TRACES")).toBeLessThan(text.indexOf("HAPPENED"));
      const after = (await h.persistedWorld())!;
      expect(after.rooms["room.a"].board).toEqual(before.rooms["room.a"].board);
      expect(after.players["player.boundary"].budgets.attention).toBe(before.players["player.boundary"].budgets.attention - 1);
      expect(obs).not.toHaveProperty("energy_floor_risk");
      expect(obs).not.toHaveProperty("play_blocked");
      expect(text).not.toMatch(/energy_floor_risk|play_blocked/);
      observations.push(obs);
    }
    // Compare presentation semantics, not request IDs, event IDs or ordered histories.
    expect(roomPresentationModel(observations[0])).toEqual(roomPresentationModel(observations[1]));
    expect(observations[0].play_text).toBe(observations[1].play_text);
  });

  it("MOVE bundles destination budgets and legal hints once, persists replay across a DO restart, and never hides a LOOK debit", async () => {
    const { h, act } = await session();
    const before = (await h.persistedWorld())!;
    const moved = await act("MOVE", { direction: "east" }, { idempotency_key: "room-contract.move" });
    expect(moved.ok).toBe(true);
    const obs = moved.observation!;
    expect(obs.location).toMatchObject({ name: "East", room_id: "room.b" });
    assertBudgetParity(obs);
    expect(obs.affordances?.filter(a => a.verb === "MOVE" && a.available).map(a => a.cmd)).toContain("move west");
    expect(obs.play_text).toContain("HAPPENED\nYou move east.\nok\nYou arrive at East. Energy −1.");
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].room_id).toBe("room.b");
    expect(after.players["player.boundary"].budgets).toEqual({ ...before.players["player.boundary"].budgets, energy: before.players["player.boundary"].budgets.energy - 1 });
    expect(moved.events?.filter(e => e.event_type === "MOVE")).toHaveLength(1);
    expect(moved.events?.some(e => e.event_type === "LOOK")).toBe(false);
    const sequences = moved.events!.map(e => e.sequence);
    expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
    expect(new Set(sequences).size).toBe(sequences.length);
    h.restart();
    const replay = await act("MOVE", { direction: "east" }, { idempotency_key: "room-contract.move" });
    expect(replay).toEqual(moved);
    expect(await h.persistedWorld()).toEqual(after);
  });

  it("keeps a real delivered private MESSAGE out of default LOOK and MOVE room text", async () => {
    const { act } = await session();
    const sent = await act("MESSAGE", { recipient_id: "player.boundary", text: "PRIVATE_INBOX_SENTINEL" });
    expect(sent.ok).toBe(true);
    for (const [command, args] of [["LOOK", {}], ["MOVE", { direction: "east" }]] as const) {
      const result = await act(command, args);
      expect(result.ok).toBe(true);
      // The authorized self observation may carry its inbox, but default room prose must not.
      expect(result.observation!.messages?.some(m => m.text === "PRIVATE_INBOX_SENTINEL")).toBe(true);
      assertBudgetParity(result.observation!);
    }
  });

  it("hidden-route MOVE rejection preserves canonical state, budgets and current room orientation", async () => {
    const { h, act } = await session();
    const current = (await act("LOOK")).observation!;
    const before = (await h.persistedWorld())!;
    const rejected = await act("MOVE", { direction: "south" });
    expect(rejected).toMatchObject({ ok: false, error: { code: "MOVE_REJECTED" } });
    expect(rejected.events ?? []).toEqual([]);
    expect(rejected.observation!.location).toEqual(current.location);
    expect(rejected.observation!.affordances).toEqual(current.affordances);
    expect(rejected.observation!.available_actions).toEqual(current.available_actions);
    assertBudgetParity(rejected.observation!);
    expect(rejected.observation!.play_text).toContain("Nothing moves.");
    expect(rejected.observation!.play_text).not.toContain("You arrive at East");
    const after = (await h.persistedWorld())!;
    // last_seen_ms is activity metadata, not a canonical action or debit.
    const withoutSeen = (w: typeof before) => {
      const copy = structuredClone(w);
      for (const player of Object.values(copy.players)) delete player.last_seen_ms;
      return copy;
    };
    expect(withoutSeen(after)).toEqual(withoutSeen(before));
  });
});

describe("optional already-known flags at the presentation wrapper only", () => {
  it("forwards supplied booleans without inferring floor or readiness and excludes private/debug fields", () => {
    // A helper input, deliberately NOT claimed to be a runtime-emitted Observation.
    const input = {
      location: { room_id: "room.helper", name: "Helper room", description: "Helper only.", entities: [], exits: [] },
      budgets: { energy: 0, attention: 2 },
      energy_floor_risk: true,
      play_blocked: true,
      cycle: 99, sequence: 777, controller_id: "PRIVATE_CONTROLLER_SENTINEL",
      messages: [{ text: "PRIVATE_INBOX_SENTINEL" }],
      debug: "PRIVATE_DEBUG_SENTINEL",
    };
    const text = playTextFromObservation(input);
    expect(text).toContain("Flag energy_floor_risk");
    expect(text).toContain("Flag play_blocked");
    expect(text).not.toMatch(/PRIVATE_|room\.helper|777|99|controller|messages|debug/);
    for (const flags of [{}, { energy_floor_risk: false, play_blocked: false }]) {
      const { energy_floor_risk: _floor, play_blocked: _blocked, ...base } = input;
      expect(playTextFromObservation({ ...base, ...flags })).not.toMatch(/Flag|energy_floor_risk|play_blocked/);
    }
  });
});
