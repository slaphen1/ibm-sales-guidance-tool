import { useState, useCallback } from "react";
import type { ChatMessage, Deal } from "@/types";

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, deal?: Deal, sellerEmail?: string) => Promise<void>;
  clearChat: () => void;
}

/** Client-side timeout for Watson Assistant calls (ms) */
const REQUEST_TIMEOUT_MS = 45_000;

/**
 * useChat — React hook for the AI sales guidance chatbot.
 *
 * Maintains conversation history locally and sends messages to POST /api/chat.
 * Optionally accepts deal context to personalise responses.
 *
 * Usage:
 *   const { messages, loading, sendMessage } = useChat();
 *   await sendMessage("How do I handle a pricing objection?", deal);
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, deal?: Deal, sellerEmail?: string) => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      // Optimistically append the user message
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, deal, sellerEmail }),
          signal: controller.signal,
        });

        // Guard against non-JSON gateway error pages (e.g. Code Engine 502/504)
        const text = await res.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            res.ok
              ? "Received an unexpected response from the server. Please try again."
              : `Server error (${res.status}). Please try again.`
          );
        }

        if (!res.ok) {
          throw new Error((json as { error?: string }).error ?? "Chat request failed");
        }

        const { message: assistantMessage } = json as { message: ChatMessage };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError("The request timed out — Watson Assistant is taking too long. Please try again.");
        } else {
          setError(err instanceof Error ? err.message : "Chat request failed");
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    []
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}
