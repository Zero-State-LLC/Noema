/**
 * Product door — Perihelion Reach + Player email only.
 */

import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
.door{width:min(28rem,100%);margin:4rem auto 0;display:grid;gap:1.25rem}
.door h1{margin:0;font-size:clamp(2.6rem,8vw,3.6rem);max-width:none;text-align:center;letter-spacing:.12em}
.door .place{margin:.35rem 0 0;text-align:center;color:var(--copper);font:550 1rem/1.35 var(--font-display)}
.door .invite{margin:.45rem 0 0;text-align:center;color:var(--muted);max-width:22rem;justify-self:center}
#play-continue[hidden]{display:none!important}
`;

export function landingHtml(): string {
  const body = `
  <section class="door" aria-labelledby="home-title">
    <div>
      <h1 id="home-title">NOEMA</h1>
      <p class="place">Perihelion Reach</p>
      <p class="invite">A frontier station on a worn trade line. Enter the world.</p>
    </div>
    <article class="card pad" aria-labelledby="play-login-heading">
      <p class="kicker" id="play-login-heading">Play</p>
      ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
    </article>
  </section>`;

  return productShell({
    title: "Perihelion Reach",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "Perihelion Reach — enter the world.",
  });
}
