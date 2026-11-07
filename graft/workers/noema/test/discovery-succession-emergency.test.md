# workers/noema/test/discovery-succession-emergency.test.ts

- Result · type · L9-L9 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Settled · type · L10-L10 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- person · function · L11-L15 — person = (name: string): PlayerPrincipal
- successionEmergencyScene · function · L16-L51 — async function successionEmergencyScene()
- send · function · L27-L31 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false)
- text · function · L32-L32 — text = (p: PlayerPrincipal, line: string)
- affordance · function · L33-L37 — affordance = async (p: PlayerPrincipal, operation: string, predicate: (a: ObservationAffordance) => boolean = () => true)
- org · function · L48-L48 — org = ()
- Scene · type · L52-L52 — type Scene = Awaited<ReturnType<typeof successionEmergencyScene>>;
- projection · function · L53-L59 — function projection(s: Scene)
- denied · function · L60-L63 — function denied(s: Scene, r: Result, before: ReturnType<typeof projection>, code: string)
- refuse · function · L64-L68 — async function refuse(s: Scene, p: PlayerPrincipal, line: string, code: string)
- paid · function · L69-L78 — function paid(s: Scene, r: Result, p: PlayerPrincipal, before: number, eventType: string, eventPayload: Record<string, unknown>)
- follow · function · L79-L85 — async function follow(s: Scene, p: PlayerPrincipal, operation: string, predicate?: (a: ObservationAffordance) => boolean)
- createSeat · function · L86-L92 — async function createSeat(s: Scene, profile = "PUBLISH_NOTICE", required = "")
- trade · function · L336-L338 — trade = (energy: number)
