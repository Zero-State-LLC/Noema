import { expect, it } from "vitest";
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
function n10Effects(w: WorldRuntime) {
  return structuredClone({
    sequence: w.sequence, rooms: w.rooms, messages: w.messages,
    budgets: Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.budgets])),
    pendingMessages: w.pending_messages ?? [], rumor: w.rumor,
    unsettled: w.unsettled,
  });
}
async function n10Refused(w: WorldRuntime, line: string) {
  const before = n10Effects(w);
  const r = await n10Run(w, n10Sender, "LOOK", { line }, true);
  expect(r.ok).toBe(false);
  expect(r.error?.code).toBe("FORBIDDEN");
  expect(r.error?.message).toBe("Recipient is not addressable in this world.");
  expect(r.events ?? []).toEqual([]);
  expect(n10Effects(w)).toEqual(before);
  expect(JSON.stringify(r)).not.toContain("N10_PRIVATE_BODY");
  expect(JSON.stringify(r)).not.toContain("player.never-n10");
  return r;
}
async function n10HeldClaim(w: WorldRuntime): Promise<string> {
  const r = await n10Run(w, n10Sender, "MESSAGE", {
    recipient_id: n10Sender.player_id, text: "N10_HELD_REPORT", as_claim: true,
  });
  expect(r.ok).toBe(true);
  const id = (r.events ?? []).find(e => e.event_type === "MESSAGE")?.payload?.claim_id;
  expect(typeof id).toBe("string");
  expect(String(id)).toMatch(/^claim\./);
  w.players[n10Sender.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return String(id);
}

it("[N10.1] canonical control delivers to the named far recipient", async () => {
  const w = await n10Scene();
  const r = await n10Run(w, n10Sender, "MESSAGE", {
    recipient_id: n10Far.player_id, text: "N10_CONTROL",
  });
  expect(r.ok).toBe(true);
  expect(r.events?.map(e => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
  expect(w.messages.at(-1)?.recipient_id).toBe(n10Far.player_id);
  const far = await n10Run(w, n10Far, "LOOK");
  const near = await n10Run(w, n10Near, "LOOK");
  expect(JSON.stringify(far.observation?.messages)).toContain("N10_CONTROL");
  expect(JSON.stringify(near.observation?.messages)).not.toContain("N10_CONTROL");
});

it("[N10.2] report never-existed and left recipients have one refusal", async () => {
  const unknown = await n10Scene();
  const absent = await n10Refused(unknown, 'report player.never-n10 "N10_PRIVATE_BODY"');
  const left = await n10Scene();
  expect((await n10Run(left, n10Far, "LEAVE_WORLD")).ok).toBe(true);
  const gone = await n10Refused(left, 'report player.far "N10_PRIVATE_BODY"');
  expect(gone.error).toEqual(absent.error);
});

it("[N10.3] repeat unknown recipient is uniformly refused", async () => {
  await n10Refused(await n10Scene(), 'repeat player.never-n10 "N10_PRIVATE_BODY"');
});
