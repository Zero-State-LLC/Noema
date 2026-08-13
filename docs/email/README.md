# NOEMA auth email templates

Supabase Auth has **one** Magic Link template per project. PLAY and ADMIN both send `/auth/v1/otp`; they differ only by `email_redirect_to`:

| Request | Redirect |
|---------|----------|
| Player (`/` or `/play`) | `https://noema.guru/play/callback` |
| Admin (`/admin/login`) | `https://noema.guru/admin/callback` |

The dashboard template **must** put `token_hash` on that redirect. Do **not** hardcode only `/admin/callback` or only `/play/callback`.

## Paste into Supabase (required)

Dashboard: **Authentication → Emails → Magic Link**

**Subject**

```text
NOEMA sign-in
```

**Body:** paste `docs/email/supabase-magic-link.html` as-is.

The button href is:

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}
```

Allowlist (Authentication → URL configuration):

```text
https://noema.guru/play/callback
https://noema.guru/admin/callback
http://127.0.0.1:8787/play/callback
http://127.0.0.1:8787/admin/callback
```

## Reference copies (not pasted as the live slot)

These are the two planes if we later send mail ourselves. Today they are copy/design references.

| File | Plane |
|------|--------|
| `play-magic-link.html` + `.txt` | Player → Chamber |
| `admin-magic-link.html` + `.txt` | Operator → `/admin` |

## What not to put in mail

- `ADMIN_OPERATOR_TOKEN`
- Supabase service role
- World seed / profile / Story Seed IDs
- “Activate Genesis”
