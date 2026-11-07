# workers/noema/test/contextual-help-nonmutation.test.ts

- helpPrincipal · function · L7-L13 — helpPrincipal = (name: string): PlayerPrincipal
- helpScene · function · L16-L50 — async function helpScene()
- command · function · L32-L36 — command = (p: PlayerPrincipal, verb: string, args: Record<string, unknown> = {})
- ask · function · L43-L48 — ask = (line: string, fixedKey?: string)
- HelpScene · type · L52-L52 — type HelpScene = Awaited<ReturnType<typeof helpScene>>;
- helpCanonical · function · L53-L63 — function helpCanonical(s: HelpScene)
- readonlyHelp · function · L64-L74 — async function readonlyHelp(s: HelpScene, line: string, fixedKey?: string)
