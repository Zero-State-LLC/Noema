# workers/noema/test/incident-recover.test.ts

- FixtureEnvelope · type · L11-L15 — type FixtureEnvelope = { fixture_version: string; sanitization: { contains_real_user_data: false; redactions: string[] }; world: WorldRuntime; };
- requireRecord · function · L17-L19 — function requireRecord(value: unknown, name: string): asserts value is Record<string, unknown>
- readRepresentativeFixture · function · L21-L31 — function readRepresentativeFixture(): FixtureEnvelope
- cloneRepresentativeWorld · function · L33-L35 — function cloneRepresentativeWorld(): WorldRuntime
- liveWorld · function · L37-L70 — function liveWorld(overrides: Partial<WorldRuntime> = {}): WorldRuntime
- headFrom · function · L72-L83 — function headFrom(world: WorldRuntime, revision = 4): WorldHead
- fakeDurableState · function · L85-L95 — function fakeDurableState(storage: Map<string, unknown>)
- json · function · L97-L99 — async function json(res: Response): Promise<Record<string, unknown>>
