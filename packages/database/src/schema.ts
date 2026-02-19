// This file should be auto-generated from Supabase CLI
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/schema.ts
// For now, this is a stub.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
      };
      sites: {
        Row: {
          id: string;
          user_id: string;
          domain: string;
          ownership_verified: boolean;
          verification_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          ownership_verified?: boolean;
          verification_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: string;
          ownership_verified?: boolean;
          verification_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          site_id: string;
          url: string;
          last_crawled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          url: string;
          last_crawled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          url?: string;
          last_crawled_at?: string | null;
          created_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          page_id: string;
          url: string;
          status: 'ok' | 'broken' | 'redirected' | 'unknown';
          http_code: number | null;
          redirect_url: string | null;
          last_checked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          url: string;
          status?: 'ok' | 'broken' | 'redirected' | 'unknown';
          http_code?: number | null;
          redirect_url?: string | null;
          last_checked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          url?: string;
          status?: 'ok' | 'broken' | 'redirected' | 'unknown';
          http_code?: number | null;
          redirect_url?: string | null;
          last_checked_at?: string | null;
          created_at?: string;
        };
      };
      scans: {
        Row: {
          id: string;
          site_id: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
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
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      link_status: 'ok' | 'broken' | 'redirected' | 'unknown';
      scan_status: 'pending' | 'running' | 'completed' | 'failed';
    };
  };
}
