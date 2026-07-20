# Backend

The API server and service layer for the Sales Guidance Tool.

## Recommended Structure

```
src/
├── routes/
│   ├── guidance.js         # POST /guidance — deal input → recommendations
│   ├── chat.js             # POST /chat — conversational AI endpoint
│   ├── asksales.js         # GET|POST /asksales/* — proxied AskSales calls
│   └── crm.js              # GET /crm/deals — CRM data retrieval
│
├── controllers/
│   ├── guidanceController.js   # Orchestrates deal guidance logic
│   ├── chatController.js       # Orchestrates chatbot responses
│   └── crmController.js        # Handles CRM data operations
│
├── services/
│   ├── asksales/
│   │   ├── client.js       # IBM AskSales API HTTP client
│   │   ├── search.js       # AskSales content search logic
│   │   └── auth.js         # AskSales API authentication
│   │
│   ├── ai/
│   │   ├── provider.js     # AI provider abstraction (OpenAI / WatsonX)
│   │   ├── guidance.js     # Generates deal guidance using AI + AskSales content
│   │   └── chat.js         # Manages conversational AI sessions
│   │
│   └── crm/
│       ├── client.js       # CRM API HTTP client
│       ├── deals.js        # Deal data fetching and normalisation
│       └── transform.js    # Maps CRM data to internal Deal model
│
├── middleware/
│   ├── auth.js             # API key / token validation
│   ├── errorHandler.js     # Centralised error handling
│   └── logger.js           # Request logging
│
└── types/
    └── index.js            # Backend type definitions and schemas
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/guidance` | Submit deal details, get recommendations |
| `POST` | `/api/chat` | Send a chat message, get AI response |
| `GET` | `/api/asksales/search` | Search IBM AskSales content |
| `GET` | `/api/crm/deals` | Fetch deals from CRM |

## Environment

Copy the root `.env.example` to `.env` and fill in:
- `ASKSALES_API_KEY`, `ASKSALES_API_URL`
- `AI_PROVIDER`, `AI_API_KEY`
- `CRM_API_URL`, `CRM_API_KEY`
- `PORT` (default: 3001)
