"use client";

import { useState } from "react";
import RoadmapWorkflow from "@/components/RoadmapWorkflow/RoadmapWorkflow";
import RoadmapOutput from "@/components/RoadmapOutput/RoadmapOutput";
import type { RoadmapResponse } from "@/types";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!roadmap) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerEmail: "seller@ibm.com", // replaced with real auth later
          clientName: roadmap.clientName,
          parsedFiles: [],
          download: true,
        }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roadmap.clientName.replace(/\s+/g, "_")}_Roadmap.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ibm-gray-100 mb-1">
          Client Roadmap Generator
        </h1>
        <p className="text-sm text-gray-500">
          AI-assisted workflow powered by IBM Watson Assistant and AskSales. Provide your deal inputs and receive a structured, actionable client brief.
        </p>
      </div>

      {roadmap ? (
        <RoadmapOutput
          roadmap={roadmap}
          onDownload={handleDownload}
          onReset={() => setRoadmap(null)}
          downloading={downloading}
        />
      ) : (
        <RoadmapWorkflow
          sellerEmail="seller@ibm.com"
          onComplete={setRoadmap}
        />
      )}
    </div>
  );
}
