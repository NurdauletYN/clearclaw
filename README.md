# ClearClaw

**See what your AI agents are actually doing — real-time monitor for Claude Code and OpenClaw.**

![Dashboard screenshot](docs/screenshot.png)

> ClearClaw is a lightweight daemon that runs on your machine, intercepts every file read, command execution, and network request made by your AI agents, translates each action into plain English, scores it for anomalies, and streams the result to a live web dashboard.

---

## Install

```bash
npx clearclaw@latest install
```

Or for fully offline / local-only mode (no cloud):

```bash
npx clearclaw@latest install --local-only
```

---

## What it monitors

| Agent | Method | Events captured |
|---|---|---|
| **Claude Code** | Hook injection via `~/.claude/settings.json` | File reads & writes, command execution, network requests, session start/end |
| **OpenClaw** | Log file tail (`~/.openclaw/events.log` or `/tmp/openclaw/`) | All events at WARN level and above |

---

## What data is sent to the cloud

When running in **cloud mode** (the default), the daemon sends the following
fields to your Supabase instance for each event:

| Field | Example | Notes |
|---|---|---|
| `source` | `"claude_code"` | Which agent fired the event |
| `type` | `"file_read"` | Event type enum |
| `sessionId` | `"abc123"` | Opaque session ID from the agent |
| `timestamp` | `"2026-01-01T12:00:00Z"` | ISO-8601 |
| `payload.path` | `"/home/user/app/index.ts"` | File path (not file contents) |
| `payload.command` | `"npm install"` | Command name (not output) |
| `payload.host` | `"api.openai.com"` | Hostname (not request body) |
| `plainEnglish` | `"claude_code read file /home/user/app/index.ts."` | Human translation |
| `anomalyScore` | `0.05` | Float 0–1 |
| `anomalyReason` | `null` | Short string or null |

**The daemon NEVER sends:**

- File contents
- Command stdout / stderr / output
- API keys, tokens, passwords, or secrets
- Environment variable values
- Any payload field named `content`, `output`, `stdout`, `stderr`, `data`,
  `body`, `text`, `result`, `response`, `secret`, `password`, `token`,
  `key`, or `credential` (these are stripped by `sanitizePayload` in
  `packages/daemon/src/supabase.ts` before any insert)

See [SECURITY.md](SECURITY.md) for the full data inventory and verification instructions.

---

## Local-only mode

No data leaves your machine. Events are written to `~/.clearclaw/events.jsonl`
and printed to the terminal.

**Activate at install time:**

```bash
npx clearclaw@latest install --local-only
```

**Activate at any time:**

```bash
echo '{"localOnly": true}' > ~/.clearclaw/config.json
```

**Or via environment variable:**

```bash
LOCAL_ONLY=true node packages/daemon/dist/index.js
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Daemon | Node.js, TypeScript, Unix sockets |
| Schema validation | Zod |
| Database & real-time | Supabase (PostgreSQL + WebSockets) |
| Dashboard | Next.js 14 App Router, Tailwind CSS |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Payments | Lemon Squeezy |
| Package manager | pnpm workspaces |
| Tests | Vitest |
| CI | GitHub Actions |

---

## Quick start (development)

```bash
# 1. Clone
git clone https://github.com/yourusername/clearclaw
cd clearclaw

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
cp packages/dashboard/.env.local.example packages/dashboard/.env.local
# Edit both files with your Supabase and Lemon Squeezy credentials

# 4. Run database migrations (in Supabase SQL editor)
# supabase/migrations/001_create_events.sql
# supabase/migrations/002_create_subscriptions.sql
# supabase/migrations/003_create_settings.sql

# 5. Build the daemon
pnpm build

# 6. Start the dashboard
pnpm dev

# 7. Start the daemon
node packages/daemon/dist/index.js
```

---

## Running tests

```bash
pnpm test:daemon
```

---

## Links

- Homepage: [clearclaw.dev](https://clearclaw.dev)
- Security policy: [SECURITY.md](SECURITY.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- License: [Business Source License 1.1](LICENSE) → MIT after 4 years

---

## License

[Business Source License 1.1](LICENSE) — free for personal non-commercial use,
converts to MIT after 4 years. Commercial use requires a license from
[clearclaw.dev](https://clearclaw.dev).
