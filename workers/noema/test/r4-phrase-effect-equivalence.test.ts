/**
 * #778 step 4 — T0.3 / T0.4 / T0.5 settled-effect equivalence.
 *
 * The R4 matrix gap for all three rows: phrases are proven to *parse* to the same action, but "no assertion
 * compares canonical event/settlement effect" of every phrase against the structured command. Here each
 * phrase runs on the developer text path in a fresh world, and the structured command runs on the hosted
 * path (default admission). Both settled worlds are projected the same way and must be equal.
 *
 * The projection keeps everything deterministic: event types, sequences, payloads (cost paid, from/to,
 * target, recipient, text), the actor's room / budgets / practice / discovery, every message, and
 * `world.sequence`. It drops only per-request random identifiers (`event_id`, `message_id`,
 * `source_event_id`). A discrimination control proves the projection tells different effects apart.
 * Local reducer evidence only.
 */
import { describe, expect, it } from "vitest";
import { applyWorldCommand, buildObservation, type WorldRuntime } from "../src/world-actions";
import { enrichEntity } from "../src/actions";
import type { PlayerPrincipal } from "../src/types";

const principal = (id: string, session: string): PlayerPrincipal => ({
  player_id: `player.${id}`,
  agent_id: `agent.${id}`,
  session_id: session,
  controller_id: `ctrl.${id}`,
  controller_type: "agent",
  scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1",
  authentication_context: "test",
});
const self = principal("self", "sess.self");
const rhea = principal("rhea", "sess.rhea");
const tamsin = principal("tamsin", "sess.tamsin");
const DEV = { admission: "developer" as const };

function world(): WorldRuntime {
  return {
    world_id: "test.phrase-equivalence",
    world_name: "Phrase Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "A crossing.",
        exits: [
          { direction: "east", to_room_id: "room.east" },
          { direction: "north", to_room_id: "room.north", hidden: true },
        ],
        // Two overlapping labels make article stripping and exact-label-first load-bearing: an unstripped
        // "the signal-relay" partially matches both and would be ambiguous (the resolver matches both ways).
        entities: [
          enrichEntity({ entity_id: "ent.relay", label: "signal-relay", entity_type: "INFRASTRUCTURE", condition: 40 }),
          enrichEntity({ entity_id: "ent.annex", label: "signal-relay-annex", entity_type: "INFRASTRUCTURE", condition: 70 }),
        ],
      },
      "room.east": { room_id: "room.east", name: "East", description: "Open ground.", exits: [], entities: [] },
      "room.north": { room_id: "room.north", name: "North", description: "Behind the wall.", exits: [], entities: [] },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

/** A world where both Players have entered the hub; built the same way for every run. */
async function entered(): Promise<WorldRuntime> {
  const w = world();
  for (const p of [self, rhea, tamsin]) {
    const r = await applyWorldCommand(w, p, { request_id: `enter.${p.player_id}`, idempotency_key: `enter.${p.player_id}`, command: "ENTER_WORLD", arguments: {} }, async () => true);
    expect(r.ok).toBe(true);
  }
  return w;
}

// Per-request random ids, and the wall-clock presence stamp (`last_seen_ms`), are the only dropped fields.
const VOLATILE = new Set(["event_id", "message_id", "source_event_id", "last_seen_ms"]);
function strip(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !VOLATILE.has(k)).map(([k, x]) => [k, strip(x)]));
  }
  return v;
}

type Settled = { ok: boolean; code?: string; projection: unknown };
async function settle(command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Settled> {
  const w = await entered();
  const r = await applyWorldCommand(w, self, { request_id: "act", idempotency_key: "act", command, arguments: args }, async () => true, mode);
  const me = w.players[self.player_id];
  return {
    ok: r.ok,
    code: r.error?.code,
    projection: strip({
      events: r.events ?? [],
      sequence: w.sequence,
      actor: { room_id: me.room_id, budgets: me.budgets, practice: me.practice, discovery: me.discovery },
      // Every other channel the command could touch: the other Players (incl. inboxes), rooms and their
      // entities (condition, stock, pressure), stored messages and unsettled work.
      others: Object.fromEntries(Object.entries(w.players).filter(([id]) => id !== self.player_id)),
      rooms: w.rooms,
      messages: w.messages,
      unsettled: w.unsettled,
    }),
  };
}
const text = (line: string) => settle("LOOK", { line }, DEV);

describe("#778 T0.3–T0.5 phrases settle exactly like their structured command", () => {
  it("control: the projection distinguishes different effects", async () => {
    const east = await settle("MOVE", { direction: "east" });
    const inspect = await settle("INSPECT", { entity_id: "ent.relay" });
    const hello = await settle("MESSAGE", { recipient_id: "player.rhea", text: "hello" });
    const hullo = await settle("MESSAGE", { recipient_id: "player.rhea", text: "hullo" });
    const annex = await settle("INSPECT", { entity_id: "ent.annex" });
    const toTamsin = await settle("MESSAGE", { recipient_id: "player.tamsin", text: "hello" });
    expect(east.projection).not.toEqual(inspect.projection);
    expect(hello.projection).not.toEqual(hullo.projection);
    expect(inspect.projection).not.toEqual(annex.projection);
    expect(hello.projection).not.toEqual(toTamsin.projection);
  });

  it("T0.3: e / east / go east / walk east / move east settle as structured MOVE east", async () => {
    const canonical = await settle("MOVE", { direction: "east" });
    expect(canonical.ok).toBe(true);
    for (const line of ["e", "east", "go east", "walk east", "move east"]) {
      const r = await text(line);
      expect({ line, ok: r.ok, projection: r.projection }).toEqual({ line, ok: true, projection: canonical.projection });
    }
  });

  it("T0.3: a hidden exit refuses every phrase with no effect, like structured MOVE north", async () => {
    const baseline = (await settle("WAIT", {})).projection;
    const canonical = await settle("MOVE", { direction: "north" });
    expect(canonical.ok).toBe(false);
    for (const line of ["n", "north", "go north", "walk north", "move north"]) {
      const r = await text(line);
      expect({ line, ok: r.ok }).toEqual({ line, ok: false });
      expect((r.projection as { events: unknown[] }).events).toEqual([]);
      expect((r.projection as { actor: { room_id: string } }).actor.room_id).toBe("room.hub");
      expect((r.projection as { sequence: number }).sequence).toBe((baseline as { sequence: number }).sequence);
      expect((r.projection as { actor: unknown }).actor).toEqual((canonical.projection as { actor: unknown }).actor);
    }
  });

  it("T0.4: look X / look at X / inspect X / inspect the X settle as structured INSPECT on the exact label", async () => {
    const canonical = await settle("INSPECT", { entity_id: "ent.relay" });
    expect(canonical.ok).toBe(true);
    for (const line of ["look signal-relay", "look at signal-relay", "inspect signal-relay", "inspect the signal-relay", "look at the signal-relay"]) {
      const r = await text(line);
      expect({ line, ok: r.ok, projection: r.projection }).toEqual({ line, ok: true, projection: canonical.projection });
    }
  });

  it("T0.5: tell / say to / message / msg settle as structured MESSAGE, including delivery", async () => {
    const canonical = await settle("MESSAGE", { recipient_id: "player.rhea", text: "hello" });
    expect(canonical.ok).toBe(true);
    for (const line of ["tell rhea hello", "say to rhea hello", 'message rhea "hello"', "message rhea hello", "msg rhea hello"]) {
      const r = await text(line);
      expect({ line, ok: r.ok, projection: r.projection }).toEqual({ line, ok: true, projection: canonical.projection });
    }
  });

  it("T0.5: an unobservable recipient is refused with no effect and no identity lookup", async () => {
    const baseline = (await settle("WAIT", {})).projection as { sequence: number };
    const structured = await settle("MESSAGE", { recipient_id: "player.ghost", text: "hi" });
    expect(structured.ok).toBe(false);
    for (const line of ["tell ghost hi", "msg player.ghost hi"]) {
      const r = await text(line);
      // Refusal codes are deliberately NOT compared: text says NOT_FOUND where structured says FORBIDDEN, and
      // the codes themselves can disclose whether a handle exists or is online. Tracked as a separate finding
      // (#790); this test pins only that the refusal has no effect at all.
      expect({ line, ok: r.ok }).toEqual({ line, ok: false });
      const pr = r.projection as { events: unknown[]; sequence: number; messages: unknown[] };
      expect(pr.events).toEqual([]);
      expect(pr.sequence).toBe(baseline.sequence);
      expect(pr.messages).toEqual([]);
      // Nothing about anyone changed: the whole settled world equals a no-op.
      expect({ ...pr, events: [] }).toEqual({ ...(baseline as object), events: [] });
    }
  });
});

/**
 * #791 (ADR 0002): MESSAGE recipients on the text path refuse absent Players exactly like structured
 * MESSAGE, and name matching runs only among co-located Players; anyone elsewhere needs an exact handle or id.
 * Each case builds the same world twice and runs the text phrase in one and structured MESSAGE in the other.
 */
describe("#791 MESSAGE recipients: text path equals structured; no existence oracle, no roster", () => {
  type Spot = "hub" | "east" | "left" | "never";
  type Cast = Record<string, Spot>;
  /** relay: condition of the one relay (null = none, so long range is UNREACHABLE). */
  async function scene(cast: Cast, relay: number | null, handles: Record<string, string> = {}): Promise<WorldRuntime> {
    const w = world();
    w.rooms["room.hub"].exits = [{ direction: "east", to_room_id: "room.east" }];
    w.rooms["room.east"].exits = [{ direction: "west", to_room_id: "room.hub" }];
    w.rooms["room.hub"].entities = relay === null ? [] :
      [enrichEntity({ entity_id: "ent.comms-relay", label: "comms-relay", entity_type: "INFRASTRUCTURE", condition: relay })];
    const enter = async (p: PlayerPrincipal) => {
      const r = await applyWorldCommand(w, p, { request_id: `in.${p.player_id}`, idempotency_key: `in.${p.player_id}`, command: "ENTER_WORLD", arguments: {} }, async () => true);
      expect(r.ok).toBe(true);
    };
    await enter(self);
    for (const [id, spot] of Object.entries(cast)) {
      if (spot === "never") continue;
      const p = principal(id, `sess.${id}`);
      await enter(p);
      if (handles[id]) w.players[p.player_id].handle = handles[id];
      if (spot === "east") {
        expect((await applyWorldCommand(w, p, { request_id: `mv.${id}`, idempotency_key: `mv.${id}`, command: "MOVE", arguments: { direction: "east" } }, async () => true)).ok).toBe(true);
      }
      if (spot === "left") {
        expect((await applyWorldCommand(w, p, { request_id: `out.${id}`, idempotency_key: `out.${id}`, command: "LEAVE_WORLD", arguments: {} }, async () => true)).ok).toBe(true);
      }
    }
    return w;
  }
  type Outcome = { ok: boolean; code?: string; message?: string; response: string; projection: unknown };
  async function send(w: WorldRuntime, command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Outcome> {
    const r = await applyWorldCommand(w, self, { request_id: "send", idempotency_key: "send", command, arguments: args }, async () => true, mode);
    const me = w.players[self.player_id];
    return {
      ok: r.ok,
      code: r.error?.code,
      message: r.error?.message,
      // What this path itself says: the refusal or clarification, and any stored pick. The observation's
      // affordance list is excluded here because it currently names every present Player on both paths (#793).
      response: JSON.stringify({ error: r.error, pending: w.players[self.player_id]?.pending_clarify ?? null }),
      projection: strip({
        events: r.events ?? [],
        sequence: w.sequence,
        actor: { room_id: me.room_id, budgets: me.budgets },
        others: Object.fromEntries(Object.entries(w.players).filter(([id]) => id !== self.player_id)),
        messages: w.messages,
      }),
    };
  }
  /** Text phrase vs structured MESSAGE, each in its own copy of the same scene. */
  async function both(cast: Cast, relay: number | null, line: string, recipient_id: string, handles?: Record<string, string>) {
    const text = await send(await scene(cast, relay, handles), "LOOK", { line }, DEV);
    const structured = await send(await scene(cast, relay, handles), "MESSAGE", { recipient_id, text: "hi" });
    return { text, structured };
  }
  const same = (o: { text: Outcome; structured: Outcome }) =>
    expect({ ok: o.text.ok, code: o.text.code, message: o.text.message, projection: o.text.projection })
      .toEqual({ ok: o.structured.ok, code: o.structured.code, message: o.structured.message, projection: o.structured.projection });

  it("present and co-located, by exact handle: delivered exactly like structured", async () => {
    const o = await both({ rhea: "hub" }, 60, "tell rhea hi", "player.rhea");
    expect(o.structured.ok).toBe(true);
    same(o);
  });

  it("present elsewhere, relays healthy, by exact handle or exact id: delivered exactly like structured", async () => {
    for (const line of ["tell tamsin hi", "msg player.tamsin hi"]) {
      const o = await both({ tamsin: "east" }, 60, line, "player.tamsin");
      expect(o.structured.ok).toBe(true);
      same(o);
    }
  });

  it("present elsewhere, relays down: UNREACHABLE exactly like structured", async () => {
    const o = await both({ tamsin: "east" }, null, "tell tamsin hi", "player.tamsin");
    expect(o.structured.code).toBe("UNREACHABLE");
    same(o);
  });

  it("left the world: refused exactly like structured", async () => {
    for (const line of ["tell gone hi", "msg player.gone hi"]) {
      const o = await both({ gone: "left" }, 60, line, "player.gone");
      expect(o.structured.ok).toBe(false);
      same(o);
    }
  });

  it("never existed: refused exactly like structured, and exactly like a Player who left", async () => {
    for (const line of ["tell ghost hi", "msg player.ghost hi"]) {
      const o = await both({}, 60, line, "player.ghost");
      expect(o.structured.ok).toBe(false);
      same(o);
      const left = await send(await scene({ ghost: "left" }, 60), "LOOK", { line }, DEV);
      expect({ code: o.text.code, message: o.text.message }).toEqual({ code: left.code, message: left.message });
    }
  });

  it("a partial name that matches only a distant Player is refused like an absent one and names nobody", async () => {
    const o = await both({ tamsin: "east" }, 60, "tell tam hi", "player.ghost");
    same(o);
    expect(o.text.response).not.toMatch(/tamsin/i);
  });

  it("a partial name matching several co-located Players lists only them, never a distant match", async () => {
    const w = await scene({ rhea: "hub", rhys: "hub", rhona: "east" }, 60);
    const r = await send(w, "LOOK", { line: "tell rh hi" }, DEV);
    expect(r.code).toBe("AMBIGUOUS_TARGET");
    expect([...(w.players[self.player_id].pending_clarify?.choices ?? [])].sort()).toEqual(["rhea", "rhys"]);
    expect(r.response).not.toMatch(/rhona/i);
    expect((r.projection as { messages: unknown[] }).messages).toEqual([]);
  });

  it("a partial name matching exactly one co-located Player is delivered to them", async () => {
    const o = await both({ rhea: "hub", rhona: "east" }, 60, "tell rhe hi", "player.rhea");
    expect(o.structured.ok).toBe(true);
    same(o);
  });

  it("a shared exact handle: one co-located holder is the recipient; distant holders are never listed", async () => {
    const handles = { "dupe-a": "dupe", "dupe-b": "dupe" };
    const near = await both({ "dupe-a": "hub", "dupe-b": "east" }, 60, "tell dupe hi", "player.dupe-a", handles);
    expect(near.structured.ok).toBe(true);
    same(near);
    const far = await send(await scene({ "dupe-a": "east", "dupe-b": "east" }, 60, handles), "LOOK", { line: "tell dupe hi" }, DEV);
    const absent = await send(await scene({}, 60), "MESSAGE", { recipient_id: "player.ghost", text: "hi" });
    expect({ ok: far.ok, code: far.code, message: far.message }).toEqual({ ok: absent.ok, code: absent.code, message: absent.message });
    expect(far.response).not.toMatch(/dupe-/);
  });

  it("an exact hyphenated id elsewhere reaches that Player, never a co-located Player whose handle it contains", async () => {
    // Codex review on #795: normalisation turned "player.remote-agent" into "player.remote agent", missed the
    // exact id, and the partial rule delivered the private message to the co-located "agent".
    for (const line of ["msg player.remote-agent hi"]) {
      const o = await both({ "remote-agent": "east", agent: "hub" }, 60, line, "player.remote-agent");
      expect(o.structured.ok).toBe(true);
      same(o);
    }
  });

  it("a distant short ID with a renamed public handle is not a recipient name", async () => {
    const cast = { alpha: "east" } as const;
    const handles = { alpha: "public-friend" };
    const absent = await send(await scene({}, 60), "MESSAGE", { recipient_id: "player.ghost", text: "hi" });
    const short = await send(await scene(cast, 60, handles), "LOOK", { line: "tell alpha hi" }, DEV);
    expect({ ok: short.ok, code: short.code, message: short.message }).toEqual({ ok: absent.ok, code: absent.code, message: absent.message });
    expect((short.projection as { events: unknown[]; messages: unknown[] }).events).toEqual([]);
    expect((short.projection as { messages: unknown[] }).messages).toEqual([]);
    const localShort = await send(await scene({ alpha: "hub" }, 60, handles), "LOOK", { line: "tell alpha hi" }, DEV);
    expect({ ok: localShort.ok, code: localShort.code, message: localShort.message }).toEqual({ ok: absent.ok, code: absent.code, message: absent.message });
    expect((localShort.projection as { messages: unknown[] }).messages).toEqual([]);
    for (const line of ["tell player.alpha hi", "tell public-friend hi"]) {
      const o = await both(cast, 60, line, "player.alpha", handles);
      expect(o.structured.ok).toBe(true);
      same(o);
    }
  });

  it("short-ID collision does not substitute punctuation; explicit distant ID and handle still work", async () => {
    // East player.remote-agent is renamed public-friend; local beta is named remote agent.
    // A short ID is not an address, and a space cannot stand in for a hyphen.
    const cast = { "remote-agent": "east", beta: "hub" } as const;
    const handles = { "remote-agent": "public-friend", beta: "remote agent" };
    const w = await scene(cast, 60, handles);
    const refused = await send(w, "LOOK", { line: "tell remote-agent hi" }, DEV);
    const absent = await send(await scene(cast, 60, handles), "MESSAGE", { recipient_id: "player.ghost", text: "hi" });
    expect(refused.ok).toBe(false);
    expect(refused.code).toBe(absent.code);
    expect(refused.projection).toEqual(absent.projection);
    for (const line of ["tell player.remote-agent hi", "tell public-friend hi"]) {
      const exact = await both(cast, 60, line, "player.remote-agent", handles);
      expect(exact.structured.ok).toBe(true);
      same(exact);
    }
    const explicit = await both(cast, 60, "tell remote-agent hi", "player.remote-agent", { ...handles, "remote-agent": "remote-agent" });
    expect(explicit.structured.ok).toBe(true);
    same(explicit);
  });

  it("punctuation substitutions never address a co-located alternative without a literal target", async () => {
    // Hyphen, underscore, and space are distinct handle characters, not interchangeable separators.
    // The text grammar accepts a single-token recipient; space handles are tested as alternatives.
    for (const [typed, alternative] of [
      ["remote-agent", "remote_agent"], ["remote_agent", "remote-agent"],
      ["remote-agent", "remote agent"], ["remote_agent", "remote agent"],
    ] as const) {
      const cast = { alpha: "hub", beta: "hub" } as const;
      const handles = { alpha: alternative, beta: "witness" };
      const w = await scene(cast, 60, handles);
      const line = `tell ${typed} hi`;
      const actual = await send(w, "LOOK", { line }, DEV);
      const absent = await send(await scene(cast, 60, handles), "MESSAGE", { recipient_id: "player.ghost", text: "hi" });
      expect(actual.ok, line).toBe(false);
      expect(actual.code, line).toBe(absent.code);
      expect(actual.projection, line).toEqual(absent.projection);
      const projection = actual.projection as { events: unknown[]; sequence: number; actor: { budgets: unknown }; messages: unknown[] };
      expect(projection.events, line).toEqual([]);
      expect(projection.messages, line).toEqual([]);
      const before = await scene(cast, 60, handles);
      expect(projection.sequence, line).toBe(before.sequence);
      expect(projection.actor.budgets, line).toEqual(before.players[self.player_id].budgets);
      expect(buildObservation(w, principal("alpha", "sess.alpha")).messages, line).toEqual([]);
      expect(buildObservation(w, principal("beta", "sess.beta")).messages, line).toEqual([]);
    }
  });

  it("literal ids and handles win over normalization collisions, with private delivery only to the intended inbox", async () => {
    const cases = [
      { target: "remote-agent", other: "remote_agent", address: "remote-agent", spot: "east" },
      { target: "remote_agent", other: "remote-agent", address: "remote_agent", spot: "east" },
      { target: "remote-agent", other: "remote_agent", address: "remote-agent", spot: "hub" },
      { target: "remote_agent", other: "remote-agent", address: "remote_agent", spot: "hub" },
      { target: "remote-agent", other: "remote agent", address: "remote-agent", spot: "east" },
    ] as const;
    for (const { target, other, address, spot } of cases) {
      // Stable ids are separate from public handles, including handles with spaces and id-like spelling.
      const cast = { alpha: spot, beta: spot === "east" ? "hub" : "east" } as const;
      const w = await scene(cast, 60, { alpha: target, beta: other });
      const line = `tell ${address} hi`;
      const r = await applyWorldCommand(w, self, { request_id: `collision.${address}.${spot}`, idempotency_key: `collision.${address}.${spot}`, command: "LOOK", arguments: { line } }, async () => true, DEV);
      expect(r.ok, line).toBe(true);
      expect(r.events?.find((e) => e.event_type === "MESSAGE")?.payload).toMatchObject({ recipient_id: "player.alpha", text: "hi" });
      expect(w.messages).toMatchObject([{ recipient_id: "player.alpha", text: "hi", status: "DELIVERED" }]);
      for (const [id, expected] of [["alpha", ["hi"]], ["beta", []]] as const) {
        const observation = await applyWorldCommand(w, principal(id, `sess.${id}`), { request_id: `inbox.${id}`, idempotency_key: `inbox.${id}`, command: "LOOK", arguments: {} }, async () => true);
        expect(observation.observation?.messages?.map((m) => m.text), `${line} -> ${id}`).toEqual(expected);
      }
    }
    // An id-looking public handle cannot displace either literal full player id, even when co-located.
    for (const [target, other] of [["remote-agent", "remote_agent"], ["remote_agent", "remote-agent"]] as const) {
      const w = await scene({ [target]: "east", [other]: "hub" }, 60, { [other]: `player.${target}` });
      const r = await applyWorldCommand(w, self, { request_id: `id.${target}`, idempotency_key: `id.${target}`, command: "LOOK", arguments: { line: `msg player.${target} hi` } }, async () => true, DEV);
      expect(r.ok).toBe(true);
      expect(r.events?.find((e) => e.event_type === "MESSAGE")?.payload).toMatchObject({ recipient_id: `player.${target}`, text: "hi" });
      expect(w.messages.map((m) => [m.recipient_id, m.text])).toEqual([[`player.${target}`, "hi"]]);
      for (const [id, expected] of [[target, ["hi"]], [other, []]] as const) {
        const observation = await applyWorldCommand(w, principal(id, `sess.${id}`), { request_id: `id-inbox.${id}`, idempotency_key: `id-inbox.${id}`, command: "LOOK", arguments: {} }, async () => true);
        expect(observation.observation?.messages?.map((m) => m.text)).toEqual(expected);
      }
    }
  });

  it("a typed name that merely contains a co-located handle is not that Player", async () => {
    // "agentsmith" is absent; the co-located "agent" must not receive a message meant for someone else.
    for (const [line, id] of [["tell agentsmith hi", "player.agentsmith"], ["msg player.agentsmith hi", "player.agentsmith"], ["tell agent-x hi", "player.agent-x"]] as const) {
      const o = await both({ agent: "hub" }, 60, line, id);
      expect({ line, ok: o.text.ok }).toEqual({ line, ok: false });
      same(o);
    }
  });

  it("a hyphenated id typed in another case still reaches exactly that Player (literal id match)", async () => {
    // Only the literal, case-insensitive id comparison resolves this: admission's own lookup is exact-case.
    const w = await scene({ "remote-agent": "east", agent: "hub" }, 60);
    const r = await send(w, "LOOK", { line: "msg Player.Remote-Agent hi" }, DEV);
    expect(r.ok).toBe(true);
    expect(w.messages.map((m) => m.recipient_id)).toEqual(["player.remote-agent"]);
  });

  it("an id-shaped name is exact or nothing: it never partial-matches a co-located handle", async () => {
    // "player.help" is absent; a co-located Player whose handle happens to contain it must not receive it.
    const handles = { helper: "player.helper-bot" };
    const o = await both({ helper: "hub" }, 60, "msg player.help hi", "player.help", handles);
    expect(o.text.ok).toBe(false);
    same(o);
  });

  it("messaging yourself behaves exactly like structured MESSAGE to yourself", async () => {
    const o = await both({}, 60, "msg player.self hi", "player.self");
    same(o);
  });
});
