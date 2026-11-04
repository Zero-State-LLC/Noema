/**
 * #733 acceptance runner (scripts/acceptance-733.mjs) phases g1/g2/r0 driven against the
 * REAL Worker + NoemaWorldDO through the mounted fixture. Only platform primitives are
 * faked: DO storage, the Supabase PostgREST/RPC surface (in-memory, built from what the
 * DO actually committed), and the DO eviction. Local fixture evidence only: it proves the
 * runner's guessed response shapes match real Worker output, not workerd or hosted behaviour.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, redactDeep } from "../scripts/acceptance-733.mjs";
import worker from "../src/index";
import { ATTEST_WORLD_ID } from "../src/mini-chamber";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

const RUN = "20261104t120000z";
const WORKER = `noema-733-acc-${RUN}`;
const BASE = `https://${WORKER}.zer0state-noema.workers.dev`;
const DEFAULT_WORLD = `test.hosted-canonical.733-default-${RUN}`;
const ISO_WORLD = `test.hosted-canonical.733-acc-${RUN}`;
const SB_URL = "https://acceptanceprojectref.supabase.co";
const SB_KEY = "sb-service-role-FIXTURE-ONLY";
const SENT = `PRIVATE_733_ACC_SENTINEL_${RUN}`;
const rand = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

type Row = Record<string, unknown>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** In-memory Supabase: records what the DO's RPC committed; serves PostgREST `eq.` GETs. */
function fakeSupabase() {
  const heads = new Map<string, Row>();
  const settlements: Row[] = [];
  const events: Row[] = [];
  const log: Array<{ method: string; path: string }> = [];
  const handler = async (url: string, init: RequestInit = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    log.push({ method, path: u.pathname });
    const table = u.pathname.replace("/rest/v1/", "");
    if (method === "GET") {
      const tables: Record<string, Row[]> = { noema_world_heads: [...heads.values()], noema_settled_events: events, noema_canonical_settlements: settlements };
      if (!tables[table]) return json({ message: "unknown table" }, 404);
      let rows = tables[table];
      for (const [k, v] of u.searchParams) {
        if (k === "select") continue;
        if (!v.startsWith("eq.")) return json({ message: `unsupported PostgREST filter ${k}=${v}` }, 400);
        rows = rows.filter((r) => String(r[k]) === v.slice(3));
      }
      return json(rows);
    }
    if (method === "POST" && table === "rpc/noema_commit_canonical_settlement") {
      const b = JSON.parse(String(init.body));
      const head = heads.get(b.p_world_id);
      if (!head && !(b.p_allow_bootstrap === true && b.p_expected_revision === 0)) return json({ code: "P0001", message: "HEAD_MISSING" }, 400);
      if (head && head.revision !== b.p_expected_revision) return json({ code: "P0001", message: "REVISION_CONFLICT" }, 400);
      const dup = settlements.find((s) => s.settlement_id === b.p_settlement_id);
      if (dup) return json({ ok: true, idempotent: true, revision: dup.revision, sequence: head?.sequence });
      const revision = Number(head?.revision ?? 0) + 1;
      const last = b.p_events[b.p_events.length - 1];
      heads.set(b.p_world_id, { world_id: b.p_world_id, revision, sequence: last.sequence, cycle: last.cycle, status: b.p_status,
        settlement_health: b.p_settlement_health, state_json: b.p_state_json, state_digest: b.p_state_digest,
        ledger_head_event_id: last.event_id, ledger_head_digest: last.digest, writer_generation: b.p_writer_generation, genesis_id: b.p_genesis_id });
      settlements.push({ settlement_id: b.p_settlement_id, world_id: b.p_world_id, revision, event_count: b.p_events.length });
      for (const e of b.p_events) events.push({ world_id: b.p_world_id, ...e });
      return json({ ok: true, revision, sequence: last.sequence });
    }
    return json({ message: `unhandled ${method} ${u.pathname}` }, 404);
  };
  return { handler, heads, settlements, events, log };
}

type Rig = Awaited<ReturnType<typeof rig>>;

async function rig(opts: { isolated?: string; afterRunnerRequest?: (h: ReturnType<typeof harness>, requestId: string) => Promise<void> } = {}) {
  const isolated = opts.isolated ?? ISO_WORLD;
  const h = harness(fixtureWorld(), isolated, undefined, isolated);
  Object.assign(h.env, {
    NOEMA_ENV: "test", DEFAULT_WORLD_ID: DEFAULT_WORLD, ISOLATED_WATCH_WORLD_ID: isolated,
    CF_VERSION: { id: "22222222-2222-4222-8222-222222222222", timestamp: "2026-11-04T12:00:00Z" }, // platform binding
    ADMIN_OPERATOR_TOKEN: rand(), TOKEN_SIGNING_SECRET: rand(), SUPABASE_URL: SB_URL, SUPABASE_SERVICE_ROLE_KEY: SB_KEY,
  });
  const sb = fakeSupabase();
  const outbound: string[] = [];
  // The DO talks to Supabase through global fetch; nothing else may leave the process.
  vi.stubGlobal("fetch", async (input: string | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (new URL(url).host === new URL(SB_URL).host) return sb.handler(url, init);
    throw new Error(`external network forbidden: ${url}`);
  });
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "acc-fx-"));
  const envFile = path.join(home, "acceptance.env");
  fs.writeFileSync(envFile, `SUPABASE_URL=${SB_URL}\nSUPABASE_SERVICE_ROLE_KEY=${SB_KEY}\n`);
  fs.chmodSync(envFile, 0o600);
  const runsDir = path.join(home, "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const state = {
    schema: "noema-733-run-state/1", run_id: RUN, worker: WORKER, base: BASE,
    default_world: DEFAULT_WORLD, isolated_world: isolated, sentinel: SENT,
    admin_operator_token: (h.env as unknown as { ADMIN_OPERATOR_TOKEN: string }).ADMIN_OPERATOR_TOKEN,
    source_commit: "fixture", no_production_routes: true, production: { before: "x", after: null },
    created_at: "2026-11-04T12:00:00.000Z", version: "fixture-version", sections: {},
  };
  fs.writeFileSync(path.join(runsDir, `${RUN}.json`), JSON.stringify(state), { mode: 0o600 });
  const requests: Array<{ method: string; path: string; status: number }> = [];
  const ctx = {
    env: { NOEMA_ACCEPTANCE_ENV: envFile, NOEMA_ACCEPTANCE_RUNS: runsDir, HOME: home } as Record<string, string>,
    fetch: async (url: string, init?: RequestInit) => {
      const u = new URL(String(url));
      if (u.host === new URL(SB_URL).host) return sb.handler(String(url), init);
      if (u.origin !== BASE) throw new Error(`runner reached a non-guarded host: ${u.origin}`);
      outbound.push(`${init?.method || "GET"} ${u.pathname}`);
      const res = await worker.fetch(new Request(`https://noema.invalid${u.pathname}${u.search}`, init as RequestInit), h.env);
      requests.push({ method: init?.method || "GET", path: u.pathname, status: res.status });
      // Platform primitive: `evict` aborts the DO; the platform then constructs a fresh instance.
      if (u.pathname === "/v1/operator/test-world/command") await opts.afterRunnerRequest?.(h, JSON.parse(String(init?.body)).request_id);
      if (u.pathname === "/v1/operator/test-world/instance" && JSON.parse(String(init?.body)).action === "evict") h.restart();
      return res;
    },
    /** Fake only the platform socket pair + 101 response; gateway and protocol handlers stay real. */
    wsFactory: (url: string) => {
      const u = new URL(url);
      if (u.protocol !== "wss:" || u.origin.replace("wss:", "https:") !== BASE) throw new Error(`ws to non-guarded host: ${url}`);
      const handlers: Record<string, Array<(e: unknown) => void>> = {};
      const emit = (type: string, e: unknown) => (handlers[type] || []).forEach((fn) => fn(e));
      let serverListener: ((evt: { data: string }) => void) | undefined;
      const server = {
        accept() {}, addEventListener(type: string, fn: (evt: { data: string }) => void) { if (type === "message") serverListener = fn; },
        send(message: string) { queueMicrotask(() => emit("message", { data: message })); },
      };
      vi.stubGlobal("WebSocketPair", class { 0 = {}; 1 = server; });
      const NativeResponse = Response;
      vi.stubGlobal("Response", class extends NativeResponse {
        constructor(body: BodyInit | null, init?: ResponseInit & { webSocket?: unknown }) {
          super(body, { ...init, status: init?.status === 101 ? 200 : init?.status });
          if (init?.status === 101) Object.defineProperty(this, "status", { value: 101 });
        }
      });
      outbound.push(`WS ${u.pathname}`);
      void worker.fetch(new Request(`https://noema.invalid${u.pathname}`, { headers: { Upgrade: "websocket" } }), h.env).then(
        (res) => emit(res.status === 101 ? "open" : "error", {}), () => emit("error", {}));
      return {
        addEventListener: (type: string, fn: (e: unknown) => void) => { (handlers[type] ||= []).push(fn); },
        send: (data: string) => serverListener?.({ data }), close() {},
      };
    },
    exec: () => { throw new Error("runner must not spawn processes in g1/g2/r0"); },
    now: () => new Date("2026-11-04T12:00:00Z"), sleep: async () => {},
    out: () => {}, err: (s: string) => errs.push(s), randomHex: rand,
  };
  const errs: string[] = [];
  const readSection = (name: string) => JSON.parse(fs.readFileSync(path.join(runsDir, `${RUN}.json`), "utf8")).sections[name];
  return { h, sb, ctx, errs, outbound, requests, readSection, runsDir };
}

const falseChecks = (section: { checks: Record<string, boolean> }) => Object.entries(section.checks).filter(([, v]) => v !== true).map(([k]) => k);

afterEach(() => vi.unstubAllGlobals());

describe("acceptance-733 runner against the mounted Worker + DO", () => {
  it("g1: every check is true (aliases seeded, structured JOIN/MOVE canonical, text carriers refused)", async () => {
    const r = await rig();
    const code = await main(["g1", "--run", RUN], r.ctx);
    const g1 = r.readSection("g1_isolation");
    expect({ code, errs: r.errs, falseChecks: falseChecks(g1), checks: g1.checks }).toMatchObject({ code: 0, errs: [], falseChecks: [] });
    expect(g1.passed).toBe(true);
    expect(Object.keys(g1.checks)).toEqual(expect.arrayContaining(["text_line_stripped_canonical", "command_endpoint_structured_join_canonical",
      "command_endpoint_text_refused", "refusals_left_head_unchanged", "agent_tempo_refused"]));
  });

  it("g2: real verbs only on the stock isolated seed (ENTER, HARVEST, REPAIR, LEAVE_WORLD, evict, observer sees the trace)", async () => {
    // D5: the isolated mini seed carries a harvestable source (1 materials) and a repairable relay. REPAIR costs
    // energy 3 / compute 2 / 1 cargo (COSTS.REPAIR) and HARVEST costs energy 2 / compute 1 (COSTS.HARVEST), so one
    // harvest funds exactly one repair. No DO storage is mutated: only public verbs move state.
    const r = await rig();
    const code = await main(["g2", "--run", RUN], r.ctx);
    const g2 = r.readSection("g2_s3_readback");
    expect({ code, errs: r.errs, falseChecks: falseChecks(g2), checks: g2.checks }).toMatchObject({ code: 0, errs: [], falseChecks: [] });
    expect(g2.seed_gap).toBeUndefined();
    expect(g2.repair_rejection).toBeUndefined();
    expect(Object.keys(g2.checks)).toEqual(expect.arrayContaining(["harvest_accepted", "harvest_committed_in_sql", "repair_accepted"]));
    // Independent of the runner's regexes: what the real DO committed into the fake SQL tables, in order.
    const types = r.sb.events.map((e) => e.event_type);
    expect(types).toContain("AGENT_LEFT_WORLD");
    expect(types.join(" ")).not.toMatch(/LEAVE|DEPART/i); // the guessed leave event name does not exist
    const harvest = r.sb.events.find((e) => e.event_type === "ENTITY_UPDATE" && (e.payload as Row).operation === "HARVEST");
    const repair = r.sb.events.find((e) => e.event_type === "ENTITY_UPDATE" && (e.payload as Row).operation === "REPAIR");
    expect(harvest?.payload).toMatchObject({ operation: "HARVEST", entity_id: "entity.acceptance-source", to: 0 });
    expect(repair?.payload).toMatchObject({ operation: "REPAIR", entity_id: "entity.acceptance-relay" });
    expect(Number(harvest?.sequence)).toBeLessThan(Number(repair?.sequence));
    expect(Number(repair?.sequence)).toBeLessThan(Number(r.sb.events.find((e) => e.event_type === "AGENT_LEFT_WORLD")?.sequence));
    expect(r.sb.settlements.length).toBeGreaterThanOrEqual(4);
    const relay = (await r.h.persistedWorld(ISO_WORLD))?.rooms["room.anchor"].entities.find((e) => e.entity_id === "entity.acceptance-relay");
    expect(relay).toMatchObject({ last_repair_cycle: expect.any(Number), last_repair_handle: expect.any(String) });
  });

  it("g2 on the attest seed (no harvest source) reports the seed gap instead of faking cargo", async () => {
    const r = await rig({ isolated: ATTEST_WORLD_ID });
    expect(await main(["g2", "--run", RUN], r.ctx)).toBe(1);
    const g2 = r.readSection("g2_s3_readback");
    expect(g2.checks).toEqual({ repairable_entity_found: true, harvest_source_found: false });
    expect(g2.seed_gap).toMatch(/no harvestable source/);
  });

  it("r0: every check is true (observation stack fields + MOVE orientation)", async () => {
    const r = await rig();
    const code = await main(["r0", "--run", RUN], r.ctx);
    const r0 = r.readSection("r0_presentation");
    expect({ code, errs: r.errs, falseChecks: falseChecks(r0), checks: r0.checks }).toMatchObject({ code: 0, errs: [], falseChecks: [] });
  });

  it("g1 exercises WS ACT over the injected socket: structured JOIN canonical, text carrier refused", async () => {
    const r = await rig();
    expect(await main(["g1", "--run", RUN], r.ctx)).toBe(0);
    const g1 = r.readSection("g1_isolation");
    expect(g1.checks.ws_act_structured_join_canonical).toBe(true);
    expect(g1.checks.ws_act_text_carrier_refused).toBe(true);
    expect(g1.informational.ws_act).toBe("run_by_runner");
    expect(r.outbound).toContain("WS /protocol/v1/ws");
  });

  it("only the guarded base and the acceptance Supabase were contacted; receipts redact cleanly", async () => {
    const r = await rig();
    for (const phase of ["g1", "g2", "r0"]) await main([phase, "--run", RUN], r.ctx);
    const state = JSON.parse(fs.readFileSync(path.join(r.runsDir, `${RUN}.json`), "utf8"));
    const text = JSON.stringify(redactDeep(state.sections));
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(text).not.toContain("supabase.co");
    expect(text).not.toContain(SENT);
    expect(r.sb.log.every((l) => l.method === "GET" || l.path.startsWith("/rest/v1/rpc/"))).toBe(true);
    expect(r.h.calls.filter((c) => c.name === DEFAULT_WORLD)).toEqual([]);
  });
});
