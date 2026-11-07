import { afterEach, beforeEach, expect, it as boundaryCase, vi } from "vitest";
import type { CommandResult } from "../src/types";
import type { WorldRuntime } from "../src/world-actions";
import { buildWatchLive, type WatchRoomIn } from "../src/watch-live";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("authored-text fixture forbids external network"); })));
afterEach(() => { try { expect(fetch).not.toHaveBeenCalled(); } finally { vi.unstubAllGlobals(); } });

let requestSequence = 0;
async function mountedLook(world: WorldRuntime) {
  const h = harness(structuredClone(world));
  const token = (await h.agent()).access_token;
  const entered = await h.command(token, "ENTER_WORLD");
  expect(entered.status).toBe(200);
  expect((await entered.json() as CommandResult).ok).toBe(true);
  h.restart();
  const response = await h.command(token, "LOOK", {}, { request_id: `t35.look.${++requestSequence}` });
  expect(response.status).toBe(200);
  const result = await response.json() as CommandResult;
  expect(result.ok).toBe(true);
  return result.observation?.location?.traces;
}

boundaryCase("T35 LOOK board preserves literal bounded public text on JSON wire", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].board = [{ cycle: 0, text: `  <b data-x="board">   board\n\t${"x".repeat(150)}END  ` }];
  const traces = await mountedLook(world);
  expect(traces).toEqual([{ kind: "notice", text: `<b data-x="board"> board ${"x".repeat(135)}`, visibility: "public" }]);
  expect(Object.keys(traces![0]).sort()).toEqual(["kind", "text", "visibility"]);
});

boundaryCase("T35 LOOK shout preserves literal normalized public text", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].shout = { cycle: 0, text: "  <img src=x>\n  shouted\ttext  " };
  const traces = await mountedLook(world);
  expect(traces).toEqual([{ kind: "notice", text: "<img src=x> shouted text", visibility: "public" }]);
  expect(Object.keys(traces![0]).sort()).toEqual(["kind", "text", "visibility"]);
});

boundaryCase("T35 LOOK institution notice retains literal public text", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].institution_notice = {
    cycle: 0, org_id: "org.line", org_name: "Line", text: "  <svg onload=alert(1)>\n  institutional  ",
  };
  const traces = await mountedLook(world);
  expect(traces).toEqual([{ kind: "notice", text: "<svg onload=alert(1)> institutional", visibility: "public" }]);
  expect(Object.keys(traces![0]).sort()).toEqual(["kind", "text", "visibility"]);
});

boundaryCase("T35 LOOK trade notice retains literal public text", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].trade_notice = { cycle: 0, text: "  <a href=x>trade</a>\n  receipt  " };
  const traces = await mountedLook(world);
  expect(traces).toEqual([{ kind: "notice", text: "<a href=x>trade</a> receipt", visibility: "public" }]);
  expect(Object.keys(traces![0]).sort()).toEqual(["kind", "text", "visibility"]);
});

function spectatorTraces(world: WorldRuntime) {
  const live = buildWatchLive({
    world_id: world.world_id, cycle: world.cycle, sequence: world.sequence,
    rooms: world.rooms as unknown as Record<string, WatchRoomIn>, players: [], events: [],
  });
  const rooms = live.rooms as Array<{ room_id: string; traces: Array<{ kind: string; text: string; visibility: string }> }>;
  return rooms.find((r) => r.room_id === "room.a")!.traces;
}

function spectatorWorld(family: "board" | "shout" | "institution_notice" | "trade_notice") {
  const world = fixtureWorld();
  world.rooms["room.a"].entities[0].scar = true;
  world.rooms["room.a"].entities[0].label = "Scar <em>visible</em>";
  const text = `<img src=x> forbidden ${family}`;
  if (family === "board") world.rooms["room.a"].board = [{ text, cycle: 0 }];
  if (family === "shout") world.rooms["room.a"].shout = { text, cycle: 0 };
  if (family === "institution_notice") world.rooms["room.a"].institution_notice = {
    text, cycle: 0, org_id: "org.line", org_name: "Line",
  };
  if (family === "trade_notice") world.rooms["room.a"].trade_notice = { text, cycle: 0 };
  return { world, text };
}

boundaryCase.each(["board", "shout", "institution_notice", "trade_notice"] as const)(
  "T35 WATCH excludes %s but keeps a visible scar", (family) => {
    const { world, text } = spectatorWorld(family);
    const traces = spectatorTraces(world);
    expect(traces).toEqual([{ kind: "scar", text: "A scar remains (Scar <em>visible</em>).", visibility: "public" }]);
    expect(traces.map((t) => t.text)).not.toContain(text);
  },
);

boundaryCase("T35 WATCH visible hostile-looking scar is literal; hidden twin is excluded", () => {
  const world = fixtureWorld();
  world.rooms["room.a"].entities[0].scar = true;
  world.rooms["room.a"].entities[0].label = "Scar <strong>allowed</strong>";
  world.rooms["room.a"].entities.push({
    entity_id: "entity.hidden", label: "Hidden <script>excluded</script>", entity_type: "RUIN",
    condition: 40, hidden: true,
  });
  const traces = spectatorTraces(world);
  expect(traces).toEqual([{ kind: "scar", text: "A scar remains (Scar <strong>allowed</strong>).", visibility: "public" }]);
  expect(JSON.stringify(traces)).not.toContain("Hidden <script>excluded</script>");
});
