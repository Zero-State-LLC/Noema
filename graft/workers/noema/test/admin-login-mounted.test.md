# workers/noema/test/admin-login-mounted.test.ts

- Output · type · L22-L26 — type Output = { response: Response; raw: string; body: Record<string, unknown>; };
- Reply · type · L27-L27 — type Reply = () => Response | Promise<Response>;
- providerSuccess · function · L29-L35 — function providerSuccess(): Response
- createMountedAdminLoginHarness · function · L37-L84 — function createMountedAdminLoginHarness(overrides: Partial<Env> = {})
- forbidWorld · function · L41-L44 — forbidWorld = (name: string): never
- setReply · method · L71-L71 — setReply(next: Reply)
- consume · method · L72-L82 — async consume(body: Record<string, unknown>): Promise<Output>
- safeRefusal · function · L86-L96 — function safeRefusal(out: Output, status: number, code: string)
- legacySuccess · function · L98-L126 — async function legacySuccess(h: ReturnType<typeof createMountedAdminLoginHarness>, out: Output)
