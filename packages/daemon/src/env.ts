import fs from "node:fs";
import path from "node:path";

const parseEnvLine = (line: string): { key: string; value: string } | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  const unquotedValue =
    (rawValue.startsWith("\"") && rawValue.endsWith("\"")) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ? rawValue.slice(1, -1)
      : rawValue;

  if (!key) {
    return null;
  }

  return { key, value: unquotedValue };
};

const loadFromFile = (filePath: string): void => {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }

      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown env load error";
    console.error(`[agentaudit:daemon] failed to load env file ${filePath}: ${message}`);
  }
};

export const loadDaemonEnv = (): void => {
  const cwdEnvPath = path.join(process.cwd(), ".env");
  const rootEnvPath = path.resolve(process.cwd(), "..", "..", ".env");

  loadFromFile(cwdEnvPath);
  loadFromFile(rootEnvPath);
};
