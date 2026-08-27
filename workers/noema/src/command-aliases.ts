/** Player-preference aliases and bounded macros. Outside world truth. */

export const MAX_ALIAS_DEPTH = 4;
export const MAX_MACRO_STEPS = 5;
export const MAX_ALIASES = 16;

const RESERVED = new Set(
  [
    "help",
    "look",
    "l",
    "wait",
    "observe",
    "enter",
    "move",
    "go",
    "walk",
    "inspect",
    "examine",
    "x",
    "repair",
    "harvest",
    "trade",
    "message",
    "msg",
    "tell",
    "say",
    "alias",
    "do",
    "talk",
    "form",
    "invite",
    "leave",
    "accept",
    "reject",
    "cancel",
  ].map((s) => s.toLowerCase()),
);

export function isReservedAliasName(name: string): boolean {
  return RESERVED.has(String(name || "").trim().toLowerCase());
}

export function splitMacroSteps(line: string): string[] {
  return String(line || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type AliasMap = Record<string, string>;

export function expandAliases(
  line: string,
  aliases: AliasMap,
  depth = 0,
): { line: string; error?: string } {
  const trimmed = String(line || "").trim();
  if (!trimmed) return { line: trimmed };
  if (depth > MAX_ALIAS_DEPTH) return { line: trimmed, error: "Alias expansion is too deep." };
  const parts = trimmed.split(/\s+/);
  const head = (parts[0] || "").toLowerCase();
  const rest = parts.slice(1).join(" ");
  const expansion = aliases[head];
  if (!expansion) return { line: trimmed };
  const next = rest ? `${expansion} ${rest}`.trim() : expansion.trim();
  return expandAliases(next, aliases, depth + 1);
}

export type AliasCommand =
  | { ok: true; op: "list" }
  | { ok: true; op: "set"; name: string; expansion: string }
  | { ok: true; op: "rm"; name: string }
  | { ok: false; error: string };

export function parseAliasCommand(line: string): AliasCommand | null {
  const t = String(line || "").trim();
  const m = t.match(/^alias(?:\s+(.*))?$/i);
  if (!m) return null;
  const rest = (m[1] || "").trim();
  if (!rest || rest.toLowerCase() === "list") return { ok: true, op: "list" };
  const rm = rest.match(/^(?:rm|remove|unset)\s+(\S+)\s*$/i);
  if (rm) return { ok: true, op: "rm", name: rm[1].toLowerCase() };
  const set = rest.match(/^(?:set\s+)?(\S+)\s+(.+)$/i);
  if (set) {
    const name = set[1].toLowerCase();
    const expansion = set[2].trim();
    if (isReservedAliasName(name)) return { ok: false, error: `“${name}” is a reserved command.` };
    if (!/^[a-z][a-z0-9_-]{0,23}$/.test(name)) return { ok: false, error: "Alias names are short letters." };
    if (!expansion) return { ok: false, error: "Alias needs an expansion." };
    return { ok: true, op: "set", name, expansion };
  }
  return { ok: false, error: "Alias syntax: alias list | alias set <name> <command> | alias rm <name>" };
}

export function applyAliasCommand(aliases: AliasMap, cmd: AliasCommand): { aliases: AliasMap; text: string } {
  const next = { ...aliases };
  if (!cmd.ok) return { aliases: next, text: cmd.error };
  if (cmd.op === "list") {
    const keys = Object.keys(next).sort();
    if (!keys.length) return { aliases: next, text: "No aliases." };
    return { aliases: next, text: keys.map((k) => `${k} → ${next[k]}`).join("\n") };
  }
  if (cmd.op === "rm") {
    delete next[cmd.name];
    return { aliases: next, text: `Alias ${cmd.name} removed.` };
  }
  if (Object.keys(next).length >= MAX_ALIASES && next[cmd.name] == null) {
    return { aliases: next, text: `At most ${MAX_ALIASES} aliases.` };
  }
  next[cmd.name] = cmd.expansion;
  return { aliases: next, text: `Alias ${cmd.name} → ${cmd.expansion}` };
}

export function macroStepsFromLine(line: string): { steps: string[]; error?: string } {
  let body = String(line || "").trim();
  const doM = body.match(/^do\s+(.+)$/i);
  if (doM) body = doM[1].trim();
  const steps = splitMacroSteps(body);
  if (steps.length > MAX_MACRO_STEPS) {
    return { steps: [], error: `Macros are at most ${MAX_MACRO_STEPS} steps.` };
  }
  if (steps.some((s) => /^do\b/i.test(s))) {
    return { steps: [], error: "Macros cannot nest." };
  }
  return { steps };
}
