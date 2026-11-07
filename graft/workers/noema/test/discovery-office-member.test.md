# workers/noema/test/discovery-office-member.test.ts

- Result · type · L8-L8 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Settled · type · L9-L9 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- person · function · L10-L14 — person = (name: string): PlayerPrincipal
- officeMemberScene · function · L16-L56 — async function officeMemberScene()
- send · function · L26-L31 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false, fixedId?: string)
- text · function · L32-L32 — text = (p: PlayerPrincipal, line: string, fixedId?: string)
- affordance · function · L33-L40 — affordance = async (p: PlayerPrincipal, operation: string, target?: string, label?: string)
- org · function · L54-L54 — org = ()
- Scene · type · L57-L57 — type Scene = Awaited<ReturnType<typeof officeMemberScene>>;
- canonical · function · L58-L64 — function canonical(s: Scene)
- refusal · function · L65-L68 — function refusal(s: Scene, r: Result, before: ReturnType<typeof canonical>, code: string)
- paid · function · L69-L80 — function paid(s: Scene, r: Result, p: PlayerPrincipal, cost: Partial<typeof DEFAULT_BUDGETS>, before: typeof DEFAULT_BUDGETS, event: string, payload: Record<string, unknown>)
- published · function · L81-L88 — async function published(s: Scene, p: PlayerPrincipal, operation: string, target?: string, label?: string)
- rejectOfficeMemberLine · function · L172-L175 — rejectOfficeMemberLine = async (p: PlayerPrincipal, line: string, code: string)
- line · function · L232-L234 — line = (prefix: string)
- createLine · function · L335-L338 — createLine = (name: string, precedence?: "append" | "lead")
