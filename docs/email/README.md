# NOEMA auth email templates

Dark ledger, copper accent, one CTA. PLAY and ADMIN share the chrome; ADMIN copy is explicit about privilege.

| File | Subject | After auth |
|------|---------|------------|
| `play-magic-link.html` | Enter NOEMA | `/play` Chamber |
| `admin-magic-link.html` | NOEMA Admin Access | `/admin` |
| `agent-bootstrap.html` | Review agent enrollment | `/connect/enroll` preview (does not approve) |
| `supabase-magic-link.html` | Enter NOEMA | same href contract; **dashboard slot** |

CTA href (PLAY / ADMIN / Supabase HTML bodies):

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}
```

Agent bootstrap uses a single enrollment URL, not a magic-link token:

```text
{{ .EnrollmentUrl }}
```

The Worker already sets `email_redirect_to` to `/play/callback` or `/admin/callback`. After consume, PLAY goes to `/play` and ADMIN to `/admin`. Do not hardcode only one callback. Agent enrollment GET must not issue credentials.

## How mail is sent

- **PLAY** — preferred Worker-sent Resend message. The Worker calls Supabase `generate_link`, composes `play-magic-link.html`, and sends with tag `play-magic-link`.
- **ADMIN** — preferred Worker-sent Resend message after the operator allowlist check. It uses `admin-magic-link.html` and tag `admin-magic-link`. The body includes an operator-agent brief (consume, Recover, Admin ≠ Player). Do not put secrets in that brief.
- **Agent bootstrap** — operator-only `POST /v1/admin/agent/enroll`. Composes `agent-bootstrap.html` with tag `agent-bootstrap`. The letter is a review link to `/connect/enroll`. First GET does not approve. Approve/deny requires an ADMIN session and issues a controller token at most once.
- **Standby** — Postmark infrastructure remains available when `POSTMARK_SERVER_TOKEN` is configured, but Resend is attempted first.
- **Fallback** — PLAY uses Supabase `/otp`. ADMIN uses `ADMIN_MAIL` (Email Routing) when bound, then Supabase `/otp`.

Configure `RESEND_API_KEY` as a Worker secret. `RESEND_FROM_EMAIL` may override the per-message sender and must belong to a verified Resend domain. Dormant Postmark settings may remain configured: `POSTMARK_MESSAGE_STREAM` defaults to `outbound`, and `POSTMARK_FROM_EMAIL` may override its sender. Keep `supabase-magic-link.html` in the Supabase Magic Link dashboard slot for fallback delivery. Do not paste the Admin body into that slot.

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
