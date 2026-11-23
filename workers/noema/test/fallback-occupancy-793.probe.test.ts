// DIAGNOSTIC ONLY: malformed retained occupancy, not a reachable hosted-world claim.
// Agreed maintained seam: applyWorldCommand -> successful LOOK/developer HELP observation.
import { expect, test as presenceProbe } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

let serial = 0;
function occupancyProbePrincipal(name: string): PlayerPrincipal {
  return {
    player_id: `player.${name}`, agent_id: `agent.${name}`,
    session_id: `session.${name}`, controller_id: `controller.${name}`,
    controller_type: "agent", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1", authentication_context: "test",
  };
}
function occupancyProbeCommand(w: WorldRuntime, p: PlayerPrincipal, command: string,
  args: Record<string, unknown> = {}, developer = false) {
  const id = `occupancy-probe.${++serial}`;
  return applyWorldCommand(w, p, { request_id: id, idempotency_key: id, command, arguments: args },
    async () => true, developer ? { admission: "developer" } : undefined);
}
async function occupancyProbeScene() {
  const w: WorldRuntime = {
    world_id: "test.presence-fallback-diagnostic", world_name: "Fixture", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Open hub.",
        exits: [{ direction: "east", to_room_id: "room.east" }], entities: [] },
      "room.east": { room_id: "room.east", name: "East", description: "East room.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const observer = occupancyProbePrincipal("observer"), near = occupancyProbePrincipal("near"), far = occupancyProbePrincipal("far");
  for (const p of [observer, near, far]) expect((await occupancyProbeCommand(w, p, "ENTER_WORLD")).ok).toBe(true);
  expect((await occupancyProbeCommand(w, far, "MOVE", { direction: "east" })).ok).toBe(true);
  return { w, observer, near, far };
}
presenceProbe("diagnostic healthy valid occupancy includes the local principal, not the remote one", async () => {
  const { w, observer, near, far } = await occupancyProbeScene();
  const r = await occupancyProbeCommand(w, observer, "LOOK");
  expect(r.ok).toBe(true);
  expect(r.observation?.players_here?.map(p => p.player_id)).toEqual([near.player_id]);
  expect(r.observation?.players_here?.some(p => p.player_id === far.player_id)).toBe(false);
});
for (const missingRoom of ["", undefined, "room.unknown"] as const) {
  for (const carrier of ["LOOK", "developer HELP"] as const) {
    presenceProbe(`diagnostic ${carrier} never treats fallback as occupancy for ${String(missingRoom)}`, async () => {
      const { w, observer } = await occupancyProbeScene();
      // Explicit defensive retained-state intervention, not a public mutation or live corruption witness.
      w.players[observer.player_id].room_id = missingRoom as string;
      const r = carrier === "LOOK" ? await occupancyProbeCommand(w, observer, "LOOK")
        : await occupancyProbeCommand(w, observer, "LOOK", { line: "help" }, true);
      expect(r.ok).toBe(true);
      expect(w.players[observer.player_id].room_id).toBe(missingRoom);
      expect(r.observation?.location?.room_id).toBe("room.hub");
      expect(r.observation?.players_here).toEqual([]);
    });
  }
}
