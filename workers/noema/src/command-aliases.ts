/**
 * Player-preference aliases and bounded macros. Outside world-actions on purpose:
 * keep the alias surface small, deterministic, and free of ambient world coupling.
 */

export const MAX_ALIASES = 24;
export const MAX_ALIAS_EXPANSION = 160;
export const MAX_MACRO_STEPS = 4;

const RESERVED = new Set([
  "alias",
  "do",
  "help",
  "look",
  "go",
  "say",
  "ask",
  "take",
  "drop",
  "give",
  "use",
  "build",
  "form",
  "vest",
  "share",
  "connect",
]);

export type AliasMap = Record<string, string>;

export type AliasCommand =
  | { ok: true; op: "list" }
  | { ok: true; op: "rm"; name: string }
  | { ok: true; op: "set"; name: string; expansion: string }
  | { ok: false; error: string };

function isReservedAliasName(name: string): boolean {
  return RESERVED.has(name.toLowerCase());
}

export function normalizeAliasMap(raw: unknown): AliasMap {
  if (!raw || typeof raw !== "object") return {};
  const out: AliasMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const name = String(k || "")
      .toLowerCase()
      .trim();
    const expansion = String(v || "").trim();
    if (!name || !expansion) continue;
    if (isReservedAliasName(name)) continue;
    if (!/^[a-z][a-z0-9_-]{0,23}$/.test(name)) continue;
    if (expansion.length > MAX_ALIAS_EXPANSION) continue;
    out[name] = expansion;
    if (Object.keys(out).length >= MAX_ALIASES) break;
  }
  return out;
}

export function parseAliasCommand(line: string): AliasCommand | null {
  const t = String(line || "").trim();
  if (!/^alias\b/i.test(t)) return null;
  const rest = t.replace(/^alias\b/i, "").trim();
  if (!rest || rest.toLowerCase() === "list") return { ok: true, op: "list" };
  const rm = rest.match(/^(?:rm|remove|unset)\s+(\S+)\s*$/i);
  if (rm) return { ok: true, op: "rm", name: rm[1].toLowerCase() };
  let setBody = rest;
  if (/^set\b/i.test(setBody)) setBody = setBody.replace(/^set\b/i, "").trim();
  const sp = setBody.search(/\s/);
  if (sp > 0) {
    const name = setBody.slice(0, sp).toLowerCase();
    const expansion = setBody.slice(sp).trim();
    if (isReservedAliasName(name)) return { ok: false, error: `“${name}” is a reserved command.` };
    if (!/^[a-z][a-z0-9_-]{0,23}$/.test(name)) return { ok: false, error: "Alias names are short letters." };
    if (!expansion) return { ok: false, error: "Alias needs an expansion." };
    if (expansion.length > MAX_ALIAS_EXPANSION) {
      return { ok: false, error: `Alias expansions are at most ${MAX_ALIAS_EXPANSION} characters.` };
    }
    return { ok: true, op: "set", name, expansion };
  }
  return { ok: false, error: 'Alias syntax: alias list | alias set <name> <expansion> | alias rm <name>' };
}

function splitMacroSteps(body: string): string[] {
  const steps: string[] = [];
  let buf = "";
  let q: string | null = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (q) {
      buf += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      buf += ch;
      continue;
    }
    if (ch === ";") {
      const step = buf.trim();
      if (step) steps.push(step);
      buf = "";
      continue;
    }
    buf += ch;
  }
  const last = buf.trim();
  if (last) steps.push(last);
  return steps;
}

export function macroStepsFromLine(line: string): { steps: string[]; error?: string } {
  let body = String(line || "").trim();
  if (/^do\b/i.test(body)) body = body.replace(/^do\b/i, "").trim();
  const steps = splitMacroSteps(body);
  if (steps.length > MAX_MACRO_STEPS) {
    return { steps: [], error: `Macros are at most ${MAX_MACRO_STEPS} steps.` };
  }
  return { steps };
}
