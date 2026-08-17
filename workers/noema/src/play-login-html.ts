/**
 * Public Player email gate + magic-link callback (admin ≠ player).
 */

import { productShell } from "./shell";

export function playEmailGateMarkup(opts: { continueToPlay?: boolean; operatorLink?: boolean } = {}): string {
  const continueToPlay = Boolean(opts.continueToPlay);
  const operatorLink = opts.operatorLink !== false;
  return `
<form id="play-login-form">
  <p class="muted">A link signs you into the world.</p>
  <label for="email">Email</label>
  <input id="email" type="email" autocomplete="username" required/>
  <button class="btn primary block form-submit" type="submit">Send play link</button>
</form>
${continueToPlay ? `<a class="btn primary block" id="play-continue" href="/play" hidden>Continue to PLAY</a>` : ""}
<p class="notice" id="play-login-notice" role="status"></p>
${operatorLink ? `<p class="empty operator-link"><a href="/admin/login">Operator login</a></p>` : ""}
<script>
(() => {
  const form = document.getElementById("play-login-form");
  const notice = document.getElementById("play-login-notice");
  const email = document.getElementById("email");
  ${continueToPlay ? `const cont = document.getElementById("play-continue");
  if (cont && sessionStorage.getItem("noema.play.token")) cont.hidden = false;` : ""}
  if (!form || !notice || !email) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    notice.className = "notice";
    notice.textContent = "Requesting play link…";
    try {
      const res = await fetch("/v1/play/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
      notice.className = "notice ok";
      notice.textContent = data.message;
    } catch (err) {
      notice.className = "notice bad";
      notice.textContent = err.message || "Could not send play link";
    }
  });
})();
</script>`;
}

export function playCallbackHtml(): string {
  const body = `
  <section class="card pad" aria-labelledby="callback-title">
    <p class="kicker">World entry</p>
    <h1 id="callback-title">Entering the world…</h1>
    <p class="muted">Confirming the play link.</p>
    <p class="notice" id="notice" role="status">Checking the link…</p>
  </section>
<script>
(() => {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const token_hash = search.get("token_hash") || hash.get("token_hash") || "";
  const type = search.get("type") || hash.get("type") || "";
  const code = search.get("code") || hash.get("code") || "";
  (async () => {
    try {
      const res = await fetch("/v1/play/login/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_hash, type, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error("not authorized");
      sessionStorage.setItem("noema.play.token", data.access_token);
      const raw = search.get("next") || hash.get("next") || "";
      const next = raw === "/connect" || raw === "connect" ? "/connect" : "/play";
      location.href = next;
    } catch (err) {
      location.href = "/play?error=1";
    }
  })();
})();
</script>`;
  return productShell({
    title: "Play login",
    active: "play",
    body,
    description: "Confirming the login link.",
  });
}
