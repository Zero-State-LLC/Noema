/**
 * WATCH Chamber stage behind ?mode=3d (Noema-Specs specify/watch-single-3d-stage.md).
 * PIXEL stays the default until the stage is made the default. 3D lazily loads
 * one chunk, keeps the Places list beside the stage, and falls back to TEXT (D2).
 */
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { WATCH_LIVE_PIN } from "../src/watch-live";
import { watchHtml } from "../src/watch";
import { STAGE_FALLBACK_LINE, STAGE_GZIP_BUDGET, STAGE_LOW_NOISE_LINE, STAGE_SRC } from "../src/watch-stage-model";
import { parseWatchMode, watchModeInlineSource } from "../src/watch-mode";
import type { Env } from "../src/types";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "../public/assets");

type Node = {
  tagName: string;
  attrs: Record<string, string>;
  handlers: Record<string, Array<(ev?: unknown) => void>>;
  children: Node[];
  className: string;
  textContent: string;
  hidden: boolean;
  open: boolean;
  type?: string;
  src?: string;
  style: Record<string, string>;
  dataset: Record<string, string>;
  classList: { add(c: string): void; remove(c: string): void; toggle(c: string, on?: boolean): boolean; contains(c: string): boolean };
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  addEventListener(t: string, fn: (ev?: unknown) => void): void;
  removeEventListener(): void;
  append(...kids: Array<Node | string>): void;
  appendChild(kid: Node): Node;
  replaceChildren(...kids: Node[]): void;
  querySelector(): Node | null;
  querySelectorAll(): Node[];
  getContext?: (id: string) => unknown;
  focus(): void;
  scrollIntoView(): void;
  fire(type: string, ev?: unknown): void;
};

function makeNode(tag: string, webgl2: boolean): Node {
  const n: Node = {
    tagName: tag.toLowerCase(),
    attrs: {},
    handlers: {},
    children: [],
    className: "",
    textContent: "",
    hidden: false,
    open: false,
    style: {},
    dataset: {},
    classList: {
      add(c) { if (!n.classList.contains(c)) n.className = (n.className + " " + c).trim(); },
      remove(c) { n.className = n.className.split(/\s+/).filter((x) => x && x !== c).join(" "); },
      toggle(c, on) {
        const want = on === undefined ? !n.classList.contains(c) : Boolean(on);
        if (want) n.classList.add(c); else n.classList.remove(c);
        return want;
      },
      contains(c) { return n.className.split(/\s+/).includes(c); },
    },
    setAttribute(k, v) { n.attrs[k] = String(v); },
    getAttribute(k) { return k in n.attrs ? n.attrs[k] : null; },
    addEventListener(t, fn) { (n.handlers[t] = n.handlers[t] || []).push(fn); },
    removeEventListener() {},
    append(...kids) { for (const k of kids) if (typeof k !== "string") n.children.push(k); },
    appendChild(kid) { n.children.push(kid); return kid; },
    replaceChildren(...kids) { n.children = kids.slice(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    scrollIntoView() {},
    fire(type, ev) { for (const fn of n.handlers[type] || []) fn(ev); },
  };
  if (n.tagName === "canvas") n.getContext = (id: string) => (id === "webgl2" && webgl2 ? {} : null);
  return n;
}

type StageCall = { kind: string; arg?: unknown };

function snapshot(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    watch_live: WATCH_LIVE_PIN,
    projection: "public",
    world_id: "world.test",
    cycle: 4,
    sequence: 20,
    players_present: 1,
    world_status: "ACTIVE",
    freshness: "live",
    rooms: [{ room_id: "room.market", name: "Chamber Market", description: "Open stalls.", players_present: 1, active: true, exits: [], entities: [] }],
    recent_events: [
      { sequence: 20, cycle: 4, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Chamber Market", room_id: "room.market" },
    ],
    notable_event: { sequence: 20, cycle: 4, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Chamber Market", room_id: "room.market" },
    ...over,
  };
}

async function boot(opts: { search?: string; stored?: string | null; webgl2?: boolean; html?: string; frame?: Record<string, unknown>; wide?: boolean } = {}) {
  const webgl2 = opts.webgl2 !== false;
  const byId = new Map<string, Node>();
  const head = makeNode("head", webgl2);
  const stage = makeNode("section", webgl2);
  const doc = {
    hidden: false,
    head,
    body: makeNode("body", webgl2),
    activeElement: null,
    fonts: { ready: Promise.resolve() },
    getElementById(id: string) {
      if (!byId.has(id)) {
        const n = makeNode(id.includes("canvas") || id === "watch-map-gl" ? "canvas" : "div", webgl2);
        n.attrs.id = id;
        byId.set(id, n);
      }
      return byId.get(id)!;
    },
    createElement: (tag: string) => makeNode(tag, webgl2),
    createElementNS: (_ns: string, tag: string) => makeNode(tag, webgl2),
    createTextNode: (s: string) => { const t = makeNode("#text", webgl2); t.textContent = s; return t; },
    querySelector: (sel: string) => (sel === ".watch-stage" ? stage : null),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const store = new Map<string, string>();
  if (opts.stored != null) store.set("noema.watch.mode", opts.stored);
  const urls: string[] = [];
  const winHandlers: Record<string, Array<(ev?: unknown) => void>> = {};
  const win: Record<string, unknown> = {
    matchMedia: (q: string) => ({ matches: !!opts.wide && String(q).includes("min-width"), addEventListener() {}, removeEventListener() {} }),
    addEventListener(t: string, fn: (ev?: unknown) => void) { (winHandlers[t] = winHandlers[t] || []).push(fn); },
    dispatchEvent(ev: { type: string }) { for (const fn of winHandlers[ev.type] || []) fn(ev); return true; },
  };
  const search = opts.search || "";
  const g = globalThis as Record<string, unknown>;
  const keys = ["document", "window", "location", "localStorage", "fetch", "setInterval", "CSS", "history"];
  const saved = Object.fromEntries(keys.map((k) => [k, g[k]]));
  g.document = doc;
  g.window = win;
  g.location = { search, hash: "", protocol: "https:", host: "noema.test", href: "https://noema.test/watch" + search };
  g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)) };
  g.history = { replaceState: (_s: unknown, _t: string, url: string) => void urls.push(url) };
  g.fetch = async () => ({ ok: true, statusText: "", json: async () => opts.frame || snapshot() });
  g.setInterval = () => 0;
  g.CSS = { escape: (s: string) => s };
  const restore = () => { for (const k of keys) g[k] = saved[k]; };
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const html = opts.html || watchHtml();
  const main = html.split("<script>").map((s) => s.split("</script>")[0]).find((s) => s.includes("POLL_MS"));
  expect(main).toBeTruthy();
  try {
    (0, eval)(main as string);
    await flush();
  } catch (e) {
    restore();
    throw e;
  }
  const stageCalls: StageCall[] = [];
  let lost: (() => void) | null = null;
  let select: ((id: string) => void) | null = null;
  return {
    $: (id: string) => doc.getElementById(id),
    head,
    stage,
    store,
    urls,
    win,
    body: doc.body,
    stageScripts: () => head.children.filter((c) => c.tagName === "script" && String(c.src || "").includes("watch-stage")),
    async click(id: string) {
      doc.getElementById(id).fire("click");
      await new Promise((r) => setTimeout(r, 5));
      await flush();
    },
    installStage(failMount = false) {
      win.NoemaWatchStage = {
        mount(frame: Node, options: { canvas: Node; labels: Node; reset: Node; reduce: boolean; onLost: () => void; onSelect: (id: string) => void }) {
          if (failMount) throw new Error("no module");
          lost = options.onLost;
          select = options.onSelect;
          stageCalls.push({ kind: "mount", arg: { frame: frame.attrs.id, canvas: options.canvas.attrs.id, labels: options.labels.attrs.id, reset: options.reset.attrs.id } });
          return {
            update(s: Record<string, unknown>, ctx: Record<string, unknown>) { stageCalls.push({ kind: "update", arg: { projection: s.projection, ctx } }); },
            dispose() { stageCalls.push({ kind: "dispose" }); },
          };
        },
      };
    },
    stageCalls,
    stageLost() { lost?.(); },
    stageSelect(id: string) { select?.(id); },
    flush,
    restore,
  };
}

describe("3D is an opt-in WATCH mode", () => {
  it("parses 3d from query, hash, and storage, but never defaults to it", () => {
    expect(parseWatchMode("?mode=3d", "", "")).toBe("3d");
    expect(parseWatchMode("", "#3d", "")).toBe("3d");
    expect(parseWatchMode("", "", "3d")).toBe("3d");
    expect(parseWatchMode("?mode=3D", "", "")).toBe("3d");
    expect(parseWatchMode("", "", null)).toBe("pixel");
    expect(parseWatchMode("?mode=three", "", "")).toBe("pixel");
    expect(parseWatchMode("?mode=pixel", "", "3d")).toBe("pixel");
    expect(watchModeInlineSource()).not.toContain("__name");
  });

  it("server-renders the default page unchanged with no 3D script tag", () => {
    const html = watchHtml();
    expect(html).toContain('data-mode="pixel"');
    expect(html).toContain('id="watch-mode-3d" aria-pressed="false"');
    expect(html).toMatch(/id="watch-stage3d" hidden/);
    expect(html).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(html).not.toMatch(/<script[^>]*watch-stage/);
    for (const mode of ["text", "pixel", "map"]) {
      expect(watchHtml({ mode })).not.toMatch(/<script[^>]*watch-stage/);
      expect(watchHtml({ mode })).toContain(`id="watch-mode-${mode}" aria-pressed="true"`);
    }
  });

  it("server-renders ?mode=3d with Places beside the stage and MAP hidden", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/watch?mode=3d"), env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-mode="3d"');
    expect(html).toContain('id="watch-mode-3d" aria-pressed="true"');
    expect(html).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(html).toMatch(/id="watch-stage-map"[^>]*hidden/);
    expect(html).toContain('id="watch-stage3d-reset"');
    expect(html).toContain("Map key");
    expect(html).not.toMatch(/<script[^>]*watch-stage/);
  });
});

describe("driven WATCH client with the 3D stage", () => {
  it("default boot keeps PIXEL and never requests the stage chunk", async () => {
    const c = await boot();
    try {
      expect(c.stage.getAttribute("data-mode")).toBe("pixel");
      expect(c.$("watch-mode-pixel").getAttribute("aria-pressed")).toBe("true");
      expect(c.stageScripts()).toHaveLength(0);
      for (const id of ["watch-mode-text", "watch-mode-map", "watch-mode-pixel"]) {
        await c.click(id);
        expect(c.stageScripts()).toHaveLength(0);
      }
      expect(c.$("watch-stage3d").hidden).toBe(true);
    } finally {
      c.restore();
    }
  });

  it("choosing 3D lazily loads the chunk once, mounts it beside Places, and persists", async () => {
    const c = await boot();
    try {
      await c.click("watch-mode-3d");
      expect(c.stage.getAttribute("data-mode")).toBe("3d");
      expect(c.$("watch-mode-3d").getAttribute("aria-pressed")).toBe("true");
      expect(c.$("watch-stage-places").hidden).toBe(false);
      expect(c.$("watch-stage-map").hidden).toBe(true);
      expect(c.store.get("noema.watch.mode")).toBe("3d");
      expect(c.urls.at(-1)).toContain("mode=3d");
      const scripts = c.stageScripts();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].type).toBe("module");
      expect(scripts[0].src).toBe(STAGE_SRC);

      c.installStage();
      scripts[0].fire("load");
      await c.flush();
      expect(c.stageCalls[0]).toEqual({ kind: "mount", arg: { frame: "watch-stage3d-frame", canvas: "watch-stage3d-gl", labels: "watch-stage3d-labels", reset: "watch-stage3d-reset" } });
      const updates = c.stageCalls.filter((x) => x.kind === "update");
      expect(updates.length).toBeGreaterThan(0);
      expect(updates.every((x) => (x.arg as { projection: string }).projection === "public")).toBe(true);
      expect(c.$("watch-stage3d").hidden).toBe(false);

      await c.click("watch-mode-pixel");
      expect(c.stageCalls.at(-1)?.kind).toBe("dispose");
      expect(c.$("watch-stage3d").hidden).toBe(true);
      await c.click("watch-mode-3d");
      expect(c.stageScripts()).toHaveLength(1);
      expect(c.stageCalls.filter((x) => x.kind === "mount")).toHaveLength(2);
    } finally {
      c.restore();
    }
  });

  it("a site picked on the stage becomes the selected site in its next update", async () => {
    const c = await boot({ search: "?mode=3d" });
    try {
      c.installStage();
      c.stageScripts()[0].fire("load");
      await c.flush();
      c.stageSelect("room.market");
      await c.flush();
      const last = c.stageCalls.filter((x) => x.kind === "update").at(-1)!;
      expect((last.arg as { ctx: { selectedId: string } }).ctx.selectedId).toBe("room.market");
    } finally {
      c.restore();
    }
  });

  it("never hands a non-public last frame to the stage on selection", async () => {
    const frame = snapshot();
    const c = await boot({ frame });
    try {
      frame.projection = "private";
      await c.click("watch-mode-3d");
      const [script] = c.stageScripts();
      expect(script).toBeTruthy();
      c.installStage();
      script.fire("load");
      await c.flush();
      expect(c.stageCalls.some((call) => call.kind === "update")).toBe(false);
    } finally { c.restore(); }
  });

  it("boots straight into a stored 3D preference", async () => {
    const c = await boot({ stored: "3d" });
    try {
      expect(c.stage.getAttribute("data-mode")).toBe("3d");
      expect(c.stageScripts()).toHaveLength(1);
    } finally {
      c.restore();
    }
  });

  it("Low noise never mounts the stage and keeps the text map", async () => {
    const c = await boot({ search: "?mode=3d&low_noise=1" });
    try {
      expect(c.body.classList.contains("is-low-noise")).toBe(true);
      expect(c.stage.getAttribute("data-mode")).toBe("3d");
      expect(c.stageScripts()).toHaveLength(0);
      expect(c.$("watch-stage3d").hidden).toBe(true);
      expect(c.$("watch-stage-places").hidden).toBe(false);
      expect(c.$("watch-stage3d-fallback").textContent).toBe(STAGE_LOW_NOISE_LINE);
    } finally {
      c.restore();
    }
  });

  it("turning Low noise on over a mounted stage shows the text map at once, and off remounts it", async () => {
    const c = await boot({ search: "?mode=3d", wide: true });
    try {
      c.installStage();
      c.stageScripts()[0].fire("load");
      await c.flush();
      expect(c.stageCalls.filter((x) => x.kind === "mount")).toHaveLength(1);
      // While the stage is the map, the ASCII cartogram stays off (one map at a time).
      expect(c.$("watch-pre").hidden).toBe(true);

      await c.click("watch-low-noise-btn");
      expect(c.body.classList.contains("is-low-noise")).toBe(true);
      expect(c.stageCalls.at(-1)?.kind).toBe("dispose");
      expect(c.$("watch-stage3d").hidden).toBe(true);
      expect(c.$("watch-stage-places").hidden).toBe(false);
      expect(c.$("watch-stage3d-fallback").hidden).toBe(false);
      expect(c.$("watch-stage3d-fallback").textContent).toBe(STAGE_LOW_NOISE_LINE);
      // Painted by the toggle itself, not by a later poll.
      expect(c.$("watch-pre").hidden).toBe(false);
      expect(c.$("watch-pre").textContent).toContain("Chamber Market");

      await c.click("watch-low-noise-btn");
      expect(c.body.classList.contains("is-low-noise")).toBe(false);
      expect(c.stageCalls.filter((x) => x.kind === "mount")).toHaveLength(2);
      expect(c.$("watch-stage3d").hidden).toBe(false);
      expect(c.$("watch-stage3d-fallback").hidden).toBe(true);
      expect(c.$("watch-pre").hidden).toBe(true);
    } finally {
      c.restore();
    }
  });

  it("falls back to TEXT when the stage chunk fails to load", async () => {
    const c = await boot({ search: "?mode=3d" });
    try {
      const [script] = c.stageScripts();
      expect(script).toBeTruthy();
      script.fire("error");
      await c.flush();
      expect(c.stage.getAttribute("data-mode")).toBe("text");
      expect(c.$("watch-mode-text").getAttribute("aria-pressed")).toBe("true");
      expect(c.$("watch-stage-places").hidden).toBe(false);
      expect(c.$("watch-stage-map").hidden).toBe(true);
      expect(c.$("watch-stage3d").hidden).toBe(true);
      expect(c.$("watch-stage3d-fallback").hidden).toBe(false);
      expect(c.$("watch-stage3d-fallback").textContent).toBe(STAGE_FALLBACK_LINE);
      // Fallback does not overwrite the spectator's stored choice.
      expect(c.store.get("noema.watch.mode")).toBe("3d");
    } finally {
      c.restore();
    }
  });

  it("falls back to TEXT on a mount error or a lost WebGL context", async () => {
    const bad = await boot({ search: "?mode=3d" });
    try {
      bad.installStage(true);
      bad.stageScripts()[0].fire("load");
      await bad.flush();
      expect(bad.stage.getAttribute("data-mode")).toBe("text");
      expect(bad.$("watch-stage3d").hidden).toBe(true);
    } finally {
      bad.restore();
    }

    const lost = await boot({ search: "?mode=3d" });
    try {
      lost.installStage();
      lost.stageScripts()[0].fire("load");
      await lost.flush();
      expect(lost.stage.getAttribute("data-mode")).toBe("3d");
      lost.stageLost();
      await lost.flush();
      expect(lost.stage.getAttribute("data-mode")).toBe("text");
      expect(lost.stageCalls.at(-1)?.kind).toBe("dispose");
      expect(lost.$("watch-stage3d-fallback").hidden).toBe(false);
    } finally {
      lost.restore();
    }
  });

  it("without WebGL2 never downloads the chunk and shows TEXT", async () => {
    const c = await boot({ search: "?mode=3d", webgl2: false });
    try {
      expect(c.stageScripts()).toHaveLength(0);
      expect(c.stage.getAttribute("data-mode")).toBe("text");
      expect(c.$("watch-stage3d-fallback").textContent).toBe(STAGE_FALLBACK_LINE);
      await c.click("watch-mode-pixel");
      expect(c.$("watch-stage3d-fallback").hidden).toBe(true);
    } finally {
      c.restore();
    }
  });
});

describe("the stage chunk is built from source, budgeted, and ships the Three.js license", () => {
  it("is one chunk within the D5 budget with the MIT license and notice banner", () => {
    for (const f of ["watch-stage.js", "THREE-LICENSE.txt"]) {
      expect(existsSync(join(ASSETS, f)), f).toBe(true);
    }
    for (const gone of ["watch-fluid.js", "watch-fluid-map.js"]) {
      expect(existsSync(join(ASSETS, gone)), gone).toBe(false);
    }
    expect(readFileSync(join(ASSETS, "THREE-LICENSE.txt"), "utf8")).toContain("The MIT License");
    const chunk = readFileSync(join(ASSETS, "watch-stage.js"));
    expect(chunk.toString("utf8").startsWith("/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT")).toBe(true);
    expect(chunk.toString("utf8")).toContain("NoemaWatchStage");
    expect(gzipSync(chunk, { level: 9 }).length).toBeLessThanOrEqual(STAGE_GZIP_BUDGET);
  });
});
