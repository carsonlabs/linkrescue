export interface Offer {
  id: string;
  user_id: string;
  org_id: string | null;
  title: string;
  url: string;
  topic: string;
  tags: string[];
  estimated_value_cents: number;
  created_at: string;
  updated_at: string;
}

export interface OfferCreate {
  title: string;
  url: string;
  topic: string;
  tags?: string[];
  estimated_value_cents?: number;
  org_id?: string | null;
}
