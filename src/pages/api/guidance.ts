import type { NextApiRequest, NextApiResponse } from "next";
import { searchAskSales, getCompetitiveIntel } from "@/services/asksales/client";
import { generateGuidance } from "@/services/ai/watsonx";
import type { GuidanceRequest, GuidanceResponse } from "@/types";

type ApiResponse = GuidanceResponse | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as GuidanceRequest;

  if (!body?.deal?.product || !body?.deal?.stage || !body?.deal?.industry) {
    return res.status(400).json({ error: "Missing required deal fields: product, stage, industry" });
  }

  const { deal, question } = body;

  try {
    // 1. Build AskSales search query from deal context
    const searchQuery = [deal.product, deal.industry, deal.stage].join(" ");

    // 2. Fetch AskSales content (and competitive intel if a competitor is known)
    const [askSalesResults, competitiveResults] = await Promise.all([
      searchAskSales(searchQuery),
      deal.competitor ? getCompetitiveIntel(deal.competitor) : Promise.resolve([]),
    ]);

    const allAskSalesResults = [...askSalesResults, ...competitiveResults];

    // 3. Generate AI recommendations using deal context + AskSales content
    const recommendations = await generateGuidance(deal, allAskSalesResults, question);

    return res.status(200).json({
      dealId: deal.id ?? `deal-${Date.now()}`,
      recommendations,
      askSalesResults: allAskSalesResults,
    });
  } catch (err) {
    console.error("[Guidance API route error]", err);
    return res.status(500).json({ error: "Failed to generate guidance" });
  }
}
