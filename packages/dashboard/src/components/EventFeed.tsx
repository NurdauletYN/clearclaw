"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { DashboardEventSchema, type DashboardEvent } from "../types";
import { EventRow } from "./EventRow";

type TimeFilter = "1h" | "24h" | "7d" | "all";

const TIME_FILTER_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: "Last 1h", value: "1h" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "All time", value: "all" }
];

const getCutoff = (filter: TimeFilter): string | null => {
  const now = Date.now();
  if (filter === "1h") return new Date(now - 60 * 60 * 1000).toISOString();
  if (filter === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (filter === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  return null;
};

const isHeartbeat = (event: DashboardEvent): boolean => event.type === "heartbeat";

export const EventFeed = (): JSX.Element => {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TimeFilter>("24h");

  useEffect(() => {
    let isMounted = true;
    setEvents([]);
    setError(null);

    const loadInitialEvents = async (): Promise<void> => {
      try {
        const supabase = getSupabaseBrowserClient();
        const cutoff = getCutoff(filter);

        let query = supabase
          .from("events")
          .select("*")
          .neq("type", "heartbeat")
          .order("timestamp", { ascending: false })
          .limit(100);

        if (cutoff) {
          query = query.gte("timestamp", cutoff);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw new Error(queryError.message);
        }

        const parsed: DashboardEvent[] = [];
        for (const row of data ?? []) {
          const result = DashboardEventSchema.safeParse(row);
          if (result.success) {
            parsed.push(result.data);
          }
        }

        if (isMounted) {
          setEvents(parsed);
        }
      } catch (loadError: unknown) {
        if (isMounted) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load events";
          setError(message);
        }
      }
    };

    void loadInitialEvents();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`events:live:${filter}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload: { new: unknown }) => {
          const parsed = DashboardEventSchema.safeParse(payload.new);
          if (!parsed.success || isHeartbeat(parsed.data)) {
            return;
          }
          const cutoff = getCutoff(filter);
          if (cutoff && parsed.data.timestamp < cutoff) {
            return;
          }
          setEvents((prev) => [parsed.data, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [filter]);

  if (error) {
    return <div className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {TIME_FILTER_OPTIONS.map((opt) => (
          <button
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <EventRow event={event} key={event.id} />
        ))}
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No events in the selected time range.</p>
        ) : null}
      </div>
    </div>
  );
};
