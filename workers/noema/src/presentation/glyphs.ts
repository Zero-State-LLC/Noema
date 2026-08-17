/**
 * 14 PLAY/WATCH marks. Meaning never depends on color alone.
 * Authority: Noema-Specs docs/PLAYER-BRAND-IMPLEMENTATION.md §12
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

type GlyphMeta = {
  id: GlyphId;
  label: string;
  meaning: string;
  fallback: string;
  category: string;
  d: string;
};

/** Closed catalog so PLAY can serialize glyphMeta/glyphEl. */
export function glyphMeta(id: string): GlyphMeta {
  const all: Record<string, GlyphMeta> = {
    loc: {
      id: "loc",
      label: "Location",
      meaning: "here",
      fallback: "here",
      category: "LOCATION",
      d: "M2 2h10v10H2z M2 6h4",
    },
    player: {
      id: "player",
      label: "Player",
      meaning: "a Player",
      fallback: "P",
      category: "PLAYER",
      d: "M8 3v10 M5 13h6 M8 3l-2 3h4z",
    },
    org: {
      id: "org",
      label: "Institution",
      meaning: "institution",
      fallback: "org",
      category: "INSTITUTION",
      d: "M3 3v10 M13 3v10 M3 8h10",
    },
    trade: {
      id: "trade",
      label: "Trade",
      meaning: "trade or opportunity",
      fallback: "trade",
      category: "TRADE",
      d: "M3 6l3-3 3 3 M6 3v10 M13 10l-3 3-3-3 M10 13V3",
    },
    danger: {
      id: "danger",
      label: "Danger",
      meaning: "hostile or contested",
      fallback: "danger",
      category: "DANGER",
      d: "M8 2l6 12H2z",
    },
    distress: {
      id: "distress",
      label: "Distress",
      meaning: "strained or failing works",
      fallback: "strained",
      category: "DISTRESS",
      d: "M3 4h10 M3 8h6 M3 12h10 M8 6v4",
    },
    rumor: {
      id: "rumor",
      label: "Rumor",
      meaning: "unconfirmed claim",
      fallback: "rumor",
      category: "RUMOR",
      d: "M8 2l4 6-4 6-4-6z",
    },
    unknown: {
      id: "unknown",
      label: "Unknown",
      meaning: "incomplete or unreadable",
      fallback: "?",
      category: "UNKNOWN",
      d: "M4 4h8v8H4z",
    },
    comms: {
      id: "comms",
      label: "Signal",
      meaning: "message or board traffic",
      fallback: "message",
      category: "COMMUNICATION",
      d: "M2 5h9v6H2z M11 7l3-2v6l-3-2",
    },
    infra: {
      id: "infra",
      label: "Works",
      meaning: "infrastructure",
      fallback: "works",
      category: "INFRASTRUCTURE",
      d: "M3 12V6l5-3 5 3v6H3z",
    },
    resource: {
      id: "resource",
      label: "Resource",
      meaning: "stock or harvest",
      fallback: "stock",
      category: "RESOURCE",
      d: "M4 12V7h2v5H4z M7 12V5h2v7H7z M10 12V8h2v4h-2z",
    },
    threshold: {
      id: "threshold",
      label: "Threshold",
      meaning: "consequential change",
      fallback: "change",
      category: "THRESHOLD",
      d: "M2 8h12 M11 5l3 3-3 3",
    },
    economy: {
      id: "economy",
      label: "Economy",
      meaning: "economic change",
      fallback: "trade",
      category: "ECONOMIC CHANGE",
      d: "M4 11l4-6 4 6",
    },
    event: {
      id: "event",
      label: "Event",
      meaning: "world event",
      fallback: "event",
      category: "WORLD EVENT",
      d: "M3 8h10",
    },
  };
  return all[id] || all.unknown;
}

export function glyphForEntity(entity_type?: string, labelText?: string, condition?: number): GlyphId {
  const t = String(entity_type || "").toUpperCase();
  const s = `${labelText || ""} ${t}`.toLowerCase();
  if (t === "ARTIFACT" || /archive|record|ledger/.test(s)) return "unknown";
  if (t === "INSTITUTION" || t === "ORG") return "org";
  if (t === "RESOURCE" || /harvest|stock|cache/.test(s)) return "resource";
  if (/scar|fail|ruin|broken/.test(s) || (typeof condition === "number" && condition < 40)) return "distress";
  if (t === "INFRASTRUCTURE" || /relay|generator|workshop/.test(s)) return "infra";
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
  return "event";
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
    path.setAttribute("stroke-width", "1.4");
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
  const ids = [
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
  const rows = ids
    .map((id) => {
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
        "\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>" +
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
    })
    .join("");
  return (
    "<details class=\"legend\" id=\"world-key\">" +
    "<summary>Key</summary>" +
    "<div class=\"key-body\">" +
    rows +
    "</div></details>"
  );
}
