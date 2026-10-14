# workers/noema/src/email-provider.ts

- TransactionalMail · type · L4-L11 — type TransactionalMail = { from: string; to: string; subject: string; html: string; text: string; tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap" | "device-enrollment-review"; };
- EmailProvider · type · L13-L13 — type EmailProvider = "resend";
- hasTransactionalProvider · function · L19-L21 — function hasTransactionalProvider(env: Env): boolean
- sendTransactionalEmail · function · L23-L30 — async function sendTransactionalEmail( env: Env, mail: TransactionalMail, fetchImpl: typeof fetch = fetch, ): Promise<{ provider: EmailProvider; messageId: string }>
