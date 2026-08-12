/** Shared Stage 0 product chrome (text-first · Specs EXPERIENCE). */

export const PRODUCT_CSS = `:root{color-scheme:dark;--void:#0b1115;--surface:#111a20;--surface-2:#17232a;--ink:#e8efed;--muted:#9aabb0;--faint:#66777e;--line:#2a3a42;--strong:#3e535b;--brass:#e4b56d;--teal:#74c8ba;--ember:#e08072;--mono:"IBM Plex Mono","SFMono-Regular",ui-monospace,monospace;--sans:system-ui,-apple-system,"Segoe UI",sans-serif;--display:"Arial Narrow","Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--void);color:var(--ink);font:15px/1.55 var(--sans)}
body{background:radial-gradient(circle at 12% -8%,rgba(116,200,186,.1),transparent 28rem),radial-gradient(circle at 95% 0%,rgba(228,181,109,.08),transparent 24rem),var(--void)}
a{color:inherit;text-decoration:none}button,input,select{font:inherit}button{cursor:pointer;color:inherit;background:none;border:0}button:disabled{opacity:.45;cursor:not-allowed}
button:focus-visible,input:focus-visible,a:focus-visible,select:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.skip{position:fixed;z-index:30;top:.6rem;left:.6rem;padding:.45rem .7rem;background:var(--brass);color:var(--void);transform:translateY(-160%)}.skip:focus{transform:none}
.top{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:.75rem 1.2rem;align-items:center;justify-content:space-between;padding:.75rem clamp(.8rem,3vw,2rem);border-bottom:1px solid rgba(74,98,106,.65);background:rgba(11,17,21,.92);backdrop-filter:blur(12px)}
.brand{font:800 1.1rem var(--display);letter-spacing:.22em}.brand span{display:block;margin-top:.15rem;color:var(--faint);font:.62rem var(--mono);letter-spacing:.1em;text-transform:uppercase}
.nav{display:flex;flex-wrap:wrap;gap:.15rem}.nav a{padding:.5rem .65rem;color:var(--muted);font:700 .7rem var(--display);letter-spacing:.14em;text-transform:uppercase}.nav a[aria-current=page],.nav a:hover{color:var(--ink)}
.runtime{display:inline-flex;gap:.4rem;align-items:center;padding:.35rem .55rem;border:1px solid var(--line);color:var(--muted);font:.62rem var(--mono);text-transform:uppercase}.dot{width:.45rem;height:.45rem;border-radius:50%;background:var(--faint)}.dot.ok{background:var(--teal)}.dot.warn{background:var(--brass)}.dot.bad{background:var(--ember)}
.wrap{width:min(1100px,calc(100% - 1.5rem));margin:0 auto;padding:1.5rem 0 3rem}
.kicker{color:var(--brass);font:700 .66rem/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase}
h1{margin:.25rem 0 .5rem;font:800 clamp(2rem,6vw,3.6rem)/1 var(--display);letter-spacing:-.04em}
h2{margin:.2rem 0 .45rem;font:800 clamp(1.3rem,3vw,2rem)/1.05 var(--display);letter-spacing:-.03em}
.lead,.muted{color:var(--muted)}p{margin:.4rem 0}
.card{border:1px solid var(--line);background:linear-gradient(145deg,rgba(23,35,42,.95),rgba(15,23,28,.96))}
.pad{padding:1rem 1.1rem}
.btn{display:inline-flex;min-height:2.5rem;align-items:center;justify-content:center;padding:.55rem .85rem;border:1px solid var(--strong);border-radius:2px;background:var(--surface-2);font-weight:700}
.btn.primary{border-color:#a37d48;color:var(--void);background:var(--brass)}.btn.primary:hover{background:#f0c783}
.btn.quiet{background:transparent;color:var(--muted)}
.btn.block{width:100%}
.meta{display:flex;flex-wrap:wrap;gap:.4rem;color:var(--faint);font:.65rem var(--mono)}.meta span{padding:.3rem .45rem;border-left:2px solid var(--strong)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.8rem}.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.foot{margin-top:2rem;color:var(--faint);font:.62rem var(--mono)}
.empty{color:var(--faint);font-size:.82rem}
code{color:var(--teal);font-family:var(--mono);font-size:.86em}
label{display:block;margin:.55rem 0 .25rem;color:var(--muted);font-size:.74rem}
input,select{width:100%;min-height:2.4rem;padding:.5rem .65rem;border:1px solid var(--strong);border-radius:2px;color:var(--ink);background:#0f171c}
.tag{display:inline-block;padding:.28rem .45rem;border:1px solid var(--strong);color:var(--muted);font:.6rem var(--mono);letter-spacing:.06em;text-transform:uppercase}
.tag.ok{color:var(--teal);border-color:rgba(116,200,186,.45)}.tag.warn{color:var(--brass)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:720px){.nav a{padding:.45rem .4rem;font-size:.62rem}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

export type ProductNav = "home" | "play" | "watch" | "study" | "connect";

export function productShell(opts: {
  title: string;
  active: ProductNav;
  body: string;
  extraCss?: string;
  extraHead?: string;
}): string {
  const nav = (href: string, label: string, key: ProductNav) =>
    `<a href="${href}"${opts.active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0b1115"/>
<title>${opts.title} · NOEMA</title>
<meta name="description" content="NOEMA — persistent strategy world for humans and agents. PLAY, WATCH, or STUDY."/>
<style>${PRODUCT_CSS}${opts.extraCss || ""}</style>
${opts.extraHead || ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="brand"><a href="/" aria-label="NOEMA home">NOEMA</a><span>stage 0 · text world</span></div>
  <nav class="nav" aria-label="Primary">
    ${nav("/", "Home", "home")}
    ${nav("/play", "Play", "play")}
    ${nav("/watch", "Watch", "watch")}
    ${nav("/study", "Study", "study")}
    ${nav("/connect", "Connect", "connect")}
  </nav>
  <div class="runtime"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>
</header>
<main id="main" class="wrap">
${opts.body}
</main>
<p class="foot">NOEMA · humans and agents are both Players · PLAY / WATCH / STUDY · Specs-aligned Stage 0</p>
<script>
(() => {
  async function ping() {
    try {
      const h = await fetch("/health").then(r => r.json());
      const ready = await fetch("/ready").then(r => r.json()).catch(() => null);
      const live = Boolean(ready && ready.ready);
      const el = document.getElementById("dot");
      const lab = document.getElementById("rt-label");
      if (el) { el.className = "dot " + (live ? "ok" : h.status === "ok" ? "warn" : "bad"); }
      if (lab) lab.textContent = live ? "world ready" : h.status === "ok" ? "world waiting" : "offline";
    } catch (_) {
      const el = document.getElementById("dot");
      const lab = document.getElementById("rt-label");
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
