# workers/noema/src/resend.ts

- ResendMail · type · L5-L12 — type ResendMail = { from: string; to: string; subject: string; html: string; text: string; tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap" | "device-enrollment-review"; };
- ResendResponse · type · L14-L14 — type ResendResponse = { id?: string; message?: string };
- sendResendEmail · function · L16-L43 — async function sendResendEmail( env: Env, mail: ResendMail, fetchImpl: typeof fetch = fetch, ): Promise<string>
