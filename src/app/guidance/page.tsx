"use client";

import { useState } from "react";
import DealForm from "@/components/DealForm/DealForm";
import Recommendations from "@/components/Recommendations/Recommendations";
import Playbook from "@/components/Playbook/Playbook";
import ChatBot from "@/components/ChatBot/ChatBot";
import { useGuidance } from "@/hooks/useGuidance";
import type { Deal } from "@/types";

type ActiveTab = "recommendations" | "asksales" | "chat";

export default function GuidancePage() {
  const { data, loading, error, getGuidance } = useGuidance();
  const [activeDeal, setActiveDeal] = useState<Deal | undefined>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("recommendations");

  const handleSubmit = async (deal: Deal, question?: string) => {
    setActiveDeal(deal);
    await getGuidance({ deal, question });
    setActiveTab("recommendations");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ibm-gray-100 mb-1">
          Deal Guidance
        </h1>
        <p className="text-sm text-gray-500">
          Enter your deal details to get AI recommendations powered by IBM
          AskSales and WatsonX.
        </p>
      </div>

      {/* Deal input form */}
      <section className="border border-ibm-gray-20 p-6">
        <h2 className="text-sm font-semibold text-ibm-gray-80 mb-4 uppercase tracking-wide">
          Deal Details
        </h2>
        <DealForm onSubmit={handleSubmit} loading={loading} />
      </section>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      {/* Results tabs */}
      {(data || loading) && (
        <section>
          {/* Tab bar */}
          <div className="flex border-b border-ibm-gray-20 mb-4">
            {(
              [
                { id: "recommendations", label: "Recommendations" },
                { id: "asksales", label: "AskSales Content" },
                { id: "chat", label: "AI Assistant" },
              ] as { id: ActiveTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-ibm-blue text-ibm-blue"
                    : "border-transparent text-gray-500 hover:text-ibm-gray-100"
                }`}
              >
                {tab.label}
                {tab.id === "recommendations" && data && (
                  <span className="ml-2 text-xs bg-ibm-gray-10 px-1.5 py-0.5 rounded-sm">
                    {data.recommendations.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10 animate-pulse">
              Fetching IBM AskSales content and generating recommendations...
            </p>
          ) : (
            <>
              {activeTab === "recommendations" && (
                <Recommendations recommendations={data?.recommendations ?? []} />
              )}
              {activeTab === "asksales" && (
                <Playbook results={data?.askSalesResults ?? []} />
              )}
              {activeTab === "chat" && (
                <div className="h-[560px]">
                  <ChatBot deal={activeDeal} />
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
