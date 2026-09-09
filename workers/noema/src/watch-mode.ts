/**
 * Chamber projection mode. Query wins, then hash, then stored preference.
 * Default PIXEL matches the existing phosphor boot. One leaf so the /watch
 * IIFE can embed it without bundler keepNames (`__name`).
 */

export type WatchMode = "text" | "pixel" | "map";

export function parseWatchMode(
  search?: string | null,
  hash?: string | null,
  stored?: string | null,
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
  let m = String(raw || "").trim().toLowerCase();
  if (m === "text" || m === "pixel" || m === "map") return m;
  const h = String(hash || "");
  m = (h.charAt(0) === "#" ? h.slice(1) : h).trim().toLowerCase();
  if (m === "text" || m === "pixel" || m === "map") return m;
  m = String(stored || "").trim().toLowerCase();
  if (m === "text" || m === "pixel" || m === "map") return m;
  return "pixel";
}

/** Leaf source for the /watch IIFE. Fail if wrangler keepNames leaked. */
export function watchModeInlineSource(): string {
  const src = parseWatchMode.toString();
  if (src.includes("__name")) {
    throw new Error("watch mode helper leaked bundler keepNames");
  }
  return src;
}
