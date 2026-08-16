/**
 * Shared product chrome for NOEMA surfaces (home, PLAY, WATCH, CONNECT).
 *
 * Specs split: landing may carry brand; PLAY/WATCH stay text-first.
 * Tokens align with site/design.md while product surfaces optimize for
 * readable world text, not dashboard chrome.
 */

export const PRODUCT_CSS = `
/* Hallmark · genre: atmospheric · nav: N9 edge-aligned · footer: Ft2
 * design-system: site/design.md · designed-as-app · text-first */
:root{
  color-scheme:dark;
  --void:#070a10;
  --void-2:#0c1218;
  --void-ink:#0a1016;
  --panel:#121a22;
  --panel-2:#18232d;
  --panel-hover:#1c2a34;
  --ink:#ebe6d8;
  --muted:#9b9587;
  --faint:#8a8478;
  --line:#2a3342;
  --line-hot:#3d4a58;
  --copper:#c4784a;
  --copper-hot:#d48a58;
  --copper-soft:rgba(196,120,74,.16);
  --copper-ink:#1a1008;
  --teal:#6b9b8f;
  --ember:#c46a5a;
  --ok:#6b9b6e;
  --font-display:"Fraunces","Palatino Linotype",Palatino,Georgia,serif;
  --font-body:"Source Sans 3","Segoe UI",system-ui,sans-serif;
  --font-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --r:2px;
  --max:68rem;
  --pad:clamp(1rem,3.5vw,2.25rem);
  --space-2xs:.35rem;
  --space-xs:.55rem;
  --space-sm:.85rem;
  --space-md:1.25rem;
  --space-lg:2rem;
  --space-xl:3.25rem;
  --ease:cubic-bezier(.22,1,.36,1);
  --z-skip:6;
  --z-nav:4;
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:clip}
html,body{margin:0;min-height:100%;overflow-x:clip;background:var(--void);color:var(--ink);font:16px/1.55 var(--font-body);-webkit-font-smoothing:antialiased}
body{background:var(--void);min-height:100vh}
a{color:var(--copper);text-underline-offset:.15em}
a:hover{color:var(--ink)}
button,input,select{font:inherit}
button{cursor:pointer;color:inherit;background:none;border:0}
button:disabled{opacity:.42;cursor:not-allowed}
:focus-visible{outline:2px solid var(--copper);outline-offset:3px}
.skip{
  position:fixed;z-index:var(--z-skip);top:.75rem;left:.75rem;padding:.5rem .75rem;
  background:var(--copper);color:var(--copper-ink);font:600 .75rem var(--font-mono);
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
  font:550 1.05rem/1 var(--font-display);letter-spacing:.04em;
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
.nav a[aria-current=page]{color:var(--copper)}
.runtime{
  display:inline-flex;align-items:center;gap:.45rem;
  color:var(--faint);font:.7rem/1 var(--font-mono);
  white-space:nowrap;
}
.dot{width:.42rem;height:.42rem;border-radius:50%;background:var(--faint);flex:0 0 auto}
.dot.ok{background:var(--teal)}
.dot.warn{background:var(--copper)}
.dot.bad{background:var(--ember)}

/* —— type + layout —— */
.wrap{width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;padding:var(--space-lg) 0 var(--space-xl);scroll-margin-top:5.5rem}
#main{scroll-margin-top:5.5rem}
.kicker{
  color:var(--copper);font:500 .65rem/1.3 var(--font-mono);letter-spacing:.16em;text-transform:uppercase;
}
h1{
  margin:.2rem 0 .55rem;max-width:16ch;
  font:550 clamp(2.2rem,5.5vw,3.4rem)/1.04 var(--font-display);
  letter-spacing:-.02em;color:var(--ink);font-style:normal;
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
.btn:hover{border-color:var(--copper);background:var(--panel-hover)}
.btn:active{transform:translateY(1px)}
.btn.primary{
  border-color:var(--copper);
  background:var(--copper);color:var(--copper-ink);
}
.btn.primary:hover{background:var(--copper-hot);border-color:var(--copper-hot)}
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
.tag.ok{color:var(--teal);border-color:var(--line)}
.tag.warn{color:var(--copper);border-color:var(--line)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.82rem}
.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.empty{color:var(--faint);font-size:.84rem}
code,.mono{font-family:var(--font-mono)}
code{color:var(--teal);font-size:.88em}
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
@media(max-width:540px){
  .brand-sub{display:none}
  .runtime{font-size:.65rem}
  h1{max-width:none}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
`;

export type ProductNav = "home" | "play" | "watch" | "study" | "connect";

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet"/>`;

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
  const runtime =
    !opts.active || opts.active === "home"
      ? ``
      : `<div class="runtime" title="Runtime status"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>`;
  const canonical =
    !opts.active || opts.active === "home" ? "/" : "/" + opts.active;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#070a10"/>
<title>${opts.title} · NOEMA</title>
<meta name="description" content="${desc}"/>
<meta property="og:title" content="${opts.title} · NOEMA"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="https://noema.guru/assets/hero-noema.jpg"/>
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
    ${nav("/watch", "Watch", "watch")}
    ${nav("/connect", "Connect", "connect")}
  </nav>
  ${runtime}
</header>
<main id="main" class="wrap">
${opts.body}
</main>
<footer class="foot">
  <span>NOEMA · Perihelion Reach</span>
  <span>PLAY · WATCH · CONNECT · <a class="foot-operator" href="/admin/login">operator</a></span>
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
