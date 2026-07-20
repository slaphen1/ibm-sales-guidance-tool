"use client";

import type { RoadmapResponse } from "@/types";

interface RoadmapOutputProps {
  roadmap: RoadmapResponse;
  onDownload: () => void;
  onReset: () => void;
  downloading?: boolean;
}

export default function RoadmapOutput({
  roadmap,
  onDownload,
  onReset,
  downloading = false,
}: RoadmapOutputProps) {
  const date = new Date(roadmap.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ibm-gray-100">
            Client Roadmap: {roadmap.clientName}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Generated {date} · IBM Watson Assistant + AskSales</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="btn-primary text-sm"
          >
            {downloading ? "Preparing..." : "⬇ Download as Word"}
          </button>
          <button onClick={onReset} className="btn-secondary text-sm">
            New Roadmap
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {roadmap.sections.map((section, i) => (
          <div key={section.id} className="border border-ibm-gray-20">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-ibm-gray-10 border-b border-ibm-gray-20">
              <span className="flex items-center justify-center w-6 h-6 bg-ibm-blue text-white text-xs font-semibold shrink-0">
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold text-ibm-gray-100">{section.title}</h3>
            </div>
            {/* Section content */}
            <div className="px-5 py-4">
              <RoadmapContent content={section.content} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render roadmap section content, preserving paragraph breaks and basic markdown bold.
 */
function RoadmapContent({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => {
        // Render list items
        if (para.startsWith("- ") || para.startsWith("• ")) {
          const items = para.split("\n").filter(Boolean);
          return (
            <ul key={i} className="list-disc list-inside space-y-1 text-sm text-ibm-gray-80">
              {items.map((item, j) => (
                <li key={j}>{item.replace(/^[-•]\s*/, "")}</li>
              ))}
            </ul>
          );
        }
        // Render bold headings (### or **)
        if (para.startsWith("### ")) {
          return (
            <p key={i} className="text-sm font-semibold text-ibm-gray-100">
              {para.replace(/^###\s*/, "")}
            </p>
          );
        }
        // Default paragraph
        return (
          <p key={i} className="text-sm text-ibm-gray-80 leading-relaxed">
            {para.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
        );
      })}
    </div>
  );
}
