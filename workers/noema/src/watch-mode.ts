/**
 * WATCH view (Noema-Specs specify/watch-single-3d-stage.md D1, D3). The 3D
 * Chamber stage is the default; the TEXT / PIXEL / MAP rail is retired.
 * Old links keep resolving: `text` is the text map with the stage unmounted;
 * `pixel`, `map` and `3d` open the stage. Query wins, then hash. The view is
 * not persisted: Low noise is the lasting text-only preference. One leaf so
 * the /watch IIFE can embed it without bundler keepNames (`__name`).
 */

export type WatchMode = "text" | "3d";

export function parseWatchMode(
  search?: string | null,
  hash?: string | null,
  // Accepted for call-site compatibility; stored legacy modes are ignored (D3).
  _stored?: string | null,
): WatchMode {
  let raw = "";
  const q = String(search || "");
  const idx = q.indexOf("mode=");
  if (idx >= 0 && (idx === 0 || q.charAt(idx - 1) === "?" || q.charAt(idx - 1) === "&")) {
    let rest = q.slice(idx + 5);
    const amp = rest.indexOf("&");
    if (amp >= 0) rest = rest.slice(0, amp);
    const cut = rest.indexOf("#");
    if (cut >= 0) rest = rest.slice(0, cut);
    try {
      raw = decodeURIComponent(rest.replace(/\+/g, " "));
    } catch (e) {
      raw = rest;
    }
  }
  // No inner functions here: wrangler keepNames would wrap them (see watchModeInlineSource).
  const h = String(hash || "");
  const candidates = [raw, h.charAt(0) === "#" ? h.slice(1) : h];
  for (let i = 0; i < candidates.length; i++) {
    const m = String(candidates[i] || "").trim().toLowerCase();
    if (m === "text") return "text";
    if (m === "pixel" || m === "map" || m === "3d") return "3d";
  }
  return "3d";
}

/** Leaf source for the /watch IIFE. Fail if wrangler keepNames leaked. */
export function watchModeInlineSource(): string {
  const src = parseWatchMode.toString();
  if (src.includes("__name")) {
    throw new Error("watch mode helper leaked bundler keepNames");
  }
  return src;
}
