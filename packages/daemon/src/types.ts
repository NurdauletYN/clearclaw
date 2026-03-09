import { z } from "zod";

export const HookEventTypeSchema = z.enum([
  "tool_call",
  "file_read",
  "file_write",
  "command_exec",
  "network_request",
  "session_start",
  "session_end",
  "heartbeat"
]);

export const AgentSourceSchema = z.enum(["claude_code", "openclaw"]);

export const RawHookEventSchema = z.object({
  source: AgentSourceSchema,
  type: HookEventTypeSchema,
  sessionId: z.string().min(1),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
});

export const EnrichedEventSchema = RawHookEventSchema.extend({
  plainEnglish: z.string().min(1),
  anomalyScore: z.number().min(0).max(1),
  anomalyReason: z.string().nullable()
});

export type HookEventType = z.infer<typeof HookEventTypeSchema>;
export type AgentSource = z.infer<typeof AgentSourceSchema>;
export type RawHookEvent = z.infer<typeof RawHookEventSchema>;
export type EnrichedEvent = z.infer<typeof EnrichedEventSchema>;

// ---------------------------------------------------------------------------
// What this file sends to AgentAudit servers: NOTHING — type definitions only
// What this file never sends: everything
// ---------------------------------------------------------------------------
