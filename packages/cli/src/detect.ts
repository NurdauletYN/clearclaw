import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { InstallDetection, SupportedPlatform } from "./types.js";

const PlatformSchema = z.union([z.literal("darwin"), z.literal("linux")]);

export const detectEnvironment = (): InstallDetection => {
  const platformResult = PlatformSchema.safeParse(os.platform());
  if (!platformResult.success) {
    throw new Error("ClearClaw currently supports only macOS and Linux.");
  }

  const platform = platformResult.data as SupportedPlatform;
  const home = os.homedir();

  return {
    platform,
    claudeSettingsPath: path.join(home, ".claude", "settings.json"),
    openClawLogPath: path.join(home, ".openclaw", "events.log"),
    daemonSocketPath: "/tmp/clearclaw.sock"
  };
};
