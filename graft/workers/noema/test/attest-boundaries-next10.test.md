# workers/noema/test/attest-boundaries-next10.test.ts

- Settle · type · L6-L6 — type Settle = Parameters<typeof applyWorldCommand>[3];
- Result · type · L7-L7 — type Result = Awaited<ReturnType<typeof applyWorldCommand>>;
- world · function · L8-L20 — function world(): WorldRuntime
- scene · function · L21-L36 — async function scene()
- envelope · function · L27-L30 — envelope = (command: string, args: Record<string, unknown> = {}): CommandEnvelope
- send · function · L31-L32 — send = (command: string, args: Record<string, unknown> = {}, settle: Settle = async () => true)
- rows · function · L37-L37 — function rows(r: Result)
- pick · function · L38-L42 — function pick(r: Result, subject = "entity.local")
- projection · function · L43-L48 — function projection(w: WorldRuntime)
- Scene · type · L49-L49 — type Scene = Awaited<ReturnType<typeof scene>>;
- follow · function · L50-L52 — async function follow(s: Scene, cmd: string, settle: Settle = async () => true, outer = false)
- settle · function · L131-L131 — settle: Settle = async ()
