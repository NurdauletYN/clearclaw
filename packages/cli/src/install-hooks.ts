import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { InstallDetection } from "./types.js";

const ClaudeSettingsSchema = z.object({
  hooks: z.array(z.string()).default([])
});

type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;

export const installClaudeHooks = async (detection: InstallDetection): Promise<void> => {
  try {
    const dir = path.dirname(detection.claudeSettingsPath);
    await fs.mkdir(dir, { recursive: true });

    let currentSettings: ClaudeSettings = { hooks: [] };
    try {
      const raw = await fs.readFile(detection.claudeSettingsPath, "utf-8");
      currentSettings = ClaudeSettingsSchema.parse(JSON.parse(raw) as unknown);
    } catch {
      currentSettings = { hooks: [] };
    }

    const hookCommand = "bash ~/.agentaudit/hook.sh";
    const nextHooks = currentSettings.hooks.includes(hookCommand)
      ? currentSettings.hooks
      : [...currentSettings.hooks, hookCommand];

    const nextSettings: ClaudeSettings = { hooks: nextHooks };
    await fs.writeFile(detection.claudeSettingsPath, `${JSON.stringify(nextSettings, null, 2)}\n`, "utf-8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown hook install error";
    throw new Error(`Failed to install Claude Code hooks: ${message}`);
  }
};
