import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import getConfig from "next/config";
import type { ChatMessage, Deal, Recommendation, AskSalesResult } from "@/types";

const { serverRuntimeConfig } = getConfig();

function getWatsonxClient() {
  return WatsonXAI.newInstance({
    version: "2024-05-31",
    serviceUrl: serverRuntimeConfig.watsonxUrl,
    authenticator: new IamAuthenticator({
      apikey: serverRuntimeConfig.watsonxApiKey,
    }),
  });
}

const MODEL_ID = serverRuntimeConfig.watsonxModel ?? "ibm/granite-13b-chat-v2";
const PROJECT_ID = serverRuntimeConfig.watsonxProjectId;

/**
 * Generate sales guidance recommendations from a deal and AskSales context.
 */
export async function generateGuidance(
  deal: Deal,
  askSalesResults: AskSalesResult[],
  question?: string
): Promise<Recommendation[]> {
  const client = getWatsonxClient();

  const askSalesContext = askSalesResults
    .map((r) => `- ${r.title}: ${r.excerpt}`)
    .join("\n");

  const prompt = `You are an IBM sales expert assistant. Given the following deal details and IBM AskSales content, provide 3-5 specific, actionable sales recommendations.

Deal Details:
- Product: ${deal.product}
- Stage: ${deal.stage}
- Industry: ${deal.industry}
${deal.competitor ? `- Competitor: ${deal.competitor}` : ""}
${deal.dealSize ? `- Deal Size: $${deal.dealSize.toLocaleString()}` : ""}
${deal.notes ? `- Seller Notes: ${deal.notes}` : ""}
${question ? `\nSeller Question: ${question}` : ""}

Relevant IBM AskSales Content:
${askSalesContext || "No specific content retrieved."}

Respond with a JSON array of recommendations. Each recommendation must have:
- id (string)
- type (one of: NEXT_STEP, TALK_TRACK, PLAYBOOK, OBJECTION_RESPONSE, COMPETITIVE_INTEL, RESOURCE_LINK)
- title (string, short)
- summary (string, one sentence)
- content (string, detailed guidance)
- source ("AI_GENERATED" or "COMBINED" if using AskSales content)
- confidence (number 0.0-1.0)
- actions (array of { label, type } objects)

Return only valid JSON, no markdown.`;

  const response = await client.generateText({
    modelId: MODEL_ID,
    projectId: PROJECT_ID,
    input: prompt,
    parameters: {
      max_new_tokens: 1500,
      temperature: 0.3,
    },
  });

  const raw = response.result.results?.[0]?.generated_text ?? "[]";

  try {
    return JSON.parse(raw) as Recommendation[];
  } catch {
    return [
      {
        id: "fallback-1",
        type: "NEXT_STEP",
        title: "Review AskSales content",
        summary: "AI response could not be parsed. Review AskSales results directly.",
        content: raw,
        source: "AI_GENERATED",
        confidence: 0.5,
        actions: [],
      },
    ];
  }
}

/**
 * Generate a chat response from conversation history and optional deal context.
 */
export async function generateChatResponse(
  history: ChatMessage[],
  deal?: Deal
): Promise<string> {
  const client = getWatsonxClient();

  const dealContext = deal
    ? `Current deal context: ${deal.product} | Stage: ${deal.stage} | Industry: ${deal.industry}${deal.competitor ? ` | Competitor: ${deal.competitor}` : ""}`
    : "";

  const conversationHistory = history
    .map((m) => `${m.role === "user" ? "Seller" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt = `You are an IBM sales expert assistant helping a seller close a deal. Answer concisely and practically. Use IBM AskSales knowledge where relevant.
${dealContext ? `\n${dealContext}\n` : ""}
Conversation:
${conversationHistory}
Assistant:`;

  const response = await client.generateText({
    modelId: MODEL_ID,
    projectId: PROJECT_ID,
    input: prompt,
    parameters: {
      max_new_tokens: 800,
      temperature: 0.5,
    },
  });

  return response.result.results?.[0]?.generated_text?.trim() ?? "I could not generate a response. Please try again.";
}
