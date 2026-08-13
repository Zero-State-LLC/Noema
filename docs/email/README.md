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

## Supabase has one Magic Link slot

Paste **`supabase-magic-link.html`** (Player letter) into **Authentication → Emails → Magic Link**.

**Subject:** `Enter NOEMA`

That is the public path. The Admin letter (`admin-magic-link.html`, subject `NOEMA Admin Access`) is the operator copy. It cannot live in the same dashboard slot. Until we send Admin mail from the Worker, do not paste the Admin body into Magic Link — Players would be told they have privileged access.

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
