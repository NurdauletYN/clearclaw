# Contributing to ClearClaw

Thanks for your interest in contributing. The most impactful areas are:

1. **Anomaly detection rules** — adding new patterns that flag dangerous agent behaviour
2. **Tool translations** — improving the plain-English output for known tools
3. **Bug fixes and test coverage**

---

## Development Setup

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9

git clone https://github.com/yourusername/clearclaw
cd clearclaw
pnpm install

# Run the unit test suite
pnpm test:daemon

# Type-check everything
pnpm typecheck

# Build all packages
pnpm build
```

---

## How to Add a New Anomaly Detection Rule

Anomaly rules live in `packages/daemon/src/anomaly.ts`.

### Step 1 — Add the pattern

```typescript
// packages/daemon/src/anomaly.ts

const SUSPICIOUS_COMMANDS = [
  "rm -rf",
  "curl | sh",
  "sudo ",
  "your new pattern here",   // ← add here
];
```

For path-based rules:

```typescript
const SENSITIVE_PATH_MARKERS = [
  ".ssh",
  ".gnupg",
  ".env",
  "your/sensitive/path",   // ← add here
];
```

### Step 2 — Add a test

```typescript
// packages/daemon/src/__tests__/anomaly.test.ts

it("flags your new pattern", () => {
  const event: RawHookEvent = {
    source: "claude_code" as const,
    type: "command_exec" as const,
    sessionId: "s1",
    timestamp: new Date().toISOString(),
    payload: { command: "your new pattern here" },
  };
  const result = scoreAnomaly(event);
  expect(result.score).toBeGreaterThan(0.5);
  expect(result.reason).toContain("your new pattern");
});
```

### Step 3 — Verify tests pass

```bash
pnpm test:daemon
```

### Good anomaly rule candidates

- Exfiltration: `base64 | curl`, `wget | sh`, `nc -e`
- Credential access: reads from `~/.aws/credentials`, `~/.config/gh/`, keychain
- Persistence: writes to `cron`, `launchd`, `~/.bashrc`, `~/.zshrc`
- Obfuscation: `eval "$(`, `python -c "import base64`
- Crypto mining indicators: `xmrig`, `minerd`

---

## How to Add a New Tool Translation

Translations live in `packages/daemon/src/translator.ts`.

The `translateEvent` function receives a `RawHookEvent` and returns a plain
English string. Add a new `case` to the switch:

```typescript
// packages/daemon/src/translator.ts

case "your_new_event_type":
  return `${event.source} did something: ${readPayloadValue(event.payload.detail)}.`;
```

For a new `source` (e.g. a new AI agent):

```typescript
case "tool_call":
  if (event.source === "your_new_agent") {
    return `your_new_agent used tool ${toolName}.`;
  }
  // ...fall through to existing logic
```

Then add the new event type to `HookEventTypeSchema` in
`packages/daemon/src/types.ts`:

```typescript
export const HookEventTypeSchema = z.enum([
  // ... existing types
  "your_new_event_type",
]);
```

Add a translation test:

```typescript
// packages/daemon/src/__tests__/translator.test.ts

it("translates your_new_event_type", () => {
  const event = {
    ...baseEvent,
    type: "your_new_event_type" as const,
    payload: { detail: "example" },
  };
  expect(translateEvent(event)).toContain("example");
});
```

---

## Running Tests Locally

```bash
# Run all daemon unit tests once
pnpm test:daemon

# Run in watch mode during development
cd packages/daemon
pnpm vitest

# Run a specific test file
cd packages/daemon
pnpm vitest src/__tests__/anomaly.test.ts
```

All tests use **Vitest** with Node environment. Tests are in
`packages/daemon/src/__tests__/`.

---

## Pull Request Guidelines

1. **One concern per PR.** A new anomaly rule, a translation fix, or a bug
   fix — not all three at once.

2. **Tests are required.** Every new anomaly rule needs a test in
   `anomaly.test.ts`. Every new translation needs a test in
   `translator.test.ts`. PRs without tests will not be merged.

3. **No `any` types.** TypeScript strict mode is enforced. Use Zod schemas
   for runtime validation of external data.

4. **No new production dependencies** without discussion. The daemon is
   intentionally minimal (only `zod` and `@supabase/supabase-js`).

5. **Security-sensitive changes** (supabase.ts, socket.ts, env.ts) require
   an explanation of why the change does not expand the data sent to the
   cloud. Update the comment blocks at the bottom of each file.

6. **Commit messages:** Use the imperative mood.
   Good: `add anomaly rule for xmrig process`
   Bad: `added rule`, `fixes stuff`

7. **Run before submitting:**
   ```bash
   pnpm typecheck
   pnpm test:daemon
   ```

---

## Project Structure

```
clearclaw/
├── packages/
│   ├── daemon/          # Node.js daemon (this is the open-source core)
│   │   └── src/
│   │       ├── anomaly.ts      ← anomaly detection rules
│   │       ├── translator.ts   ← plain-English translations
│   │       ├── types.ts        ← Zod schemas
│   │       ├── supabase.ts     ← cloud streaming (sanitization here)
│   │       ├── local-only.ts   ← local-only mode
│   │       ├── socket.ts       ← Unix socket server
│   │       ├── openclaw.ts     ← OpenClaw log watcher
│   │       ├── heartbeat.ts    ← keep-alive pings
│   │       ├── pause.ts        ← remote pause control
│   │       ├── env.ts          ← environment loader
│   │       └── index.ts        ← entry point
│   ├── cli/             # npm installer
│   └── dashboard/       # Next.js dashboard (not open-source)
└── supabase/migrations/ # SQL migrations
```

---

## Code of Conduct

Be constructive. Criticism of code is welcome; criticism of people is not.
