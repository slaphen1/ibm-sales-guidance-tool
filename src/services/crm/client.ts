import axios from "axios";
import getConfig from "next/config";
import type { Deal } from "@/types";

const { serverRuntimeConfig } = getConfig();

const client = axios.create({
  baseURL: serverRuntimeConfig.crmApiUrl,
  headers: {
    Authorization: `Bearer ${serverRuntimeConfig.crmApiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export interface CrmDeal {
  id: string;
  name: string;
  stage: string;
  amount?: number;
  product?: string;
  industry?: string;
  competitor?: string;
  notes?: string;
}

/**
 * Fetch all active deals from the CRM.
 */
export async function getDeals(): Promise<CrmDeal[]> {
  const response = await client.get<{ deals: CrmDeal[] }>("/deals");
  return response.data.deals ?? [];
}

/**
 * Fetch a single deal by CRM ID.
 */
export async function getDealById(crmId: string): Promise<CrmDeal | null> {
  const response = await client.get<CrmDeal>(`/deals/${crmId}`);
  return response.data ?? null;
}

/**
 * Normalise a CRM deal record into the internal Deal model.
 */
export function normaliseCrmDeal(crmDeal: CrmDeal): Deal {
  return {
    id: crmDeal.id,
    stage: (crmDeal.stage?.toUpperCase() as Deal["stage"]) ?? "QUALIFICATION",
    product: crmDeal.product ?? "",
    industry: crmDeal.industry ?? "",
    competitor: crmDeal.competitor,
    dealSize: crmDeal.amount,
    notes: crmDeal.notes,
    crmId: crmDeal.id,
  };
}
