import { expect, test } from "vitest";
import { DEFAULT_BUDGETS, cloneBudgets } from "../src/actions";
import { CONSTRUCT_COSTS } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { PlayerPrincipal } from "../src/types";

// Local reducer acceptance only. Settlement is an in-memory callback, not HTTP,
// Durable Object restart, hosted SQL, WATCH, or production authorization proof.
const principal = (name: string): PlayerPrincipal => ({
  player_id: `player.${name}`, agent_id: `agent.${name}`, session_id: `session.${name}`,
  controller_id: `controller.${name}`, controller_type: "agent", authentication_context: "test",
  protocol_version: "1", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
});
async function scene() {
  const w: WorldRuntime = {
    world_id: "test.presence.remaining793", world_name: "Remaining presence variants", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Public hub", entities: [],
        exits: [{ direction: "east", to_room_id: "room.east" }] },
      "room.east": { room_id: "room.east", name: "East", description: "Public east", entities: [],
        exits: [{ direction: "west", to_room_id: "room.hub" }] },
    }, players: {}, organizations: {}, messages: [], trades: {}, seen_idempotency: {}, unsettled: [],
  };
  const owner = principal("owner"), near = principal("near"), member = principal("member"), distant = principal("distant");
  const settled: Array<Parameters<Parameters<typeof applyWorldCommand>[3]>[0]> = [];
  let n = 0;
  const send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, key = `remaining793.${++n}`) =>
    applyWorldCommand(w, p, { request_id: key, idempotency_key: key, command, arguments: args },
      async event => { settled.push(structuredClone(event)); return true; }, { admission: "developer" });
  const text = (p: PlayerPrincipal, line: string, key?: string) => send(p, "LOOK", { line }, key);
  const ok = async (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) => {
    const result = await send(p, command, args);
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    return result;
  };
  for (const p of [owner, near, member, distant]) await ok(p, "ENTER_WORLD");
  // Native construction fixture headroom, as in discovery-build-partner-route.
  // Storage is occupied capacity, not a material wallet. No seeded asset, funds,
  // invented material requirement, or direct completion flag is used.
  w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[owner.player_id].budgets.storage -= CONSTRUCT_COSTS.workshop.storage || 0;
  await ok(owner, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
  const shell = w.rooms["room.hub"].entities.find(e => e.infra_type === "workshop")!;
  expect(shell).toBeDefined();
  expect(shell.in_progress).toBe(true);
  const assetId = shell.entity_id;
  const asset = () => w.rooms["room.hub"].entities.find(e => e.entity_id === assetId)!;
  // Every present Player must WAIT before the native cycle promotes the shell.
  for (const p of [owner, near, member, distant]) await ok(p, "WAIT");
  expect(asset().in_progress).not.toBe(true);
  // Organization membership and office authority are obtained through commands.
  w.players[owner.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  await ok(owner, "ORG_CREATE", { name: "Own Compact", charter: "Coordinate" });
  const org = Object.values(w.organizations)[0];
  await ok(owner, "COMMIT", { operation: "ORG_MEMBER_ADD", org_id: org.org_id, agent_id: member.player_id, role: "member" });
  await ok(owner, "ORG_OFFICE_CREATE", { org_id: org.org_id, display_name: "Notice", authority_profile: "PUBLISH_NOTICE" });
  const office = Object.values(org.offices || {})[0];
  await ok(member, "MOVE", { direction: "east" });
  await ok(distant, "MOVE", { direction: "east" });
  // A real distant public holder must not become an unsolicited SHARE target.
  await ok(distant, "ORG_CREATE", { name: "Public Compact", charter: "Publish" });
  const publicOrg = Object.values(w.organizations).find(o => o.org_id !== org.org_id)!;
  await ok(distant, "ORG_OFFICE_CREATE", { org_id: publicOrg.org_id, display_name: "Public Notice", authority_profile: "PUBLISH_NOTICE" });
  const publicSeat = Object.values(publicOrg.offices || {})[0];
  await ok(distant, "ORG_OFFICE_ASSIGN", { office_id: publicSeat.office_id, agent_id: distant.player_id });
  const read = async (carrier: "LOOK" | "HELP" = "LOOK") => {
    const r = carrier === "LOOK" ? await ok(owner, "LOOK") : await text(owner, "help");
    expect(r.ok).toBe(true);
    return r.observation!;
  };
  return { w, owner, near, member, distant, get asset() { return asset(); }, org, office, publicOrg, settled, send, text, ok, read };
}

test("local reducer #793 constructed BUILD.SHARE suggestions execute for local and remote own-member partners, not distant public holders", async () => {
  const s = await scene();
  for (const carrier of ["LOOK", "HELP"] as const) {
    const obs = await s.read(carrier);
    const shares = obs.affordances?.filter(a => a.action === "BUILD" && a.operation === "SHARE") || [];
    expect(shares.map(a => a.player_id).sort()).toEqual([s.near.player_id, s.member.player_id].sort());
    expect(JSON.stringify(shares)).not.toContain(s.distant.player_id);
    expect(JSON.stringify(shares)).not.toContain("with distant");
    expect(obs.organizations?.find(o => o.org_id === s.org.org_id)?.members.map(m => m.agent_id))
      .toEqual([s.owner.player_id, s.member.player_id]);
    const publicView = obs.organizations?.find(o => o.org_id === s.publicOrg.org_id);
    expect(publicView?.offices?.[0]).toMatchObject({ holder_handle: "distant", status: "OCCUPIED" });
    expect(publicView?.offices?.[0]).not.toHaveProperty("holder_player_id");
    expect(publicView?.members).toEqual([]);
  }
  for (const partner of [s.near, s.member]) {
    const a = (await s.read()).affordances!.find(a => a.operation === "SHARE" && a.player_id === partner.player_id)!;
    expect(a).toMatchObject({ target_id: s.asset.entity_id, available: true });
    const compute = s.w.players[s.owner.player_id].budgets.compute;
    s.settled.length = 0;
    const key = `remaining793.share.${partner.player_id}`;
    const r = await s.text(s.owner, a.cmd, key);
    expect(r.ok).toBe(true);
    expect(r.events?.map(e => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(s.settled).toHaveLength(1);
    expect(s.settled[0].payload).toMatchObject({ entity_id: s.asset.entity_id, operation: "SHARE" });
    expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
    const after = structuredClone(s.asset);
    s.settled.length = 0;
    expect(await s.text(s.owner, a.cmd, key)).toEqual(r);
    expect(s.settled).toEqual([]);
    expect(s.asset).toEqual(after);
    expect((await s.read()).affordances?.some(row => row.operation === "SHARE" && row.player_id === partner.player_id)).toBe(false);
  }
  expect(s.asset).toMatchObject({ owner_id: s.owner.player_id, co_owner_id: s.near.player_id, co_owner_2_id: s.member.player_id });
  expect(s.w.messages).toEqual([]); // BUILD share is never claim forwarding.
});

test("local reducer #793 remote office-assignment offer executes and occupied seat retains authorized member ID but public handle only", async () => {
  const s = await scene();
  for (const carrier of ["LOOK", "HELP"] as const) {
    const assignments = (await s.read(carrier)).affordances?.filter(a => a.operation === "ORG_OFFICE_ASSIGN") || [];
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatchObject({ target_id: s.office.office_id, target_label: "member", available: true });
    expect(JSON.stringify(assignments)).not.toMatch(/near|distant/);
  }
  const a = (await s.read()).affordances!.find(a => a.operation === "ORG_OFFICE_ASSIGN")!;
  const compute = s.w.players[s.owner.player_id].budgets.compute;
  const r = await s.text(s.owner, a.cmd);
  expect(r.ok).toBe(true);
  expect(r.events?.map(e => e.event_type)).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
  expect(s.w.players[s.owner.player_id].budgets.compute).toBe(compute - 1);
  expect(s.office).toMatchObject({ status: "OCCUPIED", holder_player_id: s.member.player_id });
  const own = await s.read();
  expect(own.affordances?.some(row => row.operation === "ORG_OFFICE_ASSIGN" && row.target_id === s.office.office_id)).toBe(false);
  expect(own.organizations?.find(o => o.org_id === s.org.org_id)?.offices?.[0])
    .toMatchObject({ holder_player_id: s.member.player_id, holder_handle: "member" });
  const outside = (await s.ok(s.near, "LOOK")).observation!;
  const publicOffice = outside.organizations?.find(o => o.org_id === s.org.org_id)?.offices?.[0];
  expect(publicOffice).toMatchObject({ holder_handle: "member", status: "OCCUPIED" });
  expect(publicOffice).not.toHaveProperty("holder_player_id");
  expect(outside.office_lines?.join(" ")).toContain("Notice");
  expect(outside.play_text).toContain("member");
});

test("local reducer #793 membership loss removes remote SHARE and assignment suggestions while explicit authorized distant SHARE remains admitted", async () => {
  const s = await scene();
  expect((await s.text(s.member, `leave ${s.org.org_id}`)).ok).toBe(true);
  for (const carrier of ["LOOK", "HELP"] as const) {
    const obs = await s.read(carrier);
    const rows = obs.affordances?.filter(a => a.operation === "SHARE" || a.operation === "ORG_OFFICE_ASSIGN") || [];
    expect(rows.some(a => a.player_id === s.member.player_id || a.target_label === "member")).toBe(false);
    expect(rows.some(a => a.operation === "SHARE" && a.player_id === s.near.player_id)).toBe(true);
    expect(rows.some(a => a.operation === "ORG_OFFICE_ASSIGN")).toBe(false);
  }
  await s.ok(s.owner, "BUILD", { operation: "SHARE", entity_id: s.asset.entity_id, player_id: s.member.player_id });
  expect(s.asset.co_owner_id).toBe(s.member.player_id);
  expect(s.w.players[s.member.player_id].room_id).toBe("room.east");
  expect(s.w.messages).toEqual([]);
});

test("local reducer #793 SHARE suggestions follow MOVE and LEAVE presence without removing own-roster IDs", async () => {
  const s = await scene();
  const partners = async () => (await s.read()).affordances?.filter(a => a.operation === "SHARE").map(a => a.player_id).sort();
  expect(await partners()).toEqual([s.member.player_id, s.near.player_id].sort());
  await s.ok(s.near, "MOVE", { direction: "east" });
  expect(await partners()).toEqual([s.member.player_id]);
  await s.ok(s.distant, "MOVE", { direction: "west" });
  expect(await partners()).toEqual([s.member.player_id, s.distant.player_id].sort());
  await s.ok(s.distant, "LEAVE_WORLD");
  expect(await partners()).toEqual([s.member.player_id]);
  await s.ok(s.member, "LEAVE_WORLD");
  for (const carrier of ["LOOK", "HELP"] as const) {
    const obs = await s.read(carrier);
    expect(obs.affordances?.filter(a => a.operation === "SHARE" || a.operation === "ORG_OFFICE_ASSIGN")).toEqual([]);
    // Leaving world is not leaving the organization. Its authorized roster survives.
    expect(obs.organizations?.find(o => o.org_id === s.org.org_id)?.members.map(m => m.agent_id))
      .toContain(s.member.player_id);
  }
});
