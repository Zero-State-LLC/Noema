# workers/noema/src/admin-mail.ts

- extractHashedToken · function · L13-L24 — function extractHashedToken(payload: unknown): { token: string; type: string } | null
- adminMagicLinkHref · function · L26-L29 — function adminMagicLinkHref(origin: string, tokenHash: string, type = "magiclink"): string
- renderAdminMailText · function · L31-L81 — function renderAdminMailText(href: string): string
- renderAdminMailHtml · function · L83-L207 — function renderAdminMailHtml(href: string): string
- buildAdminMime · function · L209-L237 — function buildAdminMime(opts: { from: string; to: string; subject: string; text: string; html: string; }): string
- AdminMailer · type · L239-L245 — type AdminMailer = (mail: { to: string; subject: string; html: string; text: string; href: string; }) => Promise<void>;
- deliverAdminMail · function · L247-L282 — async function deliverAdminMail(env: Env, mail: { to: string; subject: string; html: string; text: string; }, fetchImpl: typeof fetch = fetch): Promise<void>
- composeAdminMail · function · L284-L298 — function composeAdminMail(href: string, to: string): { to: string; subject: string; html: string; text: string; href: string; }
