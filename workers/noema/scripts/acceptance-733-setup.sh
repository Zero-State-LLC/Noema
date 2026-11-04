#!/usr/bin/env bash
# One-time operator wizard for the #733 isolated acceptance runner.
#
#   bash workers/noema/scripts/acceptance-733-setup.sh [--dry-run]
#
# Stages: tools -> Cloudflare login -> Supabase login -> acceptance project
# (create or link; never the production project) -> db push -> acceptance.env
# (mode 600) -> boolean verification. Idempotent: re-running skips what is done.
# Secret values are read hidden, written only to the mode-600 file, never echoed.
# --dry-run prints the steps and executes nothing.
set -euo pipefail

PROD_REF="dezykkherxlaysxyvgbs"
ACCOUNT_ID="315fb44b61212825452aad0ca566ea42"
PROJECT_NAME="noema-733-acceptance"
ENV_FILE="${NOEMA_ACCEPTANCE_ENV:-$HOME/.config/noema/acceptance.env}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DRY=0
TOTAL=7
N=0

validate_ref() {
  local ref="$1"
  if [ "$ref" = "$PROD_REF" ]; then
    echo "error: that is the production Supabase project; use a separate project (decision D1a)" >&2
    return 1
  fi
  if ! [[ "$ref" =~ ^[a-z]{20}$ ]]; then
    echo "error: a Supabase project ref is 20 lowercase letters" >&2
    return 1
  fi
}

case "${1:-}" in
  --validate-ref) validate_ref "${2:-}"; exit $? ;;
  --dry-run) DRY=1 ;;
  "") ;;
  *) echo "usage: $0 [--dry-run]" >&2; exit 2 ;;
esac
[ "$#" -le 1 ] || { echo "usage: $0 [--dry-run]" >&2; exit 2; }

stage() { N=$((N + 1)); echo; echo "== [$N/$TOTAL] $1 =="; }
say() { echo "   $*"; }
# Run a command, or only show it under --dry-run.
do_cmd() {
  if [ "$DRY" = 1 ]; then echo "   + $*"; return 0; fi
  "$@"
}
ask() { local v; read -r -p "   $1: " v </dev/tty; printf '%s' "$v"; }
ask_secret() { local v; read -r -s -p "   $1 (input hidden): " v </dev/tty; echo >&2; printf '%s' "$v"; }
confirm() { local a; read -r -p "   $1 [y/N] " a </dev/tty; [ "$a" = y ] || [ "$a" = Y ]; }
wrangler_clean() { env -u CLOUDFLARE_API_TOKEN npx wrangler "$@"; }

echo "#733 acceptance setup$([ "$DRY" = 1 ] && echo ' (dry run: nothing is executed)')"

stage "Check tools"
for tool in node npx supabase; do
  if [ "$DRY" = 1 ]; then say "+ command -v $tool"; elif command -v "$tool" >/dev/null 2>&1; then say "$tool: found"; else echo "error: $tool is required" >&2; exit 1; fi
done
do_cmd npx wrangler --version

stage "Cloudflare login (account $ACCOUNT_ID)"
say "The ambient CLOUDFLARE_API_TOKEN lacks secrets permission; OAuth login is used (env -u CLOUDFLARE_API_TOKEN)."
if [ "$DRY" = 1 ]; then
  say "+ env -u CLOUDFLARE_API_TOKEN npx wrangler whoami   (login if account $ACCOUNT_ID is absent)"
  say "+ env -u CLOUDFLARE_API_TOKEN npx wrangler login"
else
  if ! wrangler_clean whoami 2>/dev/null | grep -q "$ACCOUNT_ID"; then
    say "Not logged in to the right account; starting wrangler login."
    wrangler_clean login
    wrangler_clean whoami 2>/dev/null | grep -q "$ACCOUNT_ID" || { echo "error: wrangler is not authenticated for account $ACCOUNT_ID" >&2; exit 1; }
  fi
  say "Cloudflare account verified."
fi

stage "Supabase login"
if [ "$DRY" = 1 ]; then
  say "+ supabase projects list   (if it fails: supabase login)"
  say "+ supabase login"
else
  supabase projects list >/dev/null 2>&1 || supabase login
fi

stage "Acceptance Supabase project (separate from production)"
REF=""
if [ "$DRY" = 1 ]; then
  say "+ supabase projects create $PROJECT_NAME --org-id <prompt> --region <prompt> --db-password <generated, hidden>"
  say "  or link an existing non-production project ref (refused: the production ref)"
else
  mode="$(ask 'create a new project (c) or link an existing one (l)')"
  if [ "$mode" = c ]; then
    org="$(ask 'Supabase org id')"
    region="$(ask 'region (e.g. us-west-1)')"
    dbpw="$(openssl rand -base64 24 | tr -d '/+=')"
    say "Generated a database password (kept in this shell only; reset it in the dashboard if you need it later)."
    supabase projects create "$PROJECT_NAME" --org-id "$org" --region "$region" --db-password "$dbpw"
    export SUPABASE_DB_PASSWORD="$dbpw"
    REF="$(ask 'project ref of the project just created')"
  else
    REF="$(ask 'project ref to link (not production)')"
    SUPABASE_DB_PASSWORD="$(ask_secret 'database password for that project')"; export SUPABASE_DB_PASSWORD
  fi
  validate_ref "$REF"
fi

stage "Link and push migrations (from supabase/)"
if [ "$DRY" = 1 ]; then
  say "+ (cd $REPO_ROOT && supabase link --project-ref <ref>)"
  say "+ (cd $REPO_ROOT && supabase db push)"
else
  confirm "Apply Noema migrations to project $REF?" || { echo "aborted"; exit 1; }
  (cd "$REPO_ROOT" && supabase link --project-ref "$REF" && supabase db push)
fi

stage "Write $ENV_FILE (mode 600)"
if [ "$DRY" = 1 ]; then
  say "+ write SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY with mode 600 (hidden prompt, or supabase projects api-keys --project-ref)"
else
  if [ -f "$ENV_FILE" ] && ! confirm "$ENV_FILE exists; overwrite?"; then
    say "keeping existing file"
  else
    key="$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const k=JSON.parse(s).find(x=>x.name==="service_role");process.stdout.write(k?k.api_key:"")}catch{}})' || true)"
    [ -n "$key" ] || key="$(ask_secret 'service-role key (Dashboard > Settings > API)')"
    [ "${#key}" -ge 20 ] || { echo "error: key looks too short" >&2; exit 1; }
    mkdir -p "$(dirname "$ENV_FILE")"; chmod 700 "$(dirname "$ENV_FILE")"
    ( umask 077; printf 'SUPABASE_URL=https://%s.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$REF" "$key" > "$ENV_FILE.tmp" )
    chmod 600 "$ENV_FILE.tmp"; mv "$ENV_FILE.tmp" "$ENV_FILE"
    unset key
    say "wrote $ENV_FILE (mode 600)"
  fi
fi

stage "Verify (booleans only)"
if [ "$DRY" = 1 ]; then
  say "+ file_mode_600, has_both_keys, url_not_production, postgrest_heads_reachable"
else
  mode_ok=false; keys_ok=false; url_ok=false; rest_ok=false
  [ "$(stat -f '%Lp' "$ENV_FILE" 2>/dev/null || stat -c '%a' "$ENV_FILE")" = 600 ] && mode_ok=true
  url="$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)"
  grep -q '^SUPABASE_SERVICE_ROLE_KEY=.' "$ENV_FILE" && [ -n "$url" ] && keys_ok=true
  case "$url" in *"$PROD_REF"*) ;; https://*.supabase.co) url_ok=true ;; esac
  if [ "$keys_ok" = true ] && [ "$url_ok" = true ]; then
    k="$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)"
    code="$(printf 'header = "apikey: %s"\nheader = "authorization: Bearer %s"\n' "$k" "$k" | curl -s -o /dev/null -w '%{http_code}' -K - "$url/rest/v1/noema_world_heads?select=world_id&limit=1" || true)"
    unset k
    [ "$code" = 200 ] && rest_ok=true
  fi
  echo "   file_mode_600=$mode_ok has_both_keys=$keys_ok url_not_production=$url_ok postgrest_heads_reachable=$rest_ok"
  [ "$mode_ok$keys_ok$url_ok$rest_ok" = truetruetruetrue ] || { echo "setup incomplete" >&2; exit 1; }
  echo; echo "Done. Next: node workers/noema/scripts/acceptance-733.mjs plan"
fi
