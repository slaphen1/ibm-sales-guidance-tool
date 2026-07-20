import { useState, useRef, useCallback } from "react";
import type { ChatMessage, Deal } from "@/types";

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, deal?: Deal, sellerEmail?: string) => Promise<void>;
  clearChat: () => void;
}

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
  // Persist the Watson Assistant session ID across turns without triggering re-renders
  const sessionIdRef = useRef<string | undefined>(undefined);

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

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            deal,
            sellerEmail,
            sessionId: sessionIdRef.current, // carry session across turns
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Chat request failed");

        const { message: assistantMessage, sessionId } = json as {
          message: ChatMessage;
          sessionId: string;
        };

        // Persist the session ID for the next turn
        sessionIdRef.current = sessionId;
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat request failed");
      } finally {
        setLoading(false);
      }
    },
    [] // no dependency on messages — session state is in a ref
  );

  const clearChat = useCallback(() => {
    // Signal the backend to clean up the Watson Assistant session
    if (sessionIdRef.current) {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "", sessionId: sessionIdRef.current, endSession: true }),
      }).catch(() => {}); // fire-and-forget
      sessionIdRef.current = undefined;
    }
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}
