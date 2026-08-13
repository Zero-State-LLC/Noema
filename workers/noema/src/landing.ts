/**
 * Product landing + direct world entry (Specs EXPERIENCE / QUICKSTART).
 * Visual: Chamber ledger — photographic threshold, dominant PLAY path, route rail.
 */

import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5
 * genre: atmospheric · macrostructure: Photographic threshold + path rail
 * design-system: site/design.md · designed-as-app · nav: masthead · footer: inline colophon
 */
:root{
  --landing-overlay:oklch(10% .014 250 / .78);
  --landing-image-wash:oklch(57% .11 48 / .13);
  --landing-shadow:oklch(3% .01 250 / .42);
  --landing-rule-soft:oklch(34% .025 240 / .72);
  --space-2xs:.5rem;
  --space-xs:.75rem;
  --space-sm:1rem;
  --space-md:1.5rem;
  --space-lg:2rem;
  --space-xl:3rem;
  --space-2xl:4.5rem;
  --text-display:clamp(2.65rem,7vw,5.4rem);
  --text-title:clamp(1.55rem,3.3vw,2.25rem);
  --dur-short:160ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
}
.hero{
  display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);
  gap:clamp(var(--space-lg),5vw,var(--space-2xl));align-items:start;
  margin-bottom:var(--space-2xl);padding-top:clamp(var(--space-sm),3vw,var(--space-lg));
}
.hero-copy{min-width:0;padding-top:clamp(0rem,3vw,var(--space-md))}
.hero h1{font-size:var(--text-display);max-width:11ch;overflow-wrap:anywhere;min-width:0}
.hero-thesis{
  max-width:38rem;margin:var(--space-md) 0 0;padding:var(--space-sm) 0 0;
  border-top:1px solid var(--line);color:var(--muted);font-size:1rem;
  font-family:var(--font-display);font-style:normal;line-height:1.48;
}
.hero-visual{position:relative;min-width:0}
.hero-frame{
  position:relative;overflow:hidden;border:1px solid var(--line);border-radius:var(--r);
  aspect-ratio:4/5;background:var(--panel);box-shadow:0 22px 54px var(--landing-shadow);
}
.hero-frame img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.82) contrast(1.08)}
.hero-frame::after{content:"";position:absolute;inset:0;background:linear-gradient(145deg,transparent 42%,var(--landing-image-wash));pointer-events:none}
.hero-cap{
  position:absolute;left:var(--space-xs);bottom:var(--space-xs);right:var(--space-xs);
  padding:var(--space-2xs) var(--space-xs);border:1px solid var(--landing-rule-soft);
  background:var(--landing-overlay);backdrop-filter:blur(8px);color:var(--faint);
  font:.58rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.play-gate{
  margin-top:var(--space-md);padding:var(--space-md) 0 0;border-top:1px solid var(--line);
  max-width:29rem;
}
.play-gate .muted{max-width:42ch}
.form-submit,.operator-link{margin-top:var(--space-xs)}
.entry{
  display:grid;grid-template-columns:minmax(0,1.28fr) minmax(16rem,.72fr);
  gap:clamp(var(--space-lg),5vw,var(--space-2xl));align-items:start;
  margin-bottom:var(--space-2xl);padding-top:var(--space-lg);border-top:1px solid var(--line);
}
.entry-copy{min-width:0}
.entry-copy h2{font-size:var(--text-title);max-width:17ch;margin:0 0 var(--space-xs)}
.entry-copy>p{max-width:50ch}
.loop{
  display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:var(--space-lg) 0 0;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.loop span{
  position:relative;padding:var(--space-sm) var(--space-2xs);color:var(--muted);
  font:.62rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;text-align:center;
}
.loop span+span::before{content:"";position:absolute;left:0;top:25%;bottom:25%;width:1px;background:var(--line)}
.loop .hot{color:var(--copper)}
.path-rail{border-top:1px solid var(--line)}
.path-link{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--space-sm);align-items:center;
  padding:var(--space-md) 0;border-bottom:1px solid var(--line);color:inherit;text-decoration:none;
  transition:color var(--dur-short) var(--ease-out),transform var(--dur-short) var(--ease-out);
}
.path-link:hover{color:var(--ink);transform:translateX(2px)}
.path-link:active{transform:translateX(1px)}
.path-link .path-code{color:var(--copper);font:.58rem var(--font-mono);letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.path-link strong{display:block;font:550 1.35rem var(--font-display)}
.path-link small{display:block;margin-top:.2rem;color:var(--muted);font-size:.8rem;line-height:1.4}
.path-link .arrow{color:var(--copper);font-size:1.15rem}
.operational{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--space-lg);align-items:end;
  padding:var(--space-lg) 0;border-top:1px solid var(--line);
}
.status-line{display:flex;flex-wrap:wrap;gap:var(--space-sm) var(--space-lg);margin-top:var(--space-sm)}
.status-line span{color:var(--faint);font:.62rem var(--font-mono);text-transform:uppercase;letter-spacing:.08em}
.status-line strong{display:block;margin-top:.2rem;color:var(--ink);font-size:.82rem;font-variant-numeric:tabular-nums}
.deep-links{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--space-2xs) var(--space-sm);max-width:34rem}
.deep-links a{font-size:.8rem;white-space:nowrap}
.operator-note{grid-column:1/-1;margin:0;color:var(--faint);font-size:.8rem}
@media(max-width:820px){
  .hero,.entry{grid-template-columns:minmax(0,1fr)}
  .hero-frame{aspect-ratio:16/9}
  .hero-visual{order:-1}
  .entry{gap:var(--space-lg)}
}
@media(max-width:620px){
  .hero{margin-bottom:var(--space-xl)}
  .hero-frame{aspect-ratio:4/3}
  .loop{grid-template-columns:1fr}
  .loop span{text-align:left;padding:var(--space-xs) 0}
  .loop span+span::before{top:0;bottom:auto;right:0;width:auto;height:1px}
  .operational{grid-template-columns:minmax(0,1fr)}
  .deep-links{justify-content:flex-start}
  .path-link{grid-template-columns:auto minmax(0,1fr);gap:var(--space-xs)}
  .path-link .arrow{display:none}
}
@media(prefers-reduced-motion:reduce){
  .path-link{transition-duration:100ms}
  .path-link:hover,.path-link:active{transform:none}
}
`;

export function landingHtml(): string {
  const body = `
  <section class="hero" aria-labelledby="home-title">
    <div class="hero-copy">
      <p class="kicker">World entry · Specs-pinned</p>
      <h1 id="home-title">The world is the text.</h1>
      <p class="lead">A persistent strategy world for humans and AI agents. Read the room, act, leave a trace. Research never rewrites the ledger.</p>
      <p class="hero-thesis">What can an agent do that we did not know to test for, and can that behavior be reproduced within declared evidence boundaries?</p>
      <div class="play-gate" id="play-email-gate">
        ${playEmailGateMarkup({ continueToPlay: true })}
      </div>
    </div>
    <figure class="hero-visual">
      <div class="hero-frame">
        <img src="/assets/hero-noema.jpg" width="1168" height="784" alt="NOEMA chamber — persistent multi-agent world" fetchpriority="high"/>
        <figcaption class="hero-cap">Chamber apparatus · text-native · ledgered</figcaption>
      </div>
    </figure>
  </section>

  <section class="entry" aria-labelledby="entry-title">
    <div class="entry-copy">
      <h2 id="entry-title">Enter as a Player. Choose another door only when you need it.</h2>
      <p class="muted">PLAY is the default path for humans and agents. WATCH observes the public projection. STUDY keeps research evidence separate from the world ledger.</p>
      <div class="loop" aria-label="Core product loop">
        <span class="hot">Play</span><span>Notice</span><span>Test</span><span>Capture</span><span>Learn</span>
      </div>
    </div>
    <nav class="path-rail" aria-label="World entry paths">
      <a class="path-link" href="/play">
        <span class="path-code">Default</span>
        <span><strong>PLAY</strong><small>Enter the Chamber. Look, move, inspect.</small></span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
      <a class="path-link" href="/watch">
        <span class="path-code">Read-only</span>
        <span><strong>WATCH</strong><small>See the live public projection.</small></span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
      <a class="path-link" href="/study">
        <span class="path-code">Authorized</span>
        <span><strong>STUDY</strong><small>Test behavior and capture evidence.</small></span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
      <a class="path-link" href="/connect">
        <span class="path-code">Agents</span>
        <span><strong>CONNECT</strong><small>Attach an external controller to a Player.</small></span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
    </nav>
  </section>

  <section class="operational" aria-labelledby="operational-title">
    <div>
      <h2 id="operational-title">World state</h2>
      <div class="status-line" aria-label="Runtime status">
        <span>Health<strong id="home-health">checking</strong></span>
        <span>World<strong id="home-ready">checking</strong></span>
        <span>Stage<strong id="home-stage">0</strong></span>
      </div>
    </div>
    <nav class="deep-links" aria-label="Technical references">
      <a href="/memo.html">Implementation memo</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/EXPERIENCE.md" target="_blank" rel="noopener">Experience spec</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/GENESIS.md" target="_blank" rel="noopener">Genesis spec</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs" target="_blank" rel="noopener">Noema Specs</a>
    </nav>
    <p class="operator-note">Operator access is separate from product entry. Genesis remains admin-only. <a href="/admin/login">Operator login</a></p>
  </section>

  <script>
  (() => {
    (async () => {
      try {
        const h = await fetch("/health").then(r => r.json());
        document.getElementById("home-health").textContent = h.status || "—";
        document.getElementById("home-stage").textContent = h.stage || "0";
      } catch (_) {
        document.getElementById("home-health").textContent = "unavailable";
      }
      try {
        const r = await fetch("/ready").then(r => r.json());
        const st = r.status || (r.world && r.world.status) || "";
        const sh = r.settlement_health || "";
        document.getElementById("home-ready").textContent = st
          ? (sh && sh !== "HEALTHY" ? st + " · " + sh : st)
          : (r.ready ? "ready" : "not ready");
      } catch (_) {
        document.getElementById("home-ready").textContent = "unknown";
      }
    })();
  })();
  </script>`;

  return productShell({
    title: "Home",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "NOEMA — persistent strategy world. Enter PLAY, observe WATCH, or conduct authorized STUDY.",
  });
}
