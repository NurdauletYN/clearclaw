export type SupportedPlatform = "darwin" | "linux";

export type InstallDetection = {
  platform: SupportedPlatform;
  claudeSettingsPath: string;
  openClawLogPath: string;
  daemonSocketPath: string;
};
