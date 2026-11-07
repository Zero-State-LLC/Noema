# workers/noema/test/topic-help-grammar-next10.test.ts

- Result · type · L5-L5 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- example · function · L10-L14 — function example(text: string, verb: string)
- roomForm · function · L15-L19 — function roomForm(text: string, mode: "deny" | "clear" | "allow")
- fill · function · L20-L24 — function fill(text: string, values: Record<string, string>)
- principal · function · L25-L29 — function principal(name: string): PlayerPrincipal
- world · function · L30-L36 — function world(): WorldRuntime
- Rig · type · L37-L39 — type Rig = { w: WorldRuntime; gate: PlayerPrincipal; peer: PlayerPrincipal; org: string; settled: unknown[]; send: (p: PlayerPrincipal, command: string, args?: Record<string, unknown>) => Promise<Result>; help: (topic: string) => Promise<Result> };
- seat · function · L40-L46 — async function seat(s: Rig)
- scene · function · L47-L65 — async function scene(granted = true): Promise<Rig>
- send · function · L50-L54 — send: Rig["send"] = (p, command, args = {})
- projection · function · L66-L72 — function projection(w: WorldRuntime)
- copy · function · L73-L73 — function copy(r: Result)
- nonmutatingTopic · function · L74-L89 — async function nonmutatingTopic(s: Rig, topic: "build" | "access")
