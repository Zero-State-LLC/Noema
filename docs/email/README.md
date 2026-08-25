# NOEMA auth email templates

Dark graphite, semantic accent, one CTA. PLAY uses world tokens; ADMIN uses the operator warning accent. ADMIN copy stays privilege-distinct.

| File | Subject | After auth |
|------|---------|------------|
| `play-magic-link.html` | Watch NOEMA | `/play` Chamber |
| `play-magic-link.txt` | Watch NOEMA | plaintext twin of `play-magic-link.html` |
| `admin-magic-link.html` | NOEMA Admin Access | `/admin` |
| `admin-magic-link.txt` | NOEMA Admin Access | plaintext twin of `admin-magic-link.html` |
| `agent-bootstrap.html` | Review agent enrollment | `/connect/enroll` preview (does not approve) |
| `agent-bootstrap.txt` | Review agent enrollment | plaintext twin of `agent-bootstrap.html` |
| `supabase-magic-link.html` | Enter NOEMA | same href contract; **dashboard slot fallback only** |

These files are the canonical Worker-rendered templates for PLAY, ADMIN, and Agent bootstrap mail. Worker renderers in `workers/noema/src/play-mail.ts`, `workers/noema/src/admin-mail.ts`, and `workers/noema/src/agent-mail.ts` must render byte-for-byte equivalent bodies after placeholder substitution. `workers/noema/test/email-templates.test.ts` enforces source-renderer parity and subject parity.

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
- **Fallback** — PLAY uses Supabase `/otp`. ADMIN uses `ADMIN_MAIL` (Email Routing) when bound, then Supabase `/otp`.

Configure `RESEND_API_KEY` as a Worker secret. `RESEND_FROM_EMAIL` may override the per-message sender and must belong to a verified Resend domain. Keep `supabase-magic-link.html` in the Supabase Magic Link dashboard slot for fallback delivery. Do not paste the Admin body into that slot.

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
