import type { NextApiRequest, NextApiResponse } from "next";
import { searchAskSales, queryAskSales, getPlaybook, getCompetitiveIntel } from "@/services/asksales/client";
import type { AskSalesResult } from "@/types";

type AskSalesApiResponse =
  | { results: AskSalesResult[] }
  | { answer: string }
  | { error: string };

/**
 * Proxies all AskSales requests through the backend so the API key
 * is never exposed to the browser.
 *
 * Supported query params:
 *   ?action=search&q=<query>
 *   ?action=query&q=<question>
 *   ?action=playbook&id=<playbookId>
 *   ?action=competitive&q=<competitor>
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AskSalesApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, q, id } = req.query;

  try {
    switch (action) {
      case "search": {
        if (!q || typeof q !== "string") {
          return res.status(400).json({ error: "Missing query parameter: q" });
        }
        const results = await searchAskSales(q);
        return res.status(200).json({ results });
      }

      case "query": {
        if (!q || typeof q !== "string") {
          return res.status(400).json({ error: "Missing query parameter: q" });
        }
        const answer = await queryAskSales(q);
        return res.status(200).json({ answer });
      }

      case "playbook": {
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing query parameter: id" });
        }
        const playbook = await getPlaybook(id);
        return res.status(200).json({ results: playbook ? [playbook] : [] });
      }

      case "competitive": {
        if (!q || typeof q !== "string") {
          return res.status(400).json({ error: "Missing query parameter: q" });
        }
        const results = await getCompetitiveIntel(q);
        return res.status(200).json({ results });
      }

      default:
        return res.status(400).json({ error: "Missing or invalid query parameter: action" });
    }
  } catch (err) {
    console.error("[AskSales API route error]", err);
    return res.status(502).json({ error: "Failed to reach IBM AskSales API" });
  }
}
