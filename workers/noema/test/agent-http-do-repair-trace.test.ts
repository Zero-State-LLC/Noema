import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichEntity } from "../src/actions";
import { mintControllerToken } from "../src/auth";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

afterEach(() => vi.unstubAllGlobals());

describe("Agent HTTP to DO repair trace", () => {
  it("binds the public isolated WATCH target on its first mounted load without trusting visitor headers", async () => {
    const target = "test.hosted-canonical.watch-mounted";
    const h = harness(fixtureWorld(), target, undefined, target);
    const response = await h.hit("/v1/watch/live", undefined, undefined, "", { "x-noema-world-id": WORLD });
    expect(response.status).toBe(200);
    expect((await response.json() as { world_id: string }).world_id).toBe(target);
    expect(h.calls.filter(c => c.path === "/watch")).toEqual([{ name: target, path: "/watch" }]);
    expect(h.calls.filter(c => c.name === WORLD)).toEqual([]);
    expect(h.writes.filter(c => c.name === WORLD)).toEqual([]);
  });

  it("binds mounted public map to the configured target on first load", async () => {
    const target = "test.hosted-canonical.watch-map-mounted";
    const h = harness(fixtureWorld(), target, undefined, target);
    const response = await h.hit("/v1/watch/map", undefined, undefined, "", { "x-noema-world-id": WORLD });
    expect(response.status).toBe(200);
    const map = await response.json() as { world_id: string };
    expect(map.world_id).toBe(target);
    expect(h.calls.filter(c => c.path === "/watch-map")).toEqual([{ name: target, path: "/watch-map" }]);
    expect(h.calls.filter(c => c.name === WORLD)).toEqual([]);
    expect(h.writes.filter(c => c.name === WORLD)).toEqual([]);
  });

  it("rejects a mismatched stored world before public isolated WATCH can normalize or save it", async () => {
    const target = "test.hosted-canonical.watch-mismatch";
    const h = harness(fixtureWorld(), target, fixtureWorld(), target);
    const response = await h.hit("/v1/watch/live");
    expect(response.status).toBe(403);
    expect(h.writes).toEqual([]);
    expect((await h.persistedWorld(target))?.world_id).toBe(WORLD);
  });

  it("rejects mismatched retained map world before storage writes", async () => {
    const target = "test.hosted-canonical.watch-map-mismatch";
    const h = harness(fixtureWorld(), target, fixtureWorld(), target);
    const response = await h.hit("/v1/watch/map");
    expect(response.status).toBe(403);
    expect(h.writes).toEqual([]);
    expect((await h.persistedWorld(target))?.world_id).toBe(WORLD);
  });

  it("rejects mismatched retained stream world before WebSocket acceptance or writes", async () => {
    const target = "test.hosted-canonical.watch-stream-mismatch";
    const h = harness(fixtureWorld(), target, fixtureWorld(), target);
    const response = await h.hit("/v1/watch/stream", undefined, undefined, "", { Upgrade: "websocket" });
    expect(response.status).toBe(403);
    expect(h.writes).toEqual([]);
    expect((await h.persistedWorld(target))?.world_id).toBe(WORLD);
  });

  it("binds mounted public stream to the configured target on first load", async () => {
    const target = "test.hosted-canonical.watch-stream-mounted";
    const sent: unknown[] = [];
    const server = {
      serializeAttachment(_value: unknown) {},
      send(message: string) { sent.push(JSON.parse(message)); },
    };
    vi.stubGlobal("WebSocketPair", class {
      0 = {};
      1 = server;
    });
    const NativeResponse = Response;
    vi.stubGlobal("Response", class extends NativeResponse {
      constructor(body: BodyInit | null, init?: ResponseInit & { webSocket?: unknown }) {
        super(body, { ...init, status: init?.status === 101 ? 200 : init?.status });
        if (init?.status === 101) Object.defineProperty(this, "status", { value: 101 });
      }
    });
    const h = harness(fixtureWorld(), target, undefined, target);
    const response = await h.hit("/v1/watch/stream", undefined, undefined, "", {
      Upgrade: "websocket", "x-noema-world-id": WORLD,
    });
    expect(response.status).toBe(101);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ world_id: target });
    expect(h.calls.filter(c => c.path === "/watch-stream")).toEqual([{ name: target, path: "/watch-stream" }]);
    expect(h.calls.filter(c => c.name === WORLD)).toEqual([]);
    expect(h.writes.filter(c => c.name === WORLD)).toEqual([]);
  });

  it("retains a repaired public plate after the originating Agent leaves and the fixture recreates the DO", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("external network forbidden"); }));
    const world = fixtureWorld();
    world.rooms["room.a"].entities = [
      enrichEntity({ entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE", condition: 55 }),
      enrichEntity({ entity_id: "entity.salvage-cache", label: "salvage cache", entity_type: "RESOURCE", stock_resource: "materials", stock_amount: 3 }),
      enrichEntity({ entity_id: "entity.sealed", label: "PRIVATE_TRACE_SENTINEL", entity_type: "INFRASTRUCTURE", condition: 55, hidden: true,
        last_repair_cycle: 0, last_repair_handle: "PRIVATE_HANDLE_SENTINEL" }),
    ];
    const h = harness(world);
    const originator = await h.agent();
    const token = originator.access_token;
    const sendOriginatorCommand = async (command: string, args: Record<string, unknown> = {}) => {
      const response = await h.command(token, command, args);
      expect(response.status).toBe(200);
      return response.json() as Promise<{ ok: boolean; error?: { code: string }; events?: Array<{ event_type: string; payload?: Record<string, unknown> }>; observation?: { location?: { room_id: string; traces?: Array<{ kind: string; text: string; visibility: string }> } } }>;
    };
    expect((await sendOriginatorCommand("ENTER_WORLD")).ok).toBe(true);
    expect((await sendOriginatorCommand("LOOK")).observation?.location?.room_id).toBe("room.a");
    expect((await sendOriginatorCommand("INSPECT", { entity_id: "entity.relay-7" })).ok).toBe(true);
    const harvest = await sendOriginatorCommand("HARVEST", { entity_id: "entity.salvage-cache", amount: 1 });
    expect(harvest.ok, JSON.stringify(harvest.error)).toBe(true);
    const before = (await h.persistedWorld())?.rooms["room.a"].entities.find(e => e.entity_id === "entity.relay-7")?.condition;
    const repair = await sendOriginatorCommand("REPAIR", { entity_id: "entity.relay-7" });
    expect(repair.ok, JSON.stringify(repair.error)).toBe(true);
    expect(repair.events?.map(e => e.event_type)).toContain("ENTITY_UPDATE");
    const afterRepair = await h.persistedWorld();
    const relay = afterRepair?.rooms["room.a"].entities.find(e => e.entity_id === "entity.relay-7");
    expect(relay?.condition).toBeGreaterThan(before ?? 0);
    expect(relay?.last_repair_handle).toBe("Boundary");
    expect(relay?.last_repair_cycle).toBe(afterRepair?.cycle);
    expect(repair.events).toContainEqual(expect.objectContaining({
      event_type: "ENTITY_UPDATE",
      payload: expect.objectContaining({
        entity_id: "entity.relay-7", operation: "REPAIR", last_repair_cycle: relay?.last_repair_cycle,
        last_repair_handle: "Boundary",
      }),
    }));
    const left = await sendOriginatorCommand("LEAVE_WORLD");
    expect(left.ok).toBe(true);
    expect(left.events?.map(e => e.event_type)).toContain("AGENT_LEFT_WORLD");
    expect((await h.persistedWorld())?.players[originator.player_id]?.entered).toBe(false);
    h.restart(); // Fixture reconstruction only: NOT evidence of a deployed DO eviction.
    const observer = await mintControllerToken(h.env, { handle: "Witness", controllerType: "agent", playerId: "player.witness" });
    const entered = await h.command(observer.access_token, "ENTER_WORLD");
    expect(entered.status).toBe(200);
    expect((await entered.json() as { ok: boolean }).ok).toBe(true);
    const looked = await h.command(observer.access_token, "LOOK");
    expect(looked.status).toBe(200);
    const result = await looked.json() as { ok: boolean; observation?: { play_text?: string; location?: { room_id: string; traces?: Array<{ kind: string; text: string; visibility: string }> } } };
    expect(result.ok).toBe(true);
    const observerResponse = JSON.stringify(result);
    for (const privateValue of ["PRIVATE_TRACE_SENTINEL", "PRIVATE_HANDLE_SENTINEL", "entity.sealed"]) {
      expect(observerResponse).not.toContain(privateValue);
    }
    expect(result.observation?.location?.room_id).toBe("room.a");
    const plate = "A maintenance plate names Boundary as the last repairer.";
    expect(result.observation?.location?.traces).toEqual([
      { kind: "construction", visibility: "public", text: plate },
    ]);
    const publicTraces = JSON.stringify(result.observation?.location?.traces);
    for (const privateValue of ["entity.relay-7", "source_state_ref", originator.player_id]) {
      expect(publicTraces).not.toContain(privateValue);
    }
    const roomProse = result.observation?.play_text ?? "";
    expect(roomProse.split(plate)).toHaveLength(2);
    expect(roomProse).toContain(`TRACES\n${plate}`);
    expect(roomProse.length).toBeLessThanOrEqual(4096);
    expect((await h.persistedWorld())?.rooms["room.a"].entities.find(e => e.entity_id === "entity.relay-7")?.condition).toBe(relay?.condition);
    expect(h.calls.filter(c => c.path === "/command")).toHaveLength(8);
    expect(h.calls.filter(c => c.path === "/command").every(c => c.name === WORLD)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
