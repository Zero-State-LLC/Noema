# workers/noema/test/r4-phrase-effect-equivalence.test.ts

- principal · function · L20-L29 — principal = (id: string, session: string): PlayerPrincipal
- world · function · L35-L68 — function world(): WorldRuntime
- entered · function · L71-L78 — async function entered(): Promise<WorldRuntime>
- strip · function · L82-L88 — function strip(v: unknown): unknown
- Settled · type · L90-L90 — type Settled = { ok: boolean; code?: string; projection: unknown };
- settle · function · L91-L110 — async function settle(command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Settled>
- text · function · L111-L111 — text = (line: string)
- Spot · type · L194-L194 — type Spot = "hub" | "east" | "left" | "never";
- Cast · type · L195-L195 — type Cast = Record<string, Spot>;
- scene · function · L197-L221 — async function scene(cast: Cast, relay: number | null, handles: Record<string, string> = {}): Promise<WorldRuntime>
- enter · function · L203-L206 — enter = async (p: PlayerPrincipal)
- Outcome · type · L222-L222 — type Outcome = { ok: boolean; code?: string; message?: string; response: string; projection: unknown };
- send · function · L223-L241 — async function send(w: WorldRuntime, command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Outcome>
- both · function · L243-L247 — async function both(cast: Cast, relay: number | null, line: string, recipient_id: string, handles?: Record<string, string>)
- same · function · L248-L250 — same = (o: { text: Outcome; structured: Outcome })
