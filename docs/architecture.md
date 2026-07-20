# System Architecture

High-level architecture of the Sales Guidance Tool.

---

## Component Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend (Web UI)                    │
│                                                              │
│   DealForm ──► DealGuidance Page                            │
│   ChatBot  ──► Chat Page                                     │
│   Playbook ──► Playbook / Recommendations Page              │
│                         │                                    │
│              services/api.js (HTTP client)                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS (REST)
┌────────────────────────▼─────────────────────────────────────┐
│                    Backend (API Server)                       │
│                                                              │
│   Routes:                                                    │
│   POST /api/guidance   ──► guidanceController               │
│   POST /api/chat       ──► chatController                   │
│   GET  /api/asksales/* ──► asksales proxy                   │
│   GET  /api/crm/deals  ──► crmController                    │
│                                                              │
│   Services:                                                  │
│   ├── asksales/client  ──► IBM AskSales API                 │
│   ├── ai/provider      ──► AI / LLM (WatsonX / OpenAI)     │
│   └── crm/client       ──► CRM System                       │
└──────────┬───────────────────────┬──────────────────────────┘
           │                       │
┌──────────▼──────────┐  ┌────────▼───────────┐
│  IBM AskSales API   │  │  AI / LLM Provider │
│  (Sales Content,    │  │  (WatsonX /        │
│   Playbooks,        │  │   OpenAI)          │
│   Competitive Intel)│  └────────────────────┘
└─────────────────────┘
           │
┌──────────▼──────────┐
│    CRM System       │
│  (Deal data,        │
│   opportunity       │
│   records)          │
└─────────────────────┘
```

---

## Data Flow — Deal Guidance

1. Seller enters deal details (product, stage, industry, competitor) in the **DealForm**
2. Frontend calls `POST /api/guidance` with a `GuidanceRequest`
3. Backend `guidanceController` orchestrates:
   - Fetches relevant content from **IBM AskSales API** (`asksales/search.js`)
   - Optionally enriches with **CRM deal data** (`crm/deals.js`)
   - Passes context to **AI provider** (`ai/guidance.js`) to generate ranked recommendations
4. Returns `GuidanceResponse` to the frontend
5. Frontend renders **Recommendations** and **Playbook** components

---

## Data Flow — AI Chatbot

1. Seller types a question in the **ChatBot** component
2. Frontend calls `POST /api/chat` with a `ChatMessage`
3. Backend `chatController`:
   - Retrieves relevant AskSales content for context
   - Sends message + context to **AI provider**
4. Returns AI response with optional AskSales source references
5. Frontend appends the response to the chat thread

---

## Security Principles

- IBM AskSales API key is **never exposed to the frontend**
- All third-party API calls are proxied through the backend
- Auth middleware validates requests before reaching controllers
- Secrets are loaded from environment variables, never hardcoded
