import net from "node:net";
import fs from "node:fs";
import { isDaemonPaused } from "./pause.js";
import { scoreAnomaly } from "./anomaly.js";
import { streamEventToSupabase } from "./supabase.js";
import { translateEvent } from "./translator.js";
import { EnrichedEventSchema, RawHookEventSchema, type EnrichedEvent } from "./types.js";

const DEFAULT_SOCKET_PATH = "/tmp/clearclaw.sock";

const removeExistingSocket = (socketPath: string): void => {
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }
};

const enrichEvent = (rawData: string): EnrichedEvent => {
  const parsedJson = JSON.parse(rawData) as unknown;
  const event = RawHookEventSchema.parse(parsedJson);
  const anomaly = scoreAnomaly(event);
  const enriched = {
    ...event,
    plainEnglish: translateEvent(event),
    anomalyScore: anomaly.score,
    anomalyReason: anomaly.reason
  };
  return EnrichedEventSchema.parse(enriched);
};

const handleRawMessage = async (rawData: string): Promise<void> => {
  if (isDaemonPaused()) {
    console.log("[clearclaw:daemon] paused — dropping event");
    return;
  }
  try {
    const enrichedEvent = enrichEvent(rawData);
    await streamEventToSupabase(enrichedEvent);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown socket parse error";
    console.error(`[clearclaw:daemon] unable to handle socket message: ${message}`);
  }
};

export const startSocketServer = async (socketPath = DEFAULT_SOCKET_PATH): Promise<net.Server> => {
  try {
    removeExistingSocket(socketPath);

    const server = net.createServer((connection) => {
      connection.on("data", (chunk: Buffer) => {
        const rawData = chunk.toString("utf-8").trim();
        void handleRawMessage(rawData);
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", (error) => reject(error));
      server.listen(socketPath, () => resolve());
    });

    fs.chmodSync(socketPath, 0o600);
    return server;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown socket startup error";
    throw new Error(`[clearclaw:daemon] failed to start socket server: ${message}`);
  }
};

// ---------------------------------------------------------------------------
// What this file sends to ClearClaw servers (via streamEventToSupabase):
//   - Enriched events received from the Claude Code hook (hook.sh)
//   - Only metadata fields: source, type, sessionId, timestamp, payload
//     (sanitized), plainEnglish translation, anomalyScore, anomalyReason
//
// What this file never sends:
//   - File contents — the hook only receives metadata from Claude Code
//   - Command output or stdout/stderr
//   - Events are dropped entirely when the daemon is paused
//   - In local-only mode, events are written to disk only (see local-only.ts)
// ---------------------------------------------------------------------------
