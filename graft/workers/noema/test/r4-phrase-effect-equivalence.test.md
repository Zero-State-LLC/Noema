# workers/noema/test/r4-phrase-effect-equivalence.test.ts

- principal · function · L20-L29 — principal = (id: string, session: string): PlayerPrincipal
- world · function · L35-L68 — function world(): WorldRuntime
- entered · function · L71-L78 — async function entered(): Promise<WorldRuntime>
- strip · function · L82-L88 — function strip(v: unknown): unknown
- Settled · type · L90-L90 — type Settled = { ok: boolean; code?: string; projection: unknown };
- project · function · L92-L104 — function project(w: WorldRuntime, events: unknown[]): unknown
- settle · function · L105-L113 — async function settle(command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Settled>
- text · function · L114-L114 — text = (line: string)
- Spot · type · L197-L197 — type Spot = "hub" | "east" | "left" | "never";
- Cast · type · L198-L198 — type Cast = Record<string, Spot>;
- scene · function · L200-L224 — async function scene(cast: Cast, relay: number | null, handles: Record<string, string> = {}): Promise<WorldRuntime>
- enter · function · L206-L209 — enter = async (p: PlayerPrincipal)
- Outcome · type · L225-L225 — type Outcome = { ok: boolean; code?: string; message?: string; response: string; projection: unknown };
- send · function · L226-L237 — async function send(w: WorldRuntime, command: string, args: Record<string, unknown>, mode?: typeof DEV): Promise<Outcome>
- both · function · L239-L243 — async function both(cast: Cast, relay: number | null, line: string, recipient_id: string, handles?: Record<string, string>)
- same · function · L244-L246 — same = (o: { text: Outcome; structured: Outcome })
