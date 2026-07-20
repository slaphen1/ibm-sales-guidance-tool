"use client";

import ChatBot from "@/components/ChatBot/ChatBot";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ibm-gray-100 mb-1">
          AI Sales Assistant
        </h1>
        <p className="text-sm text-gray-500">
          Ask the IBM AskSales AI assistant anything about your deal, product
          positioning, objections, or competitive landscape.
        </p>
      </div>

      <div className="h-[600px]">
        <ChatBot />
      </div>
    </div>
  );
}
