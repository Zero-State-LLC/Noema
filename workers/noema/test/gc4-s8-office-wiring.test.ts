/** GC4-S8 wiring onto ORG_OFFICE_ACT (RFC-0124 Accepted).
 *  Publish is configuration; a decision records who decided and never
 *  carries the operation out. No new verbs, no new events. */

import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = { request_id: `r.${w.sequence}.${command}`, command, arguments: args };
  return applyWorldCommand(w, p, envl, async () => true);
}

const A = principal("player.a");

function fixture(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 3,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Hub.",
        exits: [],
        entities: [enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE", condition: 60 })],
      },
    },
    players: {
      "player.a": {
        player_id: "player.a",
        handle: "nacre",
        room_id: "room.hub",
        entered: true,
        last_seen_ms: Date.now(),
        budgets: cloneBudgets({ ...DEFAULT_BUDGETS, compute: 40, influence: 40 }),
      },
    },
    organizations: {
      "org.compact": {
        org_id: "org.compact",
        name: "Signal Compact",
        charter: "keep the relay alive",
        status: "ACTIVE",
        creator_id: "player.a",
        created_cycle: 1,
        members: [{ agent_id: "player.a", role: "founder" }],
        offices: {
          "office.warden": {
            office_id: "office.warden",
            display_name: "Warden",
            status: "OCCUPIED",
            holder_player_id: "player.a",
            authority_profile: "OPERATE_NAMED_ASSET",
          },
        },
      },
    },
    trades: {},
    messages: [],
    seen_idempotency: {},
    unsettled: [],
  } as unknown as WorldRuntime;
}

const goodRule = {
  decision: { offices: ["office.warden"], quorum: 1 },
  appointment: { mechanism: "RULE_BASED" },
  jurisdiction: { objects: ["entity.relay-7"] },
  enforcement: { operation: "REPAIR" },
  failure: { on_vacancy: "SUCCEED_THEN_DECIDE", on_deadlock: "REFUSE" },
  evidence: { record: "ORG_RECORD" },
};

const publish = (w: WorldRuntime, rule: unknown = goodRule) =>
  run(w, A, "COMMIT", { operation: "ORG_OFFICE_ACT", org_id: "org.compact", governance_rule: rule });

const decide = (w: WorldRuntime, over: Record<string, unknown> = {}) =>
  run(w, A, "COMMIT", {
    operation: "ORG_OFFICE_ACT",
    org_id: "org.compact",
    rule_decision: { target: { object_id: "entity.relay-7" }, concurring: 1, ...over },
  });

describe("publish is configuration on an existing organization", () => {
  it("stores a well-formed rule and charges the existing office-act cost", async () => {
    const w = fixture();
    const before = w.players["player.a"].budgets.compute;
    const res = await publish(w);
    expect(res.ok).toBe(true);
    expect(w.organizations["org.compact"].governance_rule?.published).toBe(true);
    expect(w.organizations["org.compact"].governance_rule?.published_by).toBe("player.a");
    expect(w.players["player.a"].budgets.compute).toBeLessThan(before);
  });

  it("refuses an empty jurisdiction rather than storing a rule that can only refuse", async () => {
    const w = fixture();
    const res = await publish(w, { ...goodRule, jurisdiction: {} });
    expect(res.ok).toBe(false);
    expect(w.organizations["org.compact"].governance_rule).toBeUndefined();
  });

  it("refuses an appointment outside the SUCCESSION closed set", async () => {
    const w = fixture();
    expect((await publish(w, { ...goodRule, appointment: { mechanism: "MEMBER_ORDER" } })).ok).toBe(false);
    expect((await publish(w, { ...goodRule, appointment: { mechanism: "VACANT" } })).ok).toBe(false);
  });

  it("refuses omitted failure outcomes and unknown offices", async () => {
    const w = fixture();
    expect((await publish(w, { ...goodRule, failure: {} })).ok).toBe(false);
    expect((await publish(w, { ...goodRule, decision: { offices: ["office.ghost"], quorum: 1 } })).ok).toBe(false);
  });

  it("only a founder or officer may publish", async () => {
    const w = fixture();
    w.players["player.b"] = { ...w.players["player.a"], player_id: "player.b", handle: "other" } as never;
    const res = await run(w, principal("player.b"), "COMMIT", {
      operation: "ORG_OFFICE_ACT",
      org_id: "org.compact",
      governance_rule: goodRule,
    });
    expect(res.ok).toBe(false);
  });
});

describe("a decision records who decided; it never carries the operation out", () => {
  it("accepts inside jurisdiction and records the decision without repairing", async () => {
    const w = fixture();
    await publish(w);
    const conditionBefore = w.rooms["room.hub"].entities[0].condition;
    const res = await decide(w);
    expect(res.ok).toBe(true);
    const rec = w.organizations["org.compact"].governance_decisions;
    expect(rec).toHaveLength(1);
    expect(rec![0]).toMatchObject({ operation: "REPAIR", target: "entity.relay-7", decided_by: "player.a" });
    // RFC-0124 §6: the rule grants no reach — the relay is untouched.
    expect(w.rooms["room.hub"].entities[0].condition).toBe(conditionBefore);
    expect(res.observation?.consequence || "").toContain("still carries it out");
  });

  it("refuses with no published rule, outside jurisdiction, and on short quorum", async () => {
    const bare = fixture();
    expect((await decide(bare)).ok).toBe(false);

    const w = fixture();
    await publish(w);
    expect((await decide(w, { target: { object_id: "entity.other" } })).ok).toBe(false);
    expect((await decide(w, { concurring: 0 })).ok).toBe(false);
  });

  it("refuses a vacant deciding office when the rule wrote REFUSE", async () => {
    const w = fixture();
    await publish(w, { ...goodRule, failure: { on_vacancy: "REFUSE", on_deadlock: "REFUSE" } });
    const office = w.organizations["org.compact"].offices!["office.warden"];
    // still held by the actor, but the rule's deciding office is vacant
    w.organizations["org.compact"].offices!["office.steward"] = {
      office_id: "office.steward",
      display_name: "Steward",
      status: "VACANT",
      authority_profile: "OPERATE_NAMED_ASSET",
    } as never;
    w.organizations["org.compact"].governance_rule!.decision.offices = [office.office_id, "office.steward"];
    const res = await decide(w);
    expect(res.ok).toBe(false);
    expect(String(res.error?.message || "")).toContain("vacant");
  });
});

describe("visibility stays member-scoped", () => {
  it("members see the summary in office_lines; it names no rule text or quorum", async () => {
    const w = fixture();
    await publish(w);
    const look = await run(w, A, "LOOK");
    const lines = (look.observation?.office_lines || []).join(" ");
    expect(lines).toContain("published rule");
    expect(lines).toContain("Warden");
    expect(lines).not.toContain("REPAIR");
    expect(lines).not.toMatch(/quorum|entity\.|rule\./);
  });

  it("nothing governance-shaped reaches the public WATCH snapshot", async () => {
    const w = fixture();
    await publish(w);
    await decide(w);
    const { buildWatchLive } = await import("../src/watch-live");
    const snap = buildWatchLive({
      world_id: w.world_id,
      cycle: w.cycle,
      sequence: w.sequence,
      rooms: w.rooms as never,
      players: Object.values(w.players) as never,
      events: [],
    });
    const wire = JSON.stringify(snap);
    expect(wire).not.toMatch(/governance|rule_id|decision|quorum/i);
  });
});
