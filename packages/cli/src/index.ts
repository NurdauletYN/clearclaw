#!/usr/bin/env node
import { detectEnvironment } from "./detect.js";
import { installDaemonService } from "./install-daemon.js";
import { installClaudeHooks } from "./install-hooks.js";

const runInstall = async (): Promise<void> => {
  try {
    const detection = detectEnvironment();
    await installClaudeHooks(detection);
    await installDaemonService(detection);
    console.log("AgentAudit install complete.");
    console.log(`Detected platform: ${detection.platform}`);
    console.log(`Claude settings: ${detection.claudeSettingsPath}`);
    console.log(`OpenClaw logs: ${detection.openClawLogPath}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown CLI install error";
    console.error(`Install failed: ${message}`);
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  try {
    const command = process.argv[2] ?? "install";
    if (command !== "install") {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
    await runInstall();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown CLI runtime error";
    console.error(`CLI failed: ${message}`);
    process.exit(1);
  }
};

void main();
