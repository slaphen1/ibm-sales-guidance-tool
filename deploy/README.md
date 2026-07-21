# IBM Sales Guidance Tool — Deployment Guide

Three scripts handle the full deployment lifecycle. No local Docker, no local Node.js required — IBM Cloud builds the container image directly from the GitHub source.

---

## Prerequisites

Install before running any script:

| Tool | Install |
|---|---|
| IBM Cloud CLI | https://cloud.ibm.com/docs/cli |
| Code Engine plugin | `ibmcloud plugin install code-engine` (auto-installed by setup.sh) |
| Container Registry plugin | `ibmcloud plugin install container-registry` (auto-installed by setup.sh) |

---

## Scripts

### `setup.sh` — First-time deployment

Run this once to deploy from scratch to any IBM Cloud account.

```bash
chmod +x deploy/setup.sh deploy/update.sh deploy/secrets-update.sh
./deploy/setup.sh
```

What it does, step by step:

| Step | Action |
|---|---|
| 0 | Preflight — checks IBM Cloud CLI is installed |
| 1 | IBM Cloud login (SSO or API key, your choice) |
| 2 | Auto-installs Code Engine + Container Registry plugins |
| 3 | Validates `.env` — writes a template if missing, exits with instructions |
| 4 | Creates IBM Container Registry namespace |
| 5 | Creates (or selects) a Code Engine project |
| 6 | Creates an IAM API key and Code Engine registry pull secret for ICR |
| 7 | Uploads all `.env` values as a Code Engine secret |
| 8 | Builds the Docker image from GitHub via source-to-image (3–6 min) |
| 9 | Deploys the app and waits for readiness |
| — | Runs `/api/diag` to verify Watson Assistant is reachable |

---

### `update.sh` — Redeploy after a code change or credential update

```bash
./deploy/update.sh
```

Use this after:
- Pushing new code to GitHub
- Editing `.env` credentials

It rebuilds the image from the latest GitHub commit, optionally re-syncs secrets, and rolls out the new revision.

---

### `secrets-update.sh` — Rotate a single credential

Updates one secret value without triggering a full rebuild. Use this to rotate an API key quickly.

```bash
# Non-interactive:
./deploy/secrets-update.sh WATSON_ASSISTANT_API_KEY my-new-api-key

# Interactive (prompts for key and value):
./deploy/secrets-update.sh
```

Restarts the app and runs `/api/diag` to confirm the new key is active.

---

## Account Architecture

Two separate IBM Cloud accounts are used:

| Account | Purpose |
|---|---|
| **Watson Assistant account** | Owns the Watson Assistant instance, Action Skill, Environment IDs, API Key |
| **Code Engine account** | Hosts the deployed app — any IBM Cloud account works here |

The app authenticates to Watson Assistant via API key in the HTTP header — the two accounts do not need to be the same, and no cross-account IAM trust is required.

---

## Configuration — `.env`

Run `./deploy/setup.sh` with no `.env` present and it will write a template for you. Minimum required:

| Variable | Notes |
|---|---|
| `WATSON_ASSISTANT_API_KEY` | **Required** — from your Watson Assistant instance |
| `WATSON_ASSISTANT_ID` | Pre-filled: `a99f67bd-26da-4ca3-b338-cbbb03bb3e57` |
| `WATSON_ASSISTANT_ENVIRONMENT_ID` | Pre-filled: `4ec3f873-5e08-4a8f-b7d4-dd528622e808` (draft) |
| `WATSON_ASSISTANT_MESSAGE_URL` | Pre-filled with instance URL |
| `WATSON_ASSISTANT_VERSION` | Must be `2024-08-25` — not `2023-06-15` |

All other credentials (AskSales, WatsonX, CRM) are optional — the app runs in mock mode without them.

> **Never commit `.env` to git.** It is git-ignored by default.

---

## Overriding defaults

All scripts read configuration from environment variables before falling back to their defaults. Override any of the following before running:

```bash
export GITHUB_REPO="https://github.com/your-fork/ibm-sales-guidance-tool"
export GITHUB_BRANCH="main"
export IBM_CLOUD_REGION="us-east"
export ICR_NAMESPACE="my-namespace"
export CE_PROJECT="my-project"
export CE_APP="my-app-name"
./deploy/setup.sh
```

---

## Post-deploy checks

Once deployed, verify everything is working:

```bash
# 1. Connectivity check — runs from inside the container
curl https://<your-app-url>/api/diag

# Expected output:
# {
#   "env":    { "hasApiKey": true, "version": "2024-08-25", ... },
#   "dns":    { "ok": true,  "ms": ~300 },
#   "watson": { "ok": true,  "status": 200, "ms": ~2500 }
# }

# 2. Live logs
ibmcloud ce application logs -f -n ibm-sales-guidance-tool
```

---

## Scaling & cost

| Setting | Value | Notes |
|---|---|---|
| Min instances | 0 | Scale-to-zero — no cost when idle. First request after idle takes ~15s. |
| Max instances | 5 | Auto-scales under load |
| CPU | 0.5 vCPU | |
| Memory | 1 GB | |
| Timeout | 120 seconds | Allows for Watson + AskSales response time |

Code Engine pricing is consumption-based — you pay only for requests handled.

---

## Troubleshooting

See the Developer Guide for a full troubleshooting section. Quick reference:

| Symptom | First step |
|---|---|
| "Failed to reach Watson Assistant" | Run `/api/diag` — check `watson.ok` and `env.hasApiKey` |
| Chat or roadmap hangs | Check logs: `ibmcloud ce application logs -n ibm-sales-guidance-tool` |
| Mock mode warning in logs | `WATSON_ASSISTANT_API_KEY` is not set — run `secrets-update.sh` |
| Build run fails | Run `npm run build` locally first — it must pass before pushing |
| App returns 503 | Check events: `ibmcloud ce application events -n ibm-sales-guidance-tool` |

---

## Optional — Restrict access with IBM App ID (w3id SSO)

To restrict the tool to IBM employees only:

1. Provision an **IBM App ID** instance in the same Code Engine account
2. Configure **IBM w3id** as the identity provider
3. Protect the Code Engine app using the [App ID + Code Engine guide](https://cloud.ibm.com/docs/appid)

This ensures only IBMers with valid w3id credentials can access the tool, and makes the seller's email available to pass to Watson Assistant automatically.
