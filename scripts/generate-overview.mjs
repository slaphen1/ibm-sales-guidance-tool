/**
 * generate-overview.mjs
 * Generates a Word (.docx) project overview document.
 * Run with: node scripts/generate-overview.mjs
 */

import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from "docx";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../IBM_Sales_Guidance_Tool_Overview.docx");
const DATE = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IBM_BLUE = "0F62FE";
const LIGHT_GRAY = "F4F4F4";
const MID_GRAY = "E0E0E0";
const TEXT = "161616";
const MUTED = "525252";

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 52, color: IBM_BLUE, font: "IBM Plex Sans" })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 120 },
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: MUTED, font: "IBM Plex Sans" })],
    spacing: { after: 480 },
  });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: IBM_BLUE, font: "IBM Plex Sans" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY } },
    spacing: { before: 480, after: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: TEXT, font: "IBM Plex Sans" })],
    spacing: { before: 280, after: 120 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: TEXT, font: "IBM Plex Sans" })],
    spacing: { after: 140 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, color: TEXT, font: "IBM Plex Sans" })],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: IBM_BLUE } },
    spacing: { after: 320 },
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 } });
}

function tableRow(label, value, shaded = false) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: "IBM Plex Sans", color: TEXT })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: shaded ? { type: ShadingType.SOLID, color: LIGHT_GRAY } : undefined,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: "IBM Plex Sans", color: TEXT })] })],
        width: { size: 70, type: WidthType.PERCENTAGE },
        shading: shaded ? { type: ShadingType.SOLID, color: LIGHT_GRAY } : undefined,
      }),
    ],
  });
}

function simpleTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value], i) => tableRow(label, value, i % 2 === 0)),
  });
}

// ─── Document content ─────────────────────────────────────────────────────────

const children = [

  // Cover
  title("IBM Sales Guidance Tool"),
  new Paragraph({
    children: [new TextRun({ text: "Client Roadmap Generator", size: 36, color: MUTED, font: "IBM Plex Sans" })],
    spacing: { after: 120 },
  }),
  subtitle(`Project Overview · Generated ${DATE}`),
  divider(),

  // 1. Purpose
  h1("1. Purpose & Scope"),
  body("The IBM Sales Guidance Tool is an AI-assisted workflow designed to help IBM sellers quickly generate structured, actionable Client Roadmaps. The tool is built to run inside IBM Bob and combines seller-provided inputs with IBM AskSales content, Watson Assistant AI, and public data retrieval to produce a comprehensive client brief."),
  spacer(),
  body("The output covers four structured sections:"),
  bullet("Client Overview — background, IBM relationship, strategic priorities"),
  bullet("IBM Cloud Opportunities — recommended solutions, upsell/cross-sell"),
  bullet("Obstacles & Risks — competitors, objection handling, blockers"),
  bullet("Quote & BOM Instructions — product SKUs, pricing guidance, BOM template"),
  spacer(),

  // 2. Architecture
  h1("2. System Architecture"),
  body("The application is built as a Next.js full-stack web application. All IBM API credentials are held server-side and never exposed to the browser. The frontend communicates exclusively with the Next.js API routes, which proxy all third-party service calls."),
  spacer(),
  h2("Technology Stack"),
  simpleTable([
    ["Framework", "Next.js 14 (React + API Routes)"],
    ["Language", "TypeScript"],
    ["Styling", "Tailwind CSS (IBM Carbon-inspired palette)"],
    ["AI Engine", "IBM Watson Assistant v2 (Actions Skill)"],
    ["Sales Content", "IBM AskSales API (includes Seismic via backend)"],
    ["Deal Guidance", "WatsonX.ai (IBM Granite model)"],
    ["Runtime", "Node.js v24 LTS"],
  ]),
  spacer(),

  // 3. Watson Assistant
  h1("3. IBM Watson Assistant Integration"),
  body("The chatbot and roadmap generation are powered by IBM Watson Assistant v2 using the Actions Skill. Authentication uses HTTP Basic auth (base64-encoded apikey credential) as documented in the AskSales API reference."),
  spacer(),
  h2("Configured Credentials"),
  simpleTable([
    ["Service Instance URL", "api.direct.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-..."],
    ["Assistant ID", "a99f67bd-26da-4ca3-b338-cbbb03bb3e57"],
    ["Action Skill ID", "85e69230-e195-49ba-9d7b-450b820991a3"],
    ["Draft Environment ID", "4ec3f873-5e08-4a8f-b7d4-dd528622e808"],
    ["Production Environment ID", "cea0be1c-1e71-4bf7-88de-ffc63fd0dee6"],
    ["API Key", "⚠ Pending — retrieve from IBM 1Password vault"],
  ]),
  spacer(),
  body("Required skill_variables passed on every message:"),
  bullet("source_system: \"IBM-Bob\""),
  bullet("email_address: <seller IBM email>"),
  bullet("user_id: <seller IBM email> (top-level field)"),
  spacer(),

  // 4. Data Sources
  h1("4. Data Sources"),
  simpleTable([
    ["IBM AskSales API", "Direct API integration — covers Seismic content via AskSales backend"],
    ["Seller-uploaded files", ".docx, .pdf, .xlsx, .csv — parsed server-side into plain text"],
    ["ISC Data", "Seller manually exports from ISC and uploads — no API integration required"],
    ["Public / External data", "IBM Bob native RAG — handles automatically within Bob workflow"],
    ["CRM", "REST API integration (configured via CRM_API_URL / CRM_API_KEY)"],
  ]),
  spacer(),

  // 5. Seller workflow
  h1("5. Seller Workflow"),
  body("The seller interacts with a multi-step guided input form embedded inside IBM Bob. The workflow collects the following inputs in sequence:"),
  spacer(),
  simpleTable([
    ["Step 1", "Client / Account Name (required)"],
    ["Step 2", "Client Overview — .docx, .pdf, or free text (required)"],
    ["Step 3", "Current IBM Cloud Usage — .xlsx or .csv (optional)"],
    ["Step 4", "ISC Account Data — seller exports from ISC, uploads .xlsx/.csv (optional)"],
    ["Step 5", "Existing BOM Example — .xlsx or .docx (optional)"],
    ["Step 6", "Competitive Install Info — .xlsx or free text (optional)"],
    ["Step 7", "Opportunity Notes — free text (required)"],
  ]),
  spacer(),
  body("On submission, the orchestrator calls IBM AskSales, passes all context to Watson Assistant, and returns a 4-section roadmap rendered on screen. A \"Download as Word\" button exports the full roadmap as a formatted .docx file."),
  spacer(),

  // 6. API Routes
  h1("6. API Routes"),
  simpleTable([
    ["POST /api/roadmap", "Main orchestrator — all inputs in, structured roadmap out"],
    ["POST /api/upload", "File upload + parsing (.docx, .pdf, .xlsx, .csv)"],
    ["POST /api/chat", "Watson Assistant stateful chat with session management"],
    ["GET /api/asksales", "IBM AskSales proxy (search, query, playbook, competitive)"],
    ["POST /api/guidance", "Deal guidance — AskSales + WatsonX recommendations"],
    ["GET /api/crm", "CRM deal data retrieval and normalisation"],
  ]),
  spacer(),

  // 7. File structure
  h1("7. Project File Structure"),
  simpleTable([
    ["src/types/index.ts", "All shared TypeScript types and interfaces"],
    ["src/services/ai/watson-assistant.ts", "Watson Assistant v2 service (mock mode when no API key)"],
    ["src/services/ai/watsonx.ts", "WatsonX.ai service for deal guidance generation"],
    ["src/services/asksales/client.ts", "IBM AskSales HTTP client"],
    ["src/services/crm/client.ts", "CRM API client and deal normalisation"],
    ["src/services/files/parser.ts", "File parsing service (.docx, .pdf, .xlsx, .csv)"],
    ["src/services/files/docx-export.ts", "Word document generation service"],
    ["src/hooks/useAskSales.ts", "React hook — AskSales queries from frontend"],
    ["src/hooks/useChat.ts", "React hook — Watson Assistant chat with session management"],
    ["src/hooks/useGuidance.ts", "React hook — deal guidance requests"],
    ["src/components/RoadmapWorkflow/", "Multi-step guided input form (Bob workflow UI)"],
    ["src/components/RoadmapOutput/", "4-section roadmap renderer + download button"],
    ["src/components/ChatBot/", "AI assistant chat interface"],
    ["src/components/DealForm/", "Deal input form"],
    ["src/app/roadmap/page.tsx", "Client Roadmap Generator page"],
    ["src/app/guidance/page.tsx", "Deal Guidance page"],
    ["src/app/chat/page.tsx", "AI Assistant chat page"],
  ]),
  spacer(),

  // 8. Current status
  h1("8. Current Status & Next Steps"),
  h2("✅ Complete"),
  bullet("Next.js project scaffolded with full TypeScript configuration"),
  bullet("IBM Watson Assistant v2 integration (auth, skill routing, session management, mock mode)"),
  bullet("IBM AskSales API integration (search, query, playbook, competitive intel)"),
  bullet("File parsing service (.docx, .pdf, .xlsx, .csv)"),
  bullet("Roadmap orchestrator (POST /api/roadmap)"),
  bullet("Word document export service"),
  bullet("Multi-step Bob workflow UI with ISC pull prompt"),
  bullet("4-section roadmap output renderer"),
  bullet("AI chatbot with Watson Assistant session continuity"),
  bullet("Deal guidance with WatsonX recommendations"),
  bullet("All dependencies installed (Node.js v24, npm v11)"),
  spacer(),
  h2("⚠ Pending"),
  bullet("Watson Assistant API key — retrieve from IBM 1Password vault"),
  bullet("Seller authentication — IBM w3id SSO (App ID integration)"),
  bullet("Deployment — IBM Cloud Code Engine + internal URL"),
  bullet("Mock mode removal — once API key is configured"),
  spacer(),
  h2("🔮 Future Phases"),
  bullet("Register as IBM Bob skill for marketplace distribution"),
  bullet("ISC API direct integration (when API access is available)"),
  bullet("Propel / Bob native search integration"),
  bullet("Multi-seller collaboration on roadmaps"),
  spacer(),

  // Footer
  divider(),
  new Paragraph({
    children: [
      new TextRun({
        text: `IBM Sales Guidance Tool · Client Roadmap Generator · ${DATE}`,
        size: 18, color: MUTED, italics: true, font: "IBM Plex Sans",
      }),
    ],
    alignment: AlignmentType.CENTER,
  }),
];

// ─── Build and write ──────────────────────────────────────────────────────────

const doc = new Document({
  creator: "IBM Bob",
  title: "IBM Sales Guidance Tool — Project Overview",
  description: "Overview of the IBM Sales Guidance Tool / Client Roadmap Generator project",
  sections: [{ children }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUT_PATH, buffer);
console.log(`✅ Document written to: ${OUT_PATH}`);
