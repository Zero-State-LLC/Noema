# workers/noema/src/play-mail.ts

- safePlayNext · function · L8-L13 — function safePlayNext(raw?: string | null): "/connect" | "/watch" | null
- canonicalConnectCode · function · L15-L18 — function canonicalConnectCode(raw?: string | null): string | null
- canonicalAuthFlow · function · L20-L23 — function canonicalAuthFlow(raw?: string | null): string | null
- playMagicLinkHref · function · L25-L42 — function playMagicLinkHref( origin: string, tokenHash: string, type = "magiclink", next?: string | null, connectCode?: string | null, authFlow?: string | null, ): string
- renderPlayMailText · function · L44-L65 — function renderPlayMailText(href: string): string
- renderPlayMailHtml · function · L67-L132 — function renderPlayMailHtml(href: string): string
- PlayMailer · type · L134-L140 — type PlayMailer = (mail: { to: string; subject: string; html: string; text: string; href: string; }) => Promise<void>;
- composePlayMail · function · L142-L157 — function composePlayMail(to: string, href: string): { to: string; subject: string; html: string; text: string; href: string; }
