import { expect, test as identityCase } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { OfficeRecord } from "../src/offices";
import type { PlayerPrincipal } from "../src/types";

const principal = (name: string): PlayerPrincipal => ({
  player_id: `player.${name}`, agent_id: `agent.${name}`,
  session_id: `session.${name}`, controller_id: `controller.${name}`,
  controller_type: "agent", scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
  protocol_version: "1", authentication_context: "test",
});
let request = 0;
const run = (w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false) => {
  const key = `identity793.${++request}`;
  return applyWorldCommand(w, p, { request_id: key, idempotency_key: key, command, arguments: args }, async () => true, developer ? { admission: "developer" } : undefined);
};
async function scene() {
  const w: WorldRuntime = {
    world_id: "test.organization.identity", world_name: "Identity", cycle: 0, sequence: 0,
    entry_room_id: "room.hub", rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "Open hub.", exits: [{ direction: "east", to_room_id: "room.east" }], entities: [enrichEntity({ entity_id: "entity.793", label: "relay", entity_type: "INFRASTRUCTURE", condition: 60, owner_id: "player.observer", infra_type: "generator" })] },
      "room.east": { room_id: "room.east", name: "East", description: "East room.", exits: [{ direction: "west", to_room_id: "room.hub" }], entities: [] },
    }, players: {}, trades: {}, messages: [], organizations: {}, seen_idempotency: {}, unsettled: [],
  };
  const observer = principal("observer"), near = principal("near"), far = principal("far"), outsider = principal("outsider"), founder = principal("founder");
  for (const p of [observer, near, far, outsider, founder]) expect((await run(w, p, "ENTER_WORLD")).ok).toBe(true);
  for (const p of [far, outsider, founder]) expect((await run(w, p, "MOVE", { direction: "east" })).ok).toBe(true);
  w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.organizations = {
    "org.own": { org_id: "org.own", name: "Own Compact", charter: "coordination", status: "ACTIVE", creator_id: observer.player_id, created_cycle: 0, members: [{ agent_id: observer.player_id, role: "founder" }, { agent_id: far.player_id, role: "member" }], offices: {} },
    "org.other": { org_id: "org.other", name: "Other Compact", charter: "coordination", status: "ACTIVE", creator_id: founder.player_id, created_cycle: 0, members: [{ agent_id: founder.player_id, role: "founder" }, { agent_id: outsider.player_id, role: "member" }], offices: {} },
  };
  return { w, observer, near, far, outsider, founder };
}

identityCase("outsider LOOK keeps summary but withholds entire roster and creator in structured and PLAY text", async () => {
  const { w, observer, far, outsider, founder, near } = await scene();
  const r = await run(w, observer, "LOOK");
  expect(r.ok).toBe(true);
  const own = r.observation?.organizations?.find(o => o.org_id === "org.own");
  const other = r.observation?.organizations?.find(o => o.org_id === "org.other");
  expect(own?.members).toEqual([{ agent_id: observer.player_id, role: "founder" }, { agent_id: far.player_id, role: "member" }]);
  expect(own?.creator_id).toBe(observer.player_id);
  expect(other).toMatchObject({ name: "Other Compact", members: [], my_role: null });
  expect(other).not.toHaveProperty("creator_id");
  expect(JSON.stringify({ organizations: r.observation?.organizations, office_lines: r.observation?.office_lines, affordances: r.observation?.affordances, play_text: r.observation?.play_text })).not.toMatch(/player\.(?:founder|outsider)/);
  expect(r.observation?.players_here?.some(p => p.player_id === near.player_id)).toBe(true);
  expect(r.observation?.players_here?.some(p => p.player_id === outsider.player_id)).toBe(false);
});

identityCase("own roster survives a distant room; removed creator is an outsider", async () => {
  const { w, observer, far } = await scene();
  w.players[observer.player_id].room_id = "room.east";
  let r = await run(w, observer, "LOOK");
  expect(r.observation?.organizations?.find(o => o.org_id === "org.own")?.members.map(m => m.agent_id)).toEqual([observer.player_id, far.player_id]);
  w.organizations["org.own"].members = [{ agent_id: far.player_id, role: "member" }];
  r = await run(w, observer, "LOOK");
  const former = r.observation?.organizations?.find(o => o.org_id === "org.own");
  expect(former?.members).toEqual([]);
  expect(former).not.toHaveProperty("creator_id");
});

identityCase("entered outsider sees verified holder handle but no holder ID or successor", async () => {
  const { w, observer, outsider, founder } = await scene();
  w.organizations["org.other"].offices = {
    "office.other": { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: outsider.player_id, succession: { successors: [founder.player_id], rule_id: "MEMBER_ORDER", designated_by: founder.player_id, designated_cycle: 0 } },
  };
  const r = await run(w, observer, "LOOK");
  expect(r.ok).toBe(true);
  const office = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
  expect(office).toMatchObject({ display_name: "Treasurer", status: "OCCUPIED", holder_handle: "outsider" });
  expect(office).not.toHaveProperty("holder_player_id");
  expect(office).not.toHaveProperty("successor_handle");
  expect(r.observation?.office_lines?.join(" ")).toContain("Treasurer — outsider");
  expect(r.observation?.play_text).toContain("Treasurer — outsider");
  expect(JSON.stringify({ office, lines: r.observation?.office_lines, text: r.observation?.play_text })).not.toMatch(/player\.(?:outsider|founder)|designated successor|successor — founder/);
});

identityCase("public LOOK office projections reject raw and compatibility-spoofed private labels", async () => {
  const { w, observer, outsider, founder } = await scene();
  w.organizations["org.other"].offices = {
    "office.other": { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: outsider.player_id, succession: { successors: [founder.player_id], rule_id: "MEMBER_ORDER", designated_by: founder.player_id, designated_cycle: 0 } },
  };
  const forbidden = [
    outsider.player_id, "PLAYER.outsider", "ｐｌａｙｅｒ．holder", "player . holder", "player_ . holder",
    "entity.ledger", "ctrl.session", "ｅｎｔｉｔｙ．ledger", "ｃｔｒｌ．session",
    "abcdef123456", "ＡＢＣＤＥＦ１２３４５６", "operator-test", "OPERATOR_test", "ｏｐｅｒａｔｏｒ－test",
    "op.test", "ｏｐ．test", "smoke-test", "ＳＭＯＫＥ＿test",
    "room.hub", "ROOM.HUB", "ｒｏｏｍ．hub", "room . hub", "Hub", "Ｈｕｂ", "East", "east",
    "bad\nINJECTED", "bad\u2028INJECTED", "bad\u001b[31mINJECTED", "bad\u202eINJECTED", "bad\u200bINJECTED",
  ];
  for (const handle of forbidden) {
    w.players[outsider.player_id].handle = handle;
    w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const r = await run(w, observer, "LOOK");
    expect(r.ok, handle).toBe(true);
    const office = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
    expect(office, handle).toMatchObject({ display_name: "Treasurer", status: "OCCUPIED" });
    expect(office, handle).not.toHaveProperty("holder_player_id");
    expect(office, handle).not.toHaveProperty("holder_handle");
    expect(office, handle).not.toHaveProperty("successor_handle");
    expect(r.observation?.office_lines, handle).toContain("Other Compact: Offices: Treasurer — occupied");
    expect(r.observation?.play_text, handle).toContain("Other Compact: Offices: Treasurer — occupied");
    // Room titles and exits legitimately occur earlier in PLAY; inspect the
    // office section rather than forbidding a room name across the whole view.
    expect(JSON.stringify({ office, lines: r.observation?.office_lines, text: r.observation?.play_text?.split("\nOFFICES\n").at(-1) }), handle).not.toContain(handle);
  }
  for (const handle of ["Vesper", "Ｖｅｓｐｅｒ"]) {
    w.players[outsider.player_id].handle = handle;
    w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const valid = await run(w, observer, "LOOK");
    expect(valid.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0]?.holder_handle).toBe(handle);
    expect(valid.observation?.office_lines).toContain(`Other Compact: Offices: Treasurer — ${handle}`);
    expect(valid.observation?.play_text).toContain(`Other Compact: Offices: Treasurer — ${handle}`);
  }
});

identityCase("outsider LOOK with fullwidth room title and ASCII holder uses generic occupied", async () => {
  // An independently seeded world preserves the exact reported room.main
  // shape; ENTER/MOVE fixture preparation can canonicalize a room reference.
  const w = {
    world_id: "office.compat", world_name: "Office compat", cycle: 0, sequence: 0, entry_room_id: "room.main",
    rooms: { "room.main": { room_id: "room.main", name: "Ｈｕｂ", description: "Hub", exits: [], entities: [] } },
    players: {
      "player.viewer": { entered: true, room_id: "room.main", handle: "Viewer", budgets: cloneBudgets(DEFAULT_BUDGETS) },
      "player.holder": { entered: true, room_id: "room.main", handle: "Hub", budgets: cloneBudgets(DEFAULT_BUDGETS) },
    },
    trades: {}, messages: [], seen_idempotency: {}, unsettled: [],
    organizations: { "org.other": { org_id: "org.other", name: "Other", charter: "co-op", status: "ACTIVE", creator_id: "player.holder", created_cycle: 0,
      members: [{ agent_id: "player.holder", role: "founder" }],
      offices: { "office.other": { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: "player.holder" } },
    } },
  } as unknown as WorldRuntime;
  const r = await run(w, principal("viewer"), "LOOK");
  expect(r.ok).toBe(true);
  const office = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
  expect(office).not.toHaveProperty("holder_handle");
  expect(r.observation?.office_lines).toContain("Other: Offices: Treasurer — occupied");
  expect(r.observation?.play_text?.split("\nOFFICES\n").at(-1)).toContain("Treasurer — occupied");
});

identityCase("public office labels cannot impersonate either spelling of any room reference", async () => {
  const { w, observer, outsider } = await scene();
  w.organizations["org.other"].offices = {
    "office.other": { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: outsider.player_id },
  };
  const cases = [
    { name: "Ｈｕｂ", id: "room.main", handle: "Hub" }, // exact reported title/reference mismatch
    { name: "Hub", id: "room.main", handle: "Ｈｕｂ" },
    { name: "Hｕb", id: "room.main", handle: "Ｈub" },
    { name: "East", id: "room.Ｍａｉｎ", handle: "main" },
    { name: "East", id: "room.Ｍａｉｎ", handle: "Ｍａｉｎ" },
    { name: "East", id: "room.Ｍａｉｎ", handle: "room . main" },
    { name: "East", id: "room.Ｍａｉｎ", handle: "ＲＯＯＭ．ＭＡＩＮ" },
    { name: "East", id: "room.main", handle: "east" }, // another room, not only the current room
    { name: "Civic   Exchange", id: "room.main", handle: "Civic Exchange" },
    { name: "Civic-Exchange", id: "room.main", handle: "Civic_Exchange" },
    { name: "East", id: "room.main", handle: "Far Landing", otherName: "Ｆａｒ　Landing" },
  ];
  for (const { name, id, handle, otherName } of cases) {
    w.rooms["room.hub"].name = name;
    w.rooms["room.east"].name = otherName || "East";
    w.rooms["room.east"].room_id = id;
    w.players[outsider.player_id].handle = handle;
    w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const r = await run(w, observer, "LOOK");
    expect(r.ok, handle).toBe(true);
    const office = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
    expect(office, `${name}/${id}: ${handle}`).not.toHaveProperty("holder_handle");
    expect(r.observation?.office_lines, handle).toContain("Other Compact: Offices: Treasurer — occupied");
    expect(r.observation?.play_text?.split("\nOFFICES\n").at(-1), handle).toContain("Treasurer — occupied");
  }
  w.rooms["room.hub"].name = "Ｈｕｂ";
  for (const handle of ["Vesper", "Ｖｅｓｐｅｒ"]) {
    w.players[outsider.player_id].handle = handle;
    w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const r = await run(w, observer, "LOOK");
    expect(r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0]?.holder_handle).toBe(handle);
    expect(r.observation?.office_lines).toContain(`Other Compact: Offices: Treasurer — ${handle}`);
  }
});

identityCase("public office handle requires entered, safe source name; vacant seats remain generic", async () => {
  const { w, observer, outsider } = await scene();
  const office: OfficeRecord = { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: outsider.player_id };
  w.organizations["org.other"].offices = { "office.other": office };
  for (const handle of [undefined, outsider.player_id, "abcdef123456", "operator-test", "room.hub", "Hub", "bad\nINJECTED", "smoke-test"]) {
    w.players[outsider.player_id].handle = handle;
    w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const r = await run(w, observer, "LOOK");
    const visible = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
    expect(visible).not.toHaveProperty("holder_player_id");
    expect(visible).not.toHaveProperty("holder_handle");
    expect(r.observation?.office_lines?.join(" ")).toContain("Treasurer — occupied");
    expect(r.observation?.play_text).toContain("Treasurer — occupied");
    expect(JSON.stringify({ visible, lines: r.observation?.office_lines, text: r.observation?.play_text })).not.toMatch(/INJECTED|player\.outsider|abcdef123456|operator-test|room\.hub|smoke-test/);
  }
  w.players[outsider.player_id].handle = "Vesper";
  w.players[outsider.player_id].entered = false;
  w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, observer, "LOOK")).observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0]).not.toHaveProperty("holder_handle");
  w.players[outsider.player_id].entered = true;
  office.status = "VACANT";
  w.players[observer.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  expect((await run(w, observer, "LOOK")).observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0]).not.toHaveProperty("holder_handle");
});

identityCase("office outside member view cannot derive a holder or successor from IDs", async () => {
  const { w, observer, outsider, founder } = await scene();
  w.organizations["org.other"].offices = {
    "office.other": { office_id: "office.other", institution_id: "org.other", display_name: "Treasurer", status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [], holder_player_id: outsider.player_id, succession: { successors: [founder.player_id], rule_id: "MEMBER_ORDER", designated_by: founder.player_id, designated_cycle: 0 } },
  };
  delete w.players[outsider.player_id].handle;
  const r = await run(w, observer, "LOOK");
  expect(r.ok).toBe(true);
  const office = r.observation?.organizations?.find(o => o.org_id === "org.other")?.offices?.[0];
  expect(office).toMatchObject({ display_name: "Treasurer", status: "OCCUPIED" });
  expect(office).not.toHaveProperty("holder_player_id");
  expect(office).not.toHaveProperty("holder_handle");
  expect(JSON.stringify({ office, lines: r.observation?.office_lines, text: r.observation?.play_text })).not.toMatch(/player\.(?:outsider|founder)|successor| — outsider/);
});

identityCase("LOOK and HELP suggestions admit only near or own-roster targets", async () => {
  const { w, observer, near, far, outsider, founder } = await scene();
  w.organizations["org.own"].offices = {
    "office.own": { office_id: "office.own", institution_id: "org.own", display_name: "Notice", status: "VACANT", authority_profile: "PUBLISH_NOTICE", created_cycle: 0, history: [] },
  };
  for (const command of ["LOOK", "HELP"]) {
    const r = command === "HELP" ? await run(w, observer, "LOOK", { line: "help" }, true) : await run(w, observer, command);
    expect(r.ok).toBe(true);
    const suggested = r.observation?.affordances ?? [];
    const targetRows = suggested.filter(a => a.action === "ORG_INVITE" || a.action === "ORG_OFFICE_ASSIGN" || a.action === "ORG_SUCCESSION_DESIGNATE" || a.action === "ORG_SUCCESSION_CONSENT" || (a.action === "BUILD" && a.operation === "SHARE"));
    expect(JSON.stringify({ targetRows, text: command === "HELP" ? r.observation?.consequence : "" })).not.toMatch(/player\.(?:outsider|founder)|(?:Invite|Share|Assign|Designate|Consent to) (?:outsider|founder)/i);
    expect(targetRows.some(a => a.action === "ORG_INVITE" && a.target_label === "near")).toBe(true);
    expect(targetRows.some(a => a.action === "ORG_OFFICE_ASSIGN" && a.target_label === "far")).toBe(true);
    expect(targetRows.some(a => a.action === "BUILD" && a.operation === "SHARE" && a.player_id === far.player_id)).toBe(true);
    expect(targetRows.some(a => a.action === "BUILD" && a.operation === "SHARE" && a.player_id === near.player_id)).toBe(true);
  }
});

identityCase("missing candidate room never qualifies a distant nonmember, while own roster remains eligible", async () => {
  const { w, observer, near, far, outsider } = await scene();
  w.players[outsider.player_id].room_id = "";
  w.players[near.player_id].room_id = "";
  const r = await run(w, observer, "LOOK");
  const invites = r.observation?.affordances?.filter(a => a.action === "ORG_INVITE") ?? [];
  expect(invites.some(a => a.target_label === "outsider" || a.target_label === "near")).toBe(false);
  const shares = r.observation?.affordances?.filter(a => a.action === "BUILD" && a.operation === "SHARE") ?? [];
  expect(shares.some(a => a.player_id === far.player_id)).toBe(true);
  expect(shares.some(a => a.player_id === outsider.player_id)).toBe(false);
});

identityCase("own office keeps canonical ID in member view but never narrates an ID-derived holder or successor", async () => {
  const { w, observer, far, founder } = await scene();
  w.organizations["org.own"].offices = {
    "office.own": { office_id: "office.own", institution_id: "org.own", display_name: "Notice", status: "OCCUPIED", authority_profile: "PUBLISH_NOTICE", created_cycle: 0, history: [], holder_player_id: far.player_id, succession: { successors: [founder.player_id], rule_id: "MEMBER_ORDER", designated_by: observer.player_id, designated_cycle: 0 } },
  };
  delete w.players[far.player_id].handle;
  delete w.players[founder.player_id].handle;
  const r = await run(w, observer, "LOOK");
  const office = r.observation?.organizations?.find(o => o.org_id === "org.own")?.offices?.[0];
  expect(office?.holder_player_id).toBe(far.player_id);
  expect(office?.holder_handle).toBeUndefined();
  expect(r.observation?.office_lines?.join(" ")).toContain("Notice — occupied");
  expect(JSON.stringify({ lines: r.observation?.office_lines, text: r.observation?.play_text })).not.toMatch(/player\.(?:far|founder)|designated successor/);
});

identityCase("own office retains authorized holder and published seat; explicit distant MESSAGE remains", async () => {
  const { w, observer, far } = await scene();
  w.organizations["org.own"].offices = {
    "office.own": { office_id: "office.own", institution_id: "org.own", display_name: "Notice", status: "OCCUPIED", authority_profile: "PUBLISH_NOTICE", created_cycle: 0, history: [], holder_player_id: far.player_id },
  };
  const r = await run(w, observer, "LOOK");
  expect(r.observation?.organizations?.find(o => o.org_id === "org.own")?.offices?.[0]).toMatchObject({ holder_player_id: far.player_id, holder_handle: "far", display_name: "Notice" });
  expect(r.observation?.office_lines?.join(" ")).toContain("Notice — far");
  const sent = await run(w, observer, "MESSAGE", { recipient_id: far.player_id, text: "EXPLICIT_793" });
  expect(sent.ok).toBe(true);
  expect(w.messages.at(-1)?.recipient_id).toBe(far.player_id);
  const again = await run(w, observer, "LOOK");
  expect(again.observation?.messages?.some(m => m.text === "EXPLICIT_793")).toBe(false);
  expect((await run(w, far, "LOOK")).observation?.messages?.some(m => m.text === "EXPLICIT_793")).toBe(true);
});
