# Frontend

The web UI layer for the Sales Guidance Tool. Build this with your framework of choice (React, Next.js, Vue, etc.).

## Recommended Structure

```
src/
├── components/
│   ├── ChatBot/            # Conversational AI guidance interface
│   ├── DealForm/           # Deal input form for getting recommendations
│   ├── Playbook/           # Playbook / talk track display
│   └── Recommendations/    # Recommended next steps display
│
├── pages/
│   ├── Home/               # Landing / dashboard page
│   ├── DealGuidance/       # Deal-specific guidance view
│   └── Chat/               # AI chatbot view
│
├── services/
│   ├── api.js              # Base API client (wraps fetch / axios)
│   ├── guidance.js         # Calls backend /guidance endpoints
│   ├── chat.js             # Calls backend /chat endpoints
│   └── asksales.js         # Calls backend /asksales proxy endpoints
│
└── types/
    └── index.js            # Shared frontend type definitions
```

## Key UI Flows

1. **Deal Guidance Flow** — Seller fills in deal details (product, stage, competitor, industry) → backend returns AskSales content + AI-recommended next steps
2. **Chat Flow** — Seller types a question → AI chatbot responds using AskSales knowledge base
3. **Playbook Flow** — Seller selects a scenario → relevant playbook and talk tracks are displayed

## Environment

Set `FRONTEND_URL` and backend API base URL in your `.env` file (see root `.env.example`).
