import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/diag
 *
 * Diagnostic endpoint — tests outbound HTTPS connectivity from Code Engine
 * to the Watson Assistant endpoint. Returns timing + status so we can tell
 * whether the container can reach the API at all.
 *
 * Remove or gate this behind an env flag before any public release.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ASSISTANT_ID = process.env.WATSON_ASSISTANT_ID ?? "";
  const ENVIRONMENT_ID = process.env.WATSON_ASSISTANT_ENVIRONMENT_ID ?? "";
  const API_KEY = process.env.WATSON_ASSISTANT_API_KEY ?? "";
  const VERSION = process.env.WATSON_ASSISTANT_VERSION ?? "2024-08-25";
  const BASE_URL =
    process.env.WATSON_ASSISTANT_MESSAGE_URL ??
    "https://api.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56";

  const watsonUrl = `${BASE_URL}/v2/assistants/${ASSISTANT_ID}/environments/${ENVIRONMENT_ID}/message?version=${VERSION}`;
  const auth = `Basic ${Buffer.from(`apikey:${API_KEY}`).toString("base64")}`;

  const ASKSALES_URL = process.env.ASKSALES_API_URL ?? "";
  const ASKSALES_KEY = process.env.ASKSALES_API_KEY ?? "";
  const askSalesEnabled =
    !!ASKSALES_URL &&
    ASKSALES_URL !== "https://asksales.ibm.com/api/v1" &&
    !!ASKSALES_KEY &&
    ASKSALES_KEY !== "your-asksales-api-key";

  const results: Record<string, unknown> = {
    env: {
      hasApiKey: !!API_KEY && API_KEY !== "your-watson-assistant-api-key",
      apiKeyPrefix: API_KEY ? API_KEY.slice(0, 8) + "..." : "NOT SET",
      assistantId: ASSISTANT_ID || "NOT SET",
      environmentId: ENVIRONMENT_ID || "NOT SET",
      version: VERSION,
      baseUrl: BASE_URL,
    },
    asksales: {
      enabled: askSalesEnabled,
      url: ASKSALES_URL || "NOT SET",
      hasKey: !!ASKSALES_KEY && ASKSALES_KEY !== "your-asksales-api-key",
      note: askSalesEnabled
        ? "Real credentials configured"
        : "Placeholder credentials — AskSales queries return empty results (non-fatal)",
    },
  };

  // 1. DNS + TCP reachability check (HEAD to the base hostname)
  const dnsStart = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const dnsRes = await fetch(
      "https://api.us-east-1.aws.watsonassistant.ibm.com",
      { method: "HEAD", signal: controller.signal }
    );
    clearTimeout(t);
    results.dns = { ok: true, status: dnsRes.status, ms: Date.now() - dnsStart };
  } catch (e) {
    results.dns = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      ms: Date.now() - dnsStart,
    };
  }

  // 2. Watson Assistant API call with a short timeout
  const watsonStart = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const watsonRes = await fetch(watsonUrl, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { message_type: "text", text: "ping" },
        context: {
          skills: {
            "actions skill": {
              skill_variables: { source_system: "IBM-Bob", email_address: "diag@ibm.com" },
            },
          },
        },
        user_id: "diag@ibm.com",
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const body = await watsonRes.text();
    results.watson = {
      ok: watsonRes.ok,
      status: watsonRes.status,
      ms: Date.now() - watsonStart,
      bodyPreview: body.slice(0, 300),
    };
  } catch (e) {
    results.watson = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      errorName: e instanceof Error ? e.name : "unknown",
      ms: Date.now() - watsonStart,
    };
  }

  return res.status(200).json(results);
}
