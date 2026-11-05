import { expect, test as n10Test } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

function n10Principal(name: string): PlayerPrincipal {
  return {
    player_id: `player.${name}`, agent_id: `agent.${name}`,
    session_id: `session.${name}`, controller_id: `controller.${name}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1", authentication_context: "test",
  };
}
const n10Sender = n10Principal("sender");
const n10Near = n10Principal("near");
const n10Far = n10Principal("far");
let n10Request = 0;
async function n10Run(
  w: WorldRuntime, p: PlayerPrincipal, command: string,
  args: Record<string, unknown> = {}, developer = false,
) {
  const key = `n10.${++n10Request}`;
  return applyWorldCommand(w, p,
    { request_id: key, idempotency_key: key, command, arguments: args },
    async () => true, developer ? { admission: "developer" } : undefined);
}
async function n10Scene(): Promise<WorldRuntime> {
  const w: WorldRuntime = {
    world_id: "test.hosted-canonical.next10", world_name: "Next ten",
    cycle: 0, sequence: 0, entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub", name: "Hub", description: "Open hub.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [enrichEntity({ entity_id: "entity.n10-relay", label: "relay",
          entity_type: "INFRASTRUCTURE", condition: 60 })],
      },
      "room.east": { room_id: "room.east", name: "East", description: "East room.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {},
    seen_idempotency: {}, unsettled: [],
  };
  for (const p of [n10Sender, n10Near, n10Far]) {
    expect((await n10Run(w, p, "ENTER_WORLD")).ok).toBe(true);
  }
  expect((await n10Run(w, n10Far, "MOVE", { direction: "east" })).ok).toBe(true);
  w.players[n10Sender.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return w;
}
n10Test("[N10.9] MESSAGE and TRADE suggestions name only co-located Players", async () => {
  const w = await n10Scene();
  const r = await n10Run(w, n10Sender, "LOOK");
  expect(r.ok).toBe(true);
  const social = (r.observation?.affordances ?? [])
    .filter(a => a.action === "MESSAGE" || a.action === "TRADE");
  expect(social.some(a => a.target_id === n10Far.player_id)).toBe(false);
  expect(social.some(a => a.action === "MESSAGE" && a.target_id === n10Near.player_id)).toBe(true);
  expect(social.some(a => a.action === "TRADE" && a.target_id === n10Near.player_id)).toBe(true);
  expect(JSON.stringify(social)).not.toContain(n10Far.player_id);
  // Suggestions disappear; the explicitly named distant action must still work.
  const sent = await n10Run(w, n10Sender, "MESSAGE", {
    recipient_id: n10Far.player_id, text: "N10_EXPLICIT_ADDRESS",
  });
  expect(sent.ok).toBe(true);
  expect(w.messages.at(-1)?.recipient_id).toBe(n10Far.player_id);
});
