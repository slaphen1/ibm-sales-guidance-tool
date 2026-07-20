# Shared Types and Contracts

Language-agnostic data model definitions shared between the frontend and backend.
Implement these as interfaces/types in your chosen language.

---

## Core Models

### Deal

Represents an active sales opportunity input by a seller.

```
Deal {
  id:           string          // Unique deal identifier
  stage:        DealStage       // Current deal stage
  product:      string          // IBM product or solution being sold
  industry:     string          // Customer industry vertical
  competitor:   string?         // Known competing product (optional)
  dealSize:     number?         // Estimated deal value (optional)
  notes:        string?         // Seller notes (optional)
  crmId:        string?         // CRM system record ID (optional)
}
```

### DealStage (Enum)

```
PROSPECTING
QUALIFICATION
NEEDS_ANALYSIS
PROPOSAL
NEGOTIATION
CLOSED_WON
CLOSED_LOST
```

---

### Recommendation

A single guidance item returned in response to a deal or query.

```
Recommendation {
  id:           string
  type:         RecommendationType
  title:        string
  summary:      string
  content:      string           // Full guidance text or talk track
  source:       RecommendationSource
  confidence:   number           // 0.0 – 1.0
  actions:      Action[]         // Suggested follow-on actions
}
```

### RecommendationType (Enum)

```
NEXT_STEP
TALK_TRACK
PLAYBOOK
OBJECTION_RESPONSE
COMPETITIVE_INTEL
RESOURCE_LINK
```

### RecommendationSource (Enum)

```
ASKSALES
AI_GENERATED
CRM
COMBINED
```

---

### Action

A concrete follow-on action suggested as part of a recommendation.

```
Action {
  label:        string          // Display label, e.g. "Schedule discovery call"
  type:         ActionType
  url:          string?         // Link to a resource (optional)
}
```

### ActionType (Enum)

```
SCHEDULE_MEETING
SEND_ASSET
VIEW_PLAYBOOK
ESCALATE
RESEARCH
```

---

### ChatMessage

A single message in the conversational AI interface.

```
ChatMessage {
  id:           string
  role:         "user" | "assistant"
  content:      string
  timestamp:    string          // ISO 8601
  sources:      string[]?       // AskSales content references (optional)
}
```

---

### GuidanceRequest

The payload sent from the frontend to `POST /api/guidance`.

```
GuidanceRequest {
  deal:         Deal
  question:     string?         // Optional free-text question from seller
}
```

### GuidanceResponse

The payload returned from `POST /api/guidance`.

```
GuidanceResponse {
  dealId:       string
  recommendations: Recommendation[]
  asksalesResults: AskSalesResult[]
}
```

---

### AskSalesResult

Raw or normalised result from the IBM AskSales API.

```
AskSalesResult {
  id:           string
  title:        string
  excerpt:      string
  url:          string?
  type:         string          // e.g. "playbook", "competitive", "asset"
}
```
