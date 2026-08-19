#!/usr/bin/env bash
# Deploy Noema Stage 0 Worker + DO to pinned Cloudflare account.
# Requires: wrangler login OR CLOUDFLARE_API_TOKEN
set -euo pipefail
cd "$(dirname "$0")/.."

ACCOUNT_EXPECT="315fb44b61212825452aad0ca566ea42"

# wrangler.toml fails closed with NOEMA_ENV=production. This wrapper permits
# only the production target: no isolated [env.preview] Worker/DO exists yet.
if [ -z "${NOEMA_ENV:-}" ]; then
  echo "error: NOEMA_ENV must be set explicitly to production."
  echo "  production: NOEMA_ENV=production npm run deploy"
  echo "  local/dev:  npm run dev  (passes NOEMA_ENV=local explicitly)"
  exit 1
fi
case "${NOEMA_ENV}" in
  production) ENV_NAME="production" ;;
  preview)
    echo "error: preview deployment is disabled: wrangler.toml has no isolated [env.preview] Worker and Durable Object namespace."
    echo "Provision an independently named preview environment before enabling this path."
    exit 1
    ;;
  *)
    echo "error: NOEMA_ENV must be production, got: ${NOEMA_ENV}"
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
  echo "error: expected account_id $ACCOUNT_EXPECT not found in whoami output."
  echo "Refusing to deploy. Confirm wrangler.toml and Cloudflare token access."
  exit 1
fi

echo "==> deploy (NOEMA_ENV=$ENV_NAME)"
npx wrangler deploy --var "NOEMA_ENV:${ENV_NAME}"

echo "==> done. Set secrets if not already:"
echo "  npx wrangler secret put TOKEN_SIGNING_SECRET"
echo "  npx wrangler secret put SUPABASE_URL"
echo "  npx wrangler secret put SUPABASE_JWT_SECRET"
echo "  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "  npx wrangler secret put RESEND_API_KEY"
