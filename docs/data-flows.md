# Data Flows

Detailed descriptions of the key data flows in the Sales Guidance Tool.

---

## Flow 1: Deal Guidance

```
Seller
  │
  ▼
[Frontend: DealForm]
  │  DealForm submits: { product, stage, industry, competitor, notes }
  │
  ▼
[Backend: POST /api/guidance]
  │
  ├──► [AskSales Service]
  │      search(product + industry + competitor)
  │      returns: AskSalesResult[]
  │
  ├──► [CRM Service]  (optional)
  │      getRelatedDeals(crmId)
  │      returns: enrichment data
  │
  └──► [AI Service]
         input:  deal + askSalesResults + crmData
         output: Recommendation[]
  │
  ▼
[Frontend: Recommendations + Playbook components]
```

---

## Flow 2: AI Chatbot

```
Seller
  │
  ▼
[Frontend: ChatBot]
  │  ChatMessage: { role: "user", content: "How do I handle this objection?" }
  │
  ▼
[Backend: POST /api/chat]
  │
  ├──► [AskSales Service]
  │      query(message content)
  │      returns: relevant AskSales snippets as context
  │
  └──► [AI Service]
         input:  chat history + askSalesContext
         output: ChatMessage { role: "assistant", content: "...", sources: [] }
  │
  ▼
[Frontend: ChatBot — appends assistant response]
```

---

## Flow 3: CRM Deal Sync

```
[CRM System]
  │  Scheduled sync or on-demand fetch
  │
  ▼
[Backend: GET /api/crm/deals]
  │
  ├──► [CRM Service: client.js]
  │      Fetches raw deal records from CRM API
  │
  └──► [CRM Service: transform.js]
         Normalises CRM data to internal Deal model
  │
  ▼
[Controllers / AI Service]
  Used to enrich guidance with real deal context
```
