import type { NextApiRequest, NextApiResponse } from "next";
import { searchAskSales, getCompetitiveIntel } from "@/services/asksales/client";
import { sendStatelessMessage } from "@/services/ai/watson-assistant";
import { generateRoadmapDocx } from "@/services/files/docx-export";
import type { RoadmapRequest, RoadmapResponse, RoadmapSection, ParsedFile } from "@/types";

type ApiResponse = RoadmapResponse | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as RoadmapRequest & { download?: boolean };

  if (!body?.clientName || !body?.sellerEmail) {
    return res.status(400).json({ error: "Missing required fields: clientName, sellerEmail" });
  }

  const { clientName, sellerEmail, opportunityNotes, parsedFiles = [], download } = body;

  try {
    // 1. Build context from parsed files
    const fileContext = parsedFiles
      .map((f) => `=== ${f.fileName} (${f.fileType}) ===\n${f.content}`)
      .join("\n\n");

    // 2. Extract product and competitor signals from seller inputs
    const { products, competitors } = extractSignals(parsedFiles, opportunityNotes);

    // 3. Pull AskSales content using targeted queries in parallel
    //    - Client name (general account context)
    //    - Each detected product (playbooks, product content)
    //    - Each detected competitor (competitive intel)
    //    - Opportunity notes (deal-specific content)
    const productQueries = products.map((p) => searchAskSales(p));
    const competitorQueries = competitors.map((c) => getCompetitiveIntel(c));

    const [
      clientResults,
      notesResults,
      ...productAndCompetitorResults
    ] = await Promise.all([
      searchAskSales(clientName),
      opportunityNotes ? searchAskSales(opportunityNotes) : Promise.resolve([]),
      ...productQueries,
      ...competitorQueries,
    ]);

    const allAskSalesResults = [
      ...clientResults,
      ...notesResults,
      ...productAndCompetitorResults.flat(),
    ];

    // Deduplicate by id
    const seen = new Set<string>();
    const dedupedResults = allAskSalesResults.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    const askSalesContext = dedupedResults
      .map((r) => `- [${r.type}] ${r.title}: ${r.excerpt}`)
      .join("\n");

    // 4. Build the roadmap generation prompt
    const prompt = buildRoadmapPrompt(
      clientName,
      opportunityNotes,
      fileContext,
      askSalesContext,
      products,
      competitors
    );

    // 5. Send to Watson Assistant (Bob AI engine) for generation
    const rawResponse = await sendStatelessMessage(prompt, sellerEmail);

    // 5. Parse the structured sections from the AI response
    const sections = parseSections(rawResponse);

    // 6. Parse sections and build response
    const roadmap: RoadmapResponse = {
      clientName,
      generatedAt: new Date().toISOString(),
      sections,
    };

    // 7. If download requested, return .docx binary
    if (download) {
      const docxBuffer = await generateRoadmapDocx(roadmap);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${clientName.replace(/\s+/g, "_")}_Roadmap.docx"`);
      res.status(200).end(docxBuffer);
      return;
    }

    return res.status(200).json(roadmap);
  } catch (err) {
    console.error("[Roadmap API route error]", err);
    return res.status(500).json({ error: "Failed to generate client roadmap" });
  }
}

/**
 * Extract product names and competitor names from parsed file content
 * and opportunity notes to build targeted AskSales queries.
 *
 * Looks for IBM product keywords and common competitor names in the text.
 * Falls back to empty arrays if nothing is detected.
 */
function extractSignals(
  parsedFiles: ParsedFile[],
  opportunityNotes?: string
): { products: string[]; competitors: string[] } {
  const allText = [
    ...parsedFiles.map((f) => f.content),
    opportunityNotes ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // IBM product signals
  const IBM_PRODUCTS = [
    "watsonx", "watson", "ibm cloud", "openshift", "power", "storage",
    "maximo", "turbonomic", "instana", "envizi", "sterling", "aspera",
    "db2", "informix", "cognos", "planning analytics", "concert",
    "cloud pak", "security", "qradar", "guardium", "verify",
  ];

  // Common competitor signals
  const COMPETITORS = [
    "microsoft", "azure", "aws", "amazon", "google cloud", "gcp",
    "salesforce", "oracle", "sap", "servicenow", "vmware", "broadcom",
    "datadog", "splunk", "palo alto", "crowdstrike",
  ];

  const products = IBM_PRODUCTS.filter((p) => allText.includes(p));
  const competitors = COMPETITORS.filter((c) => allText.includes(c));

  return { products, competitors };
}

/**
 * Build the structured prompt sent to Watson Assistant / Bob AI.
 * Now includes detected products and competitors for richer context.
 */
function buildRoadmapPrompt(
  clientName: string,
  opportunityNotes: string | undefined,
  fileContext: string,
  askSalesContext: string,
  products: string[],
  competitors: string[]
): string {
  const productLine = products.length > 0
    ? `Detected IBM Products of Interest: ${products.join(", ")}`
    : "";
  const competitorLine = competitors.length > 0
    ? `Detected Competitors: ${competitors.join(", ")}`
    : "";

  return `You are an IBM sales expert. Using the information below, generate a structured Client Roadmap for ${clientName}.

Research ${clientName} using available search tools to find recent news, strategic announcements, financial context, and industry trends relevant to this IBM sales opportunity.

${productLine}
${competitorLine}
${opportunityNotes ? `\nSeller Opportunity Notes:\n${opportunityNotes}\n` : ""}
${fileContext ? `\nSeller-Provided Documents:\n${fileContext}\n` : ""}
${askSalesContext ? `\nRelevant IBM AskSales Content (sourced from AskSales + Seismic):\n${askSalesContext}\n` : ""}

Generate a Client Roadmap with exactly these four sections. Use markdown headers exactly as shown:

## 1. Client Overview
Summarise the client's business, current IBM relationship, key stakeholders, strategic priorities, and recent developments found through research.

## 2. IBM Cloud Opportunities
List specific IBM solutions and products that address this client's needs, with emphasis on: ${products.length > 0 ? products.join(", ") : "relevant IBM portfolio"}. Include expansion opportunities, upsell/cross-sell recommendations, and business value justification.

## 3. Obstacles & Risks
Identify known competitors${competitors.length > 0 ? ` (${competitors.join(", ")})` : ""}, budget or procurement constraints, technical blockers, and provide specific objection handling guidance for each.

## 4. Quote & BOM Instructions
Provide structured line items, recommended product SKUs, pricing guidance, and any specific BOM notes based on the seller's example and the client's current usage.

Be specific, actionable, and grounded in the provided context. Do not include generic advice.`;
}

/**
 * Parse the four roadmap sections from the AI text response.
 */
function parseSections(raw: string): RoadmapSection[] {
  const sectionDefs = [
    { id: "client_overview", title: "Client Overview", pattern: /##\s*1\.\s*Client Overview/i },
    { id: "opportunities", title: "IBM Cloud Opportunities", pattern: /##\s*2\.\s*IBM Cloud Opportunities/i },
    { id: "obstacles", title: "Obstacles & Risks", pattern: /##\s*3\.\s*Obstacles\s*&\s*Risks/i },
    { id: "bom", title: "Quote & BOM Instructions", pattern: /##\s*4\.\s*Quote\s*&\s*BOM Instructions/i },
  ];

  const sections: RoadmapSection[] = [];

  for (let i = 0; i < sectionDefs.length; i++) {
    const def = sectionDefs[i];
    const nextDef = sectionDefs[i + 1];

    const start = raw.search(def.pattern);
    const end = nextDef ? raw.search(nextDef.pattern) : raw.length;

    if (start === -1) {
      // Section not found — include a placeholder
      sections.push({ id: def.id, title: def.title, content: "Content not generated." });
      continue;
    }

    const sectionText = raw.slice(start, end === -1 ? raw.length : end).trim();
    // Strip the header line itself
    const content = sectionText.replace(def.pattern, "").trim();
    sections.push({ id: def.id, title: def.title, content });
  }

  return sections;
}
