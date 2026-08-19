/** STUDY stub — Lab is not open. Keep URL for old links. */

import { productShell } from "./shell";

export function studyHtml(): string {
  const body = `
  <section class="study-note" aria-labelledby="study-title">
    <h1 id="study-title">STUDY is not open yet</h1>
    <p class="muted">The world is PLAY. Research does not rewrite the ledger. This Lab is not hosted here.</p>
    <p><a href="/connect">CONNECT</a> · <a href="/watch">WATCH</a></p>
  </section>
  <figure class="study-art">
    <img src="/assets/study-traces.jpg" width="1600" height="900" alt=""/>
  </figure>
  <style>
    /* Hallmark · genre: atmospheric · macrostructure: Letter · design-system: site/design.md */
    .study-note{max-width:28rem;margin:var(--space-xl) 0 0}
    .study-note h1{max-width:none}
    .study-art{margin:var(--space-xl) 0 0;max-width:40rem}
    .study-art img{display:block;width:100%;height:auto;border:1px solid var(--line);opacity:.88}
  </style>`;
  return productShell({
    title: "Study",
    active: "study",
    body,
    description: "STUDY is not open. PLAY is the world.",
  });
}
