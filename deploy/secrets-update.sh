#!/usr/bin/env bash
# =============================================================================
# secrets-update.sh — Update a single secret value in the deployed app
#                     without triggering a full rebuild.
#
# Use this to rotate credentials (e.g. Watson API key) quickly.
#
# Usage:
#   ./deploy/secrets-update.sh KEY value
#   ./deploy/secrets-update.sh WATSON_ASSISTANT_API_KEY my-new-api-key
#
#   Or interactively:
#   ./deploy/secrets-update.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RED='\033[0;31m'; RESET='\033[0m'

info()    { echo -e "  ${CYAN}▶${RESET} $*"; }
success() { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; }
divider() { echo "────────────────────────────────────────────────────────────"; }

IBM_CLOUD_REGION="${IBM_CLOUD_REGION:-us-east}"
CE_PROJECT="${CE_PROJECT:-ibm-sales-guidance}"
CE_APP="${CE_APP:-ibm-sales-guidance-tool}"
CE_SECRET="${CE_SECRET:-sales-guidance-secrets}"

echo ""
divider
echo -e "${BOLD}  IBM Sales Guidance Tool — Secrets Update${RESET}"
divider
echo ""

# Login check
if ! ibmcloud account show &>/dev/null; then
  error "Not logged in. Run: ibmcloud login --sso"
  exit 1
fi
ibmcloud target -r "${IBM_CLOUD_REGION}" -q
ibmcloud ce project select --name "${CE_PROJECT}" -q

# ─── Get key/value ────────────────────────────────────────────────────────────
if [[ $# -eq 2 ]]; then
  SECRET_KEY="$1"
  SECRET_VALUE="$2"
elif [[ $# -eq 0 ]]; then
  echo "  Available keys (common):"
  echo "    WATSON_ASSISTANT_API_KEY"
  echo "    WATSON_ASSISTANT_ENVIRONMENT_ID"
  echo "    WATSON_ASSISTANT_VERSION"
  echo "    ASKSALES_API_KEY"
  echo "    AI_API_KEY"
  echo ""
  read -r -p "  Key to update: " SECRET_KEY
  read -r -s -p "  New value:     " SECRET_VALUE
  echo ""
else
  error "Usage: $0 KEY value"
  exit 1
fi

if [[ -z "${SECRET_KEY}" || -z "${SECRET_VALUE}" ]]; then
  error "Key and value must not be empty."
  exit 1
fi

# ─── Update the secret ────────────────────────────────────────────────────────
info "Updating ${CE_SECRET} — setting ${SECRET_KEY}..."
ibmcloud ce secret update \
  --name "${CE_SECRET}" \
  --from-literal "${SECRET_KEY}=${SECRET_VALUE}"
success "Secret updated"

# ─── Restart the app to pick up the new value ─────────────────────────────────
info "Restarting '${CE_APP}' to apply new secret..."
ibmcloud ce app update --name "${CE_APP}" --wait
success "App restarted"

# ─── Smoke test ───────────────────────────────────────────────────────────────
APP_URL=$(ibmcloud ce app get --name "${CE_APP}" --output json 2>/dev/null \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',{}).get('url',''))" \
  2>/dev/null || true)

if [[ -n "${APP_URL}" ]]; then
  info "Running /api/diag to verify..."
  sleep 8
  HTTP_CODE=$(curl -s -o /tmp/diag_response.json -w "%{http_code}" \
    --max-time 30 "${APP_URL}/api/diag" 2>/dev/null || echo "000")
  if [[ "${HTTP_CODE}" == "200" ]]; then
    HAS_KEY=$(python3 -c \
      "import json; d=json.load(open('/tmp/diag_response.json')); print('YES' if d.get('env',{}).get('hasApiKey') else 'NO')" \
      2>/dev/null || echo "?")
    WATSON_OK=$(python3 -c \
      "import json; d=json.load(open('/tmp/diag_response.json')); print('YES' if d.get('watson',{}).get('ok') else 'NO')" \
      2>/dev/null || echo "?")
    success "Diag: API key set=${HAS_KEY}, Watson reachable=${WATSON_OK}"
  else
    warn "Diag returned HTTP ${HTTP_CODE} — check ${APP_URL}/api/diag"
  fi
fi

echo ""
divider
echo -e "${BOLD}  Done — ${SECRET_KEY} updated${RESET}"
divider
echo ""
