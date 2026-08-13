/**
 * Shared Stage 0 product chrome — "Chamber ledger" system.
 *
 * Specs split: landing may carry brand; PLAY/WATCH/STUDY stay text-first.
 * Tokens align with site/design.md (copper ledger) while product surfaces
 * optimize for readable world text, not dashboard chrome.
 */

export const PRODUCT_CSS = `
:root{
  color-scheme:dark;
  --void:#070a10;
  --void-2:#0c1218;
  --panel:#121a22;
  --panel-2:#18232d;
  --ink:#ebe6d8;
  --muted:#9b9587;
  --faint:#8a8478;
  --line:#2a3342;
  --line-hot:#3d4a58;
  --copper:#c4784a;
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
  --ease:cubic-bezier(.22,1,.36,1);
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;overflow-x:clip}
html,body{margin:0;min-height:100%;background:var(--void);color:var(--ink);font:16px/1.55 var(--font-body);-webkit-font-smoothing:antialiased}
body{
  background:
    radial-gradient(ellipse 80% 50% at 10% -10%,rgba(196,120,74,.09),transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 0%,rgba(107,155,143,.06),transparent 45%),
    linear-gradient(180deg,var(--void-2) 0%,var(--void) 28rem);
  min-height:100vh;
}
body::before{
  content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.35;
  background-image:
    linear-gradient(rgba(235,230,216,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(235,230,216,.02) 1px,transparent 1px);
  background-size:48px 48px;
  mask-image:linear-gradient(to bottom,#000 0%,transparent 72%);
}
a{color:var(--copper);text-underline-offset:.15em}
a:hover{color:var(--ink)}
button,input,select{font:inherit}
button{cursor:pointer;color:inherit;background:none;border:0}
button:disabled{opacity:.42;cursor:not-allowed}
:focus-visible{outline:2px solid var(--copper);outline-offset:3px}
.skip{
  position:fixed;z-index:100;top:.75rem;left:.75rem;padding:.5rem .75rem;
  background:var(--copper);color:var(--copper-ink);font:600 .75rem var(--font-mono);
  transform:translateY(-160%);text-decoration:none;
}
.skip:focus{transform:none}

/* —— chrome —— */
.top{
  position:sticky;top:0;z-index:40;
  display:grid;grid-template-columns:auto 1fr auto;gap:.75rem 1.25rem;align-items:center;
  min-height:3.75rem;padding:.65rem var(--pad);
  border-bottom:1px solid rgba(42,51,66,.85);
  background:rgba(7,10,16,.88);backdrop-filter:blur(14px) saturate(1.1);
}
.brand{display:flex;flex-direction:column;gap:.12rem;min-width:0;text-decoration:none;color:inherit}
.brand-mark{
  font:550 1.05rem/1 var(--font-display);letter-spacing:.18em;text-transform:uppercase;
  color:var(--ink);
}
.brand-sub{color:var(--faint);font:.58rem/1.2 var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
.nav{display:flex;flex-wrap:wrap;gap:.1rem;justify-content:center}
.nav a{
  position:relative;padding:.5rem .7rem;color:var(--muted);text-decoration:none;
  font:500 .68rem/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase;
  transition:color .15s var(--ease);
}
.nav a:hover,.nav a[aria-current=page]{color:var(--ink)}
.nav a[aria-current=page]::after{
  content:"";position:absolute;left:.7rem;right:.7rem;bottom:.2rem;height:1.5px;background:var(--copper);
}
.runtime{
  display:inline-flex;align-items:center;gap:.45rem;justify-self:end;
  padding:.35rem .55rem;border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);font:.58rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
  white-space:nowrap;
}
.dot{width:.42rem;height:.42rem;border-radius:50%;background:var(--faint);flex:0 0 auto}
.dot.ok{background:var(--teal);box-shadow:0 0 0 3px rgba(107,155,143,.18)}
.dot.warn{background:var(--copper)}
.dot.bad{background:var(--ember)}

/* —— type + layout —— */
.wrap{width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;padding:clamp(1.5rem,4vw,2.75rem) 0 3.5rem;scroll-margin-top:5.5rem}
#main{scroll-margin-top:5.5rem}
.kicker{
  color:var(--copper);font:500 .65rem/1.3 var(--font-mono);letter-spacing:.16em;text-transform:uppercase;
}
h1{
  margin:.35rem 0 .55rem;max-width:16ch;
  font:550 clamp(2.4rem,6.5vw,3.75rem)/1.02 var(--font-display);
  letter-spacing:-.02em;color:var(--ink);
}
h2{margin:.2rem 0 .4rem;font:550 clamp(1.25rem,2.8vw,1.75rem)/1.15 var(--font-display);letter-spacing:-.015em}
.lead{max-width:38rem;margin:0 0 1.1rem;color:var(--muted);font-size:1.05rem;line-height:1.6}
.muted{color:var(--muted)}
.faint{color:var(--faint)}
p{margin:.45rem 0}

/* —— surfaces —— */
.card{
  border:1px solid var(--line);border-radius:var(--r);
  background:linear-gradient(160deg,rgba(24,35,45,.96),rgba(12,18,24,.98));
  box-shadow:0 20px 50px rgba(0,0,0,.22);
}
.pad{padding:1.05rem 1.15rem}
.panel-rule{height:1px;margin:0;border:0;background:linear-gradient(90deg,var(--copper),transparent 70%)}

/* —— controls —— */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.4rem;
  min-height:2.55rem;padding:.55rem 1rem;border:1px solid var(--line-hot);border-radius:var(--r);
  background:var(--panel-2);color:var(--ink);font:600 .84rem/1 var(--font-body);
  text-decoration:none;transition:border-color .15s,background .15s,transform .12s;
}
.btn:hover{border-color:var(--copper);background:#1c2a34}
.btn:active{transform:translateY(1px)}
.btn.primary{
  border-color:color-mix(in srgb,var(--copper) 70%,#000);
  background:var(--copper);color:var(--copper-ink);
}
.btn.primary:hover{background:#d48a58;border-color:#d48a58}
.btn.quiet{background:transparent;color:var(--muted);border-color:transparent}
.btn.quiet:hover{color:var(--ink);border-color:var(--line)}
.btn.block{width:100%}
.btn-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}

label{display:block;margin:.6rem 0 .28rem;color:var(--muted);font-size:.78rem}
input,select{
  width:100%;min-height:2.5rem;padding:.55rem .7rem;
  border:1px solid var(--line-hot);border-radius:var(--r);
  background:#0a1016;color:var(--ink);
}
input::placeholder{color:var(--faint)}
select{cursor:pointer}

.meta{display:flex;flex-wrap:wrap;gap:.4rem;color:var(--faint);font:.62rem var(--font-mono)}
.meta span{padding:.28rem .45rem;border-left:2px solid var(--line-hot)}
.tag{
  display:inline-flex;align-items:center;padding:.28rem .48rem;
  border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);font:.58rem/1 var(--font-mono);letter-spacing:.06em;text-transform:uppercase;
}
.tag.ok{color:var(--teal);border-color:rgba(107,155,143,.45)}
.tag.warn{color:var(--copper);border-color:rgba(196,120,74,.45)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.82rem}
.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.empty{color:var(--faint);font-size:.84rem}
code,.mono{font-family:var(--font-mono)}
code{color:var(--teal);font-size:.88em}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}

.foot{
  width:min(var(--max),calc(100% - 2*var(--pad)));margin:0 auto;
  padding:0 0 2.5rem;color:var(--faint);font:.6rem/1.5 var(--font-mono);letter-spacing:.04em;
  display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;justify-content:space-between;
  border-top:1px solid var(--line);padding-top:1rem;margin-top:-1rem;
}

/* —— responsive chrome —— */
@media(max-width:900px){
  .top{grid-template-columns:1fr auto;gap:.5rem}
  .nav{grid-column:1/-1;justify-content:flex-start;overflow-x:auto;padding-bottom:.15rem;border-top:1px solid var(--line);padding-top:.4rem}
  .nav a{padding:.45rem .55rem}
}
@media(max-width:540px){
  .brand-sub{display:none}
  .runtime{font-size:.52rem;padding:.3rem .4rem}
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
  active: ProductNav;
  body: string;
  extraCss?: string;
  description?: string;
}): string {
  const nav = (href: string, label: string, key: ProductNav) =>
    `<a href="${href}"${opts.active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  const desc =
    opts.description ||
    "NOEMA — persistent strategy world for humans and agents. PLAY, WATCH, or STUDY.";
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
<link rel="canonical" href="https://noema.guru${opts.active === "home" ? "/" : "/" + opts.active}"/>
${FONTS}
<style>${PRODUCT_CSS}${opts.extraCss || ""}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="/" aria-label="NOEMA home">
    <span class="brand-mark">NOEMA</span>
    <span class="brand-sub">strategy world · stage 0</span>
  </a>
  <nav class="nav" aria-label="Primary">
    ${nav("/", "Home", "home")}
    ${nav("/play", "Play", "play")}
    ${nav("/watch", "Watch", "watch")}
    ${nav("/study", "Study", "study")}
    ${nav("/connect", "Connect", "connect")}
  </nav>
  <div class="runtime" title="Runtime status"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>
</header>
<main id="main" class="wrap">
${opts.body}
</main>
<footer class="foot">
  <span>NOEMA · humans &amp; agents are both Players</span>
  <span>PLAY · WATCH · STUDY · <a href="/admin/login" style="color:inherit;opacity:.75">operator</a></span>
</footer>
<script>
(() => {
  async function ping() {
    const el = document.getElementById("dot");
    const lab = document.getElementById("rt-label");
    try {
      const h = await fetch("/health").then(r => r.json());
      const ready = await fetch("/ready").then(r => r.json()).catch(() => null);
      if (!ready) {
        if (el) el.className = "dot " + (h.status === "ok" ? "warn" : "bad");
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
      if (el) el.className = "dot " + dot;
      if (lab) lab.textContent = label;
    } catch (_) {
      if (el) el.className = "dot bad";
      if (lab) lab.textContent = "offline";
    }
  }
  ping();
})();
</script>
</body>
</html>`;
}
