#!/usr/bin/env bash
# Deploy Noema Stage 0 Worker + DO to pinned Cloudflare account.
# Requires: wrangler login OR CLOUDFLARE_API_TOKEN
set -euo pipefail
cd "$(dirname "$0")/.."

ACCOUNT_EXPECT="315fb44b61212825452aad0ca566ea42"

# wrangler.toml defaults NOEMA_ENV=local for `npm run dev`. A silent fallback
# here would deploy that local default and re-enable public /v1/auth/dev-token.
if [ -z "${NOEMA_ENV:-}" ]; then
  echo "error: NOEMA_ENV must be set explicitly to production or preview."
  echo "  production: NOEMA_ENV=production npm run deploy"
  echo "  preview:    NOEMA_ENV=preview npm run deploy"
  echo "  local/dev:  npm run dev  (uses wrangler.toml NOEMA_ENV=local)"
  exit 1
fi
case "${NOEMA_ENV}" in
  production|preview) ENV_NAME="${NOEMA_ENV}" ;;
  *)
    echo "error: NOEMA_ENV must be production or preview, got: ${NOEMA_ENV}"
    echo "  local/dev uses npm run dev — do not deploy NOEMA_ENV=local"
    exit 1
    ;;
esac

echo "==> wrangler whoami"
if ! WHO=$(npx wrangler whoami 2>&1); then
  echo "$WHO"
  echo "Not authenticated. Run: npx wrangler login"
  echo "Or: export CLOUDFLARE_API_TOKEN=… (Workers Edit on account $ACCOUNT_EXPECT)"
  exit 1
fi
echo "$WHO"
if ! echo "$WHO" | grep -q "$ACCOUNT_EXPECT"; then
  echo "WARN: expected account_id $ACCOUNT_EXPECT not found in whoami output."
  echo "Confirm wrangler.toml account_id and that the token can access that account."
fi

echo "==> deploy (NOEMA_ENV=$ENV_NAME)"
npx wrangler deploy --var "NOEMA_ENV:${ENV_NAME}"

echo "==> done. Set secrets if not already:"
echo "  npx wrangler secret put TOKEN_SIGNING_SECRET"
echo "  npx wrangler secret put SUPABASE_URL"
echo "  npx wrangler secret put SUPABASE_JWT_SECRET"
echo "  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "Smoke: BASE=https://noema-gateway.<subdomain>.workers.dev npm run smoke"
