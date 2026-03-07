"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { DashboardEventSchema, type DashboardEvent } from "../types";
import { EventRow } from "./EventRow";

export const EventFeed = (): JSX.Element => {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInitialEvents = async (): Promise<void> => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: queryError } = await supabase
          .from("events")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(50);

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
      .channel("events:live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload: { new: unknown }) => {
          const parsed = DashboardEventSchema.safeParse(payload.new);
          if (!parsed.success) {
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
  }, []);

  if (error) {
    return <div className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <EventRow event={event} key={event.id} />
      ))}
      {events.length === 0 ? <p className="text-sm text-slate-400">No events yet.</p> : null}
    </div>
  );
};
