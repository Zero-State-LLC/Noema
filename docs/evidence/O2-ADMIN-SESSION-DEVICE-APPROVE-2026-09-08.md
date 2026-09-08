# O2 — Admin-session device approve on `/connect`

**Recorded:** 2026-09-08
**Authority:** Danny human-yes for O2 only
**Verdict:** local Worker evidence that a signed-in Admin can Approve or Deny a pending device code on `/connect` without a PLAY watch-link session
**Does not claim Gate B COMPLETE.** Gate B still requires real device enrollment receipts after Approve + redeem. This note records the access path only.

No Deploy. No O1 review-mail secrets. No O3 maintenance header. No silent auto-approve.

## What shipped

| Surface | Change |
|---|---|
| FE `workers/noema/src/connect.ts` | `sessionToken()` uses `noema.play.token` first, then `noema.admin.token`. Approve/Deny stay click-only. Opening `/connect` still does not approve. |
| BE `approveDevice` / `denyDevice` | Accept an Admin Bearer (`AdminPrincipal`) in addition to a human platform token. Persist `approver_id` and `approver_amr` as the observed label `admin_session`. Receipt fields (`controller_id`, `approval_receipt`, `independent_control_receipt`, `controller_binding_digest`) are unchanged. |
| Not changed | `POST /v1/admin/agent/enroll` and `POST /v1/admin/controller-token` remain break-glass and are not Gate B substitutes. No `browser_automation` claims. No device auto-approve. |

## What an Admin must do

1. Sign in at `/admin/login` (allowlisted mailbox). The Admin FE stores `sessionStorage.noema.admin.token`.
2. Open `/connect` (or `/connect?connect_code=…`) in the same browser session.
3. Enter or confirm the agent's short code. Look up shows pending public fields only.
4. Click **Approve** or **Deny**. Opening the page, preview, and saved-code banners do not approve.
5. The agent polls `/v1/auth/device/token` every 5 seconds or less and redeems after Approve.

A PLAY watch-link session still works and is preferred when both tokens are present.

## Checks (local)

```bash
cd workers/noema
npx vitest run test/device-enrollment.test.ts test/connect-enroll-honesty.test.ts test/play-email-login.test.ts test/product-surface.test.ts
```

Covered: play token still approves; Admin token approves a pending `user_code` and labels `admin_session`; missing both remain unauthorized; GET `/connect` and preview do not approve; second Admin approve is 409 and does not rebind.

## Observed labels

Admin approval stores `approver_id: admin_session` and `approver_amr: admin_session`. Human watch-link approval still stores the human `identity_id` and that session's AMR.

## Out of scope

O1 `DEVICE_REVIEW_TOKEN_SECRET` / Resend. O3 maintenance approve secret. Changing Gate B acceptance criteria. Deploy.
