# workers/noema/test/clarification-materiality-next.test.ts

- Result · type · L5-L5 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- Settled · type · L6-L6 — type Settled = Parameters<Parameters<typeof applyWorldCommand>[3]>[0];
- principal · function · L8-L12 — function principal(name: string): PlayerPrincipal
- scene · function · L13-L35 — async function scene()
- send · function · L21-L25 — send = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, developer = false)
- ask · function · L26-L26 — ask = (line: string)
- Rig · type · L36-L36 — type Rig = Awaited<ReturnType<typeof scene>>;
- projection · function · L37-L45 — function projection(s: Rig)
- messageControl · function · L46-L52 — async function messageControl(s: Rig, recipient = s.b.player_id)
- offerMessage · function · L53-L64 — async function offerMessage(s: Rig)
- safeMessagePick · function · L65-L76 — async function safeMessagePick(s: Rig, pick: string)
- entity · function · L77-L80 — function entity(s: Rig, id: string)
- offerInspect · function · L81-L90 — async function offerInspect(s: Rig)
- inspected · function · L91-L97 — async function inspected(s: Rig, pick: string)
- sealedPick · function · L98-L105 — async function sealedPick(s: Rig, pick: string)
