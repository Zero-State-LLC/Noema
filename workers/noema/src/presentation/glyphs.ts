/**
 * 14 PLAY/WATCH marks. Meaning never depends on color alone.
 * Authority: Noema-Specs docs/PLAYER-BRAND-IMPLEMENTATION.md §12
 *
 * World counterparts (closed catalog — ids stay; paths are the marks):
 *   loc        public room / site
 *   player     a Player (human- or agent-controlled)
 *   org        institution / organization
 *   trade      trade or opportunity
 *   danger     hostile, contest, crime
 *   distress   strained or failing works
 *   rumor      unconfirmed claim
 *   unknown    incomplete, archive, unread
 *   comms      message, board, shout, notice
 *   infra      infrastructure / works
 *   resource   stock or harvest
 *   threshold  exit / doorway / consequential change
 *   economy    market or economic change
 *   event      world event (default)
 */

export type GlyphId =
  | "loc"
  | "player"
  | "org"
  | "trade"
  | "danger"
  | "distress"
  | "rumor"
  | "unknown"
  | "comms"
  | "infra"
  | "resource"
  | "threshold"
  | "economy"
  | "event";

export const GLYPH_IDS: GlyphId[] = [
  "loc",
  "player",
  "org",
  "trade",
  "danger",
  "distress",
  "rumor",
  "unknown",
  "comms",
  "infra",
  "resource",
  "threshold",
  "economy",
  "event",
];

export const GLYPH_STROKE = "1.4";

type GlyphMeta = {
  id: GlyphId;
  label: string;
  meaning: string;
  fallback: string;
  category: string;
  counterpart: string;
  d: string;
};

const CATALOG: Record<GlyphId, GlyphMeta> = {
  loc: {
    id: "loc",
    label: "Location",
    meaning: "here",
    fallback: "here",
    category: "LOCATION",
    counterpart: "room",
    d: "M3.2 3.2h9.6v9.6H3.2z M6.2 6.2h3.6v3.6H6.2z",
  },
  player: {
    id: "player",
    label: "Player",
    meaning: "a Player",
    fallback: "P",
    category: "PLAYER",
    counterpart: "player",
    d: "M8 2.4l5.6 5.6L8 13.6 2.4 8z",
  },
  org: {
    id: "org",
    label: "Institution",
    meaning: "institution",
    fallback: "org",
    category: "INSTITUTION",
    counterpart: "organization",
    d: "M3.5 13V5.4 M8 13V3.4 M12.5 13V5.4 M3 13.2h10",
  },
  trade: {
    id: "trade",
    label: "Trade",
    meaning: "trade or opportunity",
    fallback: "trade",
    category: "TRADE",
    counterpart: "trade",
    d: "M2.6 5.4h8.4 M8.4 3.2l3 2.2-3 2.2 M13.4 10.6H5 M7.6 8.4l-3 2.2 3 2.2",
  },
  danger: {
    id: "danger",
    label: "Danger",
    meaning: "hostile or contested",
    fallback: "danger",
    category: "DANGER",
    counterpart: "contest",
    d: "M8 2.6l6.2 10.6H1.8z M8 6.6v3.2 M8 11.6v.9",
  },
  distress: {
    id: "distress",
    label: "Distress",
    meaning: "strained or failing works",
    fallback: "strained",
    category: "DISTRESS",
    counterpart: "condition",
    d: "M3.4 3.2h9.2 M3.4 12.8h9.2 M3.4 3.2l9.2 9.6 M12.6 3.2l-9.2 9.6",
  },
  rumor: {
    id: "rumor",
    label: "Rumor",
    meaning: "unconfirmed claim",
    fallback: "rumor",
    category: "RUMOR",
    counterpart: "rumor",
    d: "M3 11.2h3.4 M6.2 8h4 M10.2 4.8h2.8",
  },
  unknown: {
    id: "unknown",
    label: "Unknown",
    meaning: "incomplete or unreadable",
    fallback: "?",
    category: "UNKNOWN",
    counterpart: "artifact",
    d: "M5.2 3.2H12.8V7 M12.8 9.2v3.6H3.2V5.6",
  },
  comms: {
    id: "comms",
    label: "Signal",
    meaning: "message or board traffic",
    fallback: "message",
    category: "COMMUNICATION",
    counterpart: "message",
    d: "M8 12.6v-1.4 M5.2 9.2a3.6 3.6 0 0 1 5.6 0 M3.4 7a6.2 6.2 0 0 1 9.2 0",
  },
  infra: {
    id: "infra",
    label: "Works",
    meaning: "infrastructure",
    fallback: "works",
    category: "INFRASTRUCTURE",
    counterpart: "infrastructure",
    d: "M3.2 3.2h4.2v4.2H3.2z M8.6 3.2h4.2v4.2H8.6z M3.2 8.6h4.2v4.2H3.2z M8.6 8.6h4.2v4.2H8.6z",
  },
  resource: {
    id: "resource",
    label: "Resource",
    meaning: "stock or harvest",
    fallback: "stock",
    category: "RESOURCE",
    counterpart: "resource",
    d: "M4.2 12.2V7.2h2.2v5 M7 12.2V4.4h2.2v7.8 M9.8 12.2V8.4h2.2v3.8 M3.4 12.4h9.4",
  },
  threshold: {
    id: "threshold",
    label: "Threshold",
    meaning: "consequential change",
    fallback: "change",
    category: "THRESHOLD",
    counterpart: "exit",
    d: "M4.2 13V3.8h7.6V13 M6.6 13V8.2h2.8V13",
  },
  economy: {
    id: "economy",
    label: "Economy",
    meaning: "economic change",
    fallback: "trade",
    category: "ECONOMIC CHANGE",
    counterpart: "market",
    d: "M8 3.2v9.4 M3.4 6.6L8 4.4l4.6 2.2 M3.6 11.4h3.2 M9.2 11.4h3.2",
  },
  event: {
    id: "event",
    label: "Event",
    meaning: "world event",
    fallback: "event",
    category: "WORLD EVENT",
    counterpart: "event",
    d: "M8 2.6v3.2 M8 10.2v3.2 M2.6 8h3.2 M10.2 8h3.2 M4.4 4.4l2.2 2.2 M9.4 9.4l2.2 2.2 M11.6 4.4l-2.2 2.2 M6.6 9.4l-2.2 2.2",
  },
};

/** Closed catalog so PLAY can serialize glyphMeta/glyphEl. */
export function glyphMeta(id: string): GlyphMeta {
  return CATALOG[id as GlyphId] || CATALOG.unknown;
}

export function glyphCatalog(): Record<GlyphId, Pick<GlyphMeta, "d" | "label" | "fallback" | "meaning" | "counterpart">> {
  const out = {} as Record<GlyphId, Pick<GlyphMeta, "d" | "label" | "fallback" | "meaning" | "counterpart">>;
  for (const id of GLYPH_IDS) {
    const m = CATALOG[id];
    out[id] = { d: m.d, label: m.label, fallback: m.fallback, meaning: m.meaning, counterpart: m.counterpart };
  }
  return out;
}

export function glyphForRoom(): GlyphId {
  return "loc";
}

export function glyphForPlayer(): GlyphId {
  return "player";
}

export function glyphForExit(): GlyphId {
  return "threshold";
}

/** Chamber verb → mark. Used by operator theater and PLAY rails. */
export function glyphForCommandVerb(command?: string): GlyphId {
  const v = String(command || "")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
  if (v === "LOOK" || v === "INSPECT" || v === "OBSERVE") return "loc";
  if (v === "MOVE" || v === "ENTER_WORLD" || v === "LEAVE_WORLD" || v === "ENTER" || v === "JOIN") return "player";
  if (v === "MESSAGE" || v === "TALK" || v === "SHOUT" || v === "BOARD" || v === "NOTICE") return "comms";
  if (v.startsWith("TRADE") || v === "OFFER") return "trade";
  if (v.startsWith("ORG") || v === "FOUND" || v === "INVITE") return "org";
  if (v === "HARVEST") return "resource";
  if (v === "REPAIR") return "infra";
  if (v === "CONTEST" || v === "ATTACK") return "danger";
  return "event";
}

export function glyphForEntity(entity_type?: string, labelText?: string, condition?: number): GlyphId {
  void labelText;
  const t = String(entity_type || "").toUpperCase();
  if (t === "ARTIFACT") return "unknown";
  if (t === "INSTITUTION" || t === "ORG") return "org";
  if (t === "RESOURCE") return "resource";
  if (t === "RUIN" || (typeof condition === "number" && condition < 40)) return "distress";
  if (t === "INFRASTRUCTURE") return "infra";
  if (t === "TRADE") return "trade";
  return "event";
}

export function glyphForLine(line: string): GlyphId {
  const s = String(line || "").toLowerCase();
  if (/^unconfirmed|^rumor\b|a record says/.test(s)) return "rumor";
  if (/^shout|^board|^notice|^channel|^trade —|^trade -/.test(s)) return "comms";
  if (/contested|contest|danger| · open\b|through cycle/.test(s)) return "danger";
  if (/condition \d+|relay|works/.test(s)) return "infra";
  if (/trade|surplus|index/.test(s)) return "economy";
  if (/reconstruct|archive|record/.test(s)) return "unknown";
  if (/\bentered\b|\bleft the chamber\b/.test(s)) return "player";
  return "event";
}

/** watch-live/1.0 projection_id → mark. */
export function glyphForProjection(projectionId?: string): GlyphId {
  switch (String(projectionId || "")) {
    case "agent_move":
      return "player";
    case "trade":
      return "trade";
    case "organization":
    case "organization_response":
      return "org";
    case "market_shift":
      return "economy";
    case "harvest":
    case "resource_change":
      return "resource";
    case "agreement_formed":
    case "agreement_broken":
    case "access_changed":
      return "threshold";
    case "contest_declared":
    case "contest_resolved":
    case "crime_detected":
      return "danger";
    case "message_notice":
    case "communication_disrupted":
      return "comms";
    case "infrastructure":
    case "infrastructure_disrupted":
    case "production":
      return "infra";
    case "discovery":
      return "unknown";
    case "shortage":
    case "world_pressure":
    case "frontier_pressure":
      return "distress";
    case "conflicting_reports":
      return "rumor";
    default:
      return "event";
  }
}

export function glyphEl(id: string): {
  className: string;
  setAttribute(name: string, value: string): void;
  append(...nodes: unknown[]): void;
} {
  const m = glyphMeta(id);
  const doc = (globalThis as unknown as {
    document?: {
      createElement(tag: string): {
        className: string;
        textContent: string;
        setAttribute(name: string, value: string): void;
        append(...nodes: unknown[]): void;
      };
      createElementNS?(
        ns: string,
        tag: string,
      ): {
        setAttribute(name: string, value: string): void;
        append(...nodes: unknown[]): void;
      };
    };
  }).document;
  if (!doc || !doc.createElement) {
    return {
      className: "glyph glyph-" + m.id,
      setAttribute() {},
      append() {},
    };
  }
  const wrap = doc.createElement("span");
  wrap.className = "glyph glyph-" + m.id;
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", m.label);
  wrap.setAttribute("title", m.meaning);
  if (doc.createElementNS) {
    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", m.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", GLYPH_STROKE);
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.append(path);
    wrap.append(svg);
  }
  const sr = doc.createElement("span");
  sr.className = "sr";
  sr.textContent = m.fallback;
  wrap.append(sr);
  return wrap;
}

export function legendHtml(): string {
  const rows = GLYPH_IDS.map((id) => {
    const m = glyphMeta(id);
    return (
      "<div class=\"key-row\">" +
      "<span class=\"glyph glyph-" +
      m.id +
      "\" role=\"img\" aria-label=\"" +
      m.label +
      "\" title=\"" +
      m.meaning +
      "\">" +
      "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\">" +
      "<path d=\"" +
      m.d +
      "\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"" +
      GLYPH_STROKE +
      "\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>" +
      "</svg>" +
      "<span class=\"sr\">" +
      m.fallback +
      "</span></span>" +
      "<span><strong>" +
      m.label +
      "</strong> — " +
      m.meaning +
      "</span></div>"
    );
  }).join("");
  return (
    "<details class=\"legend\" id=\"world-key\">" +
    "<summary>Key</summary>" +
    "<div class=\"key-body\">" +
    rows +
    "</div></details>"
  );
}
