import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { EnrichedEvent } from "./types.js";

type StoredEvent = EnrichedEvent & { id: string };

type SupabaseSchema = {
  public: {
    Tables: {
      events: {
        Row: StoredEvent;
        Insert: StoredEvent;
        Update: Partial<StoredEvent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let cachedClient: SupabaseClient<SupabaseSchema> | null = null;

export const getSupabaseClient = (): SupabaseClient<SupabaseSchema> => {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  cachedClient = createClient<SupabaseSchema>(supabaseUrl, serviceRoleKey);
  return cachedClient;
};

export const streamEventToSupabase = async (event: EnrichedEvent): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const eventForInsert: StoredEvent = {
      id: randomUUID(),
      ...event
    };
    const { error } = await supabase.from("events").insert(eventForInsert);
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Supabase error";
    console.error(`[agentaudit:daemon] failed to stream event: ${message}`);
  }
};
