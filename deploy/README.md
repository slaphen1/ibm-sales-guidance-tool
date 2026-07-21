# IBM Sales Guidance Tool — Deployment Guide

Three scripts handle the full deployment lifecycle. No local Docker, no local Node.js required — IBM Cloud builds the container image directly from the GitHub source.

---

## Prerequisites

Only the IBM Cloud CLI is strictly required. The plugins are auto-installed by `setup.sh`.

| Tool | Install |
|---|---|
| IBM Cloud CLI | https://cloud.ibm.com/docs/cli |
| Code Engine plugin | auto-installed by `setup.sh` |
| Container Registry plugin | auto-installed by `setup.sh` |

---

## Scripts

### `setup.sh` — First-time deployment

Run once to deploy from scratch to any IBM Cloud account.

```bash
chmod +x deploy/setup.sh deploy/update.sh deploy/secrets-update.sh
./deploy/setup.sh
```

| Step | Action |
|---|---|
| 0 | Preflight — checks IBM Cloud CLI is installed |
| 1 | Interactive login — SSO browser flow or API key |
| 2 | Auto-installs Code Engine + Container Registry plugins |
| 3 | Validates `.env` — writes a pre-filled template if missing, then exits with instructions |
| 4 | Creates IBM Container Registry namespace |
| 5 | Creates (or selects) a Code Engine project |
| 6 | Creates an IAM API key + Code Engine registry pull secret for ICR |
| 7 | Uploads all `.env` values as a Code Engine secret |
| 8 | Builds the Docker image from GitHub via source-to-image (3–6 min) |
| 9 | Deploys the app and waits for readiness |
| — | Runs `/api/diag` — reports Watson + AskSales status and warns if credentials are placeholders |

---

### `update.sh` — Redeploy after a code change or credential update

```bash
./deploy/update.sh
```

Use after:
- Pushing new code to GitHub
- Editing `.env` credentials

Rebuilds the image from the latest GitHub commit, optionally re-syncs the full secret from `.env`, rolls out the new revision, and runs `/api/diag` to confirm Watson and AskSales status.

---

### `secrets-update.sh` — Rotate a single credential without rebuilding

```bash
# Non-interactive:
./deploy/secrets-update.sh WATSON_ASSISTANT_API_KEY my-new-key

# Interactive (shows a menu of common keys):
./deploy/secrets-update.sh
```

Restarts the app in-place and runs `/api/diag` to confirm the new value is active. Use this for key rotations — no Docker build required.

---

## Account Architecture

Two separate IBM Cloud accounts are used:

| Account | Purpose |
|---|---|
| **Watson Assistant account** | Watson Assistant instance, Action Skill, Environment IDs, API Key |
| **Code Engine account** | Code Engine project, IBM Container Registry, app runtime |

The app authenticates to Watson Assistant via API key in the HTTP `Authorization` header — no cross-account IAM trust required. Any IBM Cloud account works for the Code Engine side.

---

## Configuration — `.env`

Run `./deploy/setup.sh` with no `.env` present and a pre-filled template is written for you. Edit it and re-run.

**Required:**

| Variable | Value |
|---|---|
| `WATSON_ASSISTANT_API_KEY` | Your Watson Assistant API key — the only value you must supply |
| `WATSON_ASSISTANT_ID` | `a99f67bd-26da-4ca3-b338-cbbb03bb3e57` (pre-filled) |
| `WATSON_ASSISTANT_ENVIRONMENT_ID` | `4ec3f873-5e08-4a8f-b7d4-dd528622e808` draft / `cea0be1c-1e71-4bf7-88de-ffc63fd0dee6` prod |
| `WATSON_ASSISTANT_MESSAGE_URL` | Pre-filled with instance URL |
| `WATSON_ASSISTANT_VERSION` | `2024-08-25` — must be exactly this |

**Optional (AskSales enrichment):**

| Variable | Effect if missing |
|---|---|
| `ASKSALES_API_URL` | Roadmap generates from Watson alone — no IBM playbook/competitive content |
| `ASKSALES_API_KEY` | Same |
| `ASKSALES_CLIENT_ID` | Same |
| `ASKSALES_CLIENT_SECRET` | Same |

> ⚠ **AskSales note:** The app detects placeholder values (`your-asksales-api-key`, `https://asksales.ibm.com/api/v1`) and skips all AskSales HTTP calls immediately — it will **not** hang waiting for a non-existent endpoint. Roadmap and guidance will still work, powered by Watson Assistant alone.

**Optional (WatsonX deal guidance):**

| Variable | Effect if missing |
|---|---|
| `AI_API_KEY` | `/guidance` page returns empty recommendations |
| `WATSONX_PROJECT_ID` | Same |
| `AI_MODEL` | Defaults to `ibm/granite-13b-chat-v2` |
| `WATSONX_URL` | Defaults to `https://us-south.ml.cloud.ibm.com` |

> **Never commit `.env` to git.** It is git-ignored by default.

---

## Overriding defaults

All scripts accept configuration via environment variables before their built-in defaults. Useful if you are deploying to a different account, region, or project name:

```bash
export GITHUB_REPO="https://github.com/your-fork/ibm-sales-guidance-tool"
export GITHUB_BRANCH="main"
export IBM_CLOUD_REGION="eu-de"
export ICR_NAMESPACE="my-namespace"
export CE_PROJECT="my-ce-project"
export CE_APP="my-app-name"
./deploy/setup.sh
```

---

## Post-deploy verification

```bash
# Full diagnostics — runs from inside the container
curl https://<your-app-url>/api/diag
```

Expected healthy output:

```json
{
  "env":     { "hasApiKey": true, "version": "2024-08-25", "assistantId": "a99f...", ... },
  "asksales":{ "enabled": true,   "hasKey": true, "note": "Real credentials configured" },
  "dns":     { "ok": true,  "ms": 280 },
  "watson":  { "ok": true,  "status": 200, "ms": 2500 }
}
```

If `asksales.enabled` is `false`, roadmap still works — it just won't include IBM playbook or competitive intel content. See the AskSales note above.

```bash
# Live logs
ibmcloud ce application logs -f -n ibm-sales-guidance-tool
```

---

## Known issues & gotchas

### Watson Assistant input must be single-line
The `/environments/{id}/message` endpoint rejects `input.text` containing tabs, newlines, or carriage returns with HTTP 400. The `sendStatelessMessage` function automatically strips these before sending — do not pass raw multi-line strings via any other code path.

### Watson timeouts differ by use case
| Route | Timeout | Reason |
|---|---|---|
| `/api/chat` | 30s server / 45s client | Short chat messages respond in ~3–5s |
| `/api/roadmap` | 90s server | Large prompt; Watson takes 30–60s to generate all 4 sections |

### AskSales placeholder credentials cause hangs (fixed)
Older versions of the `asksales/client.ts` had no timeout and no placeholder detection — causing every roadmap call to hang indefinitely waiting on `https://asksales.ibm.com/api/v1/search` (a non-existent endpoint). This is fixed: the client detects placeholders at startup, returns empty results immediately, and has an 8-second timeout on real calls.

### `next/config serverRuntimeConfig` is empty in Docker
Do not use `next/config` / `serverRuntimeConfig` in server-side code. It is not populated in the `output: standalone` Docker build. All secrets must be read via `process.env` directly.

### `/sessions` returns 401
The Watson Assistant AskSales instance does not permit the stateful sessions API. All routes use the stateless `/environments/{envId}/message` endpoint instead.

### Scale-to-zero cold start
With `min-scale: 0`, the first request after an idle period takes ~15–20s for the pod to initialise. Subsequent requests are fast. The `/api/diag` endpoint is a cheap warm-up call — hit it first if you need the next request to be fast.

---

## Scaling & cost

| Setting | Value | Notes |
|---|---|---|
| Min instances | 0 | Scale-to-zero — no cost when idle |
| Max instances | 5 | Auto-scales under load |
| CPU | 0.5 vCPU | |
| Memory | 1 GB | |
| Timeout | 120 seconds | Covers 90s roadmap Watson call + overhead |

Code Engine pricing is consumption-based — you pay only for active request time.

---

## Troubleshooting quick reference

| Symptom | Diagnosis |
|---|---|
| "Failed to reach Watson Assistant" | `curl /api/diag` — check `watson.ok` and `env.hasApiKey` |
| Roadmap returns `"Failed to generate client roadmap"` | Check logs for the real error: `ibmcloud ce application logs -n ibm-sales-guidance-tool` |
| Roadmap times out | Watson is taking >90s — check `/api/diag` `watson.ms`; if consistently slow, raise `WATSON_ROADMAP_TIMEOUT_MS` in code |
| Chat works but roadmap doesn't | Likely the prompt-too-long issue — check logs for Watson 400 errors |
| AskSales returns empty results | Expected with placeholder credentials — `/api/diag` will show `asksales.enabled: false` |
| "Unexpected token 'a', activator..." | Code Engine gateway timeout returned a plain-text page — should be handled gracefully now; check if Watson is timing out |
| Mock mode warning in logs | `WATSON_ASSISTANT_API_KEY` not set — run `./deploy/secrets-update.sh` |
| Build run fails | Run `npm run build` locally first — must pass cleanly before pushing |
| App returns 503 | `ibmcloud ce application events -n ibm-sales-guidance-tool` |
| Is it a firewall? | No — Code Engine (us-east) has unrestricted outbound HTTPS. Confirmed via `/api/diag`: DNS ~300ms, Watson ~2.5s. |

See the Developer Guide for full root-cause writeups on every bug.

---

## Optional — Restrict access with IBM App ID (w3id SSO)

To lock the tool to IBM employees only:

1. Provision **IBM App ID** in the same Code Engine account
2. Configure **IBM w3id** as the identity provider
3. Protect the app using the [App ID + Code Engine integration guide](https://cloud.ibm.com/docs/appid)

This gives you automatic seller email injection into Watson requests without requiring users to type their email.
