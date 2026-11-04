/**
 * #733 D2a: test-only operator alias seed. Mounted gateway -> real NoemaWorldDO via
 * the shared fixture. Local fixture evidence only — not workerd or hosted acceptance.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { mintControllerToken } from "../src/auth";
import type { WorldRuntime } from "../src/world-actions";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

const SENTINEL = "PRIVATE_SEED_ALIAS_SENTINEL";
const TARGET = "test.hosted-canonical.733-seed";
const SEED = "/v1/operator/test-world/seed";
const PLAYER = "player.boundary";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External network forbidden in seed fixture"); }));
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});

/** A world at `worldId` in which player.boundary has already entered. */
async function enteredWorld(worldId: string): Promise<WorldRuntime> {
  const seed = harness();
  const token = (await seed.agent()).access_token;
  expect((await seed.command(token, "ENTER_WORLD")).status).toBe(200);
  const world = (await seed.persistedWorld())!;
  world.world_id = worldId;
  return world;
}

async function retainedWorldWith(aliases: Record<string, string>): Promise<WorldRuntime> {
  const w = await enteredWorld(TARGET);
  w.players[PLAYER].command_aliases = aliases;
  return w;
}

const seedHarnessWith = (stored: WorldRuntime) => seedHarness({ stored });

async function seedHarness(opts: { entered?: boolean; worldId?: string; isolated?: string; stored?: WorldRuntime } = {}) {
  const worldId = opts.worldId ?? TARGET;
  const stored = opts.stored ?? (opts.entered === false ? { ...fixtureWorld(), world_id: worldId } : await enteredWorld(worldId));
  const h = harness(fixtureWorld(), worldId, stored, opts.isolated ?? TARGET);
  h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-operator-token";
  const admin = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
  if (admin instanceof Response) throw new Error("fixture admin session failed");
  const agentToken = (await h.agent()).access_token;
  const seed = (body: Record<string, unknown>, o: { agent?: string | null; admin?: string | null } = {}) =>
    h.hit(SEED, body, o.agent === null ? undefined : (o.agent ?? agentToken), undefined,
      o.admin === null ? {} : { "X-Noema-Admin-Token": o.admin ?? admin.access_token });
  return { h, seed, agentToken, adminToken: admin.access_token, stored };
}

const aliasesOf = async (h: Awaited<ReturnType<typeof seedHarness>>["h"], worldId = TARGET) =>
  (await h.persistedWorld(worldId))?.players[PLAYER]?.command_aliases;

describe("POST /v1/operator/test-world/seed", () => {
  it("replaces the calling Agent's aliases in the admitted test world without echoing them or touching state", async () => {
    const { h, seed, stored } = await seedHarness();
    const aliases = { join: `do look; wait ${SENTINEL}`, ii: "look" };

    const res = await seed({ world_id: TARGET, aliases });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: true, world_id: TARGET, alias_count: 2 });
    expect(text).not.toContain(SENTINEL);
    expect(text).not.toContain("join");

    const after = (await h.persistedWorld(TARGET))!;
    expect(after.players[PLAYER].command_aliases).toEqual(aliases);
    expect(after.sequence).toBe(stored.sequence);
    expect(after.players[PLAYER].budgets).toEqual(stored.players[PLAYER].budgets);
    expect(after.unsettled).toEqual(stored.unsettled);
    expect(h.calls.filter((c) => c.name === WORLD)).toEqual([]);
  });

  it("makes a structured JOIN through /v1/command the condition G1 needs: canonical, alias ignored", async () => {
    const { h, seed, agentToken } = await seedHarness();
    expect((await seed({ world_id: TARGET, aliases: { join: `do look; wait ${SENTINEL}` } })).status).toBe(200);

    const res = await h.hit("/v1/command", { request_id: "seed.join", command: "JOIN", arguments: {}, world_id: TARGET },
      agentToken, undefined, { "X-Noema-Admin-Token": (await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN!) as { access_token: string }).access_token });
    const text = await res.text();
    expect(text).not.toContain(SENTINEL);
    expect(JSON.parse(text)).toMatchObject({ ok: true, request_id: "seed.join" });
  });

  type Ctx = Awaited<ReturnType<typeof seedHarness>>;
  const OK = { join: `do look; wait ${SENTINEL}` };
  const retained = { keep: `look ${SENTINEL}` };
  /** Refusals must leave retained aliases untouched and never ask the DO to mutate. */
  const refusals: Array<[string, number, (c: Ctx) => Promise<Response>, { code?: string; doCalled?: boolean; setup?: (c: Ctx) => void }?]> = [
    ["NOEMA_ENV=production", 404, (c) => c.seed({ world_id: TARGET, aliases: OK }), { setup: (c) => { c.h.env.NOEMA_ENV = "production"; } }],
    ["NOEMA_ENV unset", 404, (c) => c.seed({ world_id: TARGET, aliases: OK }), { setup: (c) => { delete (c.h.env as { NOEMA_ENV?: string }).NOEMA_ENV; } }],
    ["missing admin token", 401, (c) => c.seed({ world_id: TARGET, aliases: OK }, { admin: null })],
    ["missing agent token", 401, (c) => c.seed({ world_id: TARGET, aliases: OK }, { agent: null })],
    ["human token", 403, async (c) => c.seed({ world_id: TARGET, aliases: OK },
      { agent: (await mintControllerToken(c.h.env, { handle: "Human", controllerType: "human", playerId: "player.human" })).access_token })],
    ["non-test world", 403, (c) => c.seed({ world_id: "world.somewhere-else", aliases: OK })],
    ["perihelion world", 403, (c) => c.seed({ world_id: "world.perihelion-reach-3", aliases: OK })],
    ["admitted world other than ISOLATED_WATCH_WORLD_ID", 403, (c) => c.seed({ world_id: "test.hosted-canonical.733-other", aliases: OK })],
    ["DEFAULT_WORLD_ID", 403, (c) => c.seed({ world_id: WORLD, aliases: OK }), { setup: (c) => { c.h.env.ISOLATED_WATCH_WORLD_ID = WORLD; } }],
    ["player not entered", 404, (c) => c.seed({ world_id: TARGET, aliases: OK }), { code: "PLAYER_NOT_FOUND", doCalled: true }],
    ["0 entries", 400, (c) => c.seed({ world_id: TARGET, aliases: {} })],
    ["9 entries", 400, (c) => c.seed({ world_id: TARGET, aliases: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`a${i}`, "look"])) })],
    ["uppercase name", 400, (c) => c.seed({ world_id: TARGET, aliases: { Join: "look" } })],
    ["name with space", 400, (c) => c.seed({ world_id: TARGET, aliases: { "a b": "look" } })],
    ["17-char name", 400, (c) => c.seed({ world_id: TARGET, aliases: { ["a".repeat(17)]: "look" } })],
    ["empty value", 400, (c) => c.seed({ world_id: TARGET, aliases: { join: "" } })],
    ["201-char value", 400, (c) => c.seed({ world_id: TARGET, aliases: { join: "x".repeat(201) } })],
    ["control char in value", 400, (c) => c.seed({ world_id: TARGET, aliases: { join: "look\u0007" } })],
    ["newline in value", 400, (c) => c.seed({ world_id: TARGET, aliases: { join: "look\nwait" } })],
    ["non-string value", 400, (c) => c.seed({ world_id: TARGET, aliases: { join: 5 as unknown as string } })],
    ["aliases not an object", 400, (c) => c.seed({ world_id: TARGET, aliases: ["look"] as unknown as Record<string, string> })],
  ];
  it.each(refusals)("refuses %s without mutating", async (name, status, act, opt = {}) => {
    const c = name === "player not entered" ? await seedHarness({ entered: false })
      : await seedHarnessWith(await retainedWorldWith(retained));
    opt.setup?.(c);
    const seedCalls = () => c.h.calls.filter((x) => x.path.includes("seed")).length;
    const before = { calls: seedCalls(), writes: c.h.writes.length };
    const res = await act(c);
    expect(res.status).toBe(status);
    const text = await res.text();
    expect(text).not.toContain(SENTINEL);
    if (opt.code) expect(JSON.parse(text)).toMatchObject({ error: { code: opt.code } });
    if (!opt.doCalled) expect(seedCalls()).toBe(before.calls);
    expect(c.h.writes.length).toBe(before.writes);
    // The fixture creates target DO storage lazily; if it was never touched nothing could be mutated.
    if (!(await c.h.persistedWorld(TARGET))) return;
    const aliases = await aliasesOf(c.h);
    if (name === "player not entered") expect(aliases).toBeUndefined();
    else expect(aliases).toEqual(retained);
  });

  it("refuses the DO-internal seed path directly outside test or for non-admitted worlds", async () => {
    const cases: Array<[string, (c: Ctx) => void, string]> = [
      ["production env", (c) => { c.h.env.NOEMA_ENV = "production"; }, TARGET],
      ["unset env", (c) => { delete (c.h.env as { NOEMA_ENV?: string }).NOEMA_ENV; }, TARGET],
      ["non-admitted world", () => {}, "world-01"],
      ["admitted but not ISOLATED_WATCH_WORLD_ID", () => {}, "test.hosted-canonical.733-other"],
    ];
    for (const [label, setup, world] of cases) {
      const c = await seedHarnessWith(await retainedWorldWith(retained));
      setup(c);
      const before = c.h.writes.length;
      const res = await c.h.env.WORLD_DO.get(c.h.env.WORLD_DO.idFromName(TARGET)).fetch("https://do/admin-seed-aliases", {
        method: "POST", headers: { "content-type": "application/json", "x-noema-world-id": world },
        body: JSON.stringify({ world_id: world, player_id: PLAYER, aliases: OK }),
      });
      expect([403, 404], label).toContain(res.status);
      expect(await res.text(), label).not.toContain(SENTINEL);
      expect(c.h.writes.length, label).toBe(before);
      expect(await aliasesOf(c.h), label).toEqual(retained);
    }
  });
});
