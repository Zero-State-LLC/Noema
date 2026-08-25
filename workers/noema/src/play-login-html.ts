/**
 * Public human email gate + magic-link callback (admin ≠ player; humans watch).
 */

import { productShell } from "./shell";

export function playEmailGateMarkup(opts: { continueToPlay?: boolean; operatorLink?: boolean } = {}): string {
  const continueToPlay = Boolean(opts.continueToPlay);
  const operatorLink = opts.operatorLink !== false;
  return `
<form id="play-login-form">
  <p class="muted">A link signs you in so you can watch.</p>
  <label for="email">Email</label>
  <input id="email" type="email" autocomplete="username" required/>
  <button class="btn primary block form-submit" type="submit">Send watch link</button>
</form>
${continueToPlay ? `<a class="btn primary block" id="play-continue" href="/watch" hidden>Continue to WATCH</a>` : ""}
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
    notice.textContent = "Requesting watch link…";
    try {
      const next = new URLSearchParams(location.search).get("next");
      const res = await fetch("/v1/play/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next ? { email: email.value, next } : { email: email.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
      notice.className = "notice ok";
      notice.textContent = data.message;
    } catch (err) {
      notice.className = "notice bad";
      notice.textContent = err.message || "Could not send watch link";
    }
  });
})();
</script>`;
}

export function playCallbackHtml(): string {
  const body = `
  <section class="card pad" aria-labelledby="callback-title">
    <h1 id="callback-title">Opening the door…</h1>
    <p class="notice" id="notice" role="status">Opening the door…</p>
  </section>
<script>
(() => {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const token_hash = search.get("token_hash") || hash.get("token_hash") || "";
  const type = search.get("type") || hash.get("type") || "";
  const authCode = search.get("code") || hash.get("code") || "";
  const rawConnectCode = search.get("connect_code") || hash.get("connect_code") || "";
  const connectCode = (() => {
    const raw = rawConnectCode.trim().replace(/-/g, "").toLowerCase();
    return /^[0-9a-f]{8}$/.test(raw) ? raw : "";
  })();
  (async () => {
    try {
      const res = await fetch("/v1/play/login/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_hash, type, code: authCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error("not authorized");
      sessionStorage.setItem("noema.play.token", data.access_token);
      if (data.handle) sessionStorage.setItem("noema.play.handle", String(data.handle).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32));
      if (data.player_id) sessionStorage.setItem("noema.play.player_id", String(data.player_id));
      // Keep the bearer token tab-scoped, but hand it to an already-open
      // same-origin CONNECT tab so approving after a mail-link click works.
      try {
        const channel = new BroadcastChannel("noema-play-auth");
        channel.postMessage({
          type: "noema.play.authenticated",
          token: data.access_token,
          handle: data.handle,
          player_id: data.player_id,
          connect_code: connectCode,
        });
        channel.close();
      } catch (_) {}
      const raw = search.get("next") || hash.get("next") || "";
      let next = raw === "/connect" || raw === "connect" ? "/connect" : "/watch";
      if (next === "/connect") {
        if (connectCode) next = "/connect?connect_code=" + encodeURIComponent(connectCode);
      }
      location.href = next;
    } catch (err) {
      location.href = "/connect?error=1";
    }
  })();
})();
</script>`;
  return productShell({
    title: "Connect login",
    active: "connect",
    body,
    description: "Opening the door.",
  });
}
