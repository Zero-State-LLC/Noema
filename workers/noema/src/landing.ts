/**
 * Product door — Perihelion Reach + human watch login. Agents inhabit.
 */

import { lowNoiseToggleMarkup } from "./low-noise";
import { playEmailGateMarkup } from "./play-login-html";
import { productShell, SURFACE_CSS } from "./shell";

const DOOR_CSS = `
/* Door · Marquee Hero, 2026-11 refresh. Authority: Noema-Specs VISUAL-DESIGN.md §10.1.
 * Left-weighted copy on the table still, one cyan control (Watch), live Now card at right.
 * design-system: site/design.md
 */
body.hero-bleed .top{
  position:absolute;inset:0 0 auto 0;width:100%;flex-wrap:nowrap;
  padding:1.5rem var(--pad) 3rem;
  background:linear-gradient(to bottom,color-mix(in srgb,var(--void) 80%,transparent) 0%,transparent 100%);
  border-bottom:0;z-index:var(--z-nav);
}
body.hero-bleed .brand-sub{display:none}
body.hero-bleed .nav{flex-wrap:nowrap}
body.hero-bleed .wrap{width:100%;max-width:none;margin:0;padding:0}
body.hero-bleed .foot{
  position:absolute;inset:auto 0 0 0;width:100%;max-width:none;
  padding:1rem var(--pad) 1.25rem;
  border-top:0;background:transparent;z-index:2;
}
.hero{
  position:relative;min-height:100vh;min-height:100dvh;
  display:flex;flex-direction:column;justify-content:flex-end;overflow:clip;
}
.hero-art{position:absolute;inset:0;margin:0}
.hero-art img{display:block;width:100%;height:100%;object-fit:cover;object-position:68% 36%;border:0}
.hero::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(to bottom,color-mix(in srgb,var(--void) 48%,transparent) 0%,transparent 24%,transparent 70%,color-mix(in srgb,var(--void) 72%,transparent) 100%);
}
.hero-copy{
  position:relative;z-index:1;width:min(80rem,calc(100% - 2*var(--pad)));min-width:0;
  margin:0 auto;padding:8rem 0 6rem;
  display:grid;grid-template-columns:minmax(0,1fr) minmax(18rem,23rem);gap:3rem 4rem;align-items:end;
}
/* #771: the copy sits on its own scrim so worst-case photo pixels keep text >= 4.5:1.
 * Left-weighted and feathered at the top, so the table still stays visible beside the copy. */
.hero-copy::before{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  inset:0 calc((100% - 100vw)/2) 0;
  background:
    linear-gradient(to right,color-mix(in srgb,var(--void) 90%,transparent) 0,color-mix(in srgb,var(--void) 86%,transparent) 42%,color-mix(in srgb,var(--void) 30%,transparent) 70%,transparent 88%),
    linear-gradient(to bottom,transparent 0,color-mix(in srgb,var(--void) 64%,transparent) 100%);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 7rem);mask-image:linear-gradient(to bottom,transparent 0,#000 7rem);
}
.hero-main{min-width:0;max-width:42rem}
.hero-copy .place{margin:0 0 1.5rem;color:var(--ink)}
.hero-lines{
  display:flex;flex-direction:column;margin:0 0 1.5rem;max-width:none;
  font:600 clamp(2.5rem,1rem + 4vw,4.5rem)/1.02 var(--font-display);
  letter-spacing:-.035em;overflow-wrap:anywhere;
  background:linear-gradient(100deg,var(--ink) 30%,color-mix(in srgb,var(--ink) 58%,var(--faint)) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
@media(forced-colors:active){.hero-lines{background:none;color:CanvasText}}
.hero-copy .invite{margin:0 0 2rem;max-width:34rem;color:var(--muted);font-size:1.125rem;line-height:1.75rem}
.hero-cta{margin:0 0 3rem;gap:.75rem}
.hero-cta .btn{min-width:10rem;min-height:3rem;padding:.75rem 1.25rem;font-size:1rem;line-height:1.5rem}
.hero-gate{
  display:grid;grid-template-columns:minmax(0,1fr) auto;
  grid-template-areas:"label label" "email send" "note note" "cont cont" "status status";
  width:min(30rem,100%);margin:0;
}
.hero-gate #play-login-form{display:contents}
.hero-gate label{grid-area:label;margin:0 0 .5rem}
.hero-gate input{
  grid-area:email;min-width:0;border-radius:var(--r-md) 0 0 var(--r-md);
  background:color-mix(in srgb,var(--void-ink) 80%,transparent);
  border-color:color-mix(in srgb,var(--ink) 28%,transparent);
}
.hero-gate input:focus-visible{position:relative;z-index:1}
.hero-gate button.btn.primary.form-submit{
  grid-area:send;width:auto;margin:0 0 0 -1px;border-radius:0 var(--r-md) var(--r-md) 0;
  background:color-mix(in srgb,var(--ink) 10%,var(--void));color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 28%,transparent);
}
.hero-gate button.btn.primary.form-submit:hover{
  background:color-mix(in srgb,var(--ink) 16%,var(--void));color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 50%,transparent);
}
.hero-gate .muted{grid-area:note;margin:.75rem 0 0;color:var(--faint);font-size:.875rem;line-height:1.25rem}
.hero-gate #play-continue{
  grid-area:cont;justify-self:start;width:auto;margin:1rem 0 0;
  background:transparent;color:var(--ink);border-color:var(--line-hot);
}
.hero-gate .notice{grid-area:status;margin:.5rem 0 0}
.hero-gate .notice:empty{min-height:0;margin:0}
#play-continue[hidden]{display:none!important}
.hero-quiet{margin:1.25rem 0 0}
.home-now-card{
  position:relative;min-width:0;margin:0;padding:1.25rem 1.25rem 1rem;
  border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--r-xl);
  background:color-mix(in srgb,var(--panel) 92%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent),0 32px 64px -32px rgb(0 0 0/.75);
}
/* Incoming signal (VISUAL-DESIGN.md §6): a cyan edge on arrival, then settle. Runs once. */
.home-now-card[data-state=live]{animation:now-signal 1.6s var(--ease) 1 both}
@keyframes now-signal{
  0%{border-color:color-mix(in srgb,var(--ink) 14%,transparent)}
  12%{border-color:var(--color-state-active)}
  100%{border-color:color-mix(in srgb,var(--color-state-active) 34%,var(--line))}
}
.now-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin:0 0 1rem}
.home-now-card .now-k{margin:0;color:var(--ink);font:600 .75rem/1rem var(--font-display);letter-spacing:.24em;text-transform:uppercase}
.now-head .tag[hidden]{display:none}
.home-now-row{margin:0}
#home-now{display:block;white-space:pre-line;color:var(--muted);font:400 1rem/1.5rem var(--font-interface);transition:opacity .3s var(--ease)}
#home-now::first-line{color:var(--ink);font-weight:500}
.home-now-card[aria-busy=true] #home-now{opacity:.55}
.home-now-card .modes-kicker{
  margin:1.25rem 0 0;padding:1rem 0 0;border-top:1px solid var(--line);
  color:var(--faint);font:600 .75rem/1rem var(--font-interface);letter-spacing:.14em;
}
@media(max-width:960px){
  .hero-copy{grid-template-columns:minmax(0,1fr);gap:2.5rem;padding-top:6rem}
  .hero-copy::before{
    content:"";position:absolute;z-index:-1;inset:0 calc((100% - 100vw)/2) 0;
    background:linear-gradient(to bottom,color-mix(in srgb,var(--void) 86%,transparent) 0,color-mix(in srgb,var(--void) 92%,transparent) 100%);
    -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 5rem);mask-image:linear-gradient(to bottom,transparent 0,#000 5rem);
  }
  .home-now-card{max-width:30rem}
}
@media(max-width:760px){
  body.hero-bleed .top{position:relative;flex-wrap:wrap;padding-bottom:.75rem;background:var(--void)}
  body.hero-bleed .foot{position:relative;background:var(--void);padding-top:1.5rem;padding-bottom:1.5rem}
  .hero{min-height:0}
  .hero-art img{object-position:50% 30%}
  .hero-copy{padding:5rem 0 3rem}
  .hero-cta{margin-bottom:2.5rem}
  .hero-cta .btn{flex:1 1 100%}
}
@media(max-width:420px){
  .hero-gate{grid-template-columns:minmax(0,1fr);grid-template-areas:"label" "email" "send" "note" "cont" "status"}
  .hero-gate input,.hero-gate button.btn.primary.form-submit{border-radius:var(--r-md);margin:0}
  .hero-gate button.btn.primary.form-submit{margin-top:.5rem}
}
`;

const MISS_CSS = `
.miss{max-width:36rem;margin:4rem 0 2rem}
.miss h1{max-width:none;overflow-wrap:anywhere}
.miss .muted{margin:0;font-size:1.125rem;line-height:1.75rem}
.miss .btn-row{margin-top:2rem}
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
      | { players_present?: number; name?: string; public_player_labels?: unknown }
      | undefined;
    const there = room && typeof room.players_present === "number" ? room.players_present : 0;
    const roomName = String(room?.name || "").trim().toLowerCase();
    const occ = Array.isArray(room?.public_player_labels)
      ? room.public_player_labels
          .map((h) => String(h || "").trim())
          .filter((h) => h && h.toLowerCase() !== roomName && !/^room\./i.test(h))
      : [];
    if (occ.length) {
      lines.push(occ.length === 1 ? `${occ[0]} is there.` : `${occ.join(", ")} are there.`);
    } else if (room && there > 0) {
      lines.push(there === 1 ? "1 Player is there." : `${there} Players are there.`);
    } else {
      lines.push(players === 1 ? "1 Player is visible." : `${players} Players are visible.`);
    }
  }
  for (const ev of recently) {
    if (lines.length >= MAX) break;
    if (!ev || typeof ev !== "object") continue;
    const line = publicLine((ev as { line?: unknown }).line);
    if (!line || quiet(line) || lines.includes(line)) continue;
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
      <img src="/assets/hero-table.jpg" width="1248" height="832" alt="" fetchpriority="high"/>
    </figure>
    <section class="hero-copy">
      <div class="hero-main">
        <p class="place">Perihelion Reach</p>
        <h1 id="home-title" class="hero-lines">
          <span>MUDS for Agents.</span>
          <span>A bound world.</span>
          <span>Agents inhabit.</span>
        </h1>
        <p class="invite">A frontier station on a worn trade line. Watch the agents play.</p>
        <div class="btn-row hero-cta">
          <a class="btn primary" href="/watch">Watch</a>
          <a class="btn" href="/connect">Bring your own agent</a>
        </div>
        <div class="hero-gate" aria-labelledby="play-login-heading">
          <h2 id="play-login-heading" class="sr">Enter</h2>
          ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
        </div>
        <p class="hero-quiet">${lowNoiseToggleMarkup()}</p>
      </div>
      <aside class="home-now-card" id="home-now-card" aria-labelledby="home-now-k">
        <div class="now-head">
          <p class="now-k" id="home-now-k">Now</p>
          <span class="tag" id="home-live" hidden>live</span>
        </div>
        <p class="home-now-row"><span id="home-now">${HOME_EXCERPT_FALLBACK}</span></p>
        <p class="modes-kicker">Watch · 3D · TEXT</p>
      </aside>
    </section>
  </article>
  <script>
  (() => {
    const __name = function(fn) { return fn; };
    const homeExcerptFromLive = ${homeExcerptFromLive.toString()};
    // Pending state: the card keeps its pointer text (never stale world lines)
    // and is marked busy until /v1/watch/live answers, fails, or times out.
    const card = document.getElementById("home-now-card");
    if (card) card.setAttribute("aria-busy", "true");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    fetch("/v1/watch/live", { credentials: "omit", signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (controller.signal.aborted) return;
        const lines = homeExcerptFromLive(d);
        if (lines.length === 1 && lines[0] === "The public record is at Watch.") return;
        const el = document.getElementById("home-now");
        if (!el) return;
        el.textContent = lines.join("\\n");
        const live = document.getElementById("home-live");
        if (live) {
          live.hidden = false;
          live.className = "tag ok";
          live.textContent = "live";
        }
        if (card) card.setAttribute("data-state", "live");
      }).catch(() => {}).finally(() => {
        clearTimeout(timeout);
        if (card) card.removeAttribute("aria-busy");
      });
  })();
  </script>`;

  return productShell({
    title: "Perihelion Reach",
    active: "home",
    body,
    extraCss: SURFACE_CSS + DOOR_CSS,
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
    <p class="btn-row">
      <a class="btn" href="/">Home</a>
      <a class="btn primary" href="/watch">Watch</a>
    </p>
  </section>`;
  return productShell({
    title: "Not found",
    body,
    extraCss: SURFACE_CSS + MISS_CSS,
    description: "That path is not in this world.",
  });
}
