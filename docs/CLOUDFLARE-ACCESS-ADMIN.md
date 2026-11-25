# Cloudflare Access Admin Login Setup

In-Worker defense-in-depth verification is implemented in `workers/noema/src/cf-access.ts` and enforced on `/admin/studies` and `/api/admin/studies/*` whenever `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are set.

## 1. Create Cloudflare Zero Trust Access Application
1. Open **Cloudflare Zero Trust -> Access -> Applications -> Add an application -> Self-hosted**.
2. Protect paths:
   - `noema.guru/admin*`
   - `noema.guru/api/admin*`
3. Attach an Allow policy restricting access to your operator emails (matching `ADMIN_ALLOWLIST_EMAILS`) via Email OTP, GitHub, or Google IdP.
4. Copy the **Application Audience (AUD) Tag** and your **Team Domain** (`<team>.cloudflareaccess.com`).

## 2. Configure Worker Secrets (Never `[vars]`)
```bash
cd workers/noema
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN
npx wrangler secret put CF_ACCESS_AUD
npx wrangler secret put ADMIN_ALLOWLIST_EMAILS
```

## 3. Security Guarantees
- **RS256 JWKS verification**: Validates `Cf-Access-Jwt-Assertion` against `https://<CF_ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs`, checking `iss`, `aud`, `nbf`, and `exp`.
- **Allowlist cross-check**: Rejects verified tokens whose `email` is not in `ADMIN_ALLOWLIST_EMAILS` with `403 CF_ACCESS_NOT_ALLOWLISTED`.
- **Anti-spoofing**: Strips any client-supplied `X-Noema-Admin-Actor` / `X-Noema-Admin-Auth-Event` headers and injects the verified Access `email` and `cf-access:<jti>` before forwarding to `StudyAdminDO`.
