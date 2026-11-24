# 2026-11-24: Live Worker Deploy, GA4 Fixes, Client 0.1.24 Pin & RFC-0131

- **Deploy pin-bot auth**: `actions/checkout@v7` persists `http.https://github.com/.extraheader`, which overrides `GH_TOKEN` in `deploy-worker-pin-pr.yml`. Fixed in `#896` by unsetting `http.https://github.com/.extraheader` before `git push`.
- **GA4 privacy hardening (`#893`)**: Always exclude `/play/callback` and `/auth/callback` from GA4 and pass `page_location: location.origin + path` so query parameters (`token_hash`, `connect_code`, `auth_flow`) are never sent to Google.
- **Official client pin**: Bumped `spec-compat.json` and `docs/PARTNER-OPERATOR.md` to `noema-client==0.1.24` (`client-pin.test.ts` enforces both stay in sync).
- **STUDY redaction & RFC-0131**: Added `scripts/validate_study_privacy_redaction.py` (`#897`) and feature-flagged `workers/noema/src/study-admin.ts` (disabled by default until `STUDY_ADMIN_UI_ENABLED=true`).
