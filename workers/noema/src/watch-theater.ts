/**
 * Public WATCH TEXT facts for an uninvolved spectator.
 * Paints only fields already on the public snapshot. Never invents actors,
 * sites, or consequences. Stringified into the /watch client; each function
 * is a leaf so the inlined script does not depend on bundler names.
 */

export const NOT_PROJECTED_PUBLICLY = "not projected publicly";
export const WITHHELD_NONE = "None marked";
export const WITHHELD_NOTICE_AUTHOR = "Notice author is not projected publicly";
export const WITHHELD_INSTITUTION = "Institution name is not projected publicly";
export const WITHHELD_FOLLOWED_SITE = "Followed agent site is not projected publicly";
export const WITHHELD_LEDE = "Private sites and motives stay off this window.";

export type TheaterEvent = {
  sequence?: number;
  projection_id?: string;
  line?: string;
  actor_label?: string;
  room_id?: string;
  consequence?: string;
};

export function theaterEventPool(
  head: TheaterEvent | null,
  events?: Array<TheaterEvent | null | undefined> | null,
): TheaterEvent[] {
  const out: TheaterEvent[] = [];
  const seen: Record<string, number> = {};
  const list: Array<TheaterEvent | null | undefined> = [head];
  if (Array.isArray(events)) {
    for (let i = 0; i < events.length; i++) list.push(events[i]);
  }
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e) continue;
    const k = String(e.sequence || 0) + ":" + String(e.projection_id || "") + ":" + String(e.line || "");
    if (seen[k]) continue;
    seen[k] = 1;
    out.push(e);
  }
  return out;
}

/** Recently row. Omit a slot when the public field is empty. */
export function recentFactParts(actor?: string | null, site?: string | null, consequence?: string | null): string[] {
  const out: string[] = [];
  const who = String(actor || "").trim();
  const where = String(site || "").trim();
  const con = String(consequence || "").trim();
  if (who) out.push("Who " + who);
  if (where) out.push("Where " + where);
  if (con) out.push("Consequence " + con);
  return out;
}

/** Join public phrases with a visible separator. Never concatenate `authority.Consequence` / `ExchangeWho`. */
export function joinWatchPhrases(parts?: Array<string | null | undefined> | null): string {
  const out: string[] = [];
  const list = Array.isArray(parts) ? parts : [];
  for (let i = 0; i < list.length; i++) {
    const t = String(list[i] || "").trim();
    if (!t) continue;
    out.push(t);
  }
  return out.join(" · ");
}

/** NOW/hero slot. Missing public fields stay an explicit absence. */
export function heroFactValue(raw?: string | null): string {
  const t = String(raw || "").trim();
  return t || "not projected publicly";
}

export function namedListLine(kind?: string | null, names?: string[] | null): string {
  const label = String(kind || "").trim() || "Named";
  const out: string[] = [];
  const list = Array.isArray(names) ? names : [];
  for (let i = 0; i < list.length; i++) {
    const n = String(list[i] || "").trim();
    if (!n) continue;
    if (out.indexOf(n) >= 0) continue;
    out.push(n);
  }
  if (!out.length) return label + ": none named";
  return label + ": " + out.join(", ");
}

export function agentsInPublicSitesCaption(count: number): string {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return "Agents in public sites: 0";
  return "Agents in public sites: " + Math.floor(n);
}

/**
 * Honest absence from a public event only. A missing actor on a notice or
 * org pulse is projectable; other missing fields are silence, not a hint.
 */
export function withheldFromProjection(projectionId?: string | null, actor?: string | null): string {
  const pid = String(projectionId || "");
  const who = String(actor || "").trim();
  if (who) return "";
  if (pid === "message_notice" || pid === "notice") {
    return "Notice author is not projected publicly";
  }
  if (pid === "organization") return "Institution name is not projected publicly";
  return "";
}

export function withheldBandLines(marks?: string[] | null): string[] {
  const out: string[] = [];
  const list = Array.isArray(marks) ? marks : [];
  for (let i = 0; i < list.length; i++) {
    const m = String(list[i] || "").trim();
    if (!m) continue;
    if (out.indexOf(m) >= 0) continue;
    out.push(m);
  }
  if (!out.length) return ["None marked"];
  return out;
}

export function followedSiteWithheld(followKind: string, inPublicSite: boolean): string {
  if (followKind !== "agent") return "";
  if (inPublicSite) return "";
  return "Followed agent site is not projected publicly";
}

const THEATER_INLINE_FNS = [
  theaterEventPool,
  recentFactParts,
  joinWatchPhrases,
  heroFactValue,
  namedListLine,
  agentsInPublicSitesCaption,
  withheldFromProjection,
  withheldBandLines,
  followedSiteWithheld,
] as const;

/**
 * Leaf sources for the /watch IIFE. Wrangler keepNames wraps nested named
 * functions as `__name(fn, "name")`; those calls abort the browser script.
 */
export function watchTheaterInlineSource(): string {
  return THEATER_INLINE_FNS.map((fn) => {
    const src = fn.toString();
    if (src.includes("__name")) {
      throw new Error("watch theater helper leaked bundler keepNames");
    }
    return src;
  }).join("\n");
}
