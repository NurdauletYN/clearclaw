import { streamEventToSupabase } from "./supabase.js";
import { EnrichedEventSchema } from "./types.js";

const HEARTBEAT_INTERVAL_MS = 30_000;

export const startHeartbeat = (): NodeJS.Timeout => {
  const sendHeartbeat = async (): Promise<void> => {
    try {
      const event = EnrichedEventSchema.parse({
        source: "claude_code",
        type: "heartbeat",
        sessionId: "daemon-heartbeat",
        timestamp: new Date().toISOString(),
        payload: { version: "0.1.0" },
        plainEnglish: "AgentAudit daemon is running.",
        anomalyScore: 0,
        anomalyReason: null
      });
      await streamEventToSupabase(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown heartbeat error";
      console.error(`[agentaudit:daemon] heartbeat failed: ${message}`);
    }
  };

  void sendHeartbeat();
  return setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
};

// ---------------------------------------------------------------------------
// What this file sends to AgentAudit servers (via streamEventToSupabase):
//   - source: "claude_code" (constant)
//   - type: "heartbeat" (constant)
//   - sessionId: "daemon-heartbeat" (constant)
//   - timestamp: current ISO-8601 datetime
//   - payload.version: daemon version string (e.g. "0.1.0")
//   - plainEnglish: "AgentAudit daemon is running." (constant)
//   - anomalyScore: 0 (constant)
//
// What this file never sends:
//   - Any user data, file paths, command names, or secrets
//   - The heartbeat contains no information about what the agent is doing
// ---------------------------------------------------------------------------
