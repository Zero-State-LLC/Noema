/**
 * Product door — Perihelion Reach + Player email only.
 */

import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · genre: atmospheric · macrostructure: Letter · design-system: site/design.md */
.door{
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(16rem,20rem);
  gap:var(--space-lg) var(--space-xl);align-items:end;
  margin:var(--space-xl) 0 0;max-width:52rem;
}
.door h1{margin:0;max-width:none;font-size:clamp(2.4rem,6vw,3.5rem)}
.door .place{margin:0 0 .4rem;color:var(--copper);font:550 1rem/1.35 var(--font-display)}
.door .invite{margin:.55rem 0 0;color:var(--muted);max-width:28rem}
.door-gate{min-width:0}
#play-continue[hidden]{display:none!important}
.miss{max-width:28rem;margin:var(--space-xl) 0 0}
.miss h1{max-width:none}
.miss .place{margin:0 0 .35rem;color:var(--faint);font:.85rem var(--font-body)}
@media(max-width:760px){.door{grid-template-columns:1fr;gap:var(--space-lg)}}
#main.wrap{
  background:url(/assets/topology-bg.jpg) center top/cover no-repeat;
}
.door-art{margin:var(--space-xl) 0 0;max-width:52rem}
.door-art img{display:block;width:100%;height:auto;border:1px solid var(--line);opacity:.88}
`;

export function landingHtml(): string {
  const body = `
  <section class="door" aria-labelledby="home-title">
    <div>
      <p class="place">Perihelion Reach</p>
      <h1 id="home-title">NOEMA</h1>
      <p class="invite">A frontier station on a worn trade line. Enter the world.</p>
    </div>
    <div class="door-gate" aria-labelledby="play-login-heading">
      <h2 id="play-login-heading" class="sr">Enter</h2>
      ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
    </div>
  </section>
  <figure class="door-art">
    <img src="/assets/hero-phosphor.jpg" width="1600" height="900" alt=""/>
  </figure>`;

  return productShell({
    title: "Perihelion Reach",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "Perihelion Reach — enter the world.",
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
      <a class="btn primary" href="/play">Enter world</a>
    </p>
  </section>`;
  return productShell({
    title: "Not found",
    body,
    extraCss: EXTRA,
    description: "That path is not in this world.",
  });
}
