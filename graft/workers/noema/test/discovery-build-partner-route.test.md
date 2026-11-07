# workers/noema/test/discovery-build-partner-route.test.ts

- Result · type · L7-L7 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Envelope · type · L8-L8 — type Envelope = Parameters<typeof applyWorldCommand>[2];
- Settled · type · L9-L9 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- principal · function · L10-L13 — principal = (name: string): PlayerPrincipal
- partnerRouteScene · function · L15-L52 — async function partnerRouteScene(kind: "workshop" | "route_link" = "workshop")
- dispatch · function · L28-L29 — dispatch = (p: PlayerPrincipal, envelope: Envelope)
- send · function · L30-L33 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {})
- text · function · L34-L34 — text = (p: PlayerPrincipal, line: string)
- enter · function · L35-L36 — enter = async (p: PlayerPrincipal)
- asset · method · L50-L51 — get asset()
- Scene · type · L53-L53 — type Scene = Awaited<ReturnType<typeof partnerRouteScene>>;
- boundedState · function · L54-L60 — function boundedState(w: WorldRuntime)
- advertised · function · L61-L67 — async function advertised(s: Scene, p: PlayerPrincipal, operation: "SHARE" | "VEST" | "CONNECT", select: (a: ObservationAffordance) => boolean)
- unchanged · function · L68-L71 — function unchanged(s: Scene, before: ReturnType<typeof boundedState>, r: Result, code: string)
- stamped · function · L72-L82 — function stamped(s: Scene, r: Result, operation: string, set: Record<string, unknown>, payer = s.owner)
- namedOffice · function · L83-L96 — async function namedOffice(s: Scene, name: string, profile = "OPERATE_NAMED_ASSET", occupied = true)
