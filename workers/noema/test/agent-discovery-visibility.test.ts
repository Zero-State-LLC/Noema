/** Mounted Worker -> stateful DO Agent discovery, not a hosted SQL or browser acceptance test. */
import { afterEach, beforeEach, describe, expect, it as discoveryVisibilityCase, vi } from "vitest";
import { mintControllerToken } from "../src/auth";
import { COSTS } from "../src/actions";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

type Offered = {
  action: string; verb: string; operation?: string; target_id?: string;
  label?: string; requires?: Record<string, number>; available: boolean;
};
type Reply = {
  ok: boolean; error?: { code: string }; events?: Array<{ event_type: string; payload: Record<string, unknown> }>;
  observation: {
    location: { room_id: string; exits: Array<{ direction: string; to_room_id: string }>;
      entities: Array<{ entity_id: string }> };
    affordances: Offered[]; available_actions: string[];
    budgets: Record<string, number>;
  };
};

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden in discovery fixture"); })));
afterEach(() => { try { expect(fetch).not.toHaveBeenCalled(); } finally { vi.unstubAllGlobals(); } });

function discoveryVisibilityWorld() {
  const world = fixtureWorld();
  // A hidden destination alone is not sufficient when a public reverse route makes it discoverable.
  // Both the outbound exit and destination are hidden here; no public reverse exists.
  world.rooms["room.a"].exits!.push({ direction: "north", to_room_id: "room.secret-route", hidden: true });
  world.rooms["room.secret-route"] = {
    room_id: "room.secret-route", name: "PRIVATE_DESTINATION_SENTINEL", description: "PRIVATE_COPY_SENTINEL",
    exits: [], entities: [], hidden: true, tags: ["hidden"],
  };
  world.rooms["room.a"].entities!.push({ entity_id: "entity.secret-target", label: "PRIVATE_ENTITY_SENTINEL", entity_type: "SITE", hidden: true });
  return world;
}

describe("mounted Agent discovery visibility", () => {
  discoveryVisibilityCase("isolates two principals' discovery while hiding exits and entities in both serialized offer projections", async () => {
    const h = harness(discoveryVisibilityWorld());
    const tokens = await Promise.all(["scout", "newcomer"].map(async name =>
      (await mintControllerToken(h.env, { handle: name, controllerType: "agent", playerId: `player.${name}` })).access_token));
    for (const token of tokens) {
      const entered = await h.command(token, "ENTER_WORLD");
      expect(entered.status).toBe(200);
      expect((await entered.json() as Reply).ok).toBe(true);
    }
    const inspected = await h.command(tokens[0], "INSPECT", { target_id: "entity.box" });
    expect((await inspected.json() as Reply).ok).toBe(true);
    const retained = (await h.persistedWorld())!;
    expect(retained.players["player.scout"].discovery).not.toEqual(retained.players["player.newcomer"].discovery);
    h.restart(); // Reconstruct both principals' observations from fixture storage, not an in-memory reference.

    for (const token of tokens) {
      const response = await h.command(token, "LOOK");
      expect(response.status).toBe(200);
      const raw = await response.text();
      const result = JSON.parse(raw) as Reply;
      expect(result.ok).toBe(true);
      expect(result.observation.location.room_id).toBe("room.a");
      expect(result.observation.location.exits.map(x => x.direction)).toEqual(["east"]);
      expect(result.observation.location.entities.map(e => e.entity_id)).toEqual(["entity.box"]);
      const offers = result.observation.affordances;
      expect(offers.some(a => a.verb === "MOVE" && a.target_id === "east" && a.available)).toBe(true);
      expect(offers.some(a => a.verb === "INSPECT" && a.target_id === "entity.box" && a.available)).toBe(true);
      expect(offers.some(a => a.target_id === "north" || a.target_id === "entity.secret-target")).toBe(false);
      expect(result.observation.available_actions).toContain("MOVE");
      expect(result.observation.available_actions).toContain("INSPECT");
      for (const poison of ["room.secret-route", "PRIVATE_DESTINATION_SENTINEL", "PRIVATE_COPY_SENTINEL", "entity.secret-target", "PRIVATE_ENTITY_SENTINEL", "room.hidden", "PRIVATE_ROOM_SENTINEL"]) {
        expect(JSON.stringify(offers)).not.toContain(poison);
        expect(JSON.stringify(result.observation.available_actions)).not.toContain(poison);
        expect(raw).not.toContain(poison);
      }
    }
    const before = (await h.persistedWorld())!;
    for (const token of tokens) {
      const denied = await h.command(token, "MOVE", { target_id: "north" });
      expect(denied.status).toBe(200);
      const result = await denied.json() as Reply;
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("MOVE_REJECTED");
      expect(result.events || []).toEqual([]);
      expect(JSON.stringify(result)).not.toContain("room.secret-route");
    }
    const after = (await h.persistedWorld())!;
    expect(after.sequence).toBe(before.sequence);
    for (const id of ["player.scout", "player.newcomer"]) {
      expect(after.players[id].room_id).toBe("room.a");
      expect(after.players[id].budgets).toEqual(before.players[id].budgets);
    }
  });

  discoveryVisibilityCase("refuses hidden structured INSPECT for both retained principals without inspecting, settling or leaking", async () => {
    const h = harness(discoveryVisibilityWorld());
    const actors = await Promise.all(["scout", "newcomer"].map(async name => ({
      id: `player.${name}`,
      token: (await mintControllerToken(h.env, { handle: name, controllerType: "agent", playerId: `player.${name}` })).access_token,
    })));
    for (const actor of actors) {
      expect((await (await h.command(actor.token, "ENTER_WORLD")).json() as Reply).ok).toBe(true);
    }
    // Real successful INSPECT in the same mounted rig proves this route can emit and settle.
    const visible = await h.command(actors[0].token, "INSPECT", { target_id: "entity.box" });
    const visibleResult = await visible.json() as Reply;
    expect(visibleResult.ok).toBe(true);
    expect(visibleResult.events).toContainEqual(expect.objectContaining({
      event_type: "INSPECT", payload: expect.objectContaining({ entity_id: "entity.box" }),
    }));
    expect(h.writes.some(write => write.key === "world")).toBe(true);
    h.restart();

    for (const actor of actors) {
      const before = (await h.persistedWorld())!;
      // Replay bookkeeping may persist a refusal; no canonical event or unsettled work may change.
      // The hosted structured normalizer accepts target_id and maps it to entity_id.
      const response = await h.command(actor.token, "INSPECT", { target_id: "entity.secret-target" });
      expect(response.status).toBe(200);
      const raw = await response.text();
      const refused = JSON.parse(raw) as Reply;
      expect(refused).toMatchObject({ ok: false, error: { code: "INSPECT_FAILED" } });
      expect(refused.events || []).toEqual([]);
      for (const secret of ["entity.secret-target", "PRIVATE_ENTITY_SENTINEL", "PRIVATE_COPY_SENTINEL", "PRIVATE_DESTINATION_SENTINEL"]) {
        expect(raw).not.toContain(secret);
      }
      const after = (await h.persistedWorld())!;
      expect(after.sequence).toBe(before.sequence);
      expect(after.unsettled).toEqual(before.unsettled);
      for (const id of actors.map(a => a.id)) {
        expect(after.players[id].budgets).toEqual(before.players[id].budgets);
        expect(after.players[id].room_id).toBe(before.players[id].room_id);
        expect(after.players[id].discovery).toEqual(before.players[id].discovery);
      }
    }
  });

  discoveryVisibilityCase("follows advertised structured INSPECT and MOVE targets and costs, then refuses a stale target and unaffordable route", async () => {
    const h = harness(discoveryVisibilityWorld());
    const token = (await mintControllerToken(h.env, { handle: "Actor", controllerType: "agent", playerId: "player.actor" })).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    const first = await h.command(token, "LOOK");
    const observed = (await first.json() as Reply).observation;
    const inspect = observed.affordances.find(a => a.action === "INSPECT" && a.target_id === "entity.box" && a.available)!;
    expect(inspect.verb).toBe("INSPECT");
    expect(inspect.requires).toEqual(COSTS.INSPECT);
    const beforeInspect = (await h.persistedWorld())!;
    const inspected = await h.command(token, inspect.verb, { target_id: inspect.target_id });
    const inspection = await inspected.json() as Reply;
    expect(inspection.ok).toBe(true);
    expect(inspection.events?.some(e => JSON.stringify(e.payload).includes("entity.box"))).toBe(true);
    const afterInspect = (await h.persistedWorld())!;
    expect(afterInspect.players["player.actor"].budgets.attention).toBe(beforeInspect.players["player.actor"].budgets.attention - inspect.requires!.attention);
    const move = inspection.observation.affordances.find(a => a.action === "MOVE" && a.target_id === "east" && a.available)!;
    expect(move.verb).toBe("MOVE");
    expect(move.requires).toEqual({ energy: 1 });
    const beforeMove = (await h.persistedWorld())!;
    const moved = await h.command(token, move.verb, { target_id: move.target_id });
    const arrival = await moved.json() as Reply;
    expect(arrival.ok).toBe(true);
    expect(arrival.observation.location.room_id).toBe("room.b");
    expect(arrival.events).toContainEqual(expect.objectContaining({ event_type: "MOVE", payload: expect.objectContaining({ to: "room.b", direction: "east" }) }));
    const afterMove = (await h.persistedWorld())!;
    expect(afterMove.players["player.actor"].budgets.energy).toBe(beforeMove.players["player.actor"].budgets.energy - move.requires!.energy);
    const beforeDenied = (await h.persistedWorld())!;
    const stale = await h.command(token, inspect.verb, { target_id: inspect.target_id });
    const staleResult = await stale.json() as Reply;
    expect(staleResult).toMatchObject({ ok: false, error: { code: "INSPECT_FAILED" } });
    expect(staleResult.events || []).toEqual([]);
    const afterDenied = (await h.persistedWorld())!;
    expect(afterDenied.sequence).toBe(beforeDenied.sequence);
    expect(afterDenied.unsettled).toEqual(beforeDenied.unsettled);
    expect(afterDenied.players["player.actor"].budgets).toEqual(beforeDenied.players["player.actor"].budgets);
    expect(afterDenied.players["player.actor"].room_id).toBe(beforeDenied.players["player.actor"].room_id);
    expect(afterDenied.players["player.actor"].discovery).toEqual(beforeDenied.players["player.actor"].discovery);

    const low = discoveryVisibilityWorld();
    // Explicit stored budget is a local fixture intervention, not an admitted budget-setting route.
    const seeded = harness(low);
    const lowToken = (await seeded.agent()).access_token;
    expect((await seeded.command(lowToken, "ENTER_WORLD")).status).toBe(200);
    const retained = (await seeded.persistedWorld())!;
    retained.players["player.boundary"].budgets.energy = 0;
    const budgeted = harness(retained);
    const seen = (await (await budgeted.command(lowToken, "LOOK", {}, { request_id: "budgeted-look" })).json() as Reply).observation;
    expect(seen.affordances.find(a => a.verb === "MOVE" && a.target_id === "east")).toMatchObject({ available: false });
    expect(seen.available_actions).not.toContain("MOVE");
    const baseline = (await budgeted.persistedWorld())!;
    const refused = await budgeted.command(lowToken, "MOVE", { target_id: "east" }, { request_id: "budgeted-move" });
    const budgetResult = await refused.json() as Reply;
    expect(budgetResult).toMatchObject({ ok: false, error: { code: "BUDGET_EXCEEDED" } });
    expect(budgetResult.events || []).toEqual([]);
    const final = (await budgeted.persistedWorld())!;
    expect(final.sequence).toBe(baseline.sequence);
    expect(final.players["player.boundary"].room_id).toBe("room.a");
    expect(final.players["player.boundary"].budgets).toEqual(baseline.players["player.boundary"].budgets);
  });
});
