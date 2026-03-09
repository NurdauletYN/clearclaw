"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 60_000; // give up after 60s and show a manual refresh button

export const PaymentConfirm = (): JSX.Element => {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const start = Date.now();

    const poll = async (): Promise<void> => {
      try {
        // Try status first (fast, no external call); fall back to full sync
        // which queries Lemon Squeezy directly in case the webhook didn't fire.
        const statusRes = await fetch("/api/billing/status");
        const status = (await statusRes.json()) as { subscribed: boolean };
        if (status.subscribed) {
          setConfirmed(true);
          setTimeout(() => { router.replace("/dashboard"); router.refresh(); }, 1500);
          return;
        }

        // After 6s of no webhook, proactively sync from LS API
        if (Date.now() - start > 6_000) {
          const syncRes = await fetch("/api/billing/sync", { method: "POST" });
          const sync = (await syncRes.json()) as { subscribed: boolean };
          if (sync.subscribed) {
            setConfirmed(true);
            setTimeout(() => { router.replace("/dashboard"); router.refresh(); }, 1500);
            return;
          }
        }
      } catch {
        // ignore transient errors
      }
      setElapsed(Date.now() - start);
    };

    void poll(); // immediate first check
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold">Payment confirmed!</h2>
        <p className="text-sm text-slate-400">Taking you to your dashboard…</p>
      </div>
    );
  }

  if (elapsed > MAX_WAIT_MS) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-slate-400">
          Payment received — it's taking a moment to activate.
        </p>
        <button
          onClick={() => { router.replace("/dashboard"); router.refresh(); }}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
        >
          Go to dashboard
        </button>
        <p className="text-xs text-slate-600">
          If the dashboard is still locked, wait 30 seconds and refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      <h2 className="text-lg font-semibold">Activating your subscription…</h2>
      <p className="text-sm text-slate-400">
        Payment confirmed. Waiting for activation — this takes a few seconds.
      </p>
    </div>
  );
};
