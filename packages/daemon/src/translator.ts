import type { RawHookEvent } from "./types.js";

const readPayloadValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return "unknown";
  }
  return String(value);
};

export const translateEvent = (event: RawHookEvent): string => {
  const toolName = readPayloadValue(event.payload.tool);
  const filePath = readPayloadValue(event.payload.path);
  const command = readPayloadValue(event.payload.command);
  const host = readPayloadValue(event.payload.host);
  const detail = String(event.payload.detail ?? "").trim();

  switch (event.type) {
    case "session_start":
      return `${event.source} started a new session (${event.sessionId}).`;
    case "session_end":
      return `${event.source} ended session ${event.sessionId}.`;
    case "tool_call":
      if (event.source === "openclaw") {
        return detail ? `openclaw ${toolName}: ${detail}` : `openclaw ${toolName}.`;
      }
      return `${event.source} called tool ${toolName}.`;
    case "file_read":
      return `${event.source} read file ${filePath}.`;
    case "file_write":
      return `${event.source} modified file ${filePath}.`;
    case "command_exec":
      return `${event.source} executed command: ${command}.`;
    case "network_request":
      return `${event.source} made a network request to ${host}.`;
    default:
      return `${event.source} triggered ${event.type}.`;
  }
};

// ---------------------------------------------------------------------------
// What this file sends to AgentAudit servers: NOTHING — pure translation logic
// What this file never sends: file contents, command output, or any secrets
// ---------------------------------------------------------------------------
