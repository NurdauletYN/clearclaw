# AgentAudit

AgentAudit monitors local AI agent activity (Claude Code and OpenClaw), translates actions into plain English, flags anomalies, and streams events to a web dashboard.

## Monorepo Packages

- `packages/daemon`: Local daemon receiving hook/log events and sending to Supabase
- `packages/cli`: Installer CLI (`npx agentaudit install`)
- `packages/dashboard`: Next.js 14 App Router dashboard for live monitoring

## Quick Start

1. Install dependencies:
   - `pnpm install`
2. Copy env templates:
   - `cp .env.example .env`
   - `cp packages/dashboard/.env.local.example packages/dashboard/.env.local`
3. Start dashboard:
   - `pnpm dev`

## Stack

- TypeScript everywhere
- pnpm workspaces
- Supabase (database/auth/realtime)
- Next.js 14 App Router + Tailwind CSS
- Lemon Squeezy for payments
- Zod schema validation
