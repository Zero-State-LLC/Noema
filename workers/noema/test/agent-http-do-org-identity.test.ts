import { afterEach, beforeEach, expect, test as mountedIdentityCase, vi } from "vitest";
import { mintControllerToken } from "../src/auth";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden in local DO fixture"); })));
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

mountedIdentityCase("mounted structured LOOK preserves own roster but not outsider identities after fixture restart", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].name = "Ａｒｒｉｖａｌ"; // Public room title differs from its room ID.
  const ids = {
    observer: "player.org-observer", near: "player.org-near", far: "player.org-far",
    holder: "player.org-holder", founder: "player.org-founder",
  };
  world.organizations = {
    "org.own": { org_id: "org.own", name: "Own Compact", charter: "coordination", status: "ACTIVE",
      creator_id: ids.observer, created_cycle: 0,
      members: [{ agent_id: ids.observer, role: "founder" }, { agent_id: ids.far, role: "member" }], offices: {} },
    "org.other": { org_id: "org.other", name: "Other Compact", charter: "coordination", status: "ACTIVE",
      creator_id: ids.founder, created_cycle: 0,
      members: [{ agent_id: ids.founder, role: "founder" }, { agent_id: ids.holder, role: "member" }],
      offices: {
        "office.safe": { office_id: "office.safe", institution_id: "org.other", display_name: "Treasurer",
          status: "OCCUPIED", authority_profile: "OPERATE_RESOURCE_ACCOUNT", created_cycle: 0, history: [],
          holder_player_id: ids.holder, succession: { successors: [ids.founder], rule_id: "MEMBER_ORDER",
            designated_by: ids.founder, designated_cycle: 0 } },
        "office.spoof": { office_id: "office.spoof", institution_id: "org.other", display_name: "Archivist",
          status: "OCCUPIED", authority_profile: "ACCESS_RESTRICTED_ARCHIVE", created_cycle: 0, history: [],
          holder_player_id: ids.founder },
      } },
  };
  const h = harness(world);
  const principals = await Promise.all([
    ["observer", "Observer"], ["near", "Near"], ["far", "Far"], ["holder", "Vesper"],
    ["founder", "Arrival"], // ASCII minted handle impersonates fullwidth room title.
  ].map(async ([key, handle]) => {
    const token = await mintControllerToken(h.env, { handle, controllerType: "agent", playerId: ids[key as keyof typeof ids] });
    return [key, token] as const;
  }));
  const tokens = Object.fromEntries(principals) as Record<keyof typeof ids, Awaited<ReturnType<typeof mintControllerToken>>>;
  for (const [, token] of principals) {
    const entered = await h.command(token.access_token, "ENTER_WORLD");
    expect(entered.status).toBe(200);
    expect(await entered.json()).toMatchObject({ ok: true });
  }
  for (const key of ["far", "holder", "founder"] as const) {
    const moved = await h.command(tokens[key].access_token, "MOVE", { direction: "east" });
    expect(moved.status).toBe(200);
    expect(await moved.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });
  }

  const read = async () => {
    const response = await h.command(tokens.observer.access_token, "LOOK");
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean; observation?: {
      organizations?: Array<{ org_id: string; name: string; members: Array<{ agent_id: string; role: string }>;
        creator_id?: string; my_role: string | null; offices?: Array<Record<string, unknown>> }>;
      office_lines?: string[]; play_text?: string;
      affordances?: Array<{ action: string; target_id?: string; player_id?: string; target_label?: string }>;
      players_here?: Array<{ player_id: string }>;
    } };
    expect(body.ok).toBe(true);
    const obs = body.observation!;
    const own = obs.organizations?.find(o => o.org_id === "org.own");
    const other = obs.organizations?.find(o => o.org_id === "org.other");
    expect(own?.members).toEqual([{ agent_id: ids.observer, role: "founder" }, { agent_id: ids.far, role: "member" }]);
    expect(own?.creator_id).toBe(ids.observer);
    expect(other).toMatchObject({ name: "Other Compact", members: [], my_role: null });
    expect(other).not.toHaveProperty("creator_id");
    expect(other?.offices?.find(o => o.office_id === "office.safe")).toMatchObject({
      status: "OCCUPIED", display_name: "Treasurer", holder_handle: "Vesper",
    });
    for (const office of other?.offices ?? []) {
      expect(office).not.toHaveProperty("holder_player_id");
      expect(office).not.toHaveProperty("successor_handle");
    }
    expect(other?.offices?.find(o => o.office_id === "office.spoof")).not.toHaveProperty("holder_handle");
    expect(obs.office_lines).toContain("Other Compact: Offices: Archivist — occupied; Treasurer — Vesper");
    expect(obs.play_text).toContain("Treasurer — Vesper");
    expect(obs.play_text).toContain("Archivist — occupied");
    expect(obs.players_here?.map(p => p.player_id)).toContain(ids.near);
    expect(obs.players_here?.map(p => p.player_id)).not.toContain(ids.holder);
    // Inspect the publication projections, not the authorized own-roster IDs or room title elsewhere in PLAY.
    const published = JSON.stringify({ other, office_lines: obs.office_lines, office_text: obs.play_text?.split("\nOFFICES\n").at(-1) });
    for (const forbidden of [ids.holder, ids.founder, "designated successor", "Arrival"]) expect(published).not.toContain(forbidden);
    const suggestions = obs.affordances?.filter(a => ["ORG_INVITE", "ORG_OFFICE_ASSIGN", "ORG_SUCCESSION_DESIGNATE", "ORG_SUCCESSION_CONSENT"].includes(a.action) || a.action === "BUILD") ?? [];
    expect(suggestions.some(a => a.action === "ORG_INVITE" && a.target_label === "Near")).toBe(true);
    for (const id of [ids.holder, ids.founder]) expect(JSON.stringify(suggestions)).not.toContain(id);
    return body;
  };
  await read();
  const retained = (await h.persistedWorld())!;
  expect(retained.organizations["org.other"].members.map(m => m.agent_id)).toEqual([ids.founder, ids.holder]);
  expect(retained.organizations["org.other"].creator_id).toBe(ids.founder);
  expect(retained.organizations["org.other"].offices?.["office.safe"].holder_player_id).toBe(ids.holder);
  expect(retained.organizations["org.other"].offices?.["office.safe"].succession?.successors).toEqual([ids.founder]);
  expect(retained.players[ids.far].room_id).toBe("room.b");
  h.restart(); // Fixture object reconstruction over retained fake storage; not hosted DO eviction or SQL settlement.
  await read();
  expect((await h.persistedWorld())?.organizations).toEqual(retained.organizations);
  expect(h.calls.filter(c => c.path === "/command").every(c => c.name === WORLD)).toBe(true);
});
