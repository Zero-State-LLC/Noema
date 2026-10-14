/** Display-only stage. WATCH owns networking, selection, pause and world identity. */
import { layoutPublicTopology, asciiCartogram, CARTOGRAM_COLS, CARTOGRAM_ROWS } from "./watch-phosphor";

const L = { layoutPublicTopology, asciiCartogram, CARTOGRAM_COLS, CARTOGRAM_ROWS };

export function mountFluidStage(root, options = {}) {
  const $ = (id) => root.querySelector(`#${id}`);
  const canvas = $("watch-fluid-flat"), gl = $("watch-fluid-gl"), pre = $("watch-fluid-text");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let ctx = null;
  try { ctx = canvas.getContext("2d"); } catch { /* Complete semantic TEXT stays available. */ }
  const state = {
    snapshot: null, text: "", cells: [], events: new Map(), focus: "",
    mode: ctx ? 1 : 0, renderer: "flat", flat: ctx ? 1 : 0, transition: 0,
    map: null, mapLoading: null, mapFailed: false, flatResolve: null, flatToken: null,
    disposed: false,
  };

  function buildCells() {
    state.cells = [];
    state.text.split("\n").forEach((line, r) => {
      const names = new Set();
      for (const match of line.matchAll(/\[([^\]\n]*)\]([*0-9!+]*)/g)) {
        for (let c = match.index; c < match.index + match[0].length; c++) names.add(c);
      }
      [...line].forEach((char, c) => {
        if (char !== " ") state.cells.push({ r, c, char, kind: names.has(c) ? char === "*" ? "mark" : "room" : "route" });
      });
    });
  }
  function drawFlat() {
    if (!ctx || !state.snapshot || state.renderer !== "flat" || state.disposed) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const pw = Math.round(width * ratio), ph = Math.round(height * ratio);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#161b20";
    ctx.fillRect(0, 0, width, height);
    const cw = 0.12, ch = 0.24;
    const scale = Math.min((width - 24) / (L.CARTOGRAM_COLS * cw + 0.6), (height - 24) / (L.CARTOGRAM_ROWS * ch + 0.6));
    const w = cw * scale, h = ch * scale, pixel = state.flat;
    ctx.font = `500 ${h * 0.67}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const cell of state.cells) {
      const x = width / 2 + (cell.c - L.CARTOGRAM_COLS / 2) * w;
      const y = height / 2 + (cell.r - L.CARTOGRAM_ROWS / 2) * h;
      if (pixel > 0) {
        ctx.globalAlpha = pixel;
        ctx.fillStyle = cell.kind === "mark" ? "#3ddcff" : cell.kind === "route" ? "#5a646e" : "#c4bfb6";
        ctx.fillRect(x - w * 0.47 * pixel, y - h * 0.47 * pixel, w * 0.94 * pixel, h * 0.94 * pixel);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = pixel > 0.5 ? "#0e1114" : cell.kind === "route" ? "#9bb8c4" : "#e8e4dc";
      ctx.fillText(cell.char, x, y);
    }
    ctx.globalAlpha = 1;
  }
  function animateFlat(target) {
    if (state.flatResolve) { state.flatResolve(false); state.flatResolve = null; }
    const token = (state.flatToken = {}), from = state.flat;
    const duration = reduce.matches ? 0 : 900 * Math.abs(target - from);
    return new Promise((resolve) => {
      state.flatResolve = resolve;
      if (!duration) { state.flat = target; drawFlat(); state.flatResolve = null; resolve(true); return; }
      const start = performance.now();
      function step(now) {
        if (state.disposed || state.flatToken !== token) return;
        const t = Math.min(1, (now - start) / duration), eased = t * t * (3 - 2 * t);
        state.flat = from + (target - from) * eased;
        drawFlat();
        if (t < 1) requestAnimationFrame(step);
        else { state.flatResolve = null; resolve(true); }
      }
      requestAnimationFrame(step);
    });
  }
  function mapEvents() {
    return [...state.events.values()].sort((a, b) => Number(a.sequence) - Number(b.sequence));
  }
  function showRenderer(renderer) {
    state.renderer = renderer;
    gl.hidden = renderer !== "map";
    canvas.hidden = renderer !== "flat" || !ctx || !state.text;
    pre.className = ctx && state.text ? "sr" : "watch-fluid-text-fallback";
    $("watch-fluid-help").hidden = renderer !== "map";
    root.dataset.renderer = renderer;
    if (renderer === "flat") drawFlat();
    else state.map?.resize();
  }
  function mapUnavailable() {
    state.mapFailed = true;
    state.map?.dispose();
    state.map = null;
    $("watch-fluid-note").textContent = "MAP is unavailable. TEXT and PIXEL remain available.";
    const next = ctx ? "pixel" : "text";
    setMode(next);
    options.onMode?.(next);
  }
  async function ensureMap() {
    if (state.map) return state.map;
    if (state.mapFailed) throw new Error("Map unavailable");
    if (!state.mapLoading) state.mapLoading = (async () => {
      await Promise.race([document.fonts.load('500 64px "IBM Plex Mono"'), new Promise((resolve) => setTimeout(resolve, 1500))]);
      const { mountStage } = await import("/assets/watch-fluid-map.js");
      if (state.disposed) throw new Error("Disposed stage");
      state.map = mountStage(gl, { layout: L, reducedMotion: reduce.matches, onLost: mapUnavailable });
      if (state.snapshot) state.map.update(state.snapshot, mapEvents());
      return state.map;
    })();
    return state.mapLoading;
  }
  async function setMode(name) {
    let mode = { text: 0, pixel: 1, map: 2 }[name] ?? 1;
    if (!ctx && mode !== 0) { mode = 0; options.onMode?.("text"); }
    if (state.disposed) return;
    const transition = ++state.transition;
    state.mode = mode;
    root.dataset.mode = ["text", "pixel", "map"][mode];
    const current = () => transition === state.transition && !state.disposed;
    try {
      if (mode === 2) {
        const map = await ensureMap();
        if (!current()) return;
        if (state.renderer === "flat") {
          if (!(await animateFlat(1)) || !current()) return;
          showRenderer("map");
        }
        await map.morphTo(2);
        if (current() && state.focus) map.focus(state.focus);
      } else {
        if (state.renderer === "map" && state.map) {
          if (!(await state.map.morphTo(1)) || !current()) return;
          state.flat = 1;
        }
        if (!current()) return;
        showRenderer("flat");
        await animateFlat(mode);
      }
    } catch { if (current()) mapUnavailable(); }
  }
  function update(snapshot) {
    if (state.disposed || !snapshot || snapshot.projection !== "public" || !Array.isArray(snapshot.rooms)) return;
    const layout = L.layoutPublicTopology(snapshot.rooms, snapshot.recent_events || [], "");
    const allowed = new Set(layout.nodes.map((node) => node.room_id));
    const next = { ...snapshot, rooms: snapshot.rooms.filter((room) => allowed.has(room.room_id)) };
    const previous = state.snapshot;
    if (previous && (previous.world_id !== next.world_id || Number(next.sequence) < Number(previous.sequence))) {
      state.events.clear(); state.focus = "";
    }
    state.snapshot = next;
    state.text = L.asciiCartogram(layout, {}) || "No public sites are projected.";
    pre.textContent = state.text;
    const recent = Array.isArray(snapshot.narrative?.recently) ? snapshot.narrative.recently : snapshot.recent_events || [];
    const headline = snapshot.narrative?.now || snapshot.notable_event;
    for (const event of [...recent, headline]) {
      if (!event || !allowed.has(event.room_id) || Number(event.sequence) > Number(snapshot.sequence)) continue;
      state.events.set(`${event.sequence}|${event.projection_id}|${event.room_id}`, event);
    }
    while (state.events.size > 5000) state.events.delete(state.events.keys().next().value);
    root.dataset.worldId = next.world_id;
    root.dataset.cycle = String(next.cycle);
    root.dataset.sequence = String(next.sequence);
    root.dataset.publicEvents = String(state.events.size);
    if (!previous || previous.world_id !== next.world_id || previous.sequence !== next.sequence) {
      buildCells();
      if (!allowed.size) {
        state.map?.dispose(); state.map = null; state.mapLoading = null;
        state.text = ""; state.cells = [];
        showRenderer("flat");
      } else {
        state.map?.update(next, mapEvents());
        showRenderer(state.renderer);
      }
    }
  }
  function focus(roomId) {
    if (!roomId || !state.snapshot?.rooms.some((room) => room.room_id === roomId)) return;
    state.focus = roomId;
    if (state.renderer === "map" && state.mode === 2) state.map?.focus(roomId);
  }
  function onReduce() {
    state.map?.setReducedMotion(reduce.matches);
    if (reduce.matches) setMode(["text", "pixel", "map"][state.mode]);
  }
  const observer = new ResizeObserver(drawFlat);
  observer.observe(canvas);
  reduce.addEventListener("change", onReduce);
  document.fonts.ready.then(drawFlat);
  root.hidden = false;
  showRenderer("flat");
  return {
    update, setMode, focus,
    dispose() {
      state.disposed = true; ++state.transition; state.flatToken = {};
      if (state.flatResolve) state.flatResolve(false);
      observer.disconnect(); reduce.removeEventListener("change", onReduce); state.map?.dispose();
    },
  };
}

window.NoemaWatchFluid = { mount: mountFluidStage };
window.dispatchEvent(new Event("noema-watch-fluid-ready"));
