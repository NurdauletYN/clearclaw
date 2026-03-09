"use client";

import { useEffect, useState } from "react";

export const StatusIndicator = (): JSX.Element => {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async (): Promise<void> => {
      try {
        const res = await fetch("/api/heartbeat");
        const data = (await res.json()) as { online: boolean };
        setOnline(data.online === true);
      } catch {
        setOnline(false);
      }
    };

    void check();
    const interval = setInterval(() => void check(), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (online === null) {
    return (
      <div className="flex items-center gap-2 rounded border border-slate-700 px-3 py-1">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-500 animate-pulse" />
        <span className="text-sm text-slate-400">Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded border border-slate-800 px-3 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="text-sm">{online ? "Daemon online" : "Daemon offline"}</span>
    </div>
  );
};
