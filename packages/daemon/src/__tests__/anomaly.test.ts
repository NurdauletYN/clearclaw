import { describe, expect, it } from "vitest";
import { scoreAnomaly } from "../anomaly.js";

describe("scoreAnomaly", () => {
  it("flags suspicious command", () => {
    const event = { type: "command_exec", payload: { command: "rm -rf /" } } as const;
    const result = scoreAnomaly(event as any);
    expect(result.reason).toContain("Suspicious command pattern");
    expect(result.score).toBeGreaterThan(0.9);
  });

  it("flags secret path access", () => {
    const event = { type: "file_read", payload: { path: "/Users/test/.ssh/id_rsa" } } as const;
    const result = scoreAnomaly(event as any);
    expect(result.reason).toContain("Sensitive path access");
  });

  it("flags onion host", () => {
    const event = { type: "network_request", payload: { host: "example.onion" } } as const;
    const result = scoreAnomaly(event as any);
    expect(result.reason).toContain("onion host");
  });

  it("defaults to low score", () => {
    const event = { type: "tool_call", payload: {} } as const;
    const result = scoreAnomaly(event as any);
    expect(result.score).toBeLessThan(0.2);
    expect(result.reason).toBeNull();
  });
});
