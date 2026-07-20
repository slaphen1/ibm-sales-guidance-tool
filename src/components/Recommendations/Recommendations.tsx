"use client";

import type { Recommendation } from "@/types";
import clsx from "clsx";

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const TYPE_LABELS: Record<Recommendation["type"], string> = {
  NEXT_STEP: "Next Step",
  TALK_TRACK: "Talk Track",
  PLAYBOOK: "Playbook",
  OBJECTION_RESPONSE: "Objection Response",
  COMPETITIVE_INTEL: "Competitive Intel",
  RESOURCE_LINK: "Resource",
};

const TYPE_COLOURS: Record<Recommendation["type"], string> = {
  NEXT_STEP: "bg-blue-100 text-blue-800",
  TALK_TRACK: "bg-purple-100 text-purple-800",
  PLAYBOOK: "bg-green-100 text-green-800",
  OBJECTION_RESPONSE: "bg-yellow-100 text-yellow-800",
  COMPETITIVE_INTEL: "bg-red-100 text-red-800",
  RESOURCE_LINK: "bg-gray-100 text-gray-700",
};

export default function Recommendations({ recommendations }: RecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No recommendations yet. Submit deal details above to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="border border-ibm-gray-20 p-4 bg-white hover:border-ibm-blue transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  "text-xs font-medium px-2 py-0.5 rounded-sm",
                  TYPE_COLOURS[rec.type]
                )}
              >
                {TYPE_LABELS[rec.type]}
              </span>
              <span className="text-xs text-gray-400">
                {rec.source.replace(/_/g, " ")}
              </span>
            </div>
            <ConfidenceBadge confidence={rec.confidence} />
          </div>

          <h3 className="text-sm font-semibold text-ibm-gray-100 mb-1">
            {rec.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{rec.summary}</p>
          <p className="text-sm text-ibm-gray-80 whitespace-pre-wrap">
            {rec.content}
          </p>

          {rec.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rec.actions.map((action, i) => (
                <a
                  key={i}
                  href={action.url ?? "#"}
                  className="text-xs text-ibm-blue border border-ibm-blue px-3 py-1 hover:bg-ibm-blue hover:text-white transition-colors"
                >
                  {action.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const colour =
    pct >= 80
      ? "text-green-700"
      : pct >= 50
      ? "text-yellow-700"
      : "text-red-600";
  return (
    <span className={clsx("text-xs font-medium shrink-0", colour)}>
      {pct}% confidence
    </span>
  );
}
