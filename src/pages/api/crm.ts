import type { NextApiRequest, NextApiResponse } from "next";
import { getDeals, getDealById, normaliseCrmDeal } from "@/services/crm/client";
import type { Deal } from "@/types";

type ApiResponse = { deals: Deal[] } | { deal: Deal } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    if (id && typeof id === "string") {
      const crmDeal = await getDealById(id);
      if (!crmDeal) {
        return res.status(404).json({ error: `Deal ${id} not found` });
      }
      return res.status(200).json({ deal: normaliseCrmDeal(crmDeal) });
    }

    const crmDeals = await getDeals();
    return res.status(200).json({ deals: crmDeals.map(normaliseCrmDeal) });
  } catch (err) {
    console.error("[CRM API route error]", err);
    return res.status(502).json({ error: "Failed to reach CRM" });
  }
}
