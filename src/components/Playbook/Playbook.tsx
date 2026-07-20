"use client";

import type { AskSalesResult } from "@/types";

interface PlaybookProps {
  results: AskSalesResult[];
}

export default function Playbook({ results }: PlaybookProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No IBM AskSales content retrieved yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
        IBM AskSales Content
      </p>
      {results.map((result) => (
        <div
          key={result.id}
          className="border border-ibm-gray-20 p-4 bg-ibm-gray-10"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-ibm-gray-100">
              {result.title}
            </h4>
            <span className="text-xs text-gray-400 shrink-0 bg-white border border-ibm-gray-20 px-2 py-0.5">
              {result.type}
            </span>
          </div>
          <p className="text-sm text-gray-600">{result.excerpt}</p>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-ibm-blue hover:underline"
            >
              View in AskSales →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
