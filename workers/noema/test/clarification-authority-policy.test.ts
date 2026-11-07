import { describe, expect, it as authorityPolicyCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity, parseHumanCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

// Public developer reducer only: these fixtures do not model hosted text admission or SQL settlement.
function actor(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`, agent_id: `agent.${id}`, session_id: `session.${id}`,
    controller_id: `controller.${id}`, controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1", authentication_context: "test",
  };
}
function rig() {
  const w: WorldRuntime = {
    world_id: "test.hosted-canonical.authority-policy", world_name: "Reach", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.east" }], entities: [] },
      "room.east": { room_id: "room.east", name: "East", description: "Shore.",
        exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    },
    players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const settled: Array<{ event_type: string; payload: unknown }> = [];
  let serial = 0;
  async function send(p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
    const id = `authority.policy.${++serial}`;
    const envelope: CommandEnvelope = { request_id: id, idempotency_key: id, command, arguments: args };
    return applyWorldCommand(w, p, envelope, async (e) => {
      settled.push({ event_type: e.event_type, payload: e.payload });
      return true;
    }, { admission: "developer" });
  }
  async function enter(p: PlayerPrincipal) {
    expect((await send(p, "ENTER_WORLD")).ok).toBe(true);
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  }
  async function grant(founder: PlayerPrincipal, holder: PlayerPrincipal, profile: "GRANT_ACCESS" | "OPERATE_NAMED_ASSET" = "GRANT_ACCESS") {
    await enter(founder);
    if (holder.player_id !== founder.player_id) await enter(holder);
    const formed = await send(founder, "ORG_CREATE", { name: "Line", charter: "Keep the grid" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    expect(orgId).toBeTruthy();
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    if (holder.player_id !== founder.player_id) {
      expect((await send(founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: holder.player_id, role: "member" })).ok).toBe(true);
    }
    const created = await send(founder, "ORG_OFFICE_CREATE", { org_id: orgId, display_name: "Gate", authority_profile: profile });
    expect(created.ok).toBe(true);
    const seatId = Object.keys(w.organizations[orgId].offices || {})[0];
    expect(seatId).toBeTruthy();
    expect((await send(founder, "ORG_OFFICE_ASSIGN", { office_id: seatId, agent_id: holder.player_id })).ok).toBe(true);
    expect(w.organizations[orgId].offices?.[seatId]?.holder_player_id).toBe(holder.player_id);
    // Fixture funding, not a claim that these resources were earned by a public action.
    w.organizations[orgId].treasury!.compute = 20;
    w.organizations[orgId].treasury!.influence = 20;
    w.organizations[orgId].treasury!.energy = 20;
    w.organizations[orgId].treasury!.storage = 20;
    return { orgId, seatId };
  }
  function projection(orgId: string, people: PlayerPrincipal[]) {
    return structuredClone({ sequence: w.sequence, treasury: w.organizations[orgId].treasury,
      restrictions: w.access_restrictions || [],
      people: people.map((p) => ({ room: w.players[p.player_id].room_id, budgets: w.players[p.player_id].budgets })),
      entities: w.rooms["room.hub"].entities, settled });
  }
  return { w, settled, send, enter, grant, projection };
}
function relays(w: WorldRuntime) {
  w.rooms["room.hub"].entities = [
    enrichEntity({ entity_id: "entity.relay-east", label: "relay-east", entity_type: "INFRASTRUCTURE", condition: 40 }),
    enrichEntity({ entity_id: "entity.relay-west", label: "relay-west", entity_type: "INFRASTRUCTURE", condition: 40 }),
  ];
}

describe("#780 action/target-specific office and outbound policy revalidation", () => {
  authorityPolicyCase("compound institutional REPAIR ambiguity does not turn a post-vacancy numeric pick into an institutional repair", async () => {
    const { w, settled, send, grant, projection } = rig();
    const founder = actor("founder"), holder = actor("holder");
    const { orgId, seatId } = await grant(founder, holder, "OPERATE_NAMED_ASSET");
    relays(w);
    const target = w.rooms["room.hub"].entities[0];
    const positive = await send(holder, "COMMIT", { operation: "REPAIR", entity_id: target.entity_id, acting_for: orgId, office_id: seatId });
    expect(positive.ok).toBe(true);
    expect(positive.events?.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.entity_id === target.entity_id && e.payload?.acting_for === orgId)).toBe(true);
    expect(w.organizations[orgId].treasury!.energy).toBeLessThan(20);
    expect(w.players[holder.player_id].budgets.energy).toBe(DEFAULT_BUDGETS.energy);
    // Personal funds are insufficient; institutional treasury remains funded. This isolates the replay identity.
    w.players[holder.player_id].budgets.energy = 0;
    const offered = await send(holder, "LOOK", { line: `repair relay for ${orgId}` });
    expect(offered.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(w.players[holder.player_id].pending_clarify?.verb).toBe("repair");
    expect(w.players[holder.player_id].pending_clarify?.choices).toHaveLength(2);
    expect(offered.events ?? []).toEqual([]);
    const vacancy = await send(founder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: seatId });
    expect(vacancy.ok).toBe(true);
    expect(w.organizations[orgId].offices?.[seatId]?.status).toBe("VACANT");
    const before = projection(orgId, [holder, founder]);
    const pick = await send(holder, "LOOK", { line: "1" });
    expect(pick.error?.code).toBe("BUDGET_EXCEEDED");
    expect(pick.events ?? []).toEqual([]);
    expect(w.players[holder.player_id].pending_clarify).toBeUndefined();
    expect(projection(orgId, [holder, founder])).toEqual(before);
    const refused = await send(holder, "COMMIT", { operation: "REPAIR", entity_id: target.entity_id, acting_for: orgId, office_id: seatId });
    expect(refused.error?.code).toBe("FORBIDDEN");
    expect(refused.events ?? []).toEqual([]);
    expect(projection(orgId, [holder, founder])).toEqual(before);
    expect(settled.filter((e) => e.event_type === "ENTITY_UPDATE" && (e.payload as { operation?: string }).operation === "REPAIR")).toHaveLength(1);
    // Personal repair is a separate legal action, independent of the vacated office.
    w.players[holder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[holder.player_id].budgets.storage = 8; // free hold space for personal repair cargo
    const personal = await send(holder, "LOOK", { line: "repair relay-east" });
    expect(personal.ok).toBe(true);
    expect(personal.events?.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.entity_id === target.entity_id && !e.payload?.acting_for)).toBe(true);
  });

  authorityPolicyCase("vacancy removes GRANT_ACCESS on both advertised text and structured paths; reassignment restores it", async () => {
    const { w, settled, send, grant, projection } = rig();
    const founder = actor("founder"), holder = actor("holder");
    const { orgId, seatId } = await grant(founder, holder);
    const text = `access east deny for ${orgId}`;
    const admitted = await send(holder, "LOOK", { line: text });
    expect(admitted.ok).toBe(true);
    expect(admitted.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
    expect(w.access_restrictions?.some((r) => r.mode === "DENY" && r.exit_id === "east")).toBe(true);
    expect(w.organizations[orgId].treasury!.compute).toBe(19);
    expect(w.organizations[orgId].treasury!.influence).toBe(18);
    const vacated = await send(founder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: seatId });
    expect(vacated.ok).toBe(true);
    expect(vacated.events?.some((e) => e.event_type === "ENTITY_UPDATE")).toBe(true);
    expect(w.organizations[orgId].offices?.[seatId]?.status).toBe("VACANT");
    expect(w.organizations[orgId].offices?.[seatId]?.holder_player_id).toBeUndefined();
    const before = projection(orgId, [founder, holder]);
    for (const [command, args] of [
      ["LOOK", { line: text }],
      ["COMMIT", { operation: "ACCESS_POLICY", scope: "EXIT", mode: "DENY", direction: "east", acting_for: orgId, applies_to: "*" }],
    ] as const) {
      const refused = await send(holder, command, args);
      expect(refused.ok).toBe(false);
      expect(refused.error?.code).toBe("FORBIDDEN");
      expect(refused.events ?? []).toEqual([]);
      expect(projection(orgId, [founder, holder])).toEqual(before);
    }
    expect(settled.filter((e) => e.event_type === "ACCESS_RESTRICTED")).toHaveLength(1);
    expect((await send(founder, "COMMIT", { operation: "ORG_OFFICE_ASSIGN", office_id: seatId, agent_id: holder.player_id })).ok).toBe(true);
    expect(w.organizations[orgId].offices?.[seatId]?.holder_player_id).toBe(holder.player_id);
    const restored = await send(holder, "LOOK", { line: text });
    expect(restored.ok).toBe(true);
    expect(restored.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
    expect(settled.filter((e) => e.event_type === "ACCESS_RESTRICTED")).toHaveLength(2);
  });

  for (const carrier of ["text", "structured"] as const) {
    authorityPolicyCase(`clean post-vacancy ${carrier} ACCESS refusal cannot hide behind a prior DENY`, async () => {
      const founder = actor("founder"), holder = actor("holder");
      const deniedRig = rig();
      const { orgId, seatId } = await deniedRig.grant(founder, holder);
      const submit = (r: ReturnType<typeof rig>, organization: string) => carrier === "text"
        ? r.send(holder, "LOOK", { line: `access east deny for ${organization}` })
        : r.send(holder, "COMMIT", { operation: "ACCESS_POLICY", scope: "EXIT", mode: "DENY",
            direction: "east", acting_for: organization, applies_to: "*" });
      expect(deniedRig.w.access_restrictions ?? []).toEqual([]);
      const vacancy = await deniedRig.send(founder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: seatId });
      expect(vacancy.ok).toBe(true);
      expect(deniedRig.w.organizations[orgId].offices?.[seatId]?.status).toBe("VACANT");
      const before = deniedRig.projection(orgId, [founder, holder]);
      const refusal = await submit(deniedRig, orgId);
      expect(refusal.ok).toBe(false);
      expect(refusal.error?.code).toBe("FORBIDDEN");
      expect(refusal.events ?? []).toEqual([]);
      expect(deniedRig.projection(orgId, [founder, holder])).toEqual(before);
      expect(deniedRig.w.access_restrictions ?? []).toEqual([]);
      expect(deniedRig.settled.filter((e) => e.event_type === "ACCESS_RESTRICTED")).toEqual([]);

      // Separate occupied, unrestricted twin proves this exact carrier reaches settlement.
      const authorizedRig = rig();
      const authorized = await authorizedRig.grant(founder, holder);
      expect(authorizedRig.w.access_restrictions ?? []).toEqual([]);
      const accepted = await submit(authorizedRig, authorized.orgId);
      expect(accepted.ok).toBe(true);
      expect(accepted.events?.filter((e) => e.event_type === "ACCESS_RESTRICTED")).toHaveLength(1);
      expect(authorizedRig.settled.filter((e) => e.event_type === "ACCESS_RESTRICTED")).toHaveLength(1);
      expect(authorizedRig.w.access_restrictions).toEqual([
        expect.objectContaining({ mode: "DENY", scope: "EXIT", exit_id: "east", applies_to: "*" }),
      ]);
      expect(authorizedRig.w.organizations[authorized.orgId].treasury!.compute).toBe(19);
      expect(authorizedRig.w.organizations[authorized.orgId].treasury!.influence).toBe(18);
    });
  }

  for (const intervention of ["none", "outbound policy", "office vacancy", "own HELP"] as const) {
    authorityPolicyCase(`numeric INSPECT retains its canonical target under ${intervention}`, async () => {
      const { w, settled, send, grant, enter, projection } = rig();
      const founder = actor("founder"), gate = actor("gate"), walker = actor("walker");
      const { orgId, seatId } = await grant(founder, gate);
      await enter(walker);
      relays(w);
      const ambiguous = await send(walker, "LOOK", { line: "inspect relay" });
      expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
      const pending = w.players[walker.player_id].pending_clarify;
      expect(pending?.verb).toBe("inspect");
      expect(pending?.choices).toHaveLength(2);
      expect(ambiguous.events ?? []).toEqual([]);
      const chosen = pending!.choices[0];
      const selected = parseHumanCommand(`inspect ${chosen}`, { entities: w.rooms["room.hub"].entities });
      expect(selected.ok && selected.action.verb === "INSPECT").toBe(true);
      const targetId = selected.ok && selected.action.verb === "INSPECT" ? selected.action.arguments.entity_id : "";
      expect(targetId).toBeTruthy();
      if (intervention === "outbound policy") {
        const change = await send(gate, "LOOK", { line: `access east deny for ${orgId}` });
        expect(change.ok).toBe(true);
        expect(change.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
        expect(w.access_restrictions?.some((r) => r.mode === "DENY")).toBe(true);
      } else if (intervention === "office vacancy") {
        const change = await send(founder, "COMMIT", { operation: "ORG_OFFICE_VACATE", office_id: seatId });
        expect(change.ok).toBe(true);
        expect(w.organizations[orgId].offices?.[seatId]?.status).toBe("VACANT");
      } else if (intervention === "own HELP") {
        const help = await send(walker, "LOOK", { line: "help" });
        expect(help.ok).toBe(true);
        expect(w.players[walker.player_id].pending_clarify).toBeUndefined();
      }
      const before = projection(orgId, [founder, gate, walker]);
      const count = settled.length;
      const picked = await send(walker, "LOOK", { line: "1" });
      expect(w.players[walker.player_id].pending_clarify).toBeUndefined();
      if (intervention === "own HELP") {
        expect(picked.error?.code).toBe("UNKNOWN_COMMAND");
        expect(picked.events ?? []).toEqual([]);
        expect(projection(orgId, [founder, gate, walker])).toEqual(before);
      } else {
        expect(picked.ok).toBe(true);
        const inspect = picked.events?.find((e) => e.event_type === "INSPECT");
        expect(inspect?.payload?.entity_id).toBe(targetId);
        expect(w.players[walker.player_id].budgets.attention).toBe(before.people[2].budgets.attention - 2);
        expect(settled.slice(count).some((e) => e.event_type === "INSPECT")).toBe(true);
        expect(picked.events?.some((e) => e.event_type === "MOVE")).toBe(false);
        expect(w.players[walker.player_id].room_id).toBe("room.hub");
      }
    });
  }

  authorityPolicyCase("explicit MOVE rechecks EXIT DENY, CLEAR, ROOM DENY and ALLOW_ONLY without a numeric MOVE fiction", async () => {
    const { w, settled, send, grant, enter, projection } = rig();
    const founder = actor("founder"), gate = actor("gate"), walker = actor("walker"), other = actor("other");
    const { orgId } = await grant(founder, gate);
    await enter(walker); await enter(other);
    async function assertAuthorityPolicyEastMove() {
      const observed = await send(walker, "LOOK");
      expect(observed.ok).toBe(true);
      const advertised = observed.observation?.affordances?.find((a) => a.verb === "MOVE" && a.target_id === "east");
      expect(advertised?.cmd).toBe("move east");
      expect(advertised?.requires).toEqual({ energy: 1 });
      const beforeEnergy = w.players[walker.player_id].budgets.energy;
      const beforeSettled = settled.length;
      const moved = await send(walker, "MOVE", { direction: "east" });
      expect(moved.ok).toBe(true);
      const moves = moved.events?.filter((e) => e.event_type === "MOVE") ?? [];
      expect(moves).toHaveLength(1);
      expect(moves[0].payload).toEqual({
        player_id: walker.player_id, from: "room.hub", to: "room.east", direction: "east", cost_paid: { energy: 1 },
      });
      expect(moves[0].payload?.cost_paid).toEqual(advertised?.requires);
      expect(settled.slice(beforeSettled).filter((e) => e.event_type === "MOVE")).toEqual([
        { event_type: "MOVE", payload: moves[0].payload },
      ]);
      expect(w.players[walker.player_id].budgets.energy).toBe(beforeEnergy - 1);
      expect(w.players[walker.player_id].room_id).toBe("room.east");
    }
    const unrestricted = await send(walker, "MOVE", { direction: "east" });
    expect(unrestricted.ok).toBe(true);
    expect(unrestricted.events?.some((e) => e.event_type === "MOVE" && e.payload?.from === "room.hub" && e.payload?.to === "room.east" && e.payload?.direction === "east")).toBe(true);
    expect((await send(walker, "MOVE", { direction: "west" })).ok).toBe(true);
    const deny = await send(gate, "LOOK", { line: `access east deny for ${orgId}` });
    expect(deny.ok).toBe(true);
    expect(deny.events?.some((e) => e.event_type === "ACCESS_RESTRICTED")).toBe(true);
    const before = projection(orgId, [walker, other]);
    const refused = await send(walker, "MOVE", { direction: "east" });
    expect(refused.error?.code).toBe("MOVE_REJECTED");
    expect(refused.events ?? []).toEqual([]);
    expect(projection(orgId, [walker, other])).toEqual(before);
    expect((await send(gate, "LOOK", { line: `access east clear for ${orgId}` })).ok).toBe(true);
    await assertAuthorityPolicyEastMove();
    expect((await send(walker, "MOVE", { direction: "west" })).ok).toBe(true);
    expect((await send(gate, "LOOK", { line: `access here deny for ${orgId}` })).ok).toBe(true);
    const roomBefore = projection(orgId, [walker]);
    expect((await send(walker, "MOVE", { direction: "east" })).error?.code).toBe("MOVE_REJECTED");
    expect(projection(orgId, [walker])).toEqual(roomBefore);
    expect((await send(gate, "LOOK", { line: `access here clear for ${orgId}` })).ok).toBe(true);
    const allowed = await send(gate, "LOOK", { line: `access east allow for ${orgId} applies_to=${walker.player_id}` });
    expect(allowed.ok).toBe(true);
    expect(w.access_restrictions?.some((r) => r.mode === "ALLOW_ONLY" && r.applies_to === walker.player_id)).toBe(true);
    const unlistedBefore = projection(orgId, [other]);
    expect((await send(other, "MOVE", { direction: "east" })).error?.code).toBe("MOVE_REJECTED");
    expect(projection(orgId, [other])).toEqual(unlistedBefore);
    await assertAuthorityPolicyEastMove();
    expect((await send(walker, "MOVE", { direction: "west" })).ok).toBe(true);
    const finalDeny = await send(gate, "LOOK", { line: `access east deny for ${orgId}` });
    expect(finalDeny.ok).toBe(true);
    const precedenceBefore = projection(orgId, [walker]);
    expect((await send(walker, "MOVE", { direction: "east" })).error?.code).toBe("MOVE_REJECTED");
    expect(projection(orgId, [walker])).toEqual(precedenceBefore);
    expect(settled.some((e) => e.event_type === "MOVE")).toBe(true);
  });

  authorityPolicyCase("unsupported compound office and MOVE numeric syntax does not assign an office or route MOVE", async () => {
    const { w, send, grant, enter, settled } = rig();
    const founder = actor("founder"), holder = actor("holder");
    const { seatId } = await grant(founder, founder);
    await enter(holder);
    w.players[holder.player_id].handle = "relay-east";
    const third = actor("third"); await enter(third); w.players[third.player_id].handle = "relay-west";
    const ambiguous = await send(founder, "LOOK", { line: `office assign ${seatId} relay` });
    expect(ambiguous.error?.code).toBe("AMBIGUOUS_TARGET");
    expect(w.players[founder.player_id].pending_clarify?.verb).toBe("office");
    const beforeHolder = w.organizations[Object.keys(w.organizations)[0]].offices?.[seatId]?.holder_player_id;
    const count = settled.length;
    const pick = await send(founder, "LOOK", { line: "1" });
    expect(pick.ok).toBe(false);
    expect(pick.events ?? []).toEqual([]);
    expect(w.organizations[Object.keys(w.organizations)[0]].offices?.[seatId]?.holder_player_id).toBe(beforeHolder);
    expect(settled).toHaveLength(count);
    const move = parseHumanCommand("move east");
    expect(move.ok && move.action.verb).toBe("MOVE");
    const access = parseHumanCommand("access east deny for org.line");
    expect(access.ok && access.action.verb === "COMMIT" && access.action.arguments.operation).toBe("ACCESS_POLICY");
    expect((await send(holder, "MOVE", { direction: "1" })).ok).toBe(false);
    expect(w.players[holder.player_id].room_id).toBe("room.hub");
  });
});
