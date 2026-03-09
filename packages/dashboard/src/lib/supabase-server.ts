import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DashboardEvent } from "../types";

export type PermissionKey = "block_sudo" | "alert_secrets" | "require_network_confirm";
export type Permissions = Record<PermissionKey, boolean>;

export const DEFAULT_PERMISSIONS: Permissions = {
  block_sudo: true,
  alert_secrets: true,
  require_network_confirm: false
};

export type SubscriptionRow = {
  id: string;
  user_email: string;
  status: string;
  plan: string;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

type DashboardSchema = {
  public: {
    Tables: {
      events: {
        Row: DashboardEvent;
        Insert: DashboardEvent;
        Update: Partial<DashboardEvent>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Omit<SubscriptionRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
      settings: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown; updated_at?: string };
        Update: { value?: unknown; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type DashboardSupabaseClient = SupabaseClient<DashboardSchema>;

export const getSupabaseServerClient = (): DashboardSupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient<DashboardSchema>(url, serviceRoleKey);
};
