/** STUDY stub — Lab is not open. Keep URL for old links. */

import { productShell } from "./shell";

export function studyHtml(): string {
  const body = `
  <section class="card pad" style="max-width:32rem;margin:2rem auto">
    <h1>STUDY is not open yet</h1>
    <p class="muted">The world is PLAY. Research does not rewrite the ledger. This Lab is not hosted on Stage 0.</p>
    <p><a href="/play">PLAY</a> · <a href="/watch">WATCH</a></p>
  </section>`;
  return productShell({
    title: "Study",
    active: "study",
    body,
    description: "STUDY is not open. PLAY is the world.",
  });
}
