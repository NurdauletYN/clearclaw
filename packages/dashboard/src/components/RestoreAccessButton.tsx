"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type State = "idle" | "loading" | "not_found";

export const RestoreAccessButton = (): JSX.Element => {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  const sync = async (): Promise<void> => {
    setState("loading");
    try {
      const res = await fetch("/api/billing/sync", { method: "POST" });
      const data = (await res.json()) as { subscribed: boolean };
      if (data.subscribed) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setState("not_found");
      }
    } catch {
      setState("not_found");
    }
  };

  if (state === "not_found") {
    return (
      <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
        <p>
          No completed payment found for this account. If you paid with a different email, contact{" "}
          <a href="mailto:support@agentaudit.dev" className="text-brand-400 underline">
            support@agentaudit.dev
          </a>
          .
        </p>
        <button
          onClick={() => setState("idle")}
          className="text-xs text-slate-500 underline hover:text-slate-300"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => void sync()}
      disabled={state === "loading"}
      className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
    >
      {state === "loading" ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-600 border-t-slate-300" />
          Checking Lemon Squeezy…
        </>
      ) : (
        "Already paid? Restore access"
      )}
    </button>
  );
};
