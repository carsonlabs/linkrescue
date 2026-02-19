export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type IssueType = 'OK' | 'BROKEN_4XX' | 'SERVER_5XX' | 'TIMEOUT' | 'REDIRECT_TO_HOME' | 'LOST_PARAMS';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      issue_type: IssueType;
      scan_status: ScanStatus;
    };
  };
}
