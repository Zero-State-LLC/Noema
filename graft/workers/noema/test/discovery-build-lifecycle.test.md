# workers/noema/test/discovery-build-lifecycle.test.ts

- Result · type · L7-L7 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Settled · type · L8-L8 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- buildLifecyclePrincipal · function · L19-L23 — function buildLifecyclePrincipal(name: string): PlayerPrincipal
- buildLifecycleWorld · function · L24-L30 — function buildLifecycleWorld(): WorldRuntime
- buildLifecycleRig · function · L31-L68 — async function buildLifecycleRig(kind?: ConstructibleClass)
- send · function · L34-L38 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {})
- text · function · L39-L39 — text = (p: PlayerPrincipal, line: string)
- fund · function · L41-L47 — fund = (p: PlayerPrincipal, cargo: number)
- enterOutsider · function · L57-L61 — enterOutsider = async ()
- asset · function · L62-L66 — asset = ()
- Rig · type · L69-L69 — type Rig = Awaited<ReturnType<typeof buildLifecycleRig>>;
- buildTopicLine · function · L70-L80 — async function buildTopicLine(s: Rig, verb: string, values: Record<string, string>)
- buildOffer · function · L81-L86 — async function buildOffer(s: Rig, operation: string, id?: string, actor = s.owner)
- buildProjection · function · L87-L92 — function buildProjection(w: WorldRuntime)
- buildRefusal · function · L93-L97 — function buildRefusal(s: Rig, result: Result, before: ReturnType<typeof buildProjection>, code: string)
- buildDebit · function · L98-L111 — function buildDebit(s: Rig, result: Result, operation: string, cost: { energy?: number; compute?: number; storage?: number; influence?: number }, before: { energy: number; compute: number; storage: number; influence: number }, settledTypes: string[])
- buildBudget · function · L112-L115 — function buildBudget(s: Rig)
