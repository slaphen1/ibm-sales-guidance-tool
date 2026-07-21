import type { NextApiRequest, NextApiResponse } from "next";
import { sendStatelessMessage } from "@/services/ai/watson-assistant";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types";

type ApiResponse = ChatResponse | { error: string };

/**
 * POST /api/chat
 *
 * Body: ChatRequest { message, history, deal?, sellerEmail? }
 *
 * Uses the stateless Watson Assistant message endpoint — the AskSales
 * instance does not permit session creation (/sessions returns 401).
 * Conversation context is passed via the input.text on each turn.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as ChatRequest & { sellerEmail?: string };

  if (!body?.message || typeof body.message !== "string") {
    return res.status(400).json({ error: "Missing required field: message" });
  }

  const { message, deal } = body;
  const sellerEmail = body.sellerEmail ?? "seller@ibm.com";

  try {
    const text = await sendStatelessMessage(message, sellerEmail, deal);

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({ message: assistantMessage });
  } catch (err) {
    console.error("[Chat API route error]", err);
    return res.status(500).json({ error: "Failed to reach Watson Assistant" });
  }
}
