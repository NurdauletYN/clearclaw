import net from "node:net";
import fs from "node:fs";
import { scoreAnomaly } from "./anomaly.js";
import { streamEventToSupabase } from "./supabase.js";
import { translateEvent } from "./translator.js";
import { EnrichedEventSchema, RawHookEventSchema, type EnrichedEvent } from "./types.js";

const DEFAULT_SOCKET_PATH = "/tmp/agentaudit.sock";

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
  try {
    const enrichedEvent = enrichEvent(rawData);
    await streamEventToSupabase(enrichedEvent);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown socket parse error";
    console.error(`[agentaudit:daemon] unable to handle socket message: ${message}`);
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
    throw new Error(`[agentaudit:daemon] failed to start socket server: ${message}`);
  }
};
