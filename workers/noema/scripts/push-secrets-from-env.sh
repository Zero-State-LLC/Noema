#!/usr/bin/env bash
# Push Cloudflare Worker secrets from environment or a local .env file.
# Never commit .env. Never echo secret values.
#
# Usage:
#   export SUPABASE_SERVICE_ROLE_KEY=...
#   ./scripts/push-secrets-from-env.sh
#
# Or create workers/noema/.env (gitignored) with KEY=value lines, then run this.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  echo "loaded workers/noema/.env"
fi
if [ -f ../../.env ]; then
  set -a
  # shellcheck disable=SC1091
  source ../../.env
  set +a
  echo "loaded repo .env"
fi

put() {
  local name="$1"
  local val="${!name-}"
  if [ -z "$val" ]; then
    echo "skip $name (unset)"
    return 0
  fi
  printf '%s' "$val" | npx wrangler secret put "$name" >/dev/null
  echo "set  $name (len=${#val})"
}

echo "==> pushing secrets to noema-gateway"
put TOKEN_SIGNING_SECRET
put SUPABASE_URL
put SUPABASE_JWT_SECRET
put SUPABASE_SERVICE_ROLE_KEY
put SUPABASE_ACCESS_TOKEN
put SUPABASE_PROJECT_REF
put SUPABASE_CANONICAL_WORLD_ID
put POSTMARK_SERVER_TOKEN
put POSTMARK_ACCOUNT_TOKEN
put POSTMARK_FROM_EMAIL
put POSTMARK_MESSAGE_STREAM
put RESEND_API_KEY
put RESEND_FROM_EMAIL

echo "==> current secret names"
npx wrangler secret list

echo "done. Redeploy not required for secret changes."
echo "Smoke: BASE=https://noema-gateway.zer0state-noema.workers.dev npm run smoke"
