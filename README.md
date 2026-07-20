# Sales Guidance Tool

A unified sales guidance platform that combines a web UI, AI-powered chatbot, CRM data processing, and IBM AskSales API integration to help sellers with deal strategy, talk tracks, playbooks, and recommended next steps.

---

## Project Structure

```
sales-guidance-tool/
├── frontend/               # Web UI (framework of your choice)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level views
│   │   ├── services/       # Frontend API client calls
│   │   └── types/          # Shared frontend types
│   └── README.md
│
├── backend/                # API server / service layer
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Core service modules
│   │   │   ├── asksales/   # IBM AskSales API integration
│   │   │   ├── ai/         # AI / LLM guidance layer
│   │   │   └── crm/        # CRM data processing
│   │   ├── middleware/     # Auth, logging, error handling
│   │   └── types/          # Backend types / interfaces
│   └── README.md
│
├── integrations/           # Third-party integration configs and clients
│   └── asksales/           # IBM AskSales API client and contracts
│       ├── client.md       # Client setup instructions
│       └── endpoints.md    # AskSales endpoint reference
│
├── shared/                 # Shared contracts used by frontend and backend
│   ├── types/              # Shared data models (Deal, Recommendation, etc.)
│   └── constants/          # Shared enums and constants
│
├── docs/                   # Project documentation
│   ├── architecture.md     # System architecture overview
│   ├── asksales-setup.md   # IBM AskSales API setup guide
│   └── data-flows.md       # Data flow diagrams and descriptions
│
├── scripts/                # Dev/ops utility scripts
│   ├── setup.md            # Environment setup instructions
│   └── seed-crm-data.md    # CRM test data seeding guide
│
├── .env.example            # Environment variable template
├── .gitignore
└── README.md               # This file
```

---

## Key Capabilities

| Capability | Description |
|---|---|
| **Deal Guidance** | Sellers input deal details and receive recommended next steps and playbooks |
| **AI Chatbot** | Conversational interface for objection handling, talk tracks, and strategy |
| **IBM AskSales API** | Integration with IBM's AskSales service for product and sales content |
| **CRM Processing** | Ingests and processes CRM data to personalise recommendations |

---

## Getting Started

1. Copy `.env.example` to `.env` and fill in your credentials
2. See [`docs/asksales-setup.md`](docs/asksales-setup.md) for IBM AskSales API onboarding
3. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev   # http://localhost:3000
   ```

---

## Environment Variables

See [`.env.example`](.env.example) for a full list. Key variables:

| Variable | Description |
|---|---|
| `ASKSALES_API_URL` | IBM AskSales base API URL |
| `ASKSALES_API_KEY` | IBM AskSales API key |
| `ASKSALES_CLIENT_ID` | IBM AskSales client ID |
| `WATSON_ASSISTANT_URL` | Watson Assistant service instance URL |
| `WATSON_ASSISTANT_API_KEY` | Watson Assistant API key |
| `WATSON_ASSISTANT_ID` | Watson Assistant instance ID |
| `WATSON_ASSISTANT_SKILL_ID` | Action Skill ID (routes messages to the correct skill) |
| `WATSON_ASSISTANT_ENVIRONMENT_ID` | Draft environment ID (dev); replace with live ID for production |
| `AI_API_KEY` | WatsonX API key (for deal guidance recommendations) |
| `WATSONX_PROJECT_ID` | WatsonX project ID |
| `CRM_API_URL` | CRM system base URL |
| `CRM_API_KEY` | CRM system API key |
