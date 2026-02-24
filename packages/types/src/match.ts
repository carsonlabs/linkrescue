export type MatchStatus = 'pending' | 'applied' | 'rejected';

export interface Match {
  id: string;
  scan_result_id: string;
  offer_id: string;
  match_score: number; // 0-100
  match_reason: string;
  status: MatchStatus;
  created_at: string;
}

export interface DeadLinkAnalysis {
  topic: string;
  intent: string;
  keywords: string[];
}

export interface OfferMatchResult {
  offer_id: string;
  score: number;
  reason: string;
}
