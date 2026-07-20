"use client";

import { useRef, useEffect } from "react";
import type { ChatMessage, Deal } from "@/types";
import { useChat } from "@/hooks/useChat";

interface ChatBotProps {
  deal?: Deal;
}

export default function ChatBot({ deal }: ChatBotProps) {
  const { messages, loading, error, sendMessage, clearChat } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputRef.current?.value.trim();
    if (!content || loading) return;
    if (inputRef.current) inputRef.current.value = "";
    await sendMessage(content, deal);
  };

  return (
    <div className="flex flex-col h-full border border-ibm-gray-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ibm-gray-20 bg-ibm-gray-10">
        <span className="text-sm font-semibold text-ibm-gray-100">
          IBM AskSales AI Assistant
        </span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-ibm-gray-100 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[480px]">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask a question about your deal, product, or objections.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="animate-pulse">●</span>
            <span>Thinking...</span>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-ibm-gray-20"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about this deal..."
          className="flex-1 border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-ibm-blue text-white px-4 py-2 text-sm font-medium hover:bg-ibm-blue-hover disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-2 text-sm ${
          isUser
            ? "bg-ibm-blue text-white"
            : "bg-ibm-gray-10 text-ibm-gray-100 border border-ibm-gray-20"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <p className="text-xs mt-1 opacity-70">
            Sources: {message.sources.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
