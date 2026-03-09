import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { InstallDetection } from "./types.js";

const execFileAsync = promisify(execFile);

const daemonInstallRoot = path.join(os.homedir(), ".agentaudit");

const buildLaunchAgentPlist = (projectRoot: string): string => {
  const daemonScript = path.join(projectRoot, "packages", "daemon", "dist", "index.js");
  const envFile = path.join(projectRoot, ".env");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.agentaudit.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>node</string>
    <string>${daemonScript}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AGENTAUDIT_ENV_PATH</key>
    <string>${envFile}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/agentaudit-daemon.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/agentaudit-daemon.log</string>
</dict>
</plist>
`;
};

const buildSystemdUnit = (projectRoot: string): string => {
  const daemonScript = path.join(projectRoot, "packages", "daemon", "dist", "index.js");
  return `[Unit]
Description=AgentAudit daemon
After=network.target

[Service]
ExecStart=node ${daemonScript}
Restart=always
RestartSec=2
Environment=NODE_ENV=production
EnvironmentFile=${path.join(projectRoot, ".env")}

[Install]
WantedBy=default.target
`;
};

const loadLaunchAgent = async (plistPath: string): Promise<void> => {
  try {
    await execFileAsync("launchctl", ["unload", plistPath]).catch(() => undefined);
    await execFileAsync("launchctl", ["load", "-w", plistPath]);
    console.log("[agentaudit:cli] LaunchAgent loaded successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown launchctl error";
    console.warn(`[agentaudit:cli] failed to load LaunchAgent (run manually): launchctl load -w ${plistPath}\n  ${message}`);
  }
};

const enableSystemdUnit = async (): Promise<void> => {
  try {
    await execFileAsync("systemctl", ["--user", "daemon-reload"]);
    await execFileAsync("systemctl", ["--user", "enable", "--now", "agentaudit-daemon.service"]);
    console.log("[agentaudit:cli] systemd user service enabled and started");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown systemctl error";
    console.warn(`[agentaudit:cli] failed to enable systemd service (run manually): systemctl --user enable --now agentaudit-daemon.service\n  ${message}`);
  }
};

export const installDaemonService = async (detection: InstallDetection): Promise<void> => {
  try {
    const projectRoot = process.cwd();
    await fs.mkdir(daemonInstallRoot, { recursive: true });

    const sourceHookPath = path.join(projectRoot, "packages", "daemon", "hook.sh");
    const targetHookPath = path.join(daemonInstallRoot, "hook.sh");
    await fs.copyFile(sourceHookPath, targetHookPath);
    await fs.chmod(targetHookPath, 0o755);

    if (detection.platform === "darwin") {
      const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
      await fs.mkdir(launchAgentsDir, { recursive: true });
      const plistPath = path.join(launchAgentsDir, "com.agentaudit.daemon.plist");
      await fs.writeFile(plistPath, buildLaunchAgentPlist(projectRoot), "utf-8");
      await loadLaunchAgent(plistPath);
      return;
    }

    const systemdDir = path.join(os.homedir(), ".config", "systemd", "user");
    await fs.mkdir(systemdDir, { recursive: true });
    const servicePath = path.join(systemdDir, "agentaudit-daemon.service");
    await fs.writeFile(servicePath, buildSystemdUnit(projectRoot), "utf-8");
    await enableSystemdUnit();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown daemon install error";
    throw new Error(`Failed to install daemon service: ${message}`);
  }
};
