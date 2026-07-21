import type { Deal } from "@/types";

const ASSISTANT_ID: string = process.env.WATSON_ASSISTANT_ID ?? "";
const ENVIRONMENT_ID: string = process.env.WATSON_ASSISTANT_ENVIRONMENT_ID ?? "4ec3f873-5e08-4a8f-b7d4-dd528622e808";
const API_KEY: string = process.env.WATSON_ASSISTANT_API_KEY ?? "";
// Version confirmed from official curl sample
const VERSION: string = process.env.WATSON_ASSISTANT_VERSION ?? "2024-08-25";

// Endpoint base — no .direct. in the message URL
const MESSAGE_BASE_URL: string =
  process.env.WATSON_ASSISTANT_MESSAGE_URL ??
  "https://api.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56";

/**
 * Mock mode is active when no API key is configured.
 * Returns realistic placeholder responses so the full app is testable without credentials.
 */
const MOCK_MODE = !API_KEY || API_KEY === "your-watson-assistant-api-key";

if (MOCK_MODE && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Watson Assistant] MOCK MODE active — WATSON_ASSISTANT_API_KEY is not set. " +
    "Responses will be simulated. Set the key in .env to enable live AI responses."
  );
}

/**
 * Watson Assistant uses HTTP Basic auth.
 * Username is always "apikey", password is the API key.
 * Encoded as base64("apikey:<api_key>").
 */
function basicAuthHeader(): string {
  const encoded = Buffer.from(`apikey:${API_KEY}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Build the skill context object.
 * - Skill key must be "actions skill" (confirmed from API docs)
 * - source_system and email_address are required skill_variables
 * - Deal context is injected as additional skill_variables
 */
function buildContext(sellerEmail: string, deal?: Deal) {
  return {
    skills: {
      "actions skill": {
        skill_variables: {
          source_system: "IBM-Bob",
          email_address: sellerEmail,
          ...(deal && {
            deal_product: deal.product,
            deal_stage: deal.stage,
            deal_industry: deal.industry,
            deal_competitor: deal.competitor ?? "",
            deal_size: deal.dealSize?.toString() ?? "",
          }),
        },
      },
    },
  };
}

/**
 * Extract plain text responses from Watson Assistant output.
 */
function extractText(output: { generic?: Array<Record<string, unknown>> }): string {
  return (
    output.generic
      ?.filter((g) => g.response_type === "text")
      .map((g) => (typeof g.text === "string" ? g.text : ""))
      .join("\n")
      .trim() ?? "I could not generate a response. Please try again."
  );
}

/** Default server-side timeout for short chat messages */
const WATSON_TIMEOUT_MS = 30_000;
/** Extended timeout for long roadmap prompts — exported for use in /api/roadmap */
export const WATSON_ROADMAP_TIMEOUT_MS = 90_000;

/**
 * Send a stateless message to Watson Assistant.
 * Uses the environment-scoped message endpoint — the only endpoint
 * this AskSales instance permits (/sessions returns 401).
 *
 * @param message      - The user's message text
 * @param sellerEmail  - Seller's IBM email (required by AskSales skill)
 * @param deal         - Optional deal context
 * @param timeoutMs    - Override timeout in ms (default: 30s; use WATSON_ROADMAP_TIMEOUT_MS for long prompts)
 */
export async function sendStatelessMessage(
  message: string,
  sellerEmail: string,
  deal?: Deal,
  timeoutMs: number = WATSON_TIMEOUT_MS
): Promise<string> {
  const url = `${MESSAGE_BASE_URL}/v2/assistants/${ASSISTANT_ID}/environments/${ENVIRONMENT_ID}/message?version=${VERSION}`;

  const body = {
    input: {
      message_type: "text",
      // Watson Assistant /environments/{id}/message rejects tabs, newlines, and
      // carriage returns in input.text — collapse whitespace to single spaces.
      text: message.replace(/[\t\n\r]+/g, " ").trim(),
    },
    context: buildContext(sellerEmail, deal),
    user_id: sellerEmail,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Watson Assistant stateless message failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as { output: { generic?: Array<Record<string, unknown>> } };
    return extractText(data.output);
  } finally {
    clearTimeout(timeoutId);
  }
}
