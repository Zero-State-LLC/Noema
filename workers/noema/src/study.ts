/** Stage 0 STUDY — progressive research path (EXPERIENCE). */

import { productShell } from "./shell";

const EXTRA = `
.study-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:.45rem;margin:0 0 1rem}
@media(max-width:720px){.study-steps{grid-template-columns:1fr 1fr}}
.study-step{
  padding:.75rem .8rem;border:1px solid var(--line);border-radius:var(--r);
  background:#0a1016;cursor:pointer;text-align:left;transition:border-color .12s;
}
.study-step[aria-selected=true]{border-color:var(--copper);background:var(--copper-soft)}
.study-step b{display:block;color:var(--copper);font:.56rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.study-step span{display:block;margin-top:.3rem;color:var(--ink);font-size:.82rem}
.study-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:.85rem}
@media(max-width:720px){.study-metrics{grid-template-columns:1fr 1fr}}
.metric{padding:.85rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016}
.metric strong{display:block;margin-top:.25rem;font:500 1.3rem var(--font-mono)}
.claims{display:flex;flex-wrap:wrap;gap:.35rem;margin:.85rem 0}
.claim{padding:.3rem .5rem;border:1px solid var(--line);border-radius:var(--r);color:var(--faint);font:.56rem var(--font-mono)}
.limit{margin:1rem 0 0;padding:.75rem;border-left:2px solid var(--line-hot);color:var(--faint);font-size:.78rem;line-height:1.45}
.panel[hidden]{display:none!important}
`;

export function studyHtml(): string {
  const body = `
  <header style="margin-bottom:1.25rem">
    <p class="kicker">STUDY / authorized evidence</p>
    <h1>Understand what the world keeps.</h1>
    <p class="lead">STUDY is separate from PLAY. Notice interesting behavior, test it, capture evidence, and learn what reproduced — without rewriting the ledger.</p>
  </header>

  <section class="card pad" style="margin-bottom:1rem">
    <p class="kicker">Stage 0 scope</p>
    <h2 style="font-size:1.25rem;margin-top:.25rem">Evidence path is open; full Lab / Compiler arrive later.</h2>
    <p class="muted">This shell teaches the Specs STUDY path and claim labels. PLAY produces settled world events. Observatory / Lab / CAPTURE land with the research spine — empty evidence stays honest.</p>
    <div class="claims" aria-label="Claim labels">
      <span class="claim">Observed</span>
      <span class="claim">Evidence suggests</span>
      <span class="claim">Possible</span>
      <span class="claim">Cannot determine</span>
    </div>
  </section>

  <div class="study-steps" role="tablist" aria-label="STUDY path">
    <button class="study-step" type="button" role="tab" aria-selected="true" data-step="notice"><b>01 notice</b><span>Interesting</span></button>
    <button class="study-step" type="button" role="tab" aria-selected="false" data-step="test"><b>02 test</b><span>TEST THIS</span></button>
    <button class="study-step" type="button" role="tab" aria-selected="false" data-step="capture"><b>03 capture</b><span>as test</span></button>
    <button class="study-step" type="button" role="tab" aria-selected="false" data-step="learn"><b>04 learn</b><span>what reproduced</span></button>
  </div>

  <div class="study-metrics">
    <div class="metric"><div class="kicker">observed trails</div><strong id="m-trails">0</strong></div>
    <div class="metric"><div class="kicker">test results</div><strong id="m-tests">0</strong></div>
    <div class="metric"><div class="kicker">captured work</div><strong id="m-captured">0</strong></div>
    <div class="metric"><div class="kicker">learned links</div><strong id="m-learn">0</strong></div>
  </div>

  <article class="card pad panel" id="panel-notice">
    <p class="kicker">Interesting</p>
    <h2>Something interesting happened?</h2>
    <p class="muted">NOTICE surfaces candidates from recorded PLAY activity — never mutates production. Stage 0: play the world first; trails appear when Observatory is wired.</p>
    <p class="empty" id="list-notice">No trails captured yet — play the world first.</p>
    <p class="limit">Presentation never invents explanations or hides claim labels.</p>
  </article>

  <article class="card pad panel" id="panel-test" hidden>
    <p class="kicker">TEST THIS</p>
    <h2>Ask a plain-language question.</h2>
    <p class="muted">Common intents compile to deterministic Lab templates. Lab forks never mutate the production ledger.</p>
    <p class="empty">No lab results yet on Stage 0.</p>
    <p class="limit">Simple results retain evidence limits and an advanced-detail route.</p>
  </article>

  <article class="card pad panel" id="panel-capture" hidden>
    <p class="kicker">CAPTURE AS TEST</p>
    <h2>Package a READY result.</h2>
    <p class="muted">One primary action packages a reusable captured behavioral test with provenance. Capture cannot strengthen machine claim labels.</p>
    <p class="empty">No captured tests yet.</p>
  </article>

  <article class="card pad panel" id="panel-learn" hidden>
    <p class="kicker">LEARN</p>
    <h2>What reproduced — not a ranking.</h2>
    <p class="muted">Evidence-backed relationships: depends on, fails without, generalizes to, not yet tested. PLAY is uncoupled from LEARN.</p>
    <p class="empty">No learned behaviors yet.</p>
  </article>

  <div class="btn-row" style="margin-top:1.1rem">
    <a class="btn primary" href="/play">Play first (produce activity)</a>
    <a class="btn quiet" href="/?path=study">Restart STUDY onboarding</a>
  </div>

  <script>
  (() => {
    document.querySelectorAll(".study-step").forEach(btn => {
      btn.addEventListener("click", () => {
        const step = btn.getAttribute("data-step");
        document.querySelectorAll(".study-step").forEach(b => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
        document.querySelectorAll(".panel").forEach(p => { p.hidden = p.id !== "panel-" + step; });
      });
    });
  })();
  </script>
  `;
  return productShell({
    title: "Study",
    active: "study",
    body,
    extraCss: EXTRA,
    description: "STUDY NOEMA evidence — Notice, Test, Capture, Learn. Separate from PLAY.",
  });
}
