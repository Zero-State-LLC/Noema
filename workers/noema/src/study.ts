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
    <p class="kicker">Stage 0 path explainer</p>
    <h2 style="font-size:1.25rem;margin-top:.25rem">Notice / Lab / Capture are not hosted on this gateway.</h2>
    <p class="muted">This page explains the Specs STUDY path. PLAY produces the ledger. This surface does not invent trails, test results, or learned links.</p>
    <div class="claims" aria-label="Claim labels">
      <span class="claim">Observed</span>
      <span class="claim">Evidence suggests</span>
      <span class="claim">Possible</span>
      <span class="claim">Cannot determine</span>
    </div>
  </section>

  <div class="study-steps" role="tablist" aria-label="STUDY path">
    <button class="study-step" type="button" role="tab" id="tab-notice" aria-controls="panel-notice" aria-selected="true" tabindex="0" data-step="notice"><b>01 notice</b><span>Interesting</span></button>
    <button class="study-step" type="button" role="tab" id="tab-test" aria-controls="panel-test" aria-selected="false" tabindex="-1" data-step="test"><b>02 test</b><span>TEST THIS</span></button>
    <button class="study-step" type="button" role="tab" id="tab-capture" aria-controls="panel-capture" aria-selected="false" tabindex="-1" data-step="capture"><b>03 capture</b><span>as test</span></button>
    <button class="study-step" type="button" role="tab" id="tab-learn" aria-controls="panel-learn" aria-selected="false" tabindex="-1" data-step="learn"><b>04 learn</b><span>what reproduced</span></button>
  </div>

  <article class="card pad panel" id="panel-notice" role="tabpanel" aria-labelledby="tab-notice">
    <p class="kicker">Interesting</p>
    <h2>Something interesting happened?</h2>
    <p class="muted">NOTICE will surface candidates from recorded PLAY activity and never mutate production. Observatory is not wired on this host.</p>
    <p class="empty" id="list-notice">No trails are listed here — this page does not invent them.</p>
    <p class="limit">Presentation never invents explanations or hides claim labels.</p>
  </article>

  <article class="card pad panel" id="panel-test" role="tabpanel" aria-labelledby="tab-test" hidden>
    <p class="kicker">TEST THIS</p>
    <h2>Ask a plain-language question.</h2>
    <p class="muted">Lab forks never mutate the production ledger. Lab is not hosted on this gateway yet.</p>
    <p class="empty">No lab runner on Stage 0.</p>
    <p class="limit">Simple results retain evidence limits and an advanced-detail route.</p>
  </article>

  <article class="card pad panel" id="panel-capture" role="tabpanel" aria-labelledby="tab-capture" hidden>
    <p class="kicker">CAPTURE AS TEST</p>
    <h2>Package a READY result.</h2>
    <p class="muted">Capture cannot strengthen machine claim labels. Compiler is not hosted here yet.</p>
    <p class="empty">No capture surface on this gateway.</p>
  </article>

  <article class="card pad panel" id="panel-learn" role="tabpanel" aria-labelledby="tab-learn" hidden>
    <p class="kicker">LEARN</p>
    <h2>What reproduced — not a ranking.</h2>
    <p class="muted">Evidence-backed relationships: depends on, fails without, generalizes to, not yet tested. PLAY is uncoupled from LEARN.</p>
    <p class="empty">No learned index on this gateway.</p>
  </article>

  <div class="btn-row" style="margin-top:1.1rem">
    <a class="btn primary" href="/play">Play first (produce activity)</a>
    <a class="btn quiet" href="/?path=study">Restart STUDY onboarding</a>
  </div>

  <script>
  (() => {
    const tabs = [...document.querySelectorAll(".study-step")];
    function selectTab(btn, focus) {
      const step = btn.getAttribute("data-step");
      tabs.forEach(b => {
        const on = b === btn;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      document.querySelectorAll(".panel").forEach(p => { p.hidden = p.id !== "panel-" + step; });
      if (focus) btn.focus();
    }
    tabs.forEach((btn, i) => {
      btn.addEventListener("click", () => selectTab(btn, false));
      btn.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next, true); }
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
