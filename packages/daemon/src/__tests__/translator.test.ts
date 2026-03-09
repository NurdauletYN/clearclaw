import { describe, expect, it } from "vitest";
import { translateEvent } from "../translator.js";

const baseEvent = {
  source: "claude_code" as const,
  sessionId: "session_1",
  timestamp: new Date("2026-03-01T00:00:00.000Z").toISOString(),
  payload: {} as Record<string, unknown>
};

describe("translateEvent", () => {
  it("describes command exec", () => {
    const event = { ...baseEvent, type: "command_exec" as const, payload: { command: "rm -rf /tmp/test" } };
    expect(translateEvent(event)).toContain("executed command");
  });

  it("describes file read", () => {
    const event = { ...baseEvent, type: "file_read" as const, payload: { path: "/tmp/secrets.env" } };
    expect(translateEvent(event)).toContain("read file /tmp/secrets.env");
  });

  it("describes tool call with tool name", () => {
    const event = { ...baseEvent, type: "tool_call" as const, payload: { tool: "clangd" } };
    expect(translateEvent(event)).toContain("called tool clangd");
  });

  it("falls back for unknown payload", () => {
    const event = { ...baseEvent, type: "network_request" as const, payload: {} };
    expect(translateEvent(event)).toContain("made a network request to unknown");
  });
});
