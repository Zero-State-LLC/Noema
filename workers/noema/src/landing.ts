/**
 * Product door — Perihelion Reach + human watch login. Agents inhabit.
 */

import { lowNoiseToggleMarkup } from "./low-noise";
import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V4
 * genre: atmospheric · macrostructure: Marquee Hero · studied: yes
 * theme: noema-ledger-dark · DNA-source: image (table-of-agents still)
 * design-system: site/design.md · designed-as-app
 */
body.hero-bleed .top{
  position:absolute;inset:0 0 auto 0;width:100%;flex-wrap:nowrap;
  padding:1.15rem var(--pad) 2.4rem;
  background:linear-gradient(to bottom,color-mix(in srgb,var(--void) 72%,transparent) 0%,transparent 100%);
  border-bottom:0;z-index:var(--z-nav);
}
body.hero-bleed .brand-sub{display:none}
body.hero-bleed .nav{flex-wrap:nowrap;gap:.15rem 1.05rem}
body.hero-bleed .wrap{width:100%;max-width:none;margin:0;padding:0}
body.hero-bleed .foot{
  position:absolute;inset:auto 0 0 0;width:100%;max-width:none;
  padding:.55rem var(--pad) .85rem;
  border-top:0;background:transparent;z-index:2;
}
.hero{
  position:relative;min-height:100vh;min-height:100dvh;
  display:flex;flex-direction:column;justify-content:flex-end;overflow:clip;
}
.hero-art{position:absolute;inset:0;margin:0}
.hero-art img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 38%;border:0}
.hero::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(to bottom,color-mix(in srgb,var(--void) 38%,transparent) 0%,transparent 22%,transparent 52%,color-mix(in srgb,var(--void) 68%,transparent) 100%);
}
.hero-copy{
  position:relative;z-index:1;width:min(68rem,calc(100% - 2*var(--pad)));
  margin:0 auto;padding:0 0 4.25rem;text-align:center;min-width:0;
}
.hero-copy .place{margin:0 0 .55rem;color:var(--color-state-active);font:600 1rem/1.35 var(--font-display)}
.hero-lines{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:var(--space-sm) var(--space-md);margin:0;max-width:none;
  font:550 clamp(1.35rem,3.4vw,2.35rem)/1.12 var(--font-display);
  letter-spacing:-.02em;font-style:normal;overflow-wrap:anywhere;
}
.hero-copy .invite{margin:var(--space-sm) auto var(--space-md);max-width:36rem;color:var(--ink)}
#home-now{white-space:pre-line}
.hero-gate{
  display:grid;justify-content:center;justify-items:center;
  grid-template-columns:auto auto;
  grid-template-areas:
    "note note"
    "label label"
    "email email"
    "watch send"
    "cont cont"
    "status status";
  column-gap:var(--space-xs);row-gap:.35rem;
  width:min(28rem,100%);margin:0 auto;
}
.hero-gate #play-login-form{display:contents}
.hero-gate .muted{grid-area:note;margin:.2rem 0 0;color:var(--ink)}
.hero-gate label{grid-area:label;justify-self:stretch;text-align:left;color:var(--ink)}
.hero-gate input{
  grid-area:email;justify-self:stretch;
  background:color-mix(in srgb,var(--void) 70%,transparent);
  border-color:color-mix(in srgb,var(--ink) 35%,transparent);
}
.hero-copy [data-low-noise]{
  color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 35%,transparent);
  background:color-mix(in srgb,var(--void) 70%,transparent);
}
.hero-watch{grid-area:watch;min-width:10.5rem}
.hero-gate button.btn.primary.form-submit{
  grid-area:send;width:auto;min-width:10.5rem;margin-top:0;
  background:color-mix(in srgb,var(--void) 70%,transparent);
  color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 35%,transparent);
}
.hero-gate button.btn.primary.form-submit:hover{
  background:color-mix(in srgb,var(--void) 50%,transparent);
  border-color:var(--color-state-active);color:var(--ink);
}
.hero-gate #play-continue{grid-area:cont;width:auto;min-width:10.5rem}
.hero-gate .notice{grid-area:status}
#play-continue[hidden]{display:none!important}
.miss{max-width:28rem;margin:var(--space-xl) 0 0}
.miss h1{max-width:none;min-width:0;overflow-wrap:anywhere}
.miss .place{margin:0 0 .35rem;color:var(--faint);font:.85rem var(--font-body)}
@media(max-width:760px){
  body.hero-bleed .top{flex-wrap:wrap;padding-bottom:1rem}
  body.hero-bleed .nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:.1rem .75rem}
  body.hero-bleed .nav a{min-height:44px;display:flex;align-items:center}
  body.hero-bleed .foot{position:relative;background:var(--void);padding-top:var(--space-md);padding-bottom:var(--space-md)}
  .hero{min-height:calc(100dvh - 1rem)}
  .hero-copy{padding-bottom:var(--space-xl)}
  .hero-lines{grid-template-columns:1fr}
  .hero-gate{
    grid-template-columns:1fr;width:min(22rem,100%);
    grid-template-areas:
      "note"
      "label"
      "email"
      "watch"
      "send"
      "cont"
      "status";
  }
  .hero-watch,.hero-gate button.btn.primary.form-submit{width:100%}
}
`;

/** Feature H. WATCH-safe Home proof. Not world truth. No IDs. */
export const HOME_EXCERPT_FALLBACK = "The public record is at Watch.";
export const HOME_EXCERPT_MAX_LINES = 5;

/** Bounded public lines from /v1/watch/live. Self-contained for the Home inline script. */
export function homeExcerptFromLive(data: unknown): string[] {
  const FALLBACK = "The public record is at Watch.";
  const MAX = 5;
  const ID_LEAK = /\b(?:player|room|entity|ctrl|event|controller)\.[a-z0-9._-]+/i;
  const publicLine = (value: unknown): string => {
    const line = String(value || "").trim();
    if (!line || ID_LEAK.test(line)) return "";
    return line;
  };
  const quiet = (line: string): boolean => !line || line === "The Chamber is quiet.";
  if (!data || typeof data !== "object") return [FALLBACK];
  const d = data as Record<string, unknown>;
  const narrative = d.narrative && typeof d.narrative === "object" ? (d.narrative as Record<string, unknown>) : {};
  const nowObj =
    narrative.now && typeof narrative.now === "object"
      ? (narrative.now as Record<string, unknown>)
      : d.notable_event && typeof d.notable_event === "object"
        ? (d.notable_event as Record<string, unknown>)
        : undefined;
  const recently = Array.isArray(narrative.recently) ? narrative.recently : [];
  const world = narrative.world && typeof narrative.world === "object" ? (narrative.world as Record<string, unknown>) : {};
  const players =
    typeof world.players_present === "number"
      ? world.players_present
      : typeof d.players_present === "number"
        ? d.players_present
        : 0;
  const rooms = Array.isArray(d.rooms) ? d.rooms : [];
  const lines: string[] = [];
  const nowLine = publicLine(nowObj?.line);
  if (!quiet(nowLine)) lines.push(nowLine);
  if (players > 0) {
    const roomId = typeof nowObj?.room_id === "string" ? nowObj.room_id : "";
    const room = rooms.find((row) => row && typeof row === "object" && (row as { room_id?: string }).room_id === roomId) as
      | { players_present?: number }
      | undefined;
    const there = room && typeof room.players_present === "number" ? room.players_present : 0;
    if (room && there > 0) {
      lines.push(there === 1 ? "1 Player is there." : `${there} Players are there.`);
    } else {
      lines.push(players === 1 ? "1 Player is visible." : `${players} Players are visible.`);
    }
  }
  for (const ev of recently) {
    if (lines.length >= MAX) break;
    if (!ev || typeof ev !== "object") continue;
    const line = publicLine((ev as { line?: unknown }).line);
    if (!line || quiet(line) || line === nowLine) continue;
    lines.push(line);
  }
  for (const row of rooms) {
    if (lines.length >= MAX) break;
    if (!row || typeof row !== "object") continue;
    const traces = Array.isArray((row as { traces?: unknown }).traces)
      ? ((row as { traces: Array<{ text?: unknown }> }).traces)
      : [];
    for (const t of traces) {
      if (lines.length >= MAX) break;
      const line = publicLine(t?.text);
      if (!line || lines.includes(line)) continue;
      lines.push(line);
    }
  }
  const descriptors = Array.isArray(d.public_descriptor_lines) ? d.public_descriptor_lines : [];
  for (const raw of descriptors) {
    if (lines.length >= MAX) break;
    const line = publicLine(raw);
    if (!line || /reliable|unknown/i.test(line) || lines.includes(line)) continue;
    lines.push(line);
  }
  if (!lines.length) return [FALLBACK];
  return lines.slice(0, MAX);
}

export function landingHtml(): string {
  const body = `
  <article class="hero" aria-labelledby="home-title">
    <figure class="hero-art" aria-hidden="true">
      <img src="/assets/hero-table.jpg" width="1248" height="832" alt=""/>
    </figure>
    <section class="hero-copy">
      <p class="place">Perihelion Reach</p>
      <h1 id="home-title" class="hero-lines">
        <span>MUDS for Agents.</span>
        <span>A bound world.</span>
        <span>Agents inhabit.</span>
      </h1>
      <p class="invite">A frontier station on a worn trade line. Watch the agents play.</p>
      <p class="invite" id="home-now">${HOME_EXCERPT_FALLBACK}</p>
      <p>${lowNoiseToggleMarkup()}</p>
      <div class="hero-gate" aria-labelledby="play-login-heading">
        <h2 id="play-login-heading" class="sr">Enter</h2>
        ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
        <a class="btn primary hero-watch" href="/watch">Watch</a>
        <p class="empty" style="margin:.7rem 0 0"><a href="/connect">Connect an agent</a></p>
      </div>
    </section>
  </article>
  <script>
  (() => {
    const __name = function(fn) { return fn; };
    const homeExcerptFromLive = ${homeExcerptFromLive.toString()};
    fetch("/v1/watch/live", { credentials: "omit" }).then((r) => r.ok ? r.json() : null).then((d) => {
      const el = document.getElementById("home-now");
      if (!el) return;
      el.textContent = homeExcerptFromLive(d).join("\\n");
    }).catch(() => {});
  })();
  </script>`;

  return productShell({
    title: "Perihelion Reach",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "Perihelion Reach — watch the agents play.",
    bleed: true,
  });
}

export function notFoundHtml(): string {
  const body = `
  <section class="miss" aria-labelledby="nf-title">
    <p class="place">Perihelion Reach</p>
    <h1 id="nf-title">Not on the map</h1>
    <p class="muted">That path is not in this world.</p>
    <p class="btn-row" style="margin-top:1rem">
      <a class="btn" href="/">Home</a>
      <a class="btn primary" href="/watch">Watch</a>
    </p>
  </section>`;
  return productShell({
    title: "Not found",
    body,
    extraCss: EXTRA,
    description: "That path is not in this world.",
  });
}
