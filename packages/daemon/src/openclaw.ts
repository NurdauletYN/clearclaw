import fs from "node:fs";
import path from "node:path";
import { scoreAnomaly } from "./anomaly.js";
import { streamEventToSupabase } from "./supabase.js";
import { translateEvent } from "./translator.js";
import { EnrichedEventSchema, RawHookEventSchema } from "./types.js";

type OpenClawLogLine = {
  "0"?: string;
  "1"?: string | Record<string, unknown>;
  _meta?: {
    logLevelName?: string;
    name?: string;
  };
  time?: string;
};

type OpenClawPayload = {
  tool: string;
  subsystem: string;
  detail: string;
  level: string;
};

const legacyOpenClawLogPath = path.join(process.env.HOME ?? "", ".openclaw", "events.log");
const openClawTmpDir = "/tmp/openclaw";
const duplicateWindowMs = 60_000;
const recentEventKeys = new Map<string, number>();
const levelPriority: Record<string, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50
};

const readMinLevelPriority = (): number => {
  const configured = String(process.env.OPENCLAW_MIN_LEVEL ?? "WARN").toUpperCase();
  return levelPriority[configured] ?? levelPriority.WARN;
};

const normalizeLevel = (level: string | undefined): string => {
  const upper = String(level ?? "INFO").toUpperCase();
  return levelPriority[upper] ? upper : "INFO";
};

const safeIsoTimestamp = (raw: string | undefined): string => {
  if (!raw) {
    return new Date().toISOString();
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const resolveOpenClawLogPath = (): string | null => {
  try {
    const configured = process.env.OPENCLAW_LOG_PATH;
    if (configured && fs.existsSync(configured)) {
      return configured;
    }

    if (fs.existsSync(legacyOpenClawLogPath)) {
      return legacyOpenClawLogPath;
    }

    if (!fs.existsSync(openClawTmpDir)) {
      return null;
    }

    const files = fs
      .readdirSync(openClawTmpDir)
      .filter((name) => /^openclaw-\d{4}-\d{2}-\d{2}\.log$/.test(name))
      .map((name) => ({
        name,
        fullPath: path.join(openClawTmpDir, name),
        mtime: fs.statSync(path.join(openClawTmpDir, name)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return files.length > 0 ? files[0].fullPath : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown OpenClaw path resolve error";
    console.error(`[agentaudit:daemon] failed to resolve openclaw log path: ${message}`);
    return null;
  }
};

const extractSubsystem = (raw: string | undefined): string => {
  if (!raw) {
    return "openclaw/log";
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as { subsystem?: unknown };
      if (typeof parsed.subsystem === "string" && parsed.subsystem.length > 0) {
        return parsed.subsystem;
      }
    } catch {
      return "openclaw/log";
    }
  }

  return "openclaw/log";
};

const normalizePayload = (line: OpenClawLogLine): OpenClawPayload => {
  const subsystem = extractSubsystem(typeof line["0"] === "string" ? line["0"] : undefined);
  const detailRaw =
    typeof line["1"] === "string"
      ? line["1"]
      : line["1"] && typeof line["1"] === "object"
        ? JSON.stringify(line["1"])
        : "";
  const level = normalizeLevel(line._meta?.logLevelName);

  return {
    tool: subsystem,
    subsystem,
    detail: detailRaw,
    level
  };
};

const shouldIngestPayload = (payload: OpenClawPayload): boolean => {
  const minPriority = readMinLevelPriority();
  const currentPriority = levelPriority[payload.level] ?? levelPriority.INFO;
  if (currentPriority < minPriority) {
    return false;
  }

  return true;
};

const isDuplicatePayload = (payload: OpenClawPayload, timestampIso: string): boolean => {
  const key = `${payload.level}|${payload.subsystem}|${payload.detail}`;
  const ts = Number.isFinite(new Date(timestampIso).getTime()) ? new Date(timestampIso).getTime() : Date.now();
  const lastSeen = recentEventKeys.get(key);
  recentEventKeys.set(key, ts);

  if (recentEventKeys.size > 1000) {
    for (const [eventKey, eventTs] of recentEventKeys) {
      if (ts - eventTs > duplicateWindowMs * 5) {
        recentEventKeys.delete(eventKey);
      }
    }
  }

  return typeof lastSeen === "number" && ts - lastSeen < duplicateWindowMs;
};

const parseOpenClawLogObjectToRawEvent = (parsed: OpenClawLogLine, payload: OpenClawPayload) => {
  const timestamp = safeIsoTimestamp(parsed.time);

  return RawHookEventSchema.parse({
    source: "openclaw",
    type: "tool_call",
    sessionId: "openclaw-gateway",
    timestamp,
    payload
  });
};

const isLikelyJsonObjectLine = (line: string): boolean => {
  const trimmed = line.trimStart();
  return trimmed.startsWith("{");
};

const processLine = async (line: string): Promise<void> => {
  try {
    if (!line.trim() || !isLikelyJsonObjectLine(line)) {
      return;
    }

    const parsed = JSON.parse(line) as OpenClawLogLine;
    const payload = normalizePayload(parsed);
    const timestamp = safeIsoTimestamp(parsed.time);

    if (!shouldIngestPayload(payload)) {
      return;
    }

    if (isDuplicatePayload(payload, timestamp)) {
      return;
    }

    const event = parseOpenClawLogObjectToRawEvent(parsed, payload);
    const anomaly = scoreAnomaly(event);
    const enriched = EnrichedEventSchema.parse({
      ...event,
      plainEnglish: translateEvent(event),
      anomalyScore: anomaly.score,
      anomalyReason: anomaly.reason
    });
    await streamEventToSupabase(enriched);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown OpenClaw parsing error";
    console.error(`[agentaudit:daemon] openclaw line parse error: ${message}`);
  }
};

export const startOpenClawWatcher = async (): Promise<fs.FSWatcher | null> => {
  try {
    const logPath = resolveOpenClawLogPath();
    if (!logPath || !fs.existsSync(logPath)) {
      console.log("[agentaudit:daemon] openclaw log file not found, skipping watcher");
      return null;
    }

    console.log(`[agentaudit:daemon] watching openclaw log: ${logPath}`);
    let previousSize = fs.statSync(logPath).size;
    let trailingPartialLine = "";

    const watcher = fs.watch(logPath, async () => {
      try {
        const stats = fs.statSync(logPath);
        if (stats.size <= previousSize) {
          return;
        }

        const stream = fs.createReadStream(logPath, { start: previousSize, encoding: "utf-8" });
        let chunk = "";
        stream.on("data", (data: string | Buffer) => {
          chunk += typeof data === "string" ? data : data.toString("utf-8");
        });

        await new Promise<void>((resolve, reject) => {
          stream.on("end", () => resolve());
          stream.on("error", (error) => reject(error));
        });

        previousSize = fs.statSync(logPath).size;
        const combined = `${trailingPartialLine}${chunk}`;
        const lines = combined.split("\n");
        trailingPartialLine = lines.pop() ?? "";

        for (const line of lines) {
          await processLine(line);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown OpenClaw watch error";
        console.error(`[agentaudit:daemon] openclaw watch callback failed: ${message}`);
      }
    });

    return watcher;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown OpenClaw watcher error";
    console.error(`[agentaudit:daemon] failed to start openclaw watcher: ${message}`);
    return null;
  }
};
