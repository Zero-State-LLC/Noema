/**
 * Shared product chrome for NOEMA surfaces (home, PLAY, WATCH, CONNECT).
 * Visual tokens: Noema-Specs VISUAL-DESIGN.md via theme/tokens.ts.
 */

import { FONT_LINKS, TOKEN_CSS } from "./theme/tokens";

export const PRODUCT_CSS = `
${TOKEN_CSS}
*,*::before,*::after{box-sizing:border-box}
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

/* —— chrome · N9 edge-aligned —— */
.top{
  position:relative;z-index:var(--z-nav);
  display:flex;flex-wrap:wrap;gap:.65rem 1.5rem;align-items:baseline;justify-content:space-between;
  padding:1rem var(--pad) .85rem;
  border-bottom:1px solid var(--line);
  background:var(--void);
}
.brand{display:flex;flex-direction:column;gap:.12rem;min-width:0;text-decoration:none;color:inherit}
.brand-mark{
  font:700 1.05rem/1 var(--font-display);letter-spacing:.18em;
  color:var(--ink);
}
.brand-sub{color:var(--faint);font:.7rem/1.2 var(--font-body)}
.nav{display:flex;flex-wrap:wrap;gap:.15rem .95rem;justify-content:flex-end;margin-left:auto}
.nav a{
  color:var(--muted);text-decoration:none;white-space:nowrap;
  font:500 .86rem/1.2 var(--font-body);
  transition:color .15s var(--ease);
}
.nav a:hover,.nav a[aria-current=page]{color:var(--ink)}
.nav a[aria-current=page]{color:var(--color-state-active)}
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
.kicker{
  color:var(--color-text-secondary);font:500 .65rem/1.3 var(--font-interface);letter-spacing:.16em;text-transform:uppercase;
}
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
  display:inline-flex;align-items:center;padding:.28rem .48rem;
  border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);font:.58rem/1 var(--font-mono);letter-spacing:.06em;text-transform:uppercase;
}
.tag.ok{color:var(--color-state-active);border-color:var(--line)}
.tag.warn{color:var(--color-state-warning);border-color:var(--line)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.82rem}
.notice.ok{color:var(--color-state-active)}.notice.bad{color:var(--color-state-critical)}
.empty{color:var(--faint);font-size:.84rem}
code,.mono{font-family:var(--font-mono)}
code{color:var(--color-text-machine);font-size:.88em}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}

.foot{
  width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;
  padding:var(--space-md) 0 var(--space-lg);color:var(--faint);font:.7rem/1.5 var(--font-body);
  display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;justify-content:space-between;
  border-top:1px solid var(--line);
}

.foot-operator{color:inherit;opacity:.75;white-space:nowrap}

@media(max-width:700px){
  .top{flex-direction:column;align-items:flex-start}
  .nav{margin-left:0;justify-content:flex-start}
}
@media(max-width:640px){
  .btn{min-height:44px}
  .nav a{min-height:44px;display:inline-flex;align-items:center}
  input,select{min-height:44px;font-size:16px}
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

export type ProductNav = "home" | "play" | "watch" | "study" | "connect";

const FONTS = FONT_LINKS;

export function productShell(opts: {
  title: string;
  active?: ProductNav;
  body: string;
  extraCss?: string;
  description?: string;
}): string {
  const nav = (href: string, label: string, key: ProductNav) =>
    `<a href="${href}"${opts.active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  const desc =
    opts.description ||
    "Perihelion Reach — enter the world.";
  const arriveChrome = opts.active === "home" || opts.active === "play";
  const runtime =
    arriveChrome
      ? ``
      : `<div class="runtime" title="Runtime status"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>`;
  const canonical =
    !opts.active || opts.active === "home" ? "/" : "/" + opts.active;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0E1114"/>
<title>${opts.title} · NOEMA</title>
<meta name="description" content="${desc}"/>
<meta property="og:title" content="${opts.title} · NOEMA"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="https://noema.guru/assets/og-social.jpg"/>
<link rel="canonical" href="https://noema.guru${canonical}"/>
${FONTS}
<style>${PRODUCT_CSS}${opts.extraCss || ""}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="/" aria-label="NOEMA home">
    <span class="brand-mark">NOEMA</span>
    <span class="brand-sub">Perihelion Reach</span>
  </a>
  <nav class="nav" aria-label="Primary">
    ${nav("/", "Home", "home")}
    ${nav("/play", "Play", "play")}
    ${arriveChrome ? "" : `${nav("/watch", "Watch", "watch")}${nav("/connect", "Connect", "connect")}`}
  </nav>
  ${runtime}
</header>
<main id="main" class="wrap">
${opts.body}
</main>
<footer class="foot">
  <span>NOEMA · Perihelion Reach</span>
  <span>${arriveChrome ? `<a class="foot-operator" href="/admin/login">operator</a>` : `PLAY · WATCH · CONNECT · <a class="foot-operator" href="/admin/login">operator</a>`}</span>
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
</body>
</html>`;
}
