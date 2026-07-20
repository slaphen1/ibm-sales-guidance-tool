import { useState, useCallback } from "react";
import type { GuidanceRequest, GuidanceResponse } from "@/types";

interface UseGuidanceReturn {
  data: GuidanceResponse | null;
  loading: boolean;
  error: string | null;
  getGuidance: (request: GuidanceRequest) => Promise<void>;
  reset: () => void;
}

/**
 * useGuidance — React hook for fetching deal guidance from the backend.
 *
 * Calls POST /api/guidance with deal details and returns AI recommendations
 * combined with IBM AskSales content.
 *
 * Usage:
 *   const { data, loading, error, getGuidance } = useGuidance();
 *   await getGuidance({ deal: { product: "WatsonX", stage: "PROPOSAL", industry: "Finance" } });
 */
export function useGuidance(): UseGuidanceReturn {
  const [data, setData] = useState<GuidanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGuidance = useCallback(async (request: GuidanceRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? "Guidance request failed");
      setData(json as GuidanceResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guidance request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, getGuidance, reset };
}
