"use client";

import { useState } from "react";
import type { Deal, DealStage } from "@/types";

const STAGES: DealStage[] = [
  "PROSPECTING",
  "QUALIFICATION",
  "NEEDS_ANALYSIS",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

interface DealFormProps {
  onSubmit: (deal: Deal, question?: string) => void;
  loading?: boolean;
}

export default function DealForm({ onSubmit, loading = false }: DealFormProps) {
  const [deal, setDeal] = useState<Deal>({
    stage: "QUALIFICATION",
    product: "",
    industry: "",
    competitor: "",
    dealSize: undefined,
    notes: "",
  });
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(deal, question || undefined);
  };

  const set = (field: keyof Deal, value: string | number | undefined) =>
    setDeal((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Product / Solution <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={deal.product}
            onChange={(e) => set("product", e.target.value)}
            placeholder="e.g. IBM WatsonX"
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
          />
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Deal Stage <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={deal.stage}
            onChange={(e) => set("stage", e.target.value as DealStage)}
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue bg-white"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={deal.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="e.g. Financial Services"
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
          />
        </div>

        {/* Competitor */}
        <div>
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Competitor (optional)
          </label>
          <input
            type="text"
            value={deal.competitor ?? ""}
            onChange={(e) => set("competitor", e.target.value)}
            placeholder="e.g. Microsoft Azure"
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
          />
        </div>

        {/* Deal Size */}
        <div>
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Deal Size USD (optional)
          </label>
          <input
            type="number"
            min={0}
            value={deal.dealSize ?? ""}
            onChange={(e) =>
              set("dealSize", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="e.g. 250000"
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
          Seller Notes (optional)
        </label>
        <textarea
          rows={3}
          value={deal.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any context about this deal..."
          className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue resize-none"
        />
      </div>

      {/* Optional question */}
      <div>
        <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
          Specific Question (optional)
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How do I respond to a budget objection?"
          className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ibm-blue text-white px-6 py-2 text-sm font-medium hover:bg-ibm-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Getting guidance..." : "Get Guidance"}
      </button>
    </form>
  );
}
