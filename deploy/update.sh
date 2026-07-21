#!/usr/bin/env bash
# =============================================================================
# update.sh — Redeploy the IBM Sales Guidance Tool after a code change
#              or credential update.
#
# Run this after:
#   - Pushing new code to GitHub
#   - Editing .env credentials
#   - Rotating the Watson API key
#
# Usage:
#   chmod +x deploy/update.sh
#   ./deploy/update.sh
#
# For first-time setup, use deploy/setup.sh instead.
# =============================================================================

set -euo pipefail

# ─── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RED='\033[0;31m'; RESET='\033[0m'

info()    { echo -e "  ${CYAN}▶${RESET} $*"; }
success() { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; }
divider() { echo "────────────────────────────────────────────────────────────"; }

# ─── Config — must match setup.sh ─────────────────────────────────────────────
GITHUB_REPO="${GITHUB_REPO:-https://github.com/slaphen1/ibm-sales-guidance-tool}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
IBM_CLOUD_REGION="${IBM_CLOUD_REGION:-us-east}"
ICR_NAMESPACE="${ICR_NAMESPACE:-ibm-sales-tools}"
IMAGE_NAME="${IMAGE_NAME:-sales-guidance-tool}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CE_PROJECT="${CE_PROJECT:-ibm-sales-guidance}"
CE_APP="${CE_APP:-ibm-sales-guidance-tool}"
CE_SECRET="${CE_SECRET:-sales-guidance-secrets}"
CE_REGISTRY_SECRET="${CE_REGISTRY_SECRET:-icr-secret}"
CE_BUILD="${CE_BUILD:-sales-guidance-build}"
ENV_FILE="${ENV_FILE:-.env}"
# ──────────────────────────────────────────────────────────────────────────────

IMAGE_URL="icr.io/${ICR_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"
BUILD_RUN_NAME="${CE_BUILD}-run-$(date +%s)"

echo ""
divider
echo -e "${BOLD}  IBM Sales Guidance Tool — Update${RESET}"
divider
echo ""

# ─── Login check ─────────────────────────────────────────────────────────────
info "Verifying IBM Cloud login..."
if ! ibmcloud account show &>/dev/null; then
  error "Not logged in. Run: ibmcloud login --sso"
  exit 1
fi
ibmcloud target -r "${IBM_CLOUD_REGION}" -q
ibmcloud ce project select --name "${CE_PROJECT}" -q
success "Logged in — project '${CE_PROJECT}' selected"

# ─── Decide what to update ────────────────────────────────────────────────────
UPDATE_SECRETS=0
UPDATE_CODE=1  # always rebuild from latest GitHub commit

if [[ -f "${ENV_FILE}" ]]; then
  echo ""
  echo "  Found ${ENV_FILE}. Sync secrets to Code Engine? [Y/n]"
  read -r -p "  > " SYNC_SECRETS
  [[ "${SYNC_SECRETS}" =~ ^[Nn]$ ]] || UPDATE_SECRETS=1
fi

# ─── Sync secrets ────────────────────────────────────────────────────────────
if [[ ${UPDATE_SECRETS} -eq 1 ]]; then
  info "Syncing secrets from ${ENV_FILE}..."
  ibmcloud ce secret delete --name "${CE_SECRET}" --force 2>/dev/null || true
  ibmcloud ce secret create --name "${CE_SECRET}" --from-env-file "${ENV_FILE}"
  success "Secret '${CE_SECRET}' updated"
fi

# ─── Rebuild from GitHub ──────────────────────────────────────────────────────
info "Submitting build run '${BUILD_RUN_NAME}' from ${GITHUB_REPO}@${GITHUB_BRANCH}..."
echo "    This takes 3–6 minutes..."
echo ""

ibmcloud ce buildrun submit \
  --build "${CE_BUILD}" \
  --name "${BUILD_RUN_NAME}" \
  --wait

success "Image rebuilt: ${IMAGE_URL}"

# ─── Redeploy app ─────────────────────────────────────────────────────────────
info "Rolling out new image to '${CE_APP}'..."

ibmcloud ce app update \
  --name "${CE_APP}" \
  --image "${IMAGE_URL}" \
  --wait

success "App updated — revision $(ibmcloud ce app get --name "${CE_APP}" --output json 2>/dev/null \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',{}).get('latestReadyRevisionName','?'))" \
  2>/dev/null || echo '?')"

# ─── Retrieve URL ─────────────────────────────────────────────────────────────
APP_URL=$(ibmcloud ce app get --name "${CE_APP}" --output json 2>/dev/null \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',{}).get('url',''))" \
  2>/dev/null || true)

[[ -z "${APP_URL}" ]] && APP_URL="(run: ibmcloud ce app get --name ${CE_APP})"

# ─── Quick smoke test ─────────────────────────────────────────────────────────
info "Running /api/diag smoke test..."
sleep 8

HTTP_CODE=$(curl -s -o /tmp/diag_response.json -w "%{http_code}" \
  --max-time 30 "${APP_URL}/api/diag" 2>/dev/null || echo "000")

if [[ "${HTTP_CODE}" == "200" ]]; then
  WATSON_OK=$(python3 -c \
    "import json; d=json.load(open('/tmp/diag_response.json')); print('YES' if d.get('watson',{}).get('ok') else 'NO')" \
    2>/dev/null || echo "?")
  WATSON_MS=$(python3 -c \
    "import json; d=json.load(open('/tmp/diag_response.json')); print(d.get('watson',{}).get('ms','?'))" \
    2>/dev/null || echo "?")
  ASKSALES_ENABLED=$(python3 -c \
    "import json; d=json.load(open('/tmp/diag_response.json')); print('YES' if d.get('asksales',{}).get('enabled') else 'NO')" \
    2>/dev/null || echo "?")
  success "Smoke test passed"
  echo "    Watson reachable : ${WATSON_OK} (${WATSON_MS}ms)"
  echo "    AskSales enabled : ${ASKSALES_ENABLED}"
  [[ "${ASKSALES_ENABLED}" == "NO" ]] && \
    warn "AskSales credentials are placeholder values — roadmap runs on Watson alone."
else
  warn "Smoke test returned HTTP ${HTTP_CODE} — app may still be cold-starting"
  warn "Check: ${APP_URL}/api/diag"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
divider
echo -e "${BOLD}  Update complete!${RESET}"
divider
echo ""
echo    "  Live URL  :  ${APP_URL}"
echo    "  Roadmap   :  ${APP_URL}/roadmap"
echo    "  Chat      :  ${APP_URL}/chat"
echo    "  Diag      :  ${APP_URL}/api/diag"
echo ""
echo    "  Logs:"
echo    "    ibmcloud ce application logs -f -n ${CE_APP}"
echo ""
divider
echo ""
