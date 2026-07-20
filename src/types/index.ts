// ─── Deal ────────────────────────────────────────────────────────────────────

export type DealStage =
  | "PROSPECTING"
  | "QUALIFICATION"
  | "NEEDS_ANALYSIS"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface Deal {
  id?: string;
  stage: DealStage;
  product: string;
  industry: string;
  competitor?: string;
  dealSize?: number;
  notes?: string;
  crmId?: string;
}

// ─── AskSales ────────────────────────────────────────────────────────────────

export interface AskSalesResult {
  id: string;
  title: string;
  excerpt: string;
  url?: string;
  type: string; // e.g. "playbook" | "competitive" | "asset"
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationType =
  | "NEXT_STEP"
  | "TALK_TRACK"
  | "PLAYBOOK"
  | "OBJECTION_RESPONSE"
  | "COMPETITIVE_INTEL"
  | "RESOURCE_LINK";

export type RecommendationSource =
  | "ASKSALES"
  | "AI_GENERATED"
  | "CRM"
  | "COMBINED";

export type ActionType =
  | "SCHEDULE_MEETING"
  | "SEND_ASSET"
  | "VIEW_PLAYBOOK"
  | "ESCALATE"
  | "RESEARCH";

export interface Action {
  label: string;
  type: ActionType;
  url?: string;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  summary: string;
  content: string;
  source: RecommendationSource;
  confidence: number; // 0.0 – 1.0
  actions: Action[];
}

// ─── Guidance API ─────────────────────────────────────────────────────────────

export interface GuidanceRequest {
  deal: Deal;
  question?: string;
}

export interface GuidanceResponse {
  dealId: string;
  recommendations: Recommendation[];
  askSalesResults: AskSalesResult[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO 8601
  sources?: string[];
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  deal?: Deal; // Optional deal context
}

export interface ChatResponse {
  message: ChatMessage;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export interface ParsedFile {
  fileName: string;
  fileType: string;
  content: string; // extracted plain text
}

export type RoadmapInputType =
  | "client_overview"
  | "ibm_cloud_usage"
  | "bom_example"
  | "competitive_info"
  | "opportunity_notes"
  | "isc_data";

export interface RoadmapInput {
  type: RoadmapInputType;
  label: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
}

export interface RoadmapRequest {
  sellerEmail: string;
  clientName: string;
  opportunityNotes?: string;
  parsedFiles: ParsedFile[];
}

export interface RoadmapSection {
  id: string;
  title: string;
  content: string;
}

export interface RoadmapResponse {
  clientName: string;
  generatedAt: string; // ISO 8601
  sections: RoadmapSection[];
}
