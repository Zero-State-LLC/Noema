# workers/noema/test/discovery-agreement-access.test.ts

- Result · type · L8-L8 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- discoveryPrincipal · function · L9-L13 — function discoveryPrincipal(name: string): PlayerPrincipal
- discoveryWorld · function · L14-L22 — function discoveryWorld(): WorldRuntime
- Rig · type · L23-L26 — type Rig = { w: WorldRuntime; a: PlayerPrincipal; b: PlayerPrincipal; c: PlayerPrincipal; settled: Array<{ event_type: string; payload: Record<string, unknown> }>; send: (p: PlayerPrincipal, command: string, args?: Record<string, unknown>) => Promise<Result>; text: (p: PlayerPrincipal, line: string) => Promise<Result>; topic: (p: PlayerPrincipal, name: string) => Promise<string> };
- discoveryRig · function · L27-L42 — async function discoveryRig(): Promise<Rig>
- send · function · L30-L34 — send: Rig["send"] = (p, command, args = {})
- text · function · L36-L36 — text = (p: PlayerPrincipal, line: string)
- topic · function · L37-L40 — topic = async (p: PlayerPrincipal, name: string)
- template · function · L43-L46 — function template(text: string, prefix: string): string
- fillTemplate · function · L47-L50 — function fillTemplate(text: string, fields: Record<string, string>): string
- discoveryProjection · function · L51-L56 — function discoveryProjection(s: Rig)
- refusal · function · L57-L62 — async function refusal(s: Rig, p: PlayerPrincipal, line: string, code: string)
- accessSeat · function · L63-L71 — async function accessSeat(s: Rig): Promise<string>
