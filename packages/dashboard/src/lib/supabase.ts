"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DashboardEvent } from "../types";

type DashboardSchema = {
  public: {
    Tables: {
      events: {
        Row: DashboardEvent;
        Insert: DashboardEvent;
        Update: Partial<DashboardEvent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: SupabaseClient<DashboardSchema> | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient<DashboardSchema> => {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }

  client = createClient<DashboardSchema>(url, anonKey);
  return client;
};
