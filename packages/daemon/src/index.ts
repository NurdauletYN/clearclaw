import { loadDaemonEnv } from "./env.js";
import { startOpenClawWatcher } from "./openclaw.js";
import { startSocketServer } from "./socket.js";

const bootDaemon = async (): Promise<void> => {
  try {
    loadDaemonEnv();
    const server = await startSocketServer();
    await startOpenClawWatcher();
    console.log("[agentaudit:daemon] running and listening for agent events");

    const shutdown = (): void => {
      try {
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
