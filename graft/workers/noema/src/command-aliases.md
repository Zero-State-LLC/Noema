# workers/noema/src/command-aliases.ts

- isReservedAliasName · function · L40-L42 — function isReservedAliasName(name: string): boolean
- splitMacroSteps · function · L44-L49 — function splitMacroSteps(line: string): string[]
- AliasMap · type · L51-L51 — type AliasMap = Record<string, string>;
- expandAliases · function · L53-L68 — function expandAliases( line: string, aliases: AliasMap, depth = 0, ): { line: string; error?: string }
- AliasCommand · type · L70-L74 — type AliasCommand = | { ok: true; op: "list" } | { ok: true; op: "set"; name: string; expansion: string } | { ok: true; op: "rm"; name: string } | { ok: false; error: string };
- parseAliasCommand · function · L76-L95 — function parseAliasCommand(line: string): AliasCommand | null
- applyAliasCommand · function · L97-L114 — function applyAliasCommand(aliases: AliasMap, cmd: AliasCommand): { aliases: AliasMap; text: string }
- macroStepsFromLine · function · L116-L127 — function macroStepsFromLine(line: string): { steps: string[]; error?: string }
