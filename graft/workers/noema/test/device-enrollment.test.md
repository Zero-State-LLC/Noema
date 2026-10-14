# workers/noema/test/device-enrollment.test.ts

- env · function · L27-L35 — function env(partial: Partial<Env> = {}): Env
- reviewEnv · function · L37-L39 — function reviewEnv(partial: Partial<Env> = {}): Env
- okResend · function · L41-L46 — function okResend(calls: unknown[] = []): typeof fetch
- reviewTokenFromMail · function · L48-L53 — function reviewTokenFromMail(calls: unknown[], _action: "approve" | "deny" = "approve"): string
- humanBearer · function · L55-L63 — async function humanBearer(e = env())
- adminBearer · function · L65-L72 — async function adminBearer(e = env())
- pendingUserCode · function · L74-L83 — async function pendingUserCode(store: ReturnType<typeof memoryDeviceStore>, e: Env)
- completeShortCodeEnrollment · function · L85-L114 — async function completeShortCodeEnrollment(store: ReturnType<typeof memoryDeviceStore>, e: Env, handle: string)
