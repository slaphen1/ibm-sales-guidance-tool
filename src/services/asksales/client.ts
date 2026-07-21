import axios from "axios";
import type { AskSalesResult } from "@/types";

/**
 * Whether a real AskSales API URL and key have been configured.
 * The placeholder values shipped in .env.example are detected here.
 */
const ASKSALES_ENABLED =
  !!process.env.ASKSALES_API_URL &&
  process.env.ASKSALES_API_URL !== "https://asksales.ibm.com/api/v1" &&
  !!process.env.ASKSALES_API_KEY &&
  process.env.ASKSALES_API_KEY !== "your-asksales-api-key";

if (!ASKSALES_ENABLED && process.env.NODE_ENV !== "test") {
  console.warn(
    "[AskSales] Real credentials not configured — AskSales queries will return empty results. " +
    "Set ASKSALES_API_URL and ASKSALES_API_KEY in your .env to enable live content."
  );
}

const client = axios.create({
  baseURL: process.env.ASKSALES_API_URL,
  timeout: 8000, // 8s — fail fast so the roadmap isn't blocked
  headers: {
    Authorization: `Bearer ${process.env.ASKSALES_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Safely run an AskSales axios call.
 * Returns an empty array (never throws) if credentials are not configured
 * or if the request fails — so callers are never blocked by AskSales.
 */
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!ASKSALES_ENABLED) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn("[AskSales] Request failed (non-fatal):", (err as Error).message);
    return fallback;
  }
}

/**
 * Search IBM AskSales for content relevant to a given query.
 */
export async function searchAskSales(query: string): Promise<AskSalesResult[]> {
  return safeCall(async () => {
    const response = await client.get<{ results: AskSalesResult[] }>("/search", {
      params: { q: query },
    });
    return response.data.results ?? [];
  }, []);
}

/**
 * Submit a natural-language query to AskSales for AI-powered answers.
 */
export async function queryAskSales(question: string): Promise<string> {
  return safeCall(async () => {
    const response = await client.post<{ answer: string }>("/query", { question });
    return response.data.answer ?? "";
  }, "");
}

/**
 * Retrieve a specific playbook by ID.
 */
export async function getPlaybook(playbookId: string): Promise<AskSalesResult | null> {
  return safeCall(async () => {
    const response = await client.get<AskSalesResult>(`/playbooks/${playbookId}`);
    return response.data ?? null;
  }, null);
}

/**
 * Retrieve competitive intelligence content.
 */
export async function getCompetitiveIntel(competitor: string): Promise<AskSalesResult[]> {
  return safeCall(async () => {
    const response = await client.get<{ results: AskSalesResult[] }>("/competitive", {
      params: { q: competitor },
    });
    return response.data.results ?? [];
  }, []);
}
