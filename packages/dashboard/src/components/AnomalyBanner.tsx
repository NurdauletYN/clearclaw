"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { DashboardEventSchema, type DashboardEvent } from "../types";

type AlertState = {
  severity: "info" | "warning" | "critical";
  message: string;
};

const buildAlertState = (events: DashboardEvent[]): AlertState => {
  const critical = events.filter((e) => e.anomalyScore >= 0.85);
  const warning = events.filter((e) => e.anomalyScore >= 0.5 && e.anomalyScore < 0.85);

  if (critical.length > 0) {
    const latest = critical[0];
    return {
      severity: "critical",
      message: `${critical.length} critical anomaly${critical.length > 1 ? "s" : ""} in the last 5 minutes. Latest: ${latest.anomalyReason ?? latest.plainEnglish}`
    };
  }

  if (warning.length > 0) {
    return {
      severity: "warning",
      message: `${warning.length} suspicious event${warning.length > 1 ? "s" : ""} in the last 5 minutes. Review the feed below.`
    };
  }

  return {
    severity: "info",
    message: "No critical anomalies detected in the last 5 minutes."
  };
};

const alertClass: Record<AlertState["severity"], string> = {
  info: "border-blue-700 bg-blue-950/30 text-blue-200",
  warning: "border-amber-700 bg-amber-950/30 text-amber-200",
  critical: "border-red-700 bg-red-950/30 text-red-200"
};

export const AnomalyBanner = (): JSX.Element => {
  const [alert, setAlert] = useState<AlertState>({
    severity: "info",
    message: "No critical anomalies detected in the last 5 minutes."
  });

  useEffect(() => {
    const checkAnomalies = async (): Promise<void> => {
      try {
        const supabase = getSupabaseBrowserClient();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .gte("timestamp", fiveMinutesAgo)
          .gte("anomalyScore", 0.5)
          .order("anomalyScore", { ascending: false })
          .limit(20);

        if (error) {
          return;
        }

        const parsed: DashboardEvent[] = [];
        for (const row of data ?? []) {
          const result = DashboardEventSchema.safeParse(row);
          if (result.success) {
            parsed.push(result.data);
          }
        }

        setAlert(buildAlertState(parsed));
      } catch {
        // silently fail
      }
    };

    void checkAnomalies();
    const interval = setInterval(() => void checkAnomalies(), 30_000);
    return () => clearInterval(interval);
  }, []);

  return <div className={`rounded border p-3 text-sm ${alertClass[alert.severity]}`}>{alert.message}</div>;
};
