export interface EmailLead {
  id: string;
  email: string;
  wizard_progress: number;
  scan_id: string | null;
  created_at: string;
}

export interface OnboardingEvent {
  id: string;
  lead_id: string;
  event_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
