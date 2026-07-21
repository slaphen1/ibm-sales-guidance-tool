import axios from "axios";
import type { AskSalesResult } from "@/types";

const client = axios.create({
  baseURL: process.env.ASKSALES_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.ASKSALES_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Search IBM AskSales for content relevant to a given query.
 */
export async function searchAskSales(query: string): Promise<AskSalesResult[]> {
  const response = await client.get<{ results: AskSalesResult[] }>("/search", {
    params: { q: query },
  });
  return response.data.results ?? [];
}

/**
 * Submit a natural-language query to AskSales for AI-powered answers.
 */
export async function queryAskSales(question: string): Promise<string> {
  const response = await client.post<{ answer: string }>("/query", {
    question,
  });
  return response.data.answer ?? "";
}

/**
 * Retrieve a specific playbook by ID.
 */
export async function getPlaybook(
  playbookId: string
): Promise<AskSalesResult | null> {
  const response = await client.get<AskSalesResult>(
    `/playbooks/${playbookId}`
  );
  return response.data ?? null;
}

/**
 * Retrieve competitive intelligence content.
 */
export async function getCompetitiveIntel(
  competitor: string
): Promise<AskSalesResult[]> {
  const response = await client.get<{ results: AskSalesResult[] }>(
    "/competitive",
    { params: { q: competitor } }
  );
  return response.data.results ?? [];
}
