# IBM AskSales API — Endpoint Reference

This document is a living reference for the IBM AskSales API endpoints used by the Sales Guidance Tool. Update as you discover endpoints during integration.

---

## Base URL

```
https://asksales.ibm.com/api/v1
```
*(Confirm exact base URL with your IBM AskSales API documentation or representative)*

---

## Known / Expected Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search` | Search for sales content by keyword or query |
| `GET` | `/products` | List IBM products available in AskSales |
| `GET` | `/playbooks` | Retrieve sales playbooks |
| `GET` | `/playbooks/{id}` | Retrieve a specific playbook |
| `GET` | `/objections` | Retrieve objection handling content |
| `POST` | `/query` | Submit a natural-language query for AI-powered answers |
| `GET` | `/competitive` | Retrieve competitive intelligence content |

---

## Request Headers

```
Authorization: Bearer <ASKSALES_API_KEY>
Content-Type: application/json
Accept: application/json
```

---

## Notes

- Confirm all endpoints against the official IBM AskSales API documentation
- Rate limits and pagination behaviour should be verified during integration
- Add discovered endpoints to this file as the integration progresses
