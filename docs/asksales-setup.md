# IBM AskSales API — Setup Guide

Step-by-step guide for onboarding to the IBM AskSales API for this project.

---

## Step 1: Request API Access

Contact your IBM representative or visit the IBM AskSales developer portal to request:
- An API key (`ASKSALES_API_KEY`)
- A client ID (`ASKSALES_CLIENT_ID`) and client secret (`ASKSALES_CLIENT_SECRET`)

---

## Step 2: Configure Environment Variables

Copy the root `.env.example` to `.env` and populate the AskSales section:

```bash
ASKSALES_API_URL=https://asksales.ibm.com/api/v1
ASKSALES_API_KEY=your-asksales-api-key
ASKSALES_CLIENT_ID=your-asksales-client-id
ASKSALES_CLIENT_SECRET=your-asksales-client-secret
```

---

## Step 3: Verify Connectivity

Once credentials are set, test connectivity with a simple search call:

```
GET <ASKSALES_API_URL>/search?q=watsonx
Authorization: Bearer <ASKSALES_API_KEY>
```

You should receive a JSON response with matching AskSales content.

---

## Step 4: Implement the Backend Client

Implement the AskSales HTTP client at `backend/src/services/asksales/client.js`.
Refer to [`integrations/asksales/endpoints.md`](../integrations/asksales/endpoints.md) for available endpoints.

Key design rules:
- All AskSales calls are made **server-side only**
- The API key is **never passed to the frontend**
- The backend exposes a `/api/asksales/*` proxy so the frontend can query content safely

---

## Step 5: Reference Endpoints

See [`integrations/asksales/endpoints.md`](../integrations/asksales/endpoints.md) for a full list of known endpoints and expected request/response shapes.
