import { queryPaused } from "./supabase.js";

const POLL_INTERVAL_MS = 5_000;

let paused = false;

export const isDaemonPaused = (): boolean => paused;

export const startPausePoller = (): NodeJS.Timeout => {
  const poll = async (): Promise<void> => {
    const result = await queryPaused();
    if (result !== paused) {
      paused = result;
      console.log(`[clearclaw:daemon] ${paused ? "paused — events will be dropped" : "resumed — processing events"}`);
    }
  };

  void poll();
  return setInterval(() => void poll(), POLL_INTERVAL_MS);
};

// ---------------------------------------------------------------------------
// What this file sends to ClearClaw servers: NOTHING — only reads a single
//   boolean value ("daemon_paused") from the Supabase settings table
//
// What this file never sends:
//   - No event data, file paths, commands, or user information
//   - In local-only mode (queryPaused returns false immediately), no network
//     calls are made at all
// ---------------------------------------------------------------------------
