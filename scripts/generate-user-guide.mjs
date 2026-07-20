/**
 * generate-user-guide.mjs
 * Generates a Word (.docx) user guide for IBM Sellers.
 * Run with: node scripts/generate-user-guide.mjs
 */

import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
  NumberFormat, LevelFormat,
} from "docx";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../IBM_AskSales_Roadmap_Generator_User_Guide.docx");
const DATE = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// ─── Design tokens ────────────────────────────────────────────────────────────
const IBM_BLUE   = "0F62FE";
const DARK_BLUE  = "003399";
const LIGHT_BLUE = "D0E2FF";
const GREEN      = "198038";
const LIGHT_GREEN= "DEFBE6";
const AMBER      = "8A3800";
const LIGHT_AMBER= "FFF8E1";
const GRAY_100   = "161616";
const GRAY_70    = "525252";
const GRAY_20    = "E0E0E0";
const GRAY_10    = "F4F4F4";
const WHITE      = "FFFFFF";

// ─── Helper functions ─────────────────────────────────────────────────────────

const font = "IBM Plex Sans";

function coverTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 56, color: WHITE, font })],
    spacing: { after: 160 },
  });
}

function coverSubtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 28, color: LIGHT_BLUE, font })],
    spacing: { after: 120 },
  });
}

function coverMeta(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: GRAY_20, font })],
    spacing: { after: 80 },
  });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: IBM_BLUE, font })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: IBM_BLUE } },
    spacing: { before: 560, after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: GRAY_100, font })],
    spacing: { before: 360, after: 140 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: DARK_BLUE, font })],
    spacing: { before: 240, after: 100 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: GRAY_100, font })],
    spacing: { after: 140 },
  });
}

function muted(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: GRAY_70, italics: true, font })],
    spacing: { after: 100 },
  });
}

function bullet(text, indent = 360) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, color: GRAY_100, font })],
    indent: { left: indent },
    spacing: { after: 80 },
  });
}

function numbered(text, num) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}.  `, bold: true, size: 22, color: IBM_BLUE, font }),
      new TextRun({ text, size: 22, color: GRAY_100, font }),
    ],
    spacing: { after: 120 },
    indent: { left: 360 },
  });
}

function stepBox(num, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `Step ${num}`, bold: true, size: 22, color: WHITE, font })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: IBM_BLUE },
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: GRAY_100, font })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text: desc, size: 20, color: GRAY_70, font })] }),
            ],
            width: { size: 88, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: GRAY_10 },
          }),
        ],
      }),
    ],
    margins: { top: 0, bottom: 200 },
  });
}

function callout(label, text, bgColor, borderColor) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: borderColor, font })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text, size: 20, color: GRAY_100, font })] }),
            ],
            shading: { type: ShadingType.SOLID, color: bgColor },
          }),
        ],
      }),
    ],
    margins: { top: 0, bottom: 240 },
  });
}

function tip(text)     { return callout("💡 Tip", text, LIGHT_BLUE, DARK_BLUE); }
function warning(text) { return callout("⚠ Important", text, LIGHT_AMBER, AMBER); }
function success(text) { return callout("✅ What to expect", text, LIGHT_GREEN, GREEN); }

function tableHeader(...cols) {
  return new TableRow({
    children: cols.map(c => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20, color: WHITE, font })] })],
      shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    })),
  });
}

function tableRow2(a, b, shaded = false) {
  const bg = shaded ? GRAY_10 : WHITE;
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a, size: 20, font, color: GRAY_100 })] })], shading: { type: ShadingType.SOLID, color: bg }, width: { size: 35, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b, size: 20, font, color: GRAY_100 })] })], shading: { type: ShadingType.SOLID, color: bg }, width: { size: 65, type: WidthType.PERCENTAGE } }),
    ],
  });
}

function tableRow3(a, b, c, shaded = false) {
  const bg = shaded ? GRAY_10 : WHITE;
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a, size: 20, font, color: GRAY_100 })] })], shading: { type: ShadingType.SOLID, color: bg } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b, size: 20, font, color: GRAY_100 })] })], shading: { type: ShadingType.SOLID, color: bg } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font, color: GRAY_100 })] })], shading: { type: ShadingType.SOLID, color: bg } }),
    ],
  });
}

function simpleTable2(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader("Item", "Detail"), ...rows.map(([a, b], i) => tableRow2(a, b, i % 2 === 0))],
    margins: { top: 0, bottom: 240 },
  });
}

function simpleTable3(col1, col2, col3, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader(col1, col2, col3), ...rows.map(([a, b, c], i) => tableRow3(a, b, c, i % 2 === 0))],
    margins: { top: 0, bottom: 240 },
  });
}

function spacer(size = 200) {
  return new Paragraph({ spacing: { after: size } });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GRAY_20 } },
    spacing: { before: 200, after: 200 },
  });
}

function footer() {
  return new Paragraph({
    children: [new TextRun({ text: `IBM Sales Guidance Tool — Client Roadmap Generator · Seller User Guide · ${DATE}`, size: 18, color: GRAY_70, italics: true, font })],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: GRAY_20 } },
    spacing: { before: 600 },
  });
}

// ─── Document body ────────────────────────────────────────────────────────────

const children = [

  // ── Cover ──────────────────────────────────────────────────────────────────
  new Paragraph({
    children: [new TextRun({ text: " ", size: 10 })],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { before: 0, after: 0 },
  }),
  new Paragraph({
    children: [],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { before: 400, after: 0 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "IBM Sales Guidance Tool", bold: true, size: 56, color: WHITE, font })],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { before: 0, after: 160 },
    indent: { left: 720 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Client Roadmap Generator", size: 32, color: LIGHT_BLUE, font })],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { after: 120 },
    indent: { left: 720 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Seller User Guide", size: 24, color: GRAY_20, font })],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { after: 80 },
    indent: { left: 720 },
  }),
  new Paragraph({
    children: [new TextRun({ text: DATE, size: 20, color: GRAY_20, font })],
    shading: { type: ShadingType.SOLID, color: IBM_BLUE },
    spacing: { after: 600 },
    indent: { left: 720 },
  }),
  spacer(400),

  // ── Section 1: Overview ───────────────────────────────────────────────────
  h1("1. What Is the Client Roadmap Generator?"),
  body("The Client Roadmap Generator is an AI-powered workflow built inside IBM Bob that helps IBM sellers quickly create structured, personalised client briefs. In minutes, it combines your deal knowledge with IBM AskSales content, Seismic sales assets, and public client intelligence to generate a comprehensive roadmap you can use in client conversations, planning sessions, and opportunity reviews."),
  spacer(),
  body("The tool is powered by IBM Watson Assistant and the IBM AskSales API. You do not need to separately log into AskSales or Seismic — the tool retrieves relevant content automatically based on the inputs you provide."),
  spacer(),
  h2("What the Roadmap Generator produces"),
  simpleTable2([
    ["Client Overview", "Summary of the client's business, IBM relationship, stakeholders, and strategic priorities"],
    ["IBM Cloud Opportunities", "Specific IBM solutions mapped to client needs, with upsell and expansion recommendations"],
    ["Obstacles & Risks", "Competitor analysis, objection handling guidance, and known blockers"],
    ["Quote & BOM Instructions", "Product SKUs, pricing guidance, and BOM line items based on your template"],
  ]),
  tip("The output is rendered on screen inside IBM Bob and can be downloaded as a formatted Microsoft Word (.docx) document — ready to share, edit, or present."),

  // ── Section 2: Before you start ───────────────────────────────────────────
  h1("2. Before You Start — What to Collect"),
  body("The quality of the roadmap output is directly proportional to the quality of the inputs you provide. Before starting the workflow, collect as much of the following as you can. Required inputs are marked."),
  spacer(),

  h2("2.1  Required Inputs"),
  simpleTable3("Input", "Format", "Where to get it", [
    ["Client / Account Name", "Text (typed)", "You know this — it's the account you're working"],
    ["Client Overview / Background", ".docx, .pdf, or typed text", "Your account plan, client briefing doc, or IBM internal account profile"],
    ["Opportunity Notes", "Typed text", "Your own knowledge — describe the deal, goals, and context in your own words"],
  ]),
  spacer(),

  h2("2.2  Optional but Highly Recommended Inputs"),
  simpleTable3("Input", "Format", "Where to get it", [
    ["Current IBM Cloud Usage", ".xlsx or .csv", "Export from IBM Cloud console, Passport Advantage, or your client's usage dashboard"],
    ["ISC Account Data", ".xlsx, .csv, or typed text", "Log into ISC → navigate to the client account → export entitlement / spend data"],
    ["Existing BOM Example", ".xlsx or .docx", "A previous BOM or quote you've used for this client or a similar one"],
    ["Competitive Install Info", ".xlsx or typed text", "What you know about competitors in this account — Azure, AWS, Salesforce, Oracle, etc."],
  ]),
  spacer(),

  warning("ISC data is not pulled automatically. The workflow will prompt you to log into ISC, export the relevant data, and upload it. Having this ready before you start saves time."),

  h2("2.3  ISC Data — Step-by-Step Export"),
  numbered("Log into ISC at isc.ibm.com using your IBM w3id credentials", 1),
  numbered("Search for the client account by name or account number", 2),
  numbered("Navigate to the client's account overview page", 3),
  numbered("Locate the entitlements or spend summary section", 4),
  numbered("Export as .xlsx or .csv using the export / download button", 5),
  numbered("Save the file to your desktop — you will upload it during the workflow", 6),
  spacer(),
  tip("If the client has multiple account records in ISC (e.g. regional subsidiaries), export the most relevant one — typically the primary account or the one tied to this opportunity."),

  // ── Section 3: Accessing the tool ─────────────────────────────────────────
  h1("3. How to Access the Tool"),
  body("The Client Roadmap Generator runs inside IBM Bob. Access it using one of the methods below."),
  spacer(),

  h2("3.1  Via the IBM Bob Web App"),
  numbered("Open IBM Bob in your browser (internal IBM URL provided by your team)", 1),
  numbered("Sign in with your IBM w3id credentials if prompted", 2),
  numbered("Click 'Client Roadmap' in the top navigation bar", 3),
  numbered("The workflow will load and prompt you to enter the client name", 4),
  spacer(),

  h2("3.2  Via IBM Bob Chat Interface"),
  numbered("Open the IBM Bob chat interface", 1),
  numbered("Type: \"Generate a client roadmap\" or \"Start roadmap generator\"", 2),
  numbered("Bob will launch the guided workflow inside the chat", 3),
  spacer(),

  tip("Bookmark the direct URL to the Client Roadmap page for quick access: http://[your-deployment-url]/roadmap"),

  // ── Section 4: Using the workflow ─────────────────────────────────────────
  h1("4. Using the Workflow — Step by Step"),
  body("The workflow guides you through a series of steps. Required steps must be completed. Optional steps can be skipped — but providing more context produces a better roadmap."),
  spacer(),

  stepBox(1, "Enter the Client Name", "Type the full client or account name (e.g. 'Acme Corporation'). This is used to search IBM AskSales for relevant account content and to label your roadmap output. Click 'Start' when ready."),
  stepBox(2, "Client Overview / Background", "Upload a .docx or .pdf document describing the client (e.g. your account plan or a client briefing doc), or paste the text directly into the text box. Both file upload and typed text are accepted. This is required."),
  stepBox(3, "Current IBM Cloud Usage", "Upload an .xlsx or .csv export of the client's current IBM Cloud spend or consumption data. This helps the tool understand the client's existing IBM footprint and identify expansion opportunities. Optional — skip if not available."),
  stepBox(4, "ISC Account Data", "The workflow will display a prompt asking you to export the client's data from ISC. Upload the .xlsx or .csv file you exported from ISC, or paste the key data as text. Optional — skip if not available."),
  stepBox(5, "Existing BOM Example", "Upload an .xlsx or .docx file of a previous BOM or quote for this client or a similar opportunity. The tool uses this as a template structure for the Quote & BOM Instructions section of the roadmap. Optional."),
  stepBox(6, "Competitive Install Info", "Upload an .xlsx file or type out what you know about competitor products installed at this account (e.g. 'Currently running Azure Databricks and Salesforce CRM'). This drives the competitive intelligence in the roadmap. Optional."),
  stepBox(7, "Opportunity Notes", "Describe the opportunity in your own words. Include your instinct on the deal, the client's stated priorities, key decision-makers, timeline pressure, budget signals, and anything else not covered in the uploaded documents. This is required and has significant impact on the output quality."),
  spacer(),

  body("After completing Step 7, click 'Generate Roadmap'. The tool will:"),
  bullet("Search IBM AskSales for relevant playbooks, product content, and competitive intelligence"),
  bullet("Detect IBM products and competitors mentioned in your inputs and run targeted queries"),
  bullet("Send all context to IBM Watson Assistant (Bob AI engine) for synthesis"),
  bullet("Return a structured 4-section roadmap — typically in 15–30 seconds"),
  spacer(),

  tip("You can include competitor names like 'Azure', 'AWS', 'Salesforce', or 'Oracle' in your opportunity notes or competitive info — the tool will automatically fetch targeted competitive intel from AskSales for each one."),

  // ── Section 5: Understanding the output ───────────────────────────────────
  h1("5. Understanding the Output"),
  body("The roadmap is rendered on screen inside IBM Bob as four expandable sections. Each section is independently readable and copyable."),
  spacer(),

  h2("5.1  Section Descriptions"),
  simpleTable3("Section", "What it contains", "How to use it", [
    ["1. Client Overview", "Client background, IBM relationship, key stakeholders, strategic priorities, recent news", "Use as a briefing document before client meetings or to onboard a new team member to the account"],
    ["2. IBM Cloud Opportunities", "Specific IBM solutions mapped to client needs, expansion recommendations, business value points", "Use as the basis for your solution proposal, discovery conversation agenda, or executive briefing"],
    ["3. Obstacles & Risks", "Competitor analysis, objection handling scripts, budget and procurement blockers", "Use to prepare for objections in client meetings, to brief your technical team, or to build a competitive battle card"],
    ["4. Quote & BOM Instructions", "Recommended product SKUs, pricing guidance, BOM line items, configuration notes", "Use as a starting point for your formal quote — hand off to your technical sales specialist or pricing team"],
  ]),
  spacer(),

  h2("5.2  Downloading as a Word Document"),
  numbered("After the roadmap is generated, click the '⬇ Download as Word' button in the top right", 1),
  numbered("A formatted .docx file is downloaded to your computer", 2),
  numbered("Open in Microsoft Word — all four sections are formatted with IBM-style headings", 3),
  numbered("Edit, add your branding, and share as needed", 4),
  spacer(),
  tip("The Word document is a starting point — always review and personalise the content before sharing with a client or manager. The AI generates based on the inputs you provide, so the more specific your inputs, the less editing you'll need."),

  h2("5.3  Starting a New Roadmap"),
  body("Click 'New Roadmap' at the top of the output to return to the workflow and generate a roadmap for a different client. Your previous roadmap is not saved — download it first if you need to keep it."),
  spacer(),

  // ── Section 6: Tips for best results ──────────────────────────────────────
  h1("6. Tips for Getting the Best Results"),
  spacer(),

  h2("Opportunity Notes are the most important input"),
  body("The AI uses your opportunity notes to personalise the entire roadmap. Be specific:"),
  bullet("Name the key decision-maker and their priorities (e.g. 'CTO is focused on reducing cloud costs by 30%')"),
  bullet("Mention the deal stage and timeline (e.g. 'Proposal due in 3 weeks, decision by end of quarter')"),
  bullet("State the primary IBM solution you're positioning (e.g. 'Proposing WatsonX.ai for their data science team')"),
  bullet("Name competitors explicitly (e.g. 'They are evaluating Azure OpenAI and Google Vertex AI')"),
  spacer(),

  h2("Name IBM products explicitly"),
  body("If you mention IBM product names in your notes or uploaded documents (e.g. 'WatsonX', 'OpenShift', 'Maximo', 'QRadar'), the tool automatically fetches targeted AskSales playbooks and content for those products. The more product names you include, the richer the AskSales content in the output."),
  spacer(),

  h2("Upload real documents when possible"),
  body("A real account plan, existing BOM, or ISC export gives the tool factual grounding that significantly improves the specificity of the output — especially for the Opportunities and BOM sections."),
  spacer(),

  h2("Review before using"),
  body("The roadmap is AI-generated and should be treated as a high-quality first draft. Always review for accuracy, especially:"),
  bullet("Product SKUs and pricing in the BOM section — verify against current IBM pricing"),
  bullet("Stakeholder names and titles — the AI may infer these, not state them as facts"),
  bullet("Competitive claims — review against current competitive intelligence"),
  spacer(),

  // ── Section 7: Troubleshooting ─────────────────────────────────────────────
  h1("7. Troubleshooting"),
  simpleTable3("Issue", "Likely cause", "What to do", [
    ["Roadmap generation takes more than 60 seconds", "Watson Assistant is processing a large prompt", "Wait — it will complete. If it fails after 2 minutes, try again with slightly shorter opportunity notes"],
    ["Sections show 'Content not generated'", "Watson Assistant returned an incomplete response", "Click 'New Roadmap', re-enter your inputs, and try again. Add more detail to opportunity notes."],
    ["File upload fails", "File is too large (>10MB) or unsupported format", "Split large files or convert to a supported format (.docx, .pdf, .xlsx, .csv)"],
    ["AskSales content is generic / not relevant", "Client name or product names not recognised by AskSales", "Add specific IBM product names and competitor names to your opportunity notes"],
    ["Word download fails", "Browser blocked the download", "Check your browser's download permissions or try a different browser"],
    ["'AI service is unavailable' error", "Watson Assistant API key not configured", "Contact your IBM Bob administrator — the API key needs to be set up"],
  ]),
  spacer(),

  // ── Section 8: Data privacy ────────────────────────────────────────────────
  h1("8. Data Privacy & Security"),
  body("The Client Roadmap Generator is designed with IBM's data security standards in mind:"),
  spacer(),
  bullet("All IBM API credentials (Watson Assistant, AskSales) are held server-side and never exposed to your browser"),
  bullet("Files you upload are parsed in memory on the server and are not stored permanently"),
  bullet("Your seller email address is passed to Watson Assistant as required by the AskSales API for audit purposes"),
  bullet("Do not upload documents containing personally identifiable information (PII) about end customers beyond what is necessary for the roadmap"),
  bullet("The tool operates within IBM's internal infrastructure — data does not leave IBM's cloud environment"),
  spacer(),
  warning("Do not paste client passwords, financial account numbers, or other sensitive PII into the free-text fields. Opportunity notes and client overviews should contain business context only."),

  // ── Section 9: Getting help ────────────────────────────────────────────────
  h1("9. Getting Help"),
  simpleTable2([
    ["Technical issues / errors", "Contact your IBM Bob administrator or raise a ticket with the platform team"],
    ["AskSales content questions", "Contact the IBM AskSales team via the #asksales Slack channel"],
    ["Watson Assistant / AI responses", "If responses are consistently poor, share examples with the platform team for prompt tuning"],
    ["ISC data export help", "Contact your ISC system administrator or refer to the ISC user guide on w3"],
    ["Feature requests", "Raise with the platform team — the tool is actively being developed"],
  ]),
  spacer(),

  // ── Footer ─────────────────────────────────────────────────────────────────
  divider(),
  footer(),
];

// ─── Build and write ──────────────────────────────────────────────────────────

const doc = new Document({
  creator: "IBM Bob",
  title: "IBM Sales Guidance Tool — Client Roadmap Generator Seller User Guide",
  description: "Step-by-step guide for IBM sellers using the Client Roadmap Generator workflow",
  sections: [{ children }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUT_PATH, buffer);
console.log(`✅ User guide written to: ${OUT_PATH}`);
