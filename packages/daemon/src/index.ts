import { loadDaemonEnv } from "./env.js";
import { startHeartbeat } from "./heartbeat.js";
import { isLocalOnlyMode } from "./local-only.js";
import { startOpenClawWatcher } from "./openclaw.js";
import { startPausePoller } from "./pause.js";
import { startSocketServer } from "./socket.js";

const bootDaemon = async (): Promise<void> => {
  try {
    // Allow --local-only CLI flag to activate local-only mode before env loads
    if (process.argv.includes("--local-only")) {
      process.env.LOCAL_ONLY = "true";
    }

    loadDaemonEnv();

    if (isLocalOnlyMode()) {
      console.log(
        "[agentaudit:daemon] local-only mode — events written to ~/.agentaudit/events.jsonl, no cloud connection"
      );
    }

    const server = await startSocketServer();
    await startOpenClawWatcher();
    const heartbeatTimer = startHeartbeat();
    const pauseTimer = startPausePoller();
    console.log("[agentaudit:daemon] running and listening for agent events");

    const shutdown = (): void => {
      try {
        clearInterval(heartbeatTimer);
        clearInterval(pauseTimer);
        server.close();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown daemon startup error";
    console.error(`[agentaudit:daemon] startup failed: ${message}`);
    process.exit(1);
  }
};

void bootDaemon();

// ---------------------------------------------------------------------------
// What this file sends to AgentAudit servers: NOTHING directly — orchestrates
//   other modules; see supabase.ts for the full data inventory
//
// What this file never sends: startup errors, process arguments, or env config
// ---------------------------------------------------------------------------
