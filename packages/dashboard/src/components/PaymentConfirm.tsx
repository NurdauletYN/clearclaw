"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Stage =
  | "claim"        // waiting for user to click "Claim my access"
  | "claiming"     // POST /api/billing/claim in progress
  | "pending"      // claim submitted, polling for admin activation
  | "confirmed"    // subscription is now active, redirecting
  | "error";

const POLL_INTERVAL_MS = 4_000;

export const PaymentConfirm = (): JSX.Element => {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("claim");
  const [errorMsg, setErrorMsg] = useState("");

  // Poll /api/billing/status while in "pending" state
  useEffect(() => {
    if (stage !== "pending") return;

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch("/api/billing/status");
        const data = (await res.json()) as { subscribed: boolean };
        if (data.subscribed) {
          setStage("confirmed");
          setTimeout(() => {
            router.replace("/dashboard");
            router.refresh();
          }, 1500);
        }
      } catch {
        // ignore transient errors — keep polling
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [stage, router]);

  const handleClaim = async (): Promise<void> => {
    setStage("claiming");
    try {
      const res = await fetch("/api/billing/claim", { method: "POST" });
      const data = (await res.json()) as {
        subscribed?: boolean;
        status?: string;
        claimed?: boolean;
        error?: string;
      };

      if (data.subscribed) {
        // Already active — go straight to dashboard
        setStage("confirmed");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1000);
        return;
      }

      if (data.status === "pending" || data.claimed) {
        setStage("pending");
        return;
      }

      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      setStage("error");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStage("error");
    }
  };

  if (stage === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold">Access activated!</h2>
        <p className="text-sm text-slate-400">Taking you to your dashboard…</p>
      </div>
    );
  }

  if (stage === "pending") {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
        <h2 className="text-lg font-semibold">Verifying your payment…</h2>
        <p className="max-w-sm text-sm text-slate-400">
          Your claim has been received. We&apos;re confirming your PayPal
          payment — this usually takes a few minutes.
        </p>
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900 px-5 py-4 text-left text-sm text-slate-400">
          <p className="font-medium text-slate-300">While you wait</p>
          <ul className="mt-2 space-y-1">
            <li>· Your access will be active as soon as we verify the payment</li>
            <li>· You'll be redirected automatically — no need to refresh</li>
            <li>
              · Questions?{" "}
              <a
                href="mailto:support@clearclaw.dev"
                className="text-brand-400 underline hover:text-brand-300"
              >
                support@clearclaw.dev
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <button
          onClick={() => setStage("claim")}
          className="rounded-lg border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Try again
        </button>
        <p className="text-xs text-slate-600">
          Or email{" "}
          <a href="mailto:support@clearclaw.dev" className="text-brand-400 underline">
            support@clearclaw.dev
          </a>{" "}
          with your PayPal transaction ID.
        </p>
      </div>
    );
  }

  // stage === "claim" | "claiming"
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-2xl">
        🎉
      </div>
      <h2 className="text-xl font-semibold">Payment received — thank you!</h2>
      <p className="max-w-sm text-sm text-slate-400">
        Click below to claim your lifetime access. We&apos;ll verify your PayPal
        payment and activate your account within minutes.
      </p>
      <button
        onClick={() => void handleClaim()}
        disabled={stage === "claiming"}
        className="mt-2 flex items-center gap-2 rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {stage === "claiming" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Submitting…
          </>
        ) : (
          "Claim my lifetime access"
        )}
      </button>
      <p className="text-xs text-slate-600">
        Having trouble?{" "}
        <a href="mailto:support@clearclaw.dev" className="text-brand-400 underline hover:text-brand-300">
          Contact support
        </a>
      </p>
    </div>
  );
};
