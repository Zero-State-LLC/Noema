# NOEMA auth email templates

Dark ledger, copper accent, one CTA. PLAY and ADMIN share the chrome; ADMIN copy is explicit about privilege.

| File | Subject | After auth |
|------|---------|------------|
| `play-magic-link.html` | Enter NOEMA | `/play` Chamber |
| `admin-magic-link.html` | NOEMA Admin Access | `/admin` |
| `supabase-magic-link.html` | Enter NOEMA | same href contract; **dashboard slot** |

CTA href (all HTML bodies):

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}
```

The Worker already sets `email_redirect_to` to `/play/callback` or `/admin/callback`. After consume, PLAY goes to `/play` and ADMIN to `/admin`. Do not hardcode only one callback.

## How mail is sent

- **PLAY** — preferred Worker-sent Postmark message. The Worker calls Supabase `generate_link`, composes `play-magic-link.html`, and sends with tag `play-magic-link`.
- **ADMIN** — preferred Worker-sent Postmark message after the operator allowlist check. It uses `admin-magic-link.html` and tag `admin-magic-link`.
- **Fallback** — PLAY uses Supabase `/otp`. ADMIN uses `ADMIN_MAIL` (Email Routing) when bound, then Supabase `/otp`.

Configure `POSTMARK_SERVER_TOKEN` as a Worker secret. `POSTMARK_MESSAGE_STREAM` defaults to `outbound`; `POSTMARK_FROM_EMAIL` may override the per-message sender and must be verified in Postmark. Keep `supabase-magic-link.html` in the Supabase Magic Link dashboard slot for fallback delivery. Do not paste the Admin body into that slot.

Allowlist:

```text
https://noema.guru/play/callback
https://noema.guru/admin/callback
http://127.0.0.1:8787/play/callback
http://127.0.0.1:8787/admin/callback
```

## What not to put in mail

- `ADMIN_OPERATOR_TOKEN`
- World seed / profile / Story Seed IDs
- “Activate Genesis”
