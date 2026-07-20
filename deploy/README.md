# IBM Cloud Code Engine — Deployment Guide

Step-by-step instructions for deploying the IBM Sales Guidance Tool to IBM Cloud Code Engine so other IBMers can access it via a shared internal URL.

---

## Account Architecture

This deployment uses **two separate IBM Cloud accounts**:

| Account | Purpose | What lives here |
|---|---|---|
| **Watson Assistant account** | Owns the AI instance | Watson Assistant, Action Skill, Environment IDs, API Key |
| **Code Engine account** | Hosts the deployed app | Code Engine app, IBM Container Registry, (optionally App ID) |

These accounts do not need to be the same. The app authenticates to Watson Assistant using an **IAM API key** passed as an HTTP header — IBM Cloud does not require the caller to be in the same account as the service. As long as the API key is valid and the Code Engine app can reach `api.us-east-1.aws.watsonassistant.ibm.com` over HTTPS (port 443, open by default on Code Engine), the integration works cross-account.

> **Watson Assistant account** — the IBM Cloud account where `a99f67bd-26da-4ca3-b338-cbbb03bb3e57` was provisioned.
> **Code Engine account** — use whichever IBM Cloud account your team manages for application deployments.

---

## Prerequisites

Install the following tools before starting:

| Tool | Install |
|---|---|
| IBM Cloud CLI | https://cloud.ibm.com/docs/cli |
| Code Engine plugin | `ibmcloud plugin install code-engine` |
| Container Registry plugin | `ibmcloud plugin install container-registry` |
| Docker Desktop | https://www.docker.com/products/docker-desktop |

---

## Step 1 — Log into IBM Cloud (Code Engine account)

```bash
ibmcloud login --sso
```

> ⚠ **Log into the Code Engine account** — the account you will deploy the app to. This is **not** the same account as the Watson Assistant instance. You will authenticate to Watson Assistant via API key in your `.env` file (Step 3), not via IBM Cloud account access.

---

## Step 2 — Set up IBM Container Registry

Create a namespace in IBM Container Registry (ICR) to store your Docker image:

```bash
ibmcloud cr namespace-add <your-namespace>
```

Update `deploy/deploy.sh` — replace `your-icr-namespace` with your namespace name.

---

## Step 3 — Prepare your .env file

Copy `.env.example` to `.env` and fill in all credentials:

```bash
cp .env.example .env
```

Key values needed:

| Variable | Value |
|---|---|
| `WATSON_ASSISTANT_URL` | `https://api.direct.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56` |
| `WATSON_ASSISTANT_MESSAGE_URL` | `https://api.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56` |
| `WATSON_ASSISTANT_API_KEY` | Retrieve from IBM 1Password vault |
| `WATSON_ASSISTANT_ID` | `a99f67bd-26da-4ca3-b338-cbbb03bb3e57` |
| `WATSON_ASSISTANT_SKILL_ID` | `85e69230-e195-49ba-9d7b-450b820991a3` |
| `WATSON_ASSISTANT_ENVIRONMENT_ID` | `4ec3f873-5e08-4a8f-b7d4-dd528622e808` (draft) |
| `ASKSALES_API_URL` | IBM AskSales base URL |
| `ASKSALES_API_KEY` | IBM AskSales API key |

> ⚠ Never commit `.env` to git. It is git-ignored by default.

---

## Step 4 — Run the deployment script

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

The script will:
1. Build the Docker image
2. Push it to IBM Container Registry
3. Create/select a Code Engine project
4. Upload all `.env` values as a Code Engine secret
5. Deploy the app and print the live URL

This takes approximately 5–10 minutes on first deploy, 2–3 minutes for updates.

---

## Step 5 — Share the URL

Once deployed, the script prints a URL like:

```
https://ibm-sales-guidance-tool.<hash>.us-east.codeengine.appdomain.cloud
```

Share this URL with IBM sellers. The roadmap workflow is at:

```
https://ibm-sales-guidance-tool.<hash>.us-east.codeengine.appdomain.cloud/roadmap
```

---

## Step 6 — Update the Bob skill with the deployed URL

Open [`.bob/skills/client-roadmap/SKILL.md`](../../.bob/skills/client-roadmap/SKILL.md) and update Step 9 with the live URL so the skill directs sellers to the correct endpoint.

---

## Updating the deployment

After making code changes, re-run the deploy script:

```bash
./deploy/deploy.sh
```

It will rebuild the image, push it, and update the running app with zero downtime.

---

## Scaling & cost

| Setting | Value | Notes |
|---|---|---|
| Min instances | 0 | Scales to zero when idle — no cost when not in use |
| Max instances | 5 | Scales up automatically under load |
| CPU | 0.5 vCPU | Sufficient for the roadmap workload |
| Memory | 1 GB | Sufficient for file parsing and AI calls |
| Timeout | 120 seconds | Allows time for Watson Assistant + AskSales calls |

Code Engine pricing is consumption-based — you only pay when the app is handling requests.

---

## Optional — Restrict access with IBM App ID (w3id SSO)

To restrict access to IBM employees only, configure IBM App ID in front of the Code Engine app:

1. Provision an **IBM App ID** instance in the same IBM Cloud account
2. Configure it with **IBM w3id** as the identity provider
3. Protect the Code Engine app with App ID using the [App ID + Code Engine integration guide](https://cloud.ibm.com/docs/appid)

This ensures only IBMers with valid w3id credentials can access the tool — and makes the seller's email available for passing to Watson Assistant automatically.
