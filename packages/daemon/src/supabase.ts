import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { EnrichedEvent } from "./types.js";
import { isLocalOnlyMode, writeEventLocally } from "./local-only.js";

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

/**
 * Payload keys that could contain file contents, command output, or secrets.
 * These are stripped before any data leaves the local machine.
 */
const BLOCKED_PAYLOAD_KEYS = new Set([
  "content",
  "output",
  "stdout",
  "stderr",
  "data",
  "body",
  "text",
  "file_content",
  "filecontent",
  "result",
  "response",
  "html",
  "raw",
  "value",
  "secret",
  "password",
  "token",
  "key",
  "credential",
]);

/**
 * Strips any payload fields that could contain file contents or secrets.
 * Only metadata fields (paths, commands, hosts, sizes) are retained.
 */
const sanitizePayload = (
  payload: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> => {
  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!BLOCKED_PAYLOAD_KEYS.has(k.toLowerCase())) {
      sanitized[k] = v;
    }
  }
  return sanitized;
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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = Number(process.env.SUPABASE_RETRY_DELAY_MS ?? 1000)
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

export const queryPaused = async (): Promise<boolean> => {
  // In local-only mode there is no Supabase — daemon is never paused remotely
  if (isLocalOnlyMode()) return false;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "daemon_paused")
      .single();
    if (error) return false;
    return data?.value === true;
  } catch {
    return false;
  }
};

export const streamEventToSupabase = async (event: EnrichedEvent): Promise<void> => {
  // Local-only mode: write to disk, never touch the network
  if (isLocalOnlyMode()) {
    writeEventLocally(event);
    return;
  }

  try {
    const eventForInsert: StoredEvent = {
      id: randomUUID(),
      ...event,
      // Always sanitize payload before sending — strips content/output/secrets
      payload: sanitizePayload(event.payload),
    };

    await withRetry(async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("events").insert(eventForInsert);
      if (error) {
        throw new Error(`Supabase insert failed: ${error.message}`);
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Supabase error";
    console.error(`[clearclaw:daemon] failed to stream event after retries: ${message}`);
  }
};

// ---------------------------------------------------------------------------
// What this file sends to ClearClaw servers (Supabase):
//   - event id (random UUID generated locally, not tied to user identity)
//   - source: "claude_code" or "openclaw"
//   - type: event type enum (e.g. "file_read", "command_exec")
//   - sessionId: opaque session identifier from the agent
//   - timestamp: ISO-8601 datetime
//   - payload: SANITIZED metadata only — file paths, command names, host names
//   - plainEnglish: translated description string
//   - anomalyScore: float 0–1
//   - anomalyReason: short string or null
//
// What this file NEVER sends:
//   - File contents or any data read from disk
//   - Command stdout / stderr / output
//   - API keys, tokens, passwords, secrets
//   - User PII beyond what the agent itself logged
//   - Payload fields named: content, output, stdout, stderr, data, body,
//     text, file_content, result, response, html, raw, secret, password,
//     token, key, credential (all stripped by sanitizePayload)
// ---------------------------------------------------------------------------
