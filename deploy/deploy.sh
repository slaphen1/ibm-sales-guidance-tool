#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Legacy entry point. Delegates to setup.sh or update.sh.
#
# For first-time deployment:   ./deploy/setup.sh
# For updates after code push: ./deploy/update.sh
# To rotate a single secret:   ./deploy/secrets-update.sh KEY value
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "  IBM Sales Guidance Tool — Deployment"
echo ""
echo "  This script has been replaced by three focused scripts:"
echo ""
echo "    deploy/setup.sh           First-time deployment (any IBM Cloud account)"
echo "    deploy/update.sh          Redeploy after a code change or .env update"
echo "    deploy/secrets-update.sh  Rotate a single credential without a rebuild"
echo ""

if [[ -z "${1:-}" ]]; then
  read -r -p "  Run setup.sh now? [Y/n] " CHOICE
  [[ "${CHOICE}" =~ ^[Nn]$ ]] && exit 0
  exec bash "${SCRIPT_DIR}/setup.sh"
elif [[ "$1" == "update" ]]; then
  exec bash "${SCRIPT_DIR}/update.sh"
elif [[ "$1" == "secret" ]]; then
  shift
  exec bash "${SCRIPT_DIR}/secrets-update.sh" "$@"
else
  exec bash "${SCRIPT_DIR}/setup.sh"
fi
