#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy IBM Sales Guidance Tool to IBM Cloud Code Engine
#
# Uses Code Engine source-to-image (S2I) build — no local Docker required.
# IBM Cloud builds the container image directly from your source code.
#
# Prerequisites:
#   - IBM Cloud CLI:          https://cloud.ibm.com/docs/cli
#   - Code Engine plugin:     ibmcloud plugin install code-engine
#   - Container Registry plugin: ibmcloud plugin install container-registry
#   - Git installed
#
# Usage:
#   chmod +x deploy/deploy.sh
#   ./deploy/deploy.sh
# =============================================================================

set -euo pipefail

# ─── Configuration — edit these ───────────────────────────────────────────────
IBM_CLOUD_REGION="us-east"
ICR_NAMESPACE="ibm-sales-tools"              # IBM Container Registry namespace
IMAGE_NAME="sales-guidance-tool"
IMAGE_TAG="latest"
CE_PROJECT="ibm-sales-guidance"              # Code Engine project name
CE_APP="ibm-sales-guidance-tool"             # Code Engine app name
CE_SECRET="sales-guidance-secrets"           # Code Engine secret name
CE_BUILD="sales-guidance-build"              # Code Engine build name
ENV_FILE=".env"                              # Local .env file with credentials
SOURCE_DIR="."                               # Source directory (project root)
# ──────────────────────────────────────────────────────────────────────────────

IMAGE_URL="icr.io/${ICR_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  IBM Sales Guidance Tool — Code Engine Deployment        ║"
echo "║  (Source-to-Image — no local Docker required)            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Login check ───────────────────────────────────────────────────────
echo "▶ Step 1/8  Verifying IBM Cloud login..."
ibmcloud account show > /dev/null 2>&1 || {
  echo "  Not logged in. Logging in now..."
  ibmcloud login --sso
}
echo "  ✓ Logged in"

# ── Step 2: Target region ─────────────────────────────────────────────────────
echo "▶ Step 2/8  Targeting region ${IBM_CLOUD_REGION}..."
ibmcloud target -r "${IBM_CLOUD_REGION}"
echo "  ✓ Region set"

# ── Step 3: Install plugins if missing ───────────────────────────────────────
echo "▶ Step 3/8  Checking IBM Cloud plugins..."
ibmcloud plugin install code-engine --force 2>/dev/null || true
ibmcloud plugin install container-registry --force 2>/dev/null || true
echo "  ✓ Plugins ready"

# ── Step 4: Create ICR namespace ─────────────────────────────────────────────
echo "▶ Step 4/8  Setting up IBM Container Registry namespace..."
ibmcloud cr login
ibmcloud cr namespace-add "${ICR_NAMESPACE}" 2>/dev/null || \
  echo "  (namespace already exists)"
echo "  ✓ Registry namespace: ${ICR_NAMESPACE}"

# ── Step 5: Select/create Code Engine project ────────────────────────────────
echo "▶ Step 5/8  Selecting Code Engine project..."
ibmcloud ce project select --name "${CE_PROJECT}" 2>/dev/null || \
  ibmcloud ce project create --name "${CE_PROJECT}"
echo "  ✓ Project: ${CE_PROJECT}"

# ── Step 6: Create/update secrets from .env ──────────────────────────────────
echo "▶ Step 6/8  Syncing environment secrets..."
if [ ! -f "${ENV_FILE}" ]; then
  echo "  ✗ .env file not found. Copy .env.example to .env and fill in credentials."
  exit 1
fi
ibmcloud ce secret delete --name "${CE_SECRET}" --force 2>/dev/null || true
ibmcloud ce secret create --name "${CE_SECRET}" --from-env-file "${ENV_FILE}"
echo "  ✓ Secrets created from ${ENV_FILE}"

# ── Step 7: Create/run Code Engine build (source-to-image) ───────────────────
echo "▶ Step 7/8  Building image from source via Code Engine S2I..."

# Create or update the build config
ibmcloud ce build delete --name "${CE_BUILD}" --force 2>/dev/null || true
ibmcloud ce build create \
  --name "${CE_BUILD}" \
  --image "${IMAGE_URL}" \
  --source "${SOURCE_DIR}" \
  --strategy dockerfile \
  --dockerfile Dockerfile \
  --size medium

# Submit the build run
ibmcloud ce buildrun submit \
  --build "${CE_BUILD}" \
  --name "${CE_BUILD}-run-$(date +%s)" \
  --wait

echo "  ✓ Image built: ${IMAGE_URL}"

# ── Step 8: Deploy / update the app ──────────────────────────────────────────
echo "▶ Step 8/8  Deploying application..."
if ibmcloud ce app get --name "${CE_APP}" > /dev/null 2>&1; then
  ibmcloud ce app update \
    --name "${CE_APP}" \
    --image "${IMAGE_URL}" \
    --port 3000 \
    --min-scale 0 \
    --max-scale 5 \
    --cpu "0.5" \
    --memory "1G" \
    --env-from-secret "${CE_SECRET}" \
    --request-timeout 120 \
    --wait
  echo "  ✓ App updated"
else
  ibmcloud ce app create \
    --name "${CE_APP}" \
    --image "${IMAGE_URL}" \
    --port 3000 \
    --min-scale 0 \
    --max-scale 5 \
    --cpu "0.5" \
    --memory "1G" \
    --env-from-secret "${CE_SECRET}" \
    --request-timeout 120 \
    --wait
  echo "  ✓ App created"
fi

# ── Print the app URL ─────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
APP_URL=$(ibmcloud ce app get --name "${CE_APP}" --output json | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['status']['url'])" 2>/dev/null || \
  echo "  (run: ibmcloud ce app get --name ${CE_APP} to find the URL)")
echo "  ✅ Deployment complete!"
echo "  🌐 App URL:  ${APP_URL}"
echo "  📋 Roadmap:  ${APP_URL}/roadmap"
echo "  💬 Chat:     ${APP_URL}/chat"
echo "════════════════════════════════════════════════════════════"
