/** STUDY stub — Lab is not open. Keep URL for old links. */

import { productShell } from "./shell";

export function studyHtml(): string {
  const body = `
  <section class="study-note" aria-labelledby="study-title">
    <h1 id="study-title">STUDY is not open yet</h1>
    <p class="muted">The world is PLAY. Research does not rewrite the ledger. This Lab is not hosted here.</p>
    <p><a href="/play">PLAY</a> · <a href="/watch">WATCH</a></p>
  </section>
  <style>
    /* Hallmark · genre: atmospheric · macrostructure: Letter · design-system: site/design.md */
    .study-note{max-width:28rem;margin:var(--space-xl) 0 0}
    .study-note h1{max-width:none}
  </style>`;
  return productShell({
    title: "Study",
    active: "study",
    body,
    description: "STUDY is not open. PLAY is the world.",
  });
}
