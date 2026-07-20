import type { NextApiRequest, NextApiResponse } from "next";
import {
  createSession,
  sendMessage,
  deleteSession,
} from "@/services/ai/watson-assistant";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types";

type ApiResponse = ChatResponse | { error: string };

/**
 * POST /api/chat
 *
 * Body: ChatRequest { message, history, deal?, sessionId? }
 *
 * Pass `sessionId` from the previous response to continue a session.
 * Omit it to start a new session. Pass `endSession: true` to delete the session.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as ChatRequest & {
    sessionId?: string;
    sellerEmail?: string;
    endSession?: boolean;
  };

  if (!body?.message || typeof body.message !== "string") {
    return res.status(400).json({ error: "Missing required field: message" });
  }

  const { message, deal, sessionId: incomingSessionId, endSession } = body;
  const sellerEmail = body.sellerEmail ?? "seller@ibm.com";

  try {
    // Re-use an existing session or create a new one
    const sessionId = incomingSessionId ?? (await createSession());

    if (endSession && incomingSessionId) {
      await deleteSession(incomingSessionId);
      return res.status(200).json({
        message: {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: "Session ended.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { text } = await sendMessage(sessionId, message, sellerEmail, deal);

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Return the sessionId so the client can continue the conversation
    return res.status(200).json({
      message: assistantMessage,
      // @ts-expect-error — extending response with sessionId for session continuity
      sessionId,
    });
  } catch (err) {
    console.error("[Chat API route error]", err);
    return res.status(500).json({ error: "Failed to reach Watson Assistant" });
  }
}
