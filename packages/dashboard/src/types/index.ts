import { z } from "zod";

export const DashboardEventSchema = z.object({
  id: z.string(),
  source: z.enum(["claude_code", "openclaw"]),
  type: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  plainEnglish: z.string(),
  anomalyScore: z.number().min(0).max(1),
  anomalyReason: z.string().nullable()
});

export const SessionSchema = z.object({
  id: z.string(),
  agent: z.enum(["claude_code", "openclaw"]),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  eventCount: z.number().int().nonnegative()
});

export type DashboardEvent = z.infer<typeof DashboardEventSchema>;
export type Session = z.infer<typeof SessionSchema>;
