import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { EnrichedEvent } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".clearclaw");
const EVENTS_FILE = path.join(CONFIG_DIR, "events.jsonl");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

type ClearClawConfig = {
  localOnly?: boolean;
};

const loadConfig = (): ClearClawConfig => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(raw) as ClearClawConfig;
    }
  } catch {
    // Config is optional — silently ignore parse errors
  }
  return {};
};

/**
 * Returns true if the daemon should operate in local-only mode.
 *
 * Priority order:
 *   1. LOCAL_ONLY=true environment variable
 *   2. { "localOnly": true } in ~/.clearclaw/config.json
 *   3. --local-only CLI flag (sets LOCAL_ONLY=true before daemon boots)
 */
export const isLocalOnlyMode = (): boolean => {
  if (process.env.LOCAL_ONLY === "true") return true;
  const config = loadConfig();
  return config.localOnly === true;
};

/**
 * Writes an enriched event to ~/.clearclaw/events.jsonl and prints a
 * human-readable line to stdout.  No data leaves the local machine.
 */
export const writeEventLocally = (event: EnrichedEvent): void => {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const line = JSON.stringify(event) + "\n";
    fs.appendFileSync(EVENTS_FILE, line, "utf-8");

    const anomalyFlag = event.anomalyScore >= 0.8 ? "  ⚠  ANOMALY" : "";
    console.log(
      `[clearclaw:local] ${event.timestamp} | ${event.source} | ${event.plainEnglish}${anomalyFlag}`
    );
    if (event.anomalyReason) {
      console.log(`[clearclaw:local]   reason: ${event.anomalyReason}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown write error";
    console.error(`[clearclaw:daemon] failed to write event locally: ${message}`);
  }
};

// ---------------------------------------------------------------------------
// What this file sends to ClearClaw servers: NOTHING
// What this file never sends: all events are written only to the local
//   filesystem at ~/.clearclaw/events.jsonl
// ---------------------------------------------------------------------------
