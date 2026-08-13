/**
 * Product door — Player login + Operator login only.
 */

import { adminEmailGateMarkup } from "./admin";
import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
.door{width:min(28rem,100%);margin:2rem auto 0;display:grid;gap:1rem}
.door h1{margin:0 0 .15rem;font-size:clamp(2.4rem,8vw,3.4rem);max-width:none;text-align:center}
.door .place{margin:0 0 .5rem;text-align:center}
#play-continue[hidden]{display:none!important}
`;

export function landingHtml(): string {
  const body = `
  <section class="door" aria-labelledby="home-title">
    <div>
      <h1 id="home-title">NOEMA</h1>
      <p class="muted place">Perihelion Reach</p>
    </div>
    <article class="card pad" aria-labelledby="play-login-heading">
      <p class="kicker" id="play-login-heading">Play</p>
      ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
    </article>
    <article class="card pad" aria-labelledby="op-login-heading">
      <p class="kicker" id="op-login-heading">Operator</p>
      ${adminEmailGateMarkup()}
    </article>
  </section>`;

  return productShell({
    title: "Home",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "Sign in to PLAY or the operator plane.",
  });
}
