# workers/noema/test/older-world-compat.test.ts

- FixtureEnvelope · type · L10-L14 — type FixtureEnvelope = { fixture_version: string; sanitization: { contains_real_user_data: false; redactions: string[] }; world: WorldRuntime; };
- requireRecord · function · L16-L18 — function requireRecord(value: unknown, name: string): asserts value is Record<string, unknown>
- readFixture · function · L20-L41 — function readFixture(text = readFileSync(FIXTURE_PATH, "utf8")): FixtureEnvelope
- cloneWorld · function · L43-L45 — function cloneWorld(): WorldRuntime
