import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      insert: insertMock
    })
  })
}));

import { streamEventToSupabase } from "../supabase.js";

const baseEvent = {
  source: "claude_code" as const,
  type: "command_exec" as const,
  sessionId: "session_1",
  timestamp: new Date().toISOString(),
  payload: {},
  plainEnglish: "claude_code executed command: pnpm build.",
  anomalyScore: 0,
  anomalyReason: null
};

describe("streamEventToSupabase", () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.SUPABASE_RETRY_DELAY_MS = "1";
  });

  it("inserts an event successfully", async () => {
    await streamEventToSupabase(baseEvent);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertedArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(insertedArg.source).toBe("claude_code");
    expect(typeof insertedArg.id).toBe("string");
  });

  it("retries once after a transient failure then succeeds", async () => {
    insertMock
      .mockResolvedValueOnce({ error: new Error("transient network error") })
      .mockResolvedValueOnce({ error: null });

    await streamEventToSupabase({ ...baseEvent, sessionId: "session_retry" });
    expect(insertMock).toHaveBeenCalledTimes(2);
  });

  it("logs an error and gives up after max retries", async () => {
    insertMock.mockResolvedValue({ error: new Error("persistent error") });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await streamEventToSupabase({ ...baseEvent, sessionId: "session_fail" });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed to stream event after retries")
    );
    consoleSpy.mockRestore();
  });
});
