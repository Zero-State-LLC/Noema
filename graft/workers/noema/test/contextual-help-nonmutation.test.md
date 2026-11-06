# workers/noema/test/contextual-help-nonmutation.test.ts

- helpPrincipal · function · L6-L12 — helpPrincipal = (name: string): PlayerPrincipal
- helpScene · function · L15-L49 — async function helpScene()
- command · function · L31-L35 — command = (p: PlayerPrincipal, verb: string, args: Record<string, unknown> = {})
- ask · function · L42-L47 — ask = (line: string, fixedKey?: string)
- HelpScene · type · L51-L51 — type HelpScene = Awaited<ReturnType<typeof helpScene>>;
- helpCanonical · function · L52-L62 — function helpCanonical(s: HelpScene)
- readonlyHelp · function · L63-L73 — async function readonlyHelp(s: HelpScene, line: string, fixedKey?: string)
