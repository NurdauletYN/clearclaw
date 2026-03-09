"use client";

import { useEffect, useState } from "react";

type State = "loading" | "paused" | "running" | "error";

export const PauseButton = (): JSX.Element => {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    fetch("/api/settings/pause")
      .then((r) => r.json())
      .then((data: { paused?: boolean }) => setState(data.paused ? "paused" : "running"))
      .catch(() => setState("error"));
  }, []);

  const toggle = async (): Promise<void> => {
    const next = state !== "paused";
    setState(next ? "paused" : "running");

    try {
      const res = await fetch("/api/settings/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next })
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = (await res.json()) as { paused: boolean };
      setState(data.paused ? "paused" : "running");
    } catch {
      // Revert optimistic update
      setState(next ? "running" : "paused");
    }
  };

  if (state === "loading") {
    return (
      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-800" />
    );
  }

  if (state === "error") {
    return (
      <button
        disabled
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-500"
      >
        Pause unavailable
      </button>
    );
  }

  return (
    <button
      onClick={() => void toggle()}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        state === "paused"
          ? "bg-emerald-700 hover:bg-emerald-600 text-white"
          : "bg-red-700 hover:bg-red-600 text-white"
      }`}
      type="button"
    >
      {state === "paused" ? "Resume Agent Activity" : "Pause All Agent Actions"}
    </button>
  );
};
