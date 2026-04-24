// linkrescue/agents/supabase-tools.ts
// CRM operations for LinkRescue Prospector agent.
// Writes to Studio CRM (crm schema on stackpick Supabase).

import { createClient } from "@supabase/supabase-js";

const crm = createClient(
  process.env.STACKPICK_SUPABASE_URL!,
  process.env.STACKPICK_SUPABASE_KEY!,
  { db: { schema: "crm" } }
);

export async function getExistingContacts() {
  const { data, error } = await crm
    .from("contacts")
    .select("id, name, email, company, source")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertContact(contact: {
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  source: string;
  notes: string | null;
}) {
  const { data, error } = await crm
    .from("contacts")
    .insert(contact)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createDeal(deal: {
  contact_id: string;
  title: string;
  product: string;
  stage: string;
  value: number | null;
  notes: string | null;
}) {
  const { data, error } = await crm
    .from("deals")
    .insert(deal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logActivity(activity: {
  contact_id: string;
  type: string;
  description: string;
}) {
  const { data, error } = await crm
    .from("activities")
    .insert({
      contact_id: activity.contact_id,
      type: activity.type,
      subject: activity.type,
      body: activity.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPipelineStats() {
  const { data: contacts, error: cErr } = await crm
    .from("contacts")
    .select("source");
  if (cErr) throw cErr;

  const { data: deals, error: dErr } = await crm
    .from("deals")
    .select("product, stage, value");
  if (dErr) throw dErr;

  const bySource: Record<string, number> = {};
  for (const c of contacts || []) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }

  const lrDeals = (deals || []).filter((d) => d.product === "linkrescue");
  const byStage: Record<string, number> = {};
  let totalValue = 0;
  for (const d of lrDeals) {
    byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    totalValue += Number(d.value) || 0;
  }

  return {
    total_contacts: (contacts || []).length,
    by_source: bySource,
    linkrescue_deals: lrDeals.length,
    by_stage: byStage,
    pipeline_value: totalValue,
  };
}
