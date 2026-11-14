/**
 * Shared product chrome for NOEMA surfaces (home, PLAY, WATCH, CONNECT).
 * Visual tokens: Noema-Specs VISUAL-DESIGN.md via theme/tokens.ts.
 */

import { lowNoiseBootScript } from "./low-noise";
import { ICON_LINKS, OG_IMAGE } from "./seo";
import { FONT_LINKS, TOKEN_CSS } from "./theme/tokens";

export const PRODUCT_CSS = `
${TOKEN_CSS}
*,*::before,*::after{box-sizing:border-box}
/* hidden always hides: component display rules (.btn is inline-flex) otherwise override it. */
[hidden]{display:none!important}
html{scroll-behavior:smooth;overflow-x:clip}
html,body{margin:0;min-height:100%;overflow-x:clip;background:var(--void);color:var(--ink);font:16px/1.55 var(--font-body);-webkit-font-smoothing:antialiased}
body{background:var(--void);min-height:100vh}
a{color:var(--color-state-active);text-underline-offset:.15em}
a:hover{color:var(--ink)}
button,input,select{font:inherit}
button{cursor:pointer;color:inherit;background:none;border:0}
button:disabled{opacity:.42;cursor:not-allowed}
:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:3px}
.skip{
  position:fixed;z-index:var(--z-skip);top:.75rem;left:.75rem;padding:.5rem .75rem;
  background:var(--color-state-active);color:var(--color-text-inverse);font:600 .75rem var(--font-interface);
  transform:translateY(-160%);text-decoration:none;white-space:nowrap;
}
.skip:focus{transform:none}

/* —— chrome · N9 edge-aligned (solid bar, no frost, no glow) —— */
.top{
  position:relative;z-index:var(--z-nav);
  display:flex;flex-wrap:wrap;gap:.75rem 2rem;align-items:center;justify-content:space-between;
  padding:1rem var(--pad);
  border-bottom:1px solid var(--line);
  background:var(--void);
}
.brand{display:flex;align-items:center;gap:.75rem;min-width:0;text-decoration:none;color:inherit}
.brand-glyph{
  display:grid;place-items:center;flex:0 0 auto;width:2rem;height:2rem;
  border:1px solid var(--line-hot);border-radius:var(--r-md);color:var(--ink);
  transition:border-color .3s var(--ease-spring),color .3s var(--ease-spring);
}
.brand-glyph svg{display:block;width:.875rem;height:.875rem}
.brand:hover .brand-glyph{border-color:var(--color-state-active);color:var(--color-state-active)}
.brand-text{display:flex;flex-direction:column;gap:.25rem;min-width:0}
.brand-mark{
  font:700 1rem/1 var(--font-display);letter-spacing:.24em;
  color:var(--ink);
}
.brand-sub{color:var(--faint);font:.75rem/1 var(--font-body)}
.nav{display:flex;flex-wrap:wrap;gap:.25rem 1.5rem;justify-content:flex-end;margin-left:auto}
.nav a{
  position:relative;padding:.5rem 0;
  color:var(--muted);text-decoration:none;white-space:nowrap;
  text-transform:uppercase;letter-spacing:.14em;
  font:600 .75rem/1 var(--font-interface);
  transition:color .2s var(--ease);
}
.nav a::after{
  content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
  background:currentColor;transform:scaleX(0);transform-origin:left center;
  transition:transform .5s var(--ease-spring);
}
.nav a:hover{color:var(--ink)}
.nav a:hover::after{transform:scaleX(1)}
.nav a[aria-current=page]{color:var(--ink)}
.nav a[aria-current=page]::after{height:2px;background:var(--color-state-active);transform:scaleX(1)}
.runtime{
  display:inline-flex;align-items:center;gap:.45rem;
  color:var(--faint);font:.7rem/1 var(--font-mono);
  white-space:nowrap;
}
.dot{width:.42rem;height:.42rem;border-radius:50%;background:var(--faint);flex:0 0 auto}
.dot.ok{background:var(--color-state-active)}
.dot.warn{background:var(--color-state-warning)}
.dot.bad{background:var(--color-state-critical)}

/* —— type + layout —— */
.wrap{width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;padding:var(--space-lg) 0 var(--space-xl);scroll-margin-top:5.5rem}
#main{scroll-margin-top:5.5rem}
.kicker,.modes-kicker{
  color:var(--color-state-active);font:600 var(--text-kicker)/1.3 var(--font-display);letter-spacing:.14em;text-transform:uppercase;
}
.modes-kicker{margin:.15rem 0 .55rem}
.place{margin:0 0 .4rem;color:var(--color-state-active);font:600 1rem/1.35 var(--font-display)}
h1{
  margin:.2rem 0 .55rem;max-width:16ch;min-width:0;
  font:550 clamp(2.2rem,5.5vw,3.4rem)/1.04 var(--font-display);
  letter-spacing:-.02em;color:var(--ink);font-style:normal;overflow-wrap:anywhere;
}
h2{margin:.2rem 0 .4rem;font:550 clamp(1.15rem,2.4vw,1.55rem)/1.2 var(--font-display);letter-spacing:-.015em;font-style:normal}
.lead{max-width:38rem;margin:0 0 1.1rem;color:var(--muted);font-size:1.05rem;line-height:1.6}
.muted{color:var(--muted)}
.faint{color:var(--faint)}
p{margin:.45rem 0}

/* —— surfaces —— */
.card{
  border:1px solid var(--line);border-radius:var(--r);
  background:var(--panel);
}
.pad{padding:var(--space-md)}
.pad-tight{padding:var(--space-sm) var(--space-md)}
.pad-loose{padding:var(--space-lg) var(--space-md)}
.panel-rule{height:1px;margin:0;border:0;background:var(--line)}

/* —— controls —— */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.4rem;
  min-height:2.55rem;padding:.55rem 1rem;border:1px solid var(--line-hot);border-radius:var(--r);
  background:var(--panel-2);color:var(--ink);font:600 .84rem/1 var(--font-body);
  text-decoration:none;white-space:nowrap;transition:border-color .15s var(--ease),background .15s var(--ease);
}
.btn:hover{border-color:var(--color-state-active);background:var(--panel-hover)}
.btn:active{transform:translateY(1px)}
.btn.primary{
  border-color:var(--color-text-primary);
  background:var(--color-text-primary);color:var(--color-text-inverse);
}
.btn.primary:hover{background:var(--color-state-active);border-color:var(--color-state-active);color:var(--color-text-inverse)}
.btn.quiet{background:transparent;color:var(--muted);border-color:transparent}
.btn.quiet:hover{color:var(--ink);border-color:var(--line)}
.btn.block{width:100%}
.btn-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.form-submit,.operator-link{margin-top:.65rem}

label{display:block;margin:.6rem 0 .28rem;color:var(--muted);font-size:.78rem}
input,select{
  width:100%;min-height:2.5rem;padding:.55rem .7rem;
  border:1px solid var(--line-hot);border-radius:var(--r);
  background:var(--void-ink);color:var(--ink);
}
input::placeholder{color:var(--faint)}
select{cursor:pointer}

.meta{display:flex;flex-wrap:wrap;gap:.4rem;color:var(--faint);font:.62rem var(--font-mono)}
.meta span{padding:.2rem 0}
.tag{
  display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .48rem;
  border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);font:550 var(--text-meta)/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase;
}
.tag::before{
  content:"";width:.42rem;height:.42rem;border-radius:50%;flex:0 0 auto;
  background:currentColor;opacity:.55;
}
.tag.ok{color:var(--color-state-active);border-color:color-mix(in srgb,var(--color-state-active) 42%,var(--line))}
.tag.ok::before{opacity:1}
.tag.warn{color:var(--color-state-warning);border-color:var(--line)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.82rem}
.notice.ok{color:var(--color-state-active)}.notice.bad{color:var(--color-state-critical)}
.empty{color:var(--faint);font-size:.84rem}
code,.mono{font-family:var(--font-mono)}
code{color:var(--color-text-machine);font-size:.88em}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}

.foot{
  width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;
  padding:1.5rem 0 2rem;color:var(--faint);font:.75rem/1.25rem var(--font-body);
  display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;align-items:center;justify-content:space-between;
  border-top:1px solid var(--line);
}

.foot a{color:inherit;text-decoration:none;transition:color .2s var(--ease)}
.foot a:hover{color:var(--ink)}
.foot-contact{display:inline-flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center}
.foot-operator{color:inherit;opacity:.75;white-space:nowrap}

@media(max-width:700px){
  /* Single-line: a wrapping flex line takes its widest item's size, so the nowrap nav would outgrow the screen and never scroll. */
  .top{flex-direction:column;flex-wrap:nowrap;align-items:stretch;gap:.5rem}
  .nav{
    flex-wrap:nowrap;justify-content:flex-start;gap:1.25rem;margin:0 calc(-1*var(--pad));
    padding:0 var(--pad);overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;
    mask-image:linear-gradient(to right,#000 calc(100% - var(--pad)),transparent);
  }
  .nav::-webkit-scrollbar{display:none}
}
@media(max-width:640px){
  .btn{min-height:44px}
  .nav a{min-height:44px;display:inline-flex;align-items:center}
  input,select{min-height:44px;font-size:16px}
  .foot{align-items:flex-start;flex-direction:column;gap:.4rem;padding-top:var(--space-md)}
  .foot-contact{line-height:1.65}
}
@media(max-width:540px){
  .brand-sub{display:none}
  .runtime{font-size:.65rem}
  h1{max-width:none}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
body.is-low-noise .hero-art,body.is-low-noise .glyph{display:none!important}
body.is-low-noise.hero-bleed .hero::after,body.is-low-noise.hero-bleed .hero-copy::before{display:none}
body.is-low-noise.hero-bleed .top{
  position:relative;background:var(--void);border-bottom:1px solid var(--line);
}
body.is-low-noise.hero-bleed .foot{
  position:relative;background:var(--void);border-top:1px solid var(--line);
}
body.is-low-noise.hero-bleed .wrap{
  width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;padding:var(--space-lg) 0 var(--space-xl);
}
body.is-low-noise.hero-bleed .hero{min-height:0;justify-content:flex-start}
body.is-low-noise.hero-bleed .hero-copy{
  text-align:left;padding:0;width:auto;max-width:none;margin:0;
}
body.is-low-noise.hero-bleed .hero-copy .invite,
body.is-low-noise.hero-bleed .hero-copy .modes-kicker{margin-left:0;margin-right:auto}
body.is-low-noise.hero-bleed .home-now-card,
body.is-low-noise.hero-bleed .home-now-row,
body.is-low-noise.hero-bleed .hero-cta{justify-content:flex-start}
body.is-low-noise.hero-bleed .hero-gate{justify-content:start;justify-items:stretch}
.glyph{display:inline-flex;align-items:center;justify-content:center;width:1rem;height:1rem;margin-right:.35rem;vertical-align:-.12em;flex:0 0 auto}
.glyph svg{display:block;width:100%;height:100%}
.glyph-player{color:var(--color-state-social)}
.glyph-trade,.glyph-economy{color:var(--color-state-economic)}
.glyph-danger{color:var(--color-state-critical)}
.glyph-distress,.glyph-threshold{color:var(--color-state-warning)}
.glyph-rumor,.glyph-unknown{color:var(--color-state-unknown)}
.glyph-comms,.glyph-event,.glyph-loc{color:var(--color-state-active)}
.glyph-infra{color:var(--color-text-machine)}
.glyph-resource,.glyph-org{color:var(--color-text-secondary)}
.legend{margin:.75rem 0 0}
.legend summary{
  cursor:pointer;color:var(--color-text-secondary);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.key-body{display:grid;gap:.4rem .85rem;margin:.55rem 0 0}
@media(min-width:720px){.key-body{grid-template-columns:1fr 1fr}}
.key-row{display:flex;gap:.55rem;align-items:flex-start;font-size:.8rem;color:var(--color-text-primary)}
.key-row .glyph{width:1.15rem;height:1.15rem}
.key-row strong{font-weight:600}
`;

/** Phosphor arrow-right (MIT), used as a mask so it takes the button's color. */
const ARROW_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath d='M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z'/%3E%3C/svg%3E\")";

/**
 * Surface layer for the door, letter and workbench pages (Home, Manifesto,
 * Connect, Study, Privacy, 404). WATCH keeps PRODUCT_CSS only.
 * Motion follows VISUAL-DESIGN.md §6: 160ms route fade, state feedback, nothing ambient.
 */
export const SURFACE_CSS = `
@view-transition{navigation:auto}
::view-transition-old(root),::view-transition-new(root){animation-duration:160ms;animation-timing-function:var(--ease)}
:root{interpolate-size:allow-keywords}
body:not(.hero-bleed) .top{position:sticky;top:0}
h1,h2,h3{text-wrap:balance}
p,li,dd{text-wrap:pretty}
h1{
  margin:0 0 1.5rem;max-width:20ch;
  font:600 clamp(2.25rem,1.4rem + 3.4vw,3.75rem)/1.05 var(--font-display);letter-spacing:-.03em;
}
h2{font-weight:600;letter-spacing:-.02em}
.place{
  display:inline-flex;align-items:center;gap:.75rem;margin:0 0 1rem;
  color:var(--faint);font:600 .75rem/1rem var(--font-display);letter-spacing:.28em;text-transform:uppercase;
}
.place::before{content:"";width:1.5rem;height:1px;background:currentColor;opacity:.7}
.lead,.lede{color:var(--muted);font-size:1.125rem;line-height:1.75rem}

.panel{
  border:1px solid var(--line);border-radius:var(--r-xl);background:var(--panel);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 5%,transparent),0 24px 48px -32px rgb(0 0 0/.65);
}

.btn{
  --glyph-arrow:${ARROW_MASK};
  min-height:2.75rem;padding:.5rem 1rem;border-radius:var(--r-md);
  font:600 .875rem/1.25rem var(--font-body);
  transition:background-color .3s var(--ease-spring),border-color .3s var(--ease-spring),color .3s var(--ease-spring),transform .3s var(--ease-spring);
}
.btn:active{transform:translateY(1px) scale(.98)}
.btn.primary{background:var(--color-state-active);border-color:var(--color-state-active);color:var(--color-text-inverse)}
.btn.primary:hover{
  background:color-mix(in srgb,var(--color-state-active) 84%,var(--ink));
  border-color:color-mix(in srgb,var(--color-state-active) 84%,var(--ink));color:var(--color-text-inverse);
}
a.btn.primary::after{
  content:"";flex:0 0 auto;width:1rem;height:1rem;background:currentColor;
  -webkit-mask:var(--glyph-arrow) center/contain no-repeat;mask:var(--glyph-arrow) center/contain no-repeat;
  transition:transform .3s var(--ease-spring);
}
a.btn.primary:hover::after{transform:translateX(3px)}
.btn.quiet{min-height:0;padding:.25rem 0;color:var(--faint);border:0;text-decoration:underline;text-decoration-color:var(--line-hot);text-underline-offset:.25em}
.btn.quiet:hover{color:var(--ink);background:none;text-decoration-color:currentColor}
.btn.quiet[aria-pressed=true]{color:var(--ink)}

label{margin:1rem 0 .5rem;color:var(--faint);font:600 .75rem/1rem var(--font-interface);letter-spacing:.12em;text-transform:uppercase}
input,select{
  min-height:2.75rem;padding:.5rem .75rem;border-radius:var(--r-md);
  transition:border-color .2s var(--ease),box-shadow .2s var(--ease);
}
input:hover,select:hover{border-color:color-mix(in srgb,var(--line-hot) 55%,var(--ink))}
input:focus-visible,select:focus-visible{
  outline:none;border-color:var(--color-state-active);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--color-state-active) 26%,transparent);
}
input:user-invalid{border-color:var(--color-state-critical)}
.tag{border-radius:999px;padding:.25rem .5rem}
pre{border-radius:var(--r-lg)}

details>summary{
  display:flex;align-items:center;gap:.75rem;min-height:2.75rem;cursor:pointer;list-style:none;
  color:var(--muted);font:600 .875rem/1.25rem var(--font-body);transition:color .2s var(--ease);
}
details>summary::-webkit-details-marker{display:none}
details>summary::before{
  content:"";flex:0 0 auto;width:.4rem;height:.4rem;margin:0 .1rem;
  border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;
  transform:rotate(-45deg);transition:transform .3s var(--ease-spring);
}
details>summary:hover,details[open]>summary{color:var(--ink)}
details[open]>summary::before{transform:rotate(45deg)}
details::details-content{block-size:0;overflow-y:clip;transition:block-size .4s var(--ease-spring),content-visibility .4s allow-discrete}
details[open]::details-content{block-size:auto}

@media(prefers-reduced-motion:reduce){
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}
}
`;

const BRAND_GLYPH = `<svg viewBox="12 15 40 34" focusable="false"><path fill="currentColor" d="M46.85 42.06 44.64 42.96V15H51.63V49H44.64L17.15 22.15L19.36 21.25V49H12.37V15H19.36Z"/></svg>`;

export type ProductNav = "home" | "manifesto" | "play" | "watch" | "study" | "connect";

const FONTS = FONT_LINKS;

export function productShell(opts: {
  title: string;
  active?: ProductNav;
  body: string;
  extraCss?: string;
  description?: string;
  bleed?: boolean;
  /** Canonical path for pages outside the primary nav (e.g. /privacy). */
  canonicalPath?: string;
}): string {
  const nav = (href: string, label: string, key: ProductNav) =>
    `<a href="${href}"${opts.active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  const desc =
    opts.description ||
    "Perihelion Reach — watch the agents play.";
  const homeDoor = opts.active === "home";
  const letterDoor = homeDoor || opts.active === "manifesto";
  const runtime =
    letterDoor
      ? ``
      : `<div class="runtime" title="Runtime status"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>`;
  const canonical =
    opts.canonicalPath || (!opts.active || opts.active === "home" ? "/" : "/" + opts.active);
  const canonicalUrl = `https://noema.guru${canonical}`;
  const ogTitle = `${opts.title} · NOEMA`;
  const ogImage = OG_IMAGE.url;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0E1114"/>
<title>${ogTitle}</title>
<meta name="description" content="${desc}"/>
<meta property="og:site_name" content="NOEMA"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:title" content="${ogTitle}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:alt" content="${OG_IMAGE.alt}"/>
<meta property="og:image:width" content="${OG_IMAGE.width}"/>
<meta property="og:image:height" content="${OG_IMAGE.height}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${ogTitle}"/>
<meta name="twitter:description" content="${desc}"/>
<meta name="twitter:image" content="${ogImage}"/>
<meta name="twitter:image:alt" content="${OG_IMAGE.alt}"/>
<link rel="canonical" href="${canonicalUrl}"/>
${ICON_LINKS}
${FONTS}
<style>${PRODUCT_CSS}${opts.extraCss || ""}</style>
</head>
<body${opts.bleed ? ' class="hero-bleed"' : ""}>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="/" aria-label="NOEMA Perihelion Reach, home">
    <span class="brand-glyph" aria-hidden="true">${BRAND_GLYPH}</span>
    <span class="brand-text">
      <span class="brand-mark">NOEMA</span>
      <span class="brand-sub">Perihelion Reach</span>
    </span>
  </a>
  <nav class="nav" aria-label="Primary">
    ${nav("/", "Home", "home")}
    ${nav("/manifesto", "Manifesto", "manifesto")}
    ${nav("/watch", "Watch", "watch")}
    ${nav("/connect", "Connect", "connect")}
    ${nav("/study", "Study", "study")}
  </nav>
  ${runtime}
</header>
<main id="main" class="wrap">
${opts.body}
</main>
<footer class="foot">
  <span>NOEMA · Perihelion Reach · A Zero State LLC project</span>
  <span class="foot-contact">
    <a href="https://zer0state.com">Zero State</a>
    <a href="mailto:zer0state@zer0state.com">zer0state@zer0state.com</a>
    <a href="/privacy">Privacy</a>
    <span>·</span>
    <a class="foot-operator" href="/admin/login">operator</a>
  </span>
</footer>
<script>
(() => {
  async function ping() {
    const el = document.getElementById("dot");
    if (!el) return;
    const lab = document.getElementById("rt-label");
    try {
      const h = await fetch("/health").then(r => r.json());
      const ready = await fetch("/ready").then(r => r.json()).catch(() => null);
      if (!ready) {
        el.className = "dot " + (h.status === "ok" ? "warn" : "bad");
        if (lab) lab.textContent = h.status === "ok" ? "waiting" : "offline";
        return;
      }
      const st = String(ready.status || (ready.world && ready.world.status) || "");
      const sh = String(ready.settlement_health || (ready.world && ready.world.settlement_health) || "HEALTHY");
      let label = "ACTIVE · healthy";
      let dot = "ok";
      if (st === "NOT_ACTIVE" || !st) { label = "not ready"; dot = "warn"; }
      else if (st === "PAUSED") { label = "PAUSED"; dot = "warn"; }
      else if (st === "INCIDENT" || st === "ARCHIVED") { label = "INCIDENT"; dot = "bad"; }
      else if (sh === "BLOCKING") { label = "PLAY blocked"; dot = "bad"; }
      else if (st === "DEMO_SEED") { label = sh === "DEGRADED" ? "DEMO · degraded" : "DEMO · healthy"; dot = sh === "DEGRADED" ? "warn" : "ok"; }
      else if (st === "ACTIVE" && sh === "DEGRADED") { label = "ACTIVE · degraded"; dot = "warn"; }
      else if (st === "ACTIVE") { label = "ACTIVE · healthy"; dot = "ok"; }
      else { label = st || "waiting"; dot = ready.ready ? "ok" : "warn"; }
      el.className = "dot " + dot;
      if (lab) lab.textContent = label;
    } catch (_) {
      el.className = "dot bad";
      if (lab) lab.textContent = "offline";
    }
  }
  if (document.getElementById("dot")) {
    ping();
    setInterval(ping, 30000);
  }
})();
</script>
${lowNoiseBootScript()}
</body>
</html>`;
}
