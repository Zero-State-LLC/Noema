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

- **PLAY** — Supabase Magic Link template. Paste `supabase-magic-link.html` (subject `Enter NOEMA`) into Authentication → Emails → Magic Link.
- **ADMIN** — Worker-sent. `requestAdminMagicLink` calls Supabase `generate_link` (does not use the dashboard Magic Link template), then `ADMIN_MAIL` (Email Routing) sends `admin-magic-link.html` to `zer0state@zer0state.com` only.

If `ADMIN_MAIL` is unbound, ADMIN falls back to Supabase `/otp` (Player-shaped dashboard template). Do not paste the Admin body into the Magic Link slot.

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
