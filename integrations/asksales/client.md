# IBM AskSales API — Client Setup

This document covers how to set up and authenticate with the IBM AskSales API for the Sales Guidance Tool.

---

## Prerequisites

- IBM AskSales API access (request via your IBM sales portal or contact your IBM representative)
- API key, client ID, and client secret from the IBM AskSales developer portal

---

## Configuration

Set the following in your `.env` file (see root `.env.example`):

```
ASKSALES_API_URL=https://asksales.ibm.com/api/v1
ASKSALES_API_KEY=your-asksales-api-key
ASKSALES_CLIENT_ID=your-asksales-client-id
ASKSALES_CLIENT_SECRET=your-asksales-client-secret
```

---

## Authentication Pattern

IBM AskSales API uses API key authentication. Include the key in the request header:

```
Authorization: Bearer <ASKSALES_API_KEY>
```

Or as a query parameter (check with your IBM representative for the correct method):

```
?apiKey=<ASKSALES_API_KEY>
```

---

## Backend Client Location

The AskSales HTTP client should be implemented at:

```
backend/src/services/asksales/client.js
```

All API calls from the backend to AskSales flow through this client module. The frontend never calls AskSales directly — it proxies through the backend to keep credentials server-side.

---

## Security Notes

- **Never expose** `ASKSALES_API_KEY` or `ASKSALES_CLIENT_SECRET` to the frontend
- Always proxy AskSales requests through the backend
- Rotate keys regularly and store them in a secrets manager in production
