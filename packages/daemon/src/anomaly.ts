import type { RawHookEvent } from "./types.js";

export type AnomalyResult = {
  score: number;
  reason: string | null;
};

const SUSPICIOUS_COMMANDS = ["rm -rf", "curl | sh", "sudo "];
const SENSITIVE_PATH_MARKERS = [".ssh", ".gnupg", ".env"];

export const scoreAnomaly = (event: RawHookEvent): AnomalyResult => {
  const command = String(event.payload.command ?? "");
  const path = String(event.payload.path ?? "");

  if (event.type === "command_exec") {
    const matched = SUSPICIOUS_COMMANDS.find((pattern) => command.includes(pattern));
    if (matched) {
      return { score: 0.95, reason: `Suspicious command pattern: ${matched}` };
    }
  }

  if (event.type === "file_read" || event.type === "file_write") {
    const marker = SENSITIVE_PATH_MARKERS.find((value) => path.includes(value));
    if (marker) {
      return { score: 0.8, reason: `Sensitive path access: ${marker}` };
    }
  }

  if (event.type === "network_request" && String(event.payload.host ?? "").endsWith(".onion")) {
    return { score: 0.9, reason: "Network request to onion host" };
  }

  return { score: 0.05, reason: null };
};
