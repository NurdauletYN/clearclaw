#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { detectEnvironment } from "./detect.js";
import { installDaemonService } from "./install-daemon.js";
import { installClaudeHooks } from "./install-hooks.js";

const CONFIG_DIR = path.join(os.homedir(), ".agentaudit");

const writeLocalOnlyConfig = async (): Promise<void> => {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const configPath = path.join(CONFIG_DIR, "config.json");
  const config = { localOnly: true };
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  console.log(`[agentaudit] Local-only mode enabled — wrote ${configPath}`);
  console.log("[agentaudit] Events will be stored at ~/.agentaudit/events.jsonl");
  console.log("[agentaudit] No data will be sent to the cloud.");
};

const runInstall = async (localOnly: boolean): Promise<void> => {
  try {
    const detection = detectEnvironment();
    await installClaudeHooks(detection);
    await installDaemonService(detection);

    if (localOnly) {
      await writeLocalOnlyConfig();
    }

    console.log("AgentAudit install complete.");
    console.log(`Detected platform: ${detection.platform}`);
    console.log(`Claude settings: ${detection.claudeSettingsPath}`);
    console.log(`OpenClaw logs: ${detection.openClawLogPath}`);

    if (!localOnly) {
      console.log("Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in ~/.agentaudit/.env");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown CLI install error";
    console.error(`Install failed: ${message}`);
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  try {
    const args = process.argv.slice(2);
    const command = args[0] ?? "install";
    const localOnly = args.includes("--local-only");

    if (command !== "install") {
      console.error(`Unknown command: ${command}`);
      console.error("Usage: npx agentaudit@latest install [--local-only]");
      process.exit(1);
    }

    await runInstall(localOnly);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown CLI runtime error";
    console.error(`CLI failed: ${message}`);
    process.exit(1);
  }
};

void main();
