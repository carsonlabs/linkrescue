export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type IssueType = 'OK' | 'BROKEN_4XX' | 'SERVER_5XX' | 'TIMEOUT' | 'REDIRECT_TO_HOME' | 'LOST_PARAMS';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

// New enums (Phase 1)
export type OrgRole = 'viewer' | 'member' | 'admin' | 'owner';
export type GuardianStatus = 'active' | 'paused' | 'broken';
export type MatchStatus = 'pending' | 'applied' | 'rejected';
export type RedirectStatus = 'draft' | 'pending_approval' | 'approved' | 'deployed' | 'archived';
export type LogFormat = 'nginx' | 'apache' | 'cloudflare' | 'custom_json';
export type ScanFrequency = 'daily' | 'weekly' | 'monthly';
export type WebhookEvent =
  | 'scan.completed'
  | 'scan.failed'
  | 'guardian.rescued'
  | 'redirect.deployed'
  | 'redirect.rollback';
export type SeoPageType = 'network_check' | 'comparison' | 'guide';
export type SeoPageStatus = 'draft' | 'published' | 'archived';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          billing_address: Json | null;
          payment_method: Json | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_current_period_end: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: string | null;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          user_id: string;
          domain: string;
          sitemap_url: string | null;
          verify_token: string;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          sitemap_url?: string | null;
          verify_token?: string;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: string;
          sitemap_url?: string | null;
          verify_token?: string;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pages: {
        Row: {
          id: string;
          site_id: string;
          url: string;
          last_fetched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          url: string;
          last_fetched_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          url?: string;
          last_fetched_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pages_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      links: {
        Row: {
          id: string;
          site_id: string;
          page_id: string;
          href: string;
          is_affiliate: boolean;
          first_seen_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          page_id: string;
          href: string;
          is_affiliate?: boolean;
          first_seen_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          page_id?: string;
          href?: string;
          is_affiliate?: boolean;
          first_seen_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'links_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'links_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
        ];
      };
      scans: {
        Row: {
          id: string;
          site_id: string;
          status: ScanStatus;
          started_at: string | null;
          finished_at: string | null;
          pages_scanned: number;
          links_checked: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          status?: ScanStatus;
          started_at?: string | null;
          finished_at?: string | null;
          pages_scanned?: number;
          links_checked?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          status?: ScanStatus;
          started_at?: string | null;
          finished_at?: string | null;
          pages_scanned?: number;
          links_checked?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scans_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      scan_results: {
        Row: {
          id: string;
          scan_id: string;
          link_id: string;
          status_code: number | null;
          final_url: string | null;
          redirect_hops: number;
          issue_type: IssueType;
          checked_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          link_id: string;
          status_code?: number | null;
          final_url?: string | null;
          redirect_hops?: number;
          issue_type?: IssueType;
          checked_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          link_id?: string;
          status_code?: number | null;
          final_url?: string | null;
          redirect_hops?: number;
          issue_type?: IssueType;
          checked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scan_results_scan_id_fkey';
            columns: ['scan_id'];
            isOneToOne: false;
            referencedRelation: 'scans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scan_results_link_id_fkey';
            columns: ['link_id'];
            isOneToOne: false;
            referencedRelation: 'links';
            referencedColumns: ['id'];
          },
        ];
      };
      scan_events: {
        Row: {
          id: number;
          scan_id: string;
          level: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          scan_id: string;
          level: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          scan_id?: string;
          level?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scan_events_scan_id_fkey';
            columns: ['scan_id'];
            isOneToOne: false;
            referencedRelation: 'scans';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: OrgRole;
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role?: OrgRole;
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: OrgRole;
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      guardian_links: {
        Row: {
          id: string;
          user_id: string;
          org_id: string | null;
          slug: string;
          original_url: string;
          backup_url: string;
          status: GuardianStatus;
          value_per_click_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id?: string | null;
          slug: string;
          original_url: string;
          backup_url: string;
          status?: GuardianStatus;
          value_per_click_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string | null;
          slug?: string;
          original_url?: string;
          backup_url?: string;
          status?: GuardianStatus;
          value_per_click_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rescue_logs: {
        Row: {
          id: string;
          guardian_link_id: string;
          visitor_ip_hash: string | null;
          rescued_at: string;
        };
        Insert: {
          id?: string;
          guardian_link_id: string;
          visitor_ip_hash?: string | null;
          rescued_at?: string;
        };
        Update: {
          id?: string;
          guardian_link_id?: string;
          visitor_ip_hash?: string | null;
          rescued_at?: string;
        };
        Relationships: [];
      };
      guardian_audit_log: {
        Row: {
          id: string;
          guardian_link_id: string;
          changed_by: string;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          guardian_link_id: string;
          changed_by: string;
          field_name: string;
          old_value?: string | null;
          new_value?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          guardian_link_id?: string;
          changed_by?: string;
          field_name?: string;
          old_value?: string | null;
          new_value?: string | null;
          changed_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id?: string | null;
          title: string;
          url: string;
          topic?: string;
          tags?: string[];
          estimated_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string | null;
          title?: string;
          url?: string;
          topic?: string;
          tags?: string[];
          estimated_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          scan_result_id: string;
          offer_id: string;
          match_score: number;
          match_reason: string;
          status: MatchStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_result_id: string;
          offer_id: string;
          match_score: number;
          match_reason?: string;
          status?: MatchStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_result_id?: string;
          offer_id?: string;
          match_score?: number;
          match_reason?: string;
          status?: MatchStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      redirect_rules: {
        Row: {
          id: string;
          user_id: string;
          org_id: string | null;
          from_url: string;
          to_url: string;
          status: RedirectStatus;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id?: string | null;
          from_url: string;
          to_url: string;
          status?: RedirectStatus;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string | null;
          from_url?: string;
          to_url?: string;
          status?: RedirectStatus;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      redirect_rule_versions: {
        Row: {
          id: string;
          rule_id: string;
          from_url: string;
          to_url: string;
          status: RedirectStatus;
          version: number;
          changed_by: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          from_url: string;
          to_url: string;
          status: RedirectStatus;
          version: number;
          changed_by: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          from_url?: string;
          to_url?: string;
          status?: RedirectStatus;
          version?: number;
          changed_by?: string;
          changed_at?: string;
        };
        Relationships: [];
      };
      approval_log: {
        Row: {
          id: string;
          rule_id: string;
          action: string;
          actor_id: string;
          note: string | null;
          acted_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          action: string;
          actor_id: string;
          note?: string | null;
          acted_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          action?: string;
          actor_id?: string;
          note?: string | null;
          acted_at?: string;
        };
        Relationships: [];
      };
      log_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          format: LogFormat;
          api_key_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          format?: LogFormat;
          api_key_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          format?: LogFormat;
          api_key_hash?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      link_incidents: {
        Row: {
          id: string;
          source_id: string;
          url: string;
          source_page: string | null;
          status_code: number;
          hits: number;
          first_seen_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          url: string;
          source_page?: string | null;
          status_code: number;
          hits?: number;
          first_seen_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          url?: string;
          source_page?: string | null;
          status_code?: number;
          hits?: number;
          first_seen_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      webhooks: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          events: WebhookEvent[];
          secret: string;
          last_triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          events?: WebhookEvent[];
          secret: string;
          last_triggered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          events?: WebhookEvent[];
          secret?: string;
          last_triggered_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scan_schedules: {
        Row: {
          id: string;
          site_id: string;
          frequency: ScanFrequency;
          next_run_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          frequency?: ScanFrequency;
          next_run_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          frequency?: ScanFrequency;
          next_run_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      revenue_history: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_revenue_lost_cents: number;
          total_revenue_recovered_cents: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_revenue_lost_cents?: number;
          total_revenue_recovered_cents?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_revenue_lost_cents?: number;
          total_revenue_recovered_cents?: number;
        };
        Relationships: [];
      };
      recovered_sessions: {
        Row: {
          id: string;
          redirect_rule_id: string;
          session_fingerprint: string;
          converted: boolean;
          conversion_value_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          redirect_rule_id: string;
          session_fingerprint: string;
          converted?: boolean;
          conversion_value_cents?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          redirect_rule_id?: string;
          session_fingerprint?: string;
          converted?: boolean;
          conversion_value_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      email_leads: {
        Row: {
          id: string;
          email: string;
          wizard_progress: number;
          scan_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          wizard_progress?: number;
          scan_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          wizard_progress?: number;
          scan_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      onboarding_events: {
        Row: {
          id: string;
          lead_id: string;
          event_name: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          event_name: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          event_name?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          stripe_event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      seo_pages: {
        Row: {
          id: string;
          slug: string;
          page_type: SeoPageType;
          status: SeoPageStatus;
          title: string;
          meta_description: string;
          og_title: string | null;
          og_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          hero_headline: string | null;
          hero_subheadline: string | null;
          content: Json;
          sidebar: Json | null;
          faq: Json | null;
          network_name: string | null;
          network_url: string | null;
          network_commission: string | null;
          network_cookie_days: number | null;
          competitor_name: string | null;
          competitor_url: string | null;
          comparison_features: Json | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          page_type: SeoPageType;
          status?: SeoPageStatus;
          title: string;
          meta_description: string;
          og_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          content?: Json;
          sidebar?: Json | null;
          faq?: Json | null;
          network_name?: string | null;
          network_url?: string | null;
          network_commission?: string | null;
          network_cookie_days?: number | null;
          competitor_name?: string | null;
          competitor_url?: string | null;
          comparison_features?: Json | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          page_type?: SeoPageType;
          status?: SeoPageStatus;
          title?: string;
          meta_description?: string;
          og_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          content?: Json;
          sidebar?: Json | null;
          faq?: Json | null;
          network_name?: string | null;
          network_url?: string | null;
          network_commission?: string | null;
          network_cookie_days?: number | null;
          competitor_name?: string | null;
          competitor_url?: string | null;
          comparison_features?: Json | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      issue_type: IssueType;
      scan_status: ScanStatus;
      org_role: OrgRole;
      guardian_status: GuardianStatus;
      match_status: MatchStatus;
      redirect_status: RedirectStatus;
      log_format: LogFormat;
      scan_frequency: ScanFrequency;
      webhook_event: WebhookEvent;
      seo_page_type: SeoPageType;
      seo_page_status: SeoPageStatus;
    };
  };
}
