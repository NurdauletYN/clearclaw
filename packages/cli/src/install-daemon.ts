import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { InstallDetection } from "./types.js";

const daemonInstallRoot = path.join(os.homedir(), ".agentaudit");

const buildLaunchAgentPlist = (projectRoot: string): string => {
  const daemonScript = path.join(projectRoot, "packages", "daemon", "dist", "index.js");
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
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
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

[Install]
WantedBy=default.target
`;
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
      return;
    }

    const systemdDir = path.join(os.homedir(), ".config", "systemd", "user");
    await fs.mkdir(systemdDir, { recursive: true });
    const servicePath = path.join(systemdDir, "agentaudit-daemon.service");
    await fs.writeFile(servicePath, buildSystemdUnit(projectRoot), "utf-8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown daemon install error";
    throw new Error(`Failed to install daemon service: ${message}`);
  }
};
