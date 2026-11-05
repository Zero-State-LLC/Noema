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
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
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

  it("messaging yourself behaves exactly like structured MESSAGE to yourself", async () => {
    const o = await both({}, 60, "msg player.self hi", "player.self");
    same(o);
  });
});
