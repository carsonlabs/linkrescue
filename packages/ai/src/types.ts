export interface DeadLinkAnalysis {
  topic: string;
  intent: string;
  keywords: string[];
}

export interface OfferMatchResult {
  offer_id: string;
  score: number; // 0-100
  reason: string;
}

export interface OfferInput {
  id: string;
  title: string;
  url: string;
  topic: string;
  tags: string[];
}
