import { useState, useCallback } from "react";
import type { AskSalesResult } from "@/types";

interface UseAskSalesState {
  results: AskSalesResult[];
  answer: string | null;
  loading: boolean;
  error: string | null;
}

interface UseAskSalesReturn extends UseAskSalesState {
  search: (query: string) => Promise<void>;
  query: (question: string) => Promise<void>;
  getPlaybook: (id: string) => Promise<void>;
  getCompetitiveIntel: (competitor: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: UseAskSalesState = {
  results: [],
  answer: null,
  loading: false,
  error: null,
};

/**
 * useAskSales — React hook for querying IBM AskSales via the backend proxy.
 *
 * All requests go to /api/asksales so the API key never leaves the server.
 *
 * Usage:
 *   const { results, loading, error, search } = useAskSales();
 *   await search("watsonx financial services");
 */
export function useAskSales(): UseAskSalesReturn {
  const [state, setState] = useState<UseAskSalesState>(INITIAL_STATE);

  const setLoading = () =>
    setState((s) => ({ ...s, loading: true, error: null }));

  const setError = (error: string) =>
    setState((s) => ({ ...s, loading: false, error }));

  const search = useCallback(async (q: string) => {
    setLoading();
    try {
      const res = await fetch(
        `/api/asksales?action=search&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setState((s) => ({
        ...s,
        loading: false,
        results: (data as { results: AskSalesResult[] }).results,
        answer: null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }, []);

  const query = useCallback(async (q: string) => {
    setLoading();
    try {
      const res = await fetch(
        `/api/asksales?action=query&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      setState((s) => ({
        ...s,
        loading: false,
        answer: (data as { answer: string }).answer,
        results: [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    }
  }, []);

  const getPlaybook = useCallback(async (id: string) => {
    setLoading();
    try {
      const res = await fetch(
        `/api/asksales?action=playbook&id=${encodeURIComponent(id)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Playbook fetch failed");
      setState((s) => ({
        ...s,
        loading: false,
        results: (data as { results: AskSalesResult[] }).results,
        answer: null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playbook fetch failed");
    }
  }, []);

  const getCompetitiveIntel = useCallback(async (competitor: string) => {
    setLoading();
    try {
      const res = await fetch(
        `/api/asksales?action=competitive&q=${encodeURIComponent(competitor)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Competitive intel fetch failed");
      setState((s) => ({
        ...s,
        loading: false,
        results: (data as { results: AskSalesResult[] }).results,
        answer: null,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Competitive intel fetch failed"
      );
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    ...state,
    search,
    query,
    getPlaybook,
    getCompetitiveIntel,
    reset,
  };
}
