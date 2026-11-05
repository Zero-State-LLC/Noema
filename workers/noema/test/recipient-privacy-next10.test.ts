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

it("[N10.4] pass and claim-share uniformly refuse absent recipients", async () => {
  for (const verb of ["pass", "share"]) {
    await n10Refused(await n10Scene(), `${verb} player.never-n10 claim.N10_PRIVATE_BODY`);
  }
});

it("[N10.5] sibling recipient selection preserves literal addresses and local partial boundaries", async () => {
  for (const verb of ["report", "repeat", "pass", "share"]) {
    const w = await n10Scene();
    w.players[n10Far.player_id].handle = "remote-agent";
    w.players[n10Near.player_id].handle = "remote_agent";
    const claim = await n10HeldClaim(w);
    const line = (target: string) => verb === "pass" || verb === "share"
      ? `${verb} ${target} ${claim}`
      : `${verb} ${target} "N10_HELD_REPORT"`;
    const before = w.messages.length;
    const exact = await n10Run(w, n10Sender, "LOOK", { line: line("remote-agent") }, true);
    expect(exact.ok).toBe(true);
    expect(w.messages).toHaveLength(before + 1);
    expect(w.messages.at(-1)?.recipient_id).toBe(n10Far.player_id);
    const event = exact.events?.find(e => e.event_type === "MESSAGE");
    expect(event?.payload?.recipient_id).toBe(n10Far.player_id);
    const far = await n10Run(w, n10Far, "LOOK");
    const near = await n10Run(w, n10Near, "LOOK");
    expect(JSON.stringify(far.observation?.messages)).toContain("N10_HELD_REPORT");
    expect(JSON.stringify(near.observation?.messages)).not.toContain("N10_HELD_REPORT");
    // A short ID is not the distant Player's renamed handle or full ID.
    const short = await n10Run(w, n10Sender, "LOOK", { line: line("far") }, true);
    expect(short.ok).toBe(false);
    expect(short.error?.code).toBe("FORBIDDEN");
  }
});

it("[N10.6] sibling ambiguity lists local names without retaining body or claim token", async () => {
  for (const verb of ["report", "repeat", "pass", "share"]) {
    const w = await n10Scene();
    w.players[n10Near.player_id].handle = "local-a";
    w.players[n10Far.player_id].handle = "local-distant";
    const extra = n10Principal("local-b");
    expect((await n10Run(w, extra, "ENTER_WORLD")).ok).toBe(true);
    const privatePart = verb === "pass" || verb === "share"
      ? "claim.N10_PRIVATE_BODY" : '"N10_PRIVATE_BODY"';
    const r = await n10Run(w, n10Sender, "LOOK", { line: `${verb} local ${privatePart}` }, true);
    expect(r.error?.code).toBe("AMBIGUOUS_TARGET");
    const pending = w.players[n10Sender.player_id].pending_clarify;
    expect([...(pending?.choices ?? [])].sort()).toEqual(["local-a", "local-b"]);
    expect(JSON.stringify({ error: r.error, pending })).not.toContain("local-distant");
    expect(JSON.stringify(r)).not.toContain("N10_PRIVATE_BODY");
    expect(JSON.stringify(pending)).not.toContain("N10_PRIVATE_BODY");
    const before = n10Effects(w);
    const pick = await n10Run(w, n10Sender, "LOOK", { line: "1" }, true);
    expect(pick.error?.code).toBe("INVALID_REQUEST");
    expect(pick.error?.message).toBe("Write the message again to the chosen Player.");
    expect(pick.events ?? []).toEqual([]);
    expect(n10Effects(w)).toEqual(before);
    expect(w.players[n10Sender.player_id].pending_clarify).toBeUndefined();
  }
});

it("[N10.7] forwarding preserves a held report and refused replay settles nothing", async () => {
  for (const verb of ["pass", "share"]) {
    const w = await n10Scene();
    const claim = await n10HeldClaim(w);
    const sent = await n10Run(w, n10Sender, "LOOK", {
      line: `${verb} player.far ${claim}`,
    }, true);
    expect(sent.ok).toBe(true);
    const event = sent.events?.find(e => e.event_type === "MESSAGE");
    expect(event?.payload?.recipient_id).toBe(n10Far.player_id);
    expect(event?.payload?.claim_id).toBe(claim);
    expect(w.messages.at(-1)?.text).toBe("N10_HELD_REPORT");
    expect(w.messages.at(-1)?.recipient_id).toBe(n10Far.player_id);
    const far = await n10Run(w, n10Far, "LOOK");
    const near = await n10Run(w, n10Near, "LOOK");
    expect(JSON.stringify(far.observation?.messages)).toContain("N10_HELD_REPORT");
    expect(JSON.stringify(near.observation?.messages)).not.toContain("N10_HELD_REPORT");
  }
  const w = await n10Scene();
  const envelope = { request_id: "n10.replay", idempotency_key: "n10.replay",
    command: "LOOK", arguments: { line: 'report player.never-n10 "N10_PRIVATE_BODY"' } };
  const before = n10Effects(w);
  for (let i = 0; i < 2; i++) {
    const r = await applyWorldCommand(w, n10Sender, envelope,
      async () => { throw new Error("rejected message must never settle"); },
      { admission: "developer" });
    expect(r.error?.code).toBe("FORBIDDEN");
    expect(r.events ?? []).toEqual([]);
    expect(n10Effects(w)).toEqual(before);
    expect(JSON.stringify(r)).not.toContain("N10_PRIVATE_BODY");
    expect(JSON.stringify(w.players)).not.toContain("sourceInput");
    expect(JSON.stringify(w.seen_idempotency)).not.toContain("N10_PRIVATE_BODY");
  }
});

it("[N10.8] expanded sibling aliases preserve local ambiguity through both developer carriers", async () => {
  for (const verb of ["report", "repeat", "pass", "share"]) {
    for (const carrier of ["line", "outer"] as const) {
      const w = await n10Scene();
      w.players[n10Near.player_id].handle = "local-a";
      w.players[n10Far.player_id].handle = "local-distant";
      const localB = n10Principal("local-b");
      expect((await n10Run(w, localB, "ENTER_WORLD")).ok).toBe(true);
      w.players[n10Sender.player_id].command_aliases = { brief: verb };
      const privatePart = verb === "pass" || verb === "share"
        ? "claim.N10_PRIVATE_BODY" : '"N10_PRIVATE_BODY"';
      const input = `brief local ${privatePart}`;
      const before = n10Effects(w);
      const r = carrier === "line"
        ? await n10Run(w, n10Sender, "LOOK", { line: input }, true)
        : await n10Run(w, n10Sender, input, {}, true);
      expect(r.ok).toBe(false);
      expect(r.error?.code).toBe("AMBIGUOUS_TARGET");
      expect(r.events ?? []).toEqual([]);
      expect(n10Effects(w)).toEqual(before);
      const pending = w.players[n10Sender.player_id].pending_clarify;
      expect([...(pending?.choices ?? [])].sort()).toEqual(["local-a", "local-b"]);
      expect(JSON.stringify({ error: r.error, pending })).not.toContain("local-distant");
      expect(JSON.stringify(r)).not.toContain("N10_PRIVATE_BODY");
      expect(JSON.stringify(pending)).not.toContain("N10_PRIVATE_BODY");
      const pick = await n10Run(w, n10Sender, "1", {}, true);
      expect(pick.error?.code).toBe("INVALID_REQUEST");
      expect(pick.error?.message).toBe("Write the message again to the chosen Player.");
      expect(pick.events ?? []).toEqual([]);
      expect(n10Effects(w)).toEqual(before);
      expect(w.players[n10Sender.player_id].pending_clarify).toBeUndefined();
    }
  }
});

it("[N10.8b] expanded and raw sibling refusals keep the semantic recipient code", async () => {
  for (const verb of ["report", "repeat", "pass", "share"]) {
    for (const carrier of ["line", "outer"] as const) {
      for (const aliased of [true, false]) {
        const w = await n10Scene();
        w.players[n10Sender.player_id].command_aliases = { brief: verb };
        const privatePart = verb === "pass" || verb === "share"
          ? "claim.N10_PRIVATE_BODY" : '"N10_PRIVATE_BODY"';
        const input = `${aliased ? "brief" : verb} player.never-n10 ${privatePart}`;
        const before = n10Effects(w);
        const r = carrier === "line"
          ? await n10Run(w, n10Sender, "LOOK", { line: input }, true)
          : await n10Run(w, n10Sender, input, {}, true);
        expect(r.ok).toBe(false);
        expect(r.error?.code).toBe("FORBIDDEN");
        expect(r.error?.message).toBe("Recipient is not addressable in this world.");
        expect(r.events ?? []).toEqual([]);
        expect(n10Effects(w)).toEqual(before);
        expect(w.players[n10Sender.player_id].pending_clarify).toBeUndefined();
        expect(JSON.stringify(r)).not.toContain("N10_PRIVATE_BODY");
        expect(JSON.stringify(r)).not.toContain("player.never-n10");
      }
    }
  }
});

it("[N10.9] sibling distant-only handle partials refuse without effect; exact handles deliver", async () => {
  for (const verb of ["report", "repeat", "pass", "share"]) {
    const w = await n10Scene();
    w.players[n10Near.player_id].handle = "neighbor";
    w.players[n10Far.player_id].handle = "tamsin";
    const claim = await n10HeldClaim(w);
    const line = (target: string) => verb === "pass" || verb === "share"
      ? `${verb} ${target} ${claim}` : `${verb} ${target} "N10_DISTANT_BODY"`;
    const before = n10Effects(w);
    const refused = await n10Run(w, n10Sender, "LOOK", { line: line("tam") }, true);
    expect(refused.ok).toBe(false);
    expect(refused.error?.code).toBe("FORBIDDEN");
    expect(refused.error?.message).toBe("Recipient is not addressable in this world.");
    expect(refused.events ?? []).toEqual([]);
    expect(n10Effects(w)).toEqual(before);
    expect(JSON.stringify(refused)).not.toContain("N10_DISTANT_BODY");
    expect(JSON.stringify(refused)).not.toContain(claim);
    const sent = await n10Run(w, n10Sender, "LOOK", { line: line("tamsin") }, true);
    expect(sent.ok).toBe(true);
    expect(sent.events?.find(e => e.event_type === "MESSAGE")?.payload?.recipient_id).toBe(n10Far.player_id);
    expect(w.messages.at(-1)?.recipient_id).toBe(n10Far.player_id);
    const far = await n10Run(w, n10Far, "LOOK");
    const near = await n10Run(w, n10Near, "LOOK");
    const deliveredText = verb === "pass" || verb === "share" ? "N10_HELD_REPORT" : "N10_DISTANT_BODY";
    expect(JSON.stringify(far.observation?.messages)).toContain(deliveredText);
    expect(JSON.stringify(near.observation?.messages)).not.toContain(deliveredText);
  }
});
