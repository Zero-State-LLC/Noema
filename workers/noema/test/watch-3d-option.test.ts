/**
 * Opt-in 3D WATCH view (Three.js "fluid" stage, originally Ruffian-L #736).
 * TEXT / PIXEL / MAP stay the default and never fetch the 3D chunks; 3D is
 * selectable, persists like the other modes, and falls back to MAP.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { WATCH_LIVE_PIN } from "../src/watch-live";
import { watchHtml } from "../src/watch";
import { FLUID_FALLBACK_LINE, FLUID_SRC } from "../src/watch-fluid-view";
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

type FluidCall = { kind: string; arg?: unknown };

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

async function boot(opts: { search?: string; stored?: string | null; webgl2?: boolean; html?: string } = {}) {
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
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
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
  g.fetch = async () => ({ ok: true, statusText: "", json: async () => snapshot() });
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
  const fluidCalls: FluidCall[] = [];
  let onMode: ((next: string) => void) | null = null;
  return {
    $: (id: string) => doc.getElementById(id),
    head,
    stage,
    store,
    urls,
    win,
    fluidScripts: () => head.children.filter((c) => c.tagName === "script" && String(c.src || "").includes("watch-fluid")),
    async click(id: string) {
      doc.getElementById(id).fire("click");
      await new Promise((r) => setTimeout(r, 5));
      await flush();
    },
    installFluid(failMount = false) {
      win.NoemaWatchFluid = {
        mount(root: Node, options: { onMode: (next: string) => void }) {
          if (failMount) throw new Error("no module");
          onMode = options.onMode;
          root.hidden = false;
          fluidCalls.push({ kind: "mount" });
          return {
            update(s: Record<string, unknown>) { fluidCalls.push({ kind: "update", arg: s.projection }); },
            setMode(m: string) { fluidCalls.push({ kind: "setMode", arg: m }); },
            focus(id: string) { fluidCalls.push({ kind: "focus", arg: id }); },
            dispose() { fluidCalls.push({ kind: "dispose" }); },
          };
        },
      };
    },
    fluidCalls,
    stageLost() { onMode?.("pixel"); },
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
    expect(html).toMatch(/id="watch-fluid" hidden/);
    expect(html).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(html).not.toMatch(/<script[^>]*watch-fluid/);
    expect(html).not.toMatch(/<link[^>]*watch-fluid/);
    for (const mode of ["text", "pixel", "map"]) {
      expect(watchHtml({ mode })).not.toMatch(/<script[^>]*watch-fluid/);
      expect(watchHtml({ mode })).toContain(`id="watch-mode-${mode}" aria-pressed="true"`);
    }
  });

  it("server-renders ?mode=3d with Places and MAP hidden", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/watch?mode=3d"), env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-mode="3d"');
    expect(html).toContain('id="watch-mode-3d" aria-pressed="true"');
    expect(html).toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(html).toMatch(/id="watch-stage-map"[^>]*hidden/);
    expect(html).not.toMatch(/<script[^>]*watch-fluid/);
  });
});

describe("driven WATCH client with the 3D option", () => {
  it("default boot keeps PIXEL and never requests the 3D chunk", async () => {
    const c = await boot();
    try {
      expect(c.stage.getAttribute("data-mode")).toBe("pixel");
      expect(c.$("watch-mode-pixel").getAttribute("aria-pressed")).toBe("true");
      expect(c.$("watch-mode-3d").getAttribute("aria-pressed")).toBe("false");
      expect(c.fluidScripts()).toHaveLength(0);
      for (const id of ["watch-mode-text", "watch-mode-map", "watch-mode-pixel"]) {
        await c.click(id);
        expect(c.fluidScripts()).toHaveLength(0);
      }
      expect(c.$("watch-fluid").hidden).toBe(true);
    } finally {
      c.restore();
    }
  });

  it("choosing 3D lazily loads the chunk once, mounts it, and persists", async () => {
    const c = await boot();
    try {
      await c.click("watch-mode-3d");
      expect(c.stage.getAttribute("data-mode")).toBe("3d");
      expect(c.$("watch-mode-3d").getAttribute("aria-pressed")).toBe("true");
      expect(c.$("watch-mode-pixel").getAttribute("aria-pressed")).toBe("false");
      expect(c.$("watch-stage-places").hidden).toBe(true);
      expect(c.$("watch-stage-map").hidden).toBe(true);
      expect(c.store.get("noema.watch.mode")).toBe("3d");
      expect(c.urls.at(-1)).toContain("mode=3d");
      const scripts = c.fluidScripts();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].type).toBe("module");
      expect(scripts[0].src).toBe(FLUID_SRC);

      c.installFluid();
      scripts[0].fire("load");
      await c.flush();
      expect(c.fluidCalls.map((x) => x.kind)).toEqual(expect.arrayContaining(["mount", "update", "setMode"]));
      expect(c.fluidCalls.find((x) => x.kind === "setMode")?.arg).toBe("map");
      expect(c.fluidCalls.filter((x) => x.kind === "update").every((x) => x.arg === "public")).toBe(true);
      expect(c.$("watch-fluid").hidden).toBe(false);

      await c.click("watch-mode-pixel");
      expect(c.fluidCalls.at(-1)?.kind).toBe("dispose");
      expect(c.$("watch-fluid").hidden).toBe(true);
      expect(c.stage.getAttribute("data-mode")).toBe("pixel");
      await c.click("watch-mode-3d");
      expect(c.fluidScripts()).toHaveLength(1);
      expect(c.fluidCalls.filter((x) => x.kind === "mount")).toHaveLength(2);
    } finally {
      c.restore();
    }
  });

  it("boots straight into a stored 3D preference", async () => {
    const c = await boot({ stored: "3d" });
    try {
      expect(c.stage.getAttribute("data-mode")).toBe("3d");
      expect(c.fluidScripts()).toHaveLength(1);
    } finally {
      c.restore();
    }
  });

  it("falls back to MAP when the 3D chunk fails to load", async () => {
    const c = await boot({ search: "?mode=3d" });
    try {
      const [script] = c.fluidScripts();
      expect(script).toBeTruthy();
      script.fire("error");
      await c.flush();
      expect(c.stage.getAttribute("data-mode")).toBe("map");
      expect(c.$("watch-mode-map").getAttribute("aria-pressed")).toBe("true");
      expect(c.$("watch-stage-map").hidden).toBe(false);
      expect(c.$("watch-fluid").hidden).toBe(true);
      expect(c.$("watch-fluid-fallback").hidden).toBe(false);
      expect(c.$("watch-fluid-fallback").textContent).toBe(FLUID_FALLBACK_LINE);
      // Fallback does not overwrite the spectator's stored choice.
      expect(c.store.get("noema.watch.mode")).toBe("3d");
    } finally {
      c.restore();
    }
  });

  it("falls back to MAP on the unavailable event, a mount error, or a lost stage", async () => {
    const ev = await boot({ search: "?mode=3d" });
    try {
      (ev.win.dispatchEvent as (e: { type: string }) => boolean)({ type: "noema-watch-fluid-unavailable" });
      await ev.flush();
      expect(ev.stage.getAttribute("data-mode")).toBe("map");
      expect(ev.$("watch-fluid-fallback").textContent).toBe(FLUID_FALLBACK_LINE);
    } finally {
      ev.restore();
    }

    const bad = await boot({ search: "?mode=3d" });
    try {
      bad.installFluid(true);
      bad.fluidScripts()[0].fire("load");
      await bad.flush();
      expect(bad.stage.getAttribute("data-mode")).toBe("map");
      expect(bad.$("watch-fluid").hidden).toBe(true);
    } finally {
      bad.restore();
    }

    const lost = await boot({ search: "?mode=3d" });
    try {
      lost.installFluid();
      lost.fluidScripts()[0].fire("load");
      await lost.flush();
      expect(lost.stage.getAttribute("data-mode")).toBe("3d");
      lost.stageLost();
      await lost.flush();
      expect(lost.stage.getAttribute("data-mode")).toBe("map");
      expect(lost.fluidCalls.at(-1)?.kind).toBe("dispose");
      expect(lost.$("watch-fluid-fallback").hidden).toBe(false);
    } finally {
      lost.restore();
    }
  });

  it("without WebGL2 never downloads the chunk and shows MAP", async () => {
    const c = await boot({ search: "?mode=3d", webgl2: false });
    try {
      expect(c.fluidScripts()).toHaveLength(0);
      expect(c.stage.getAttribute("data-mode")).toBe("map");
      expect(c.$("watch-fluid-fallback").textContent).toBe(FLUID_FALLBACK_LINE);
      await c.click("watch-mode-pixel");
      expect(c.$("watch-fluid-fallback").hidden).toBe(true);
    } finally {
      c.restore();
    }
  });
});

describe("3D chunks are built from source and ship the Three.js license", () => {
  it("has both lazy chunks, the MIT license, and the notice banner", () => {
    for (const f of ["watch-fluid.js", "watch-fluid-map.js", "THREE-LICENSE.txt"]) {
      expect(existsSync(join(ASSETS, f)), f).toBe(true);
    }
    expect(readFileSync(join(ASSETS, "THREE-LICENSE.txt"), "utf8")).toContain("The MIT License");
    const map = readFileSync(join(ASSETS, "watch-fluid-map.js"), "utf8");
    expect(map.startsWith("/*! NOEMA WATCH 3D view. Bundles three.js (MIT")).toBe(true);
    const shell = readFileSync(join(ASSETS, "watch-fluid.js"), "utf8");
    expect(shell).toContain("/assets/watch-fluid-map.js");
    expect(shell).toContain('projection!=="public"');
    expect(shell).not.toContain("WebGLRenderer");
  });
});
