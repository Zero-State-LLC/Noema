# workers/noema/test/delayed-sibling-message.test.ts

- Verb · type · L7-L7 — type Verb = "report" | "repeat" | "pass" | "share";
- Carrier · type · L8-L8 — type Carrier = "line" | "outer";
- principal · function · L10-L15 — principal = (name: string): PlayerPrincipal
- run · function · L20-L26 — async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false)
- scene · function · L27-L59 — async function scene(): Promise<{ w: WorldRuntime; held: string }>
- action · function · L60-L73 — function action(verb: Verb, carrier: Carrier, held: string, structured: boolean): CommandEnvelope
- effects · function · L74-L81 — function effects(w: WorldRuntime)
- queue · function · L82-L127 — async function queue(verb: Verb, carrier: Carrier, structured: boolean)
- Queued · type · L128-L128 — type Queued = Awaited<ReturnType<typeof queue>>;
- advance · function · L129-L135 — async function advance(w: WorldRuntime, target: number)
- arrive · function · L136-L171 — async function arrive(q: Queued)
- replay · function · L172-L183 — async function replay(q: Queued)
- scenario · function · L184-L200 — async function scenario(verb: Verb, carrier: Carrier)
