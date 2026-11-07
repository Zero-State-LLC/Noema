# workers/noema/test/build-topic-execution-next10.test.ts

- Result · type · L6-L6 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Envelope · type · L7-L7 — type Envelope = Parameters<typeof applyWorldCommand>[2];
- Settled · type · L8-L8 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- principal · function · L9-L13 — function principal(name: string): PlayerPrincipal
- world · function · L14-L27 — function world(): WorldRuntime
- scene · function · L28-L62 — async function scene(kind: "workshop" | "route_link" = "workshop")
- dispatch · function · L31-L33 — dispatch = (p: PlayerPrincipal, envelope: Envelope, developer = false)
- send · function · L34-L37 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false)
- text · function · L38-L38 — text = (p: PlayerPrincipal, line: string)
- asset · method · L58-L61 — get asset()
- Rig · type · L63-L63 — type Rig = Awaited<ReturnType<typeof scene>>;
- topic · function · L64-L73 — async function topic(s: Rig, verb: "share" | "vest" | "connect", values: Record<string, string>, p = s.owner)
- projection · function · L74-L82 — function projection(w: WorldRuntime)
- rejected · function · L83-L86 — function rejected(s: Rig, r: Result, before: ReturnType<typeof projection>, code: string)
- effect · function · L87-L96 — function effect(s: Rig, r: Result, operation: "SHARE" | "VEST" | "CONNECT", set: Record<string, unknown>)
- institution · function · L97-L110 — async function institution(s: Rig, name: string, occupied = true)
- seat · function · L111-L114 — async function seat(s: Rig, office: string)
- exits · function · L115-L117 — function exits(w: WorldRuntime)
