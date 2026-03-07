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

export const getSupabaseServerClient = (): SupabaseClient<DashboardSchema> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient<DashboardSchema>(url, serviceRoleKey);
};
