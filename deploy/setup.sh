#!/usr/bin/env bash
# =============================================================================
# setup.sh — First-time deployment of the IBM Sales Guidance Tool
#             to IBM Cloud Code Engine
#
# Works from any IBM Cloud account. Builds from the public GitHub repo
# using Code Engine source-to-image — no local Docker, no local Node.js
# required on the machine running this script.
#
# Prerequisites (install before running):
#   IBM Cloud CLI    https://cloud.ibm.com/docs/cli
#   Code Engine plugin:         ibmcloud plugin install code-engine
#   Container Registry plugin:  ibmcloud plugin install container-registry
#
# Usage:
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh
#
# On subsequent updates, use deploy/update.sh instead.
# =============================================================================

set -euo pipefail

# ─── Colour helpers ───────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "  ${CYAN}▶${RESET} $*"; }
success() { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }
divider() { echo "────────────────────────────────────────────────────────────"; }

# ─── Defaults — override via environment variables ────────────────────────────
GITHUB_REPO="${GITHUB_REPO:-https://github.com/slaphen1/ibm-sales-guidance-tool}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
IBM_CLOUD_REGION="${IBM_CLOUD_REGION:-us-east}"
ICR_REGION="${ICR_REGION:-us.icr.io}"          # ICR login registry
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

clear
echo ""
divider
echo -e "${BOLD}  IBM Sales Guidance Tool — First-Time Setup${RESET}"
echo    "  Deploys to IBM Cloud Code Engine via source-to-image build"
divider
echo ""
echo    "  Source repo : ${GITHUB_REPO}"
echo    "  Branch      : ${GITHUB_BRANCH}"
echo    "  Region      : ${IBM_CLOUD_REGION}"
echo    "  CE project  : ${CE_PROJECT}"
echo    "  App name    : ${CE_APP}"
echo    "  Image       : ${IMAGE_URL}"
echo ""
divider
echo ""

# ─── Step 0: Preflight checks ─────────────────────────────────────────────────
header "Step 0/9  Preflight checks"

# IBM Cloud CLI
if ! command -v ibmcloud &>/dev/null; then
  error "IBM Cloud CLI not found."
  echo "    Install from: https://cloud.ibm.com/docs/cli"
  exit 1
fi
success "IBM Cloud CLI found: $(ibmcloud version 2>/dev/null | head -1)"

# Git (needed only for the env file prompt — S2I uses GitHub directly)
if ! command -v git &>/dev/null; then
  warn "git not found — some prompts may be skipped."
fi

# ─── Step 1: IBM Cloud login ──────────────────────────────────────────────────
header "Step 1/9  IBM Cloud login"

if ! ibmcloud account show &>/dev/null; then
  echo ""
  warn "You are not logged in to IBM Cloud."
  echo ""
  echo "    Choose your login method:"
  echo "    [1] SSO / browser (recommended for corporate w3id)"
  echo "    [2] API key"
  echo ""
  read -r -p "    Enter choice [1/2]: " LOGIN_METHOD

  if [[ "${LOGIN_METHOD}" == "2" ]]; then
    read -r -p "    Enter IBM Cloud API key: " -s IBMCLOUD_API_KEY
    echo ""
    ibmcloud login --apikey "${IBMCLOUD_API_KEY}" -r "${IBM_CLOUD_REGION}"
  else
    ibmcloud login --sso -r "${IBM_CLOUD_REGION}"
  fi
else
  # Already logged in — just retarget the region
  ibmcloud target -r "${IBM_CLOUD_REGION}" -q
fi

ACCOUNT_NAME=$(ibmcloud account show 2>/dev/null | grep "Account Name" | awk -F: '{print $2}' | xargs)
success "Logged in — account: ${ACCOUNT_NAME}"

# ─── Step 2: Install plugins ──────────────────────────────────────────────────
header "Step 2/9  IBM Cloud plugins"

MISSING_PLUGINS=0
for PLUGIN in "code-engine" "container-registry"; do
  if ibmcloud plugin show "${PLUGIN}" &>/dev/null; then
    success "Plugin ${PLUGIN} already installed"
  else
    info "Installing plugin ${PLUGIN}..."
    ibmcloud plugin install "${PLUGIN}" -f
    success "Installed ${PLUGIN}"
    MISSING_PLUGINS=$((MISSING_PLUGINS + 1))
  fi
done

# Re-login to make newly installed plugins available
[[ ${MISSING_PLUGINS} -gt 0 ]] && ibmcloud target -r "${IBM_CLOUD_REGION}" -q

# ─── Step 3: Credentials / .env ───────────────────────────────────────────────
header "Step 3/9  Credentials (.env)"

if [[ ! -f "${ENV_FILE}" ]]; then
  warn ".env file not found at '${ENV_FILE}'."
  echo ""
  echo "    The app needs credentials for:"
  echo "    • Watson Assistant  (REQUIRED — chat and roadmap won't work without this)"
  echo "    • IBM AskSales      (optional — returns empty results without it)"
  echo "    • WatsonX.ai        (optional — deal guidance page only)"
  echo ""
  echo "    A template .env has been written to: ${ENV_FILE}"
  echo "    Fill in WATSON_ASSISTANT_API_KEY at minimum, then re-run this script."
  echo ""

  # Write a pre-filled template with known static values
  cat > "${ENV_FILE}" <<'ENVTEMPLATE'
# ─── IBM Watson Assistant (REQUIRED) ────────────────────────────────────────
# Retrieve the API key from your IBM Watson Assistant instance.
# The instance URL, assistant ID, and environment ID are pre-filled below —
# change them only if you are using a different Watson Assistant instance.

WATSON_ASSISTANT_MESSAGE_URL=https://api.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56
WATSON_ASSISTANT_API_KEY=your-watson-assistant-api-key
WATSON_ASSISTANT_ID=a99f67bd-26da-4ca3-b338-cbbb03bb3e57
WATSON_ASSISTANT_ENVIRONMENT_ID=4ec3f873-5e08-4a8f-b7d4-dd528622e808
WATSON_ASSISTANT_PROD_ENVIRONMENT_ID=cea0be1c-1e71-4bf7-88de-ffc63fd0dee6
WATSON_ASSISTANT_VERSION=2024-08-25
WATSON_ASSISTANT_URL=https://api.direct.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56
WATSON_ASSISTANT_SKILL_ID=85e69230-e195-49ba-9d7b-450b820991a3

# ─── IBM AskSales API (optional — roadmap will still work without it) ────────
ASKSALES_API_URL=https://asksales.ibm.com/api/v1
ASKSALES_API_KEY=your-asksales-api-key
ASKSALES_CLIENT_ID=your-asksales-client-id
ASKSALES_CLIENT_SECRET=your-asksales-client-secret

# ─── WatsonX.ai (optional — only needed for /guidance page) ─────────────────
AI_API_KEY=your-watsonx-api-key
AI_MODEL=ibm/granite-13b-chat-v2
WATSONX_PROJECT_ID=your-watsonx-project-id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# ─── CRM Integration (optional) ─────────────────────────────────────────────
CRM_API_URL=https://your-crm-instance.com/api
CRM_API_KEY=your-crm-api-key

# ─── Runtime ────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ENVTEMPLATE

  echo "    Edit ${ENV_FILE} now, then re-run: ./deploy/setup.sh"
  echo ""
  exit 0
fi

# Validate that the Watson API key has been set
WATSON_KEY=$(grep '^WATSON_ASSISTANT_API_KEY=' "${ENV_FILE}" | cut -d= -f2-)
if [[ -z "${WATSON_KEY}" || "${WATSON_KEY}" == "your-watson-assistant-api-key" ]]; then
  error "WATSON_ASSISTANT_API_KEY is not set in ${ENV_FILE}."
  echo "    Edit the file and add your Watson Assistant API key, then re-run."
  exit 1
fi
success ".env found — WATSON_ASSISTANT_API_KEY is set (${WATSON_KEY:0:8}...)"

# Warn about optional placeholder values
for KEY in ASKSALES_API_KEY AI_API_KEY; do
  VAL=$(grep "^${KEY}=" "${ENV_FILE}" | cut -d= -f2- || true)
  if [[ -z "${VAL}" || "${VAL}" == "your-"* ]]; then
    warn "${KEY} is a placeholder — that feature will use mock/empty responses"
  fi
done

# ─── Step 4: IBM Container Registry ──────────────────────────────────────────
header "Step 4/9  IBM Container Registry"

info "Logging in to IBM Container Registry..."
ibmcloud cr login

# Create namespace (idempotent)
if ibmcloud cr namespace-list 2>/dev/null | grep -q "^${ICR_NAMESPACE}"; then
  success "ICR namespace '${ICR_NAMESPACE}' already exists"
else
  info "Creating ICR namespace '${ICR_NAMESPACE}'..."
  ibmcloud cr namespace-add "${ICR_NAMESPACE}"
  success "Created ICR namespace '${ICR_NAMESPACE}'"
fi

# ─── Step 5: Code Engine project ─────────────────────────────────────────────
header "Step 5/9  Code Engine project"

if ibmcloud ce project get --name "${CE_PROJECT}" &>/dev/null; then
  ibmcloud ce project select --name "${CE_PROJECT}" -q
  success "Selected existing project '${CE_PROJECT}'"
else
  info "Creating Code Engine project '${CE_PROJECT}' in ${IBM_CLOUD_REGION}..."
  ibmcloud ce project create --name "${CE_PROJECT}"
  ibmcloud ce project select --name "${CE_PROJECT}" -q
  success "Created and selected project '${CE_PROJECT}'"
fi

# ─── Step 6: Registry pull secret ────────────────────────────────────────────
header "Step 6/9  Registry pull secret"

# Create an IAM API key scoped for Code Engine to pull from ICR
info "Creating IAM API key for ICR pull access..."
IAM_KEY_NAME="ce-icr-pull-$(date +%s)"
IAM_KEY_JSON=$(ibmcloud iam api-key-create "${IAM_KEY_NAME}" \
  --description "Code Engine ICR pull key for ${CE_APP}" \
  --output json 2>/dev/null)
IAM_KEY_VALUE=$(echo "${IAM_KEY_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['apikey'])" 2>/dev/null)

if [[ -z "${IAM_KEY_VALUE}" ]]; then
  error "Failed to create IAM API key. Check your account permissions."
  exit 1
fi

# Delete existing registry secret if present
ibmcloud ce registry delete --name "${CE_REGISTRY_SECRET}" --force 2>/dev/null || true

ibmcloud ce registry create \
  --name "${CE_REGISTRY_SECRET}" \
  --server "icr.io" \
  --username "iamapikey" \
  --password "${IAM_KEY_VALUE}"

success "Registry secret '${CE_REGISTRY_SECRET}' created"

# ─── Step 7: App secrets from .env ───────────────────────────────────────────
header "Step 7/9  Application secrets"

# Delete and recreate to ensure values are fresh
ibmcloud ce secret delete --name "${CE_SECRET}" --force 2>/dev/null || true
ibmcloud ce secret create --name "${CE_SECRET}" --from-env-file "${ENV_FILE}"
success "Secret '${CE_SECRET}' created from ${ENV_FILE}"

# ─── Step 8: Build image via Code Engine S2I ─────────────────────────────────
header "Step 8/9  Build — source-to-image from GitHub"

echo "    Source: ${GITHUB_REPO} (branch: ${GITHUB_BRANCH})"
echo "    Image:  ${IMAGE_URL}"
echo "    Note:   This takes 3–6 minutes on first build."
echo ""

# Create build config (replace if exists)
ibmcloud ce build delete --name "${CE_BUILD}" --force 2>/dev/null || true

ibmcloud ce build create \
  --name "${CE_BUILD}" \
  --image "${IMAGE_URL}" \
  --source "${GITHUB_REPO}" \
  --commit "${GITHUB_BRANCH}" \
  --strategy dockerfile \
  --dockerfile Dockerfile \
  --size medium \
  --registry-secret "${CE_REGISTRY_SECRET}"

BUILD_RUN_NAME="${CE_BUILD}-run-$(date +%s)"
info "Submitting build run '${BUILD_RUN_NAME}'..."

ibmcloud ce buildrun submit \
  --build "${CE_BUILD}" \
  --name "${BUILD_RUN_NAME}" \
  --wait

success "Image built and pushed: ${IMAGE_URL}"

# ─── Step 9: Create / update the app ─────────────────────────────────────────
header "Step 9/9  Deploy application"

APP_EXISTS=0
ibmcloud ce app get --name "${CE_APP}" &>/dev/null && APP_EXISTS=1

CE_APP_ARGS=(
  --name "${CE_APP}"
  --image "${IMAGE_URL}"
  --port 3000
  --min-scale 0
  --max-scale 5
  --cpu "0.5"
  --memory "1G"
  --env-from-secret "${CE_SECRET}"
  --request-timeout 120
  --registry-secret "${CE_REGISTRY_SECRET}"
  --wait
)

if [[ ${APP_EXISTS} -eq 1 ]]; then
  info "Updating existing app '${CE_APP}'..."
  ibmcloud ce app update "${CE_APP_ARGS[@]}"
  success "App updated"
else
  info "Creating app '${CE_APP}'..."
  ibmcloud ce app create "${CE_APP_ARGS[@]}"
  success "App created"
fi

# ─── Retrieve the live URL ────────────────────────────────────────────────────
APP_URL=$(ibmcloud ce app get --name "${CE_APP}" --output json 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',{}).get('url',''))" 2>/dev/null || true)

if [[ -z "${APP_URL}" ]]; then
  APP_URL="(run: ibmcloud ce app get --name ${CE_APP} to find the URL)"
fi

# ─── Post-deploy verification ─────────────────────────────────────────────────
header "Post-deploy verification"

info "Waiting 10s for cold start, then running /api/diag..."
sleep 10

DIAG_STATUS=""
DIAG_BODY=""
for ATTEMPT in 1 2 3; do
  HTTP_CODE=$(curl -s -o /tmp/diag_response.json -w "%{http_code}" \
    --max-time 30 "${APP_URL}/api/diag" 2>/dev/null || echo "000")
  if [[ "${HTTP_CODE}" == "200" ]]; then
    DIAG_STATUS="ok"
    DIAG_BODY=$(cat /tmp/diag_response.json 2>/dev/null || echo "")
    break
  fi
  warn "Attempt ${ATTEMPT}/3 — HTTP ${HTTP_CODE}. Retrying in 10s..."
  sleep 10
done

if [[ "${DIAG_STATUS}" == "ok" ]]; then
  WATSON_OK=$(echo "${DIAG_BODY}" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print('YES' if d.get('watson',{}).get('ok') else 'NO')" \
    2>/dev/null || echo "UNKNOWN")
  WATSON_MS=$(echo "${DIAG_BODY}" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print(d.get('watson',{}).get('ms','?'))" \
    2>/dev/null || echo "?")
  HAS_KEY=$(echo "${DIAG_BODY}" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print('YES' if d.get('env',{}).get('hasApiKey') else 'NO')" \
    2>/dev/null || echo "UNKNOWN")
  ASKSALES_ENABLED=$(echo "${DIAG_BODY}" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); print('YES' if d.get('asksales',{}).get('enabled') else 'NO')" \
    2>/dev/null || echo "UNKNOWN")

  success "Connectivity check passed"
  echo "    API key set          : ${HAS_KEY}"
  echo "    Watson reachable     : ${WATSON_OK} (${WATSON_MS}ms)"
  echo "    AskSales enabled     : ${ASKSALES_ENABLED}"

  if [[ "${ASKSALES_ENABLED}" == "NO" ]]; then
    warn "AskSales credentials are placeholder values."
    warn "Roadmap will generate using Watson Assistant alone — this works, but"
    warn "IBM AskSales content (playbooks, competitive intel) won't be included."
    warn "To enable: run ./deploy/secrets-update.sh with real ASKSALES_* values."
  fi
else
  warn "Could not reach /api/diag after 3 attempts."
  warn "App may still be cold-starting. Visit ${APP_URL}/api/diag manually."
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
divider
echo -e "${BOLD}  Deployment complete!${RESET}"
divider
echo ""
echo    "  Live URL  :  ${APP_URL}"
echo    "  Roadmap   :  ${APP_URL}/roadmap"
echo    "  Chat      :  ${APP_URL}/chat"
echo    "  Guidance  :  ${APP_URL}/guidance"
echo    "  Diag      :  ${APP_URL}/api/diag"
echo ""
echo    "  Code Engine project : ${CE_PROJECT} (${IBM_CLOUD_REGION})"
echo    "  Secret              : ${CE_SECRET}"
echo    "  Build config        : ${CE_BUILD}"
echo    "  Registry secret     : ${CE_REGISTRY_SECRET}"
echo ""
divider
echo ""
echo    "  Next steps:"
echo    "  1. Test the Chat page — ask a question about an IBM product"
echo    "  2. Test the Roadmap page — generate a roadmap for a client"
echo    "  3. To update credentials: edit .env then run ./deploy/update.sh"
echo    "  4. To redeploy after a code change:       ./deploy/update.sh"
echo ""
echo    "  To view live logs:"
echo    "    ibmcloud ce application logs -f -n ${CE_APP}"
echo ""
divider
echo ""
