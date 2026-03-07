import { anomalyLevel, formatTimestamp } from "../lib/utils";
import type { DashboardEvent } from "../types";

type EventRowProps = {
  event: DashboardEvent;
};

const severityClass: Record<"low" | "medium" | "high", string> = {
  low: "border-slate-800",
  medium: "border-amber-700",
  high: "border-red-700"
};

export const EventRow = ({ event }: EventRowProps): JSX.Element => {
  const level = anomalyLevel(event.anomalyScore);

  return (
    <div className={`rounded border p-3 ${severityClass[level]}`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase text-slate-400">
          {event.source} - {event.type}
        </span>
        <span className="text-xs text-slate-400">{formatTimestamp(event.timestamp)}</span>
      </div>
      <p className="text-sm">{event.plainEnglish}</p>
      {event.anomalyReason ? <p className="mt-1 text-xs text-red-300">{event.anomalyReason}</p> : null}
    </div>
  );
};
