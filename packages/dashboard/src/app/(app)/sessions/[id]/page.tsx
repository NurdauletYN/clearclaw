import { EventRow } from "../../../../components/EventRow";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";
import { DashboardEventSchema, type DashboardEvent } from "../../../../types";

type SessionReplayPageProps = {
  params: {
    id: string;
  };
};

const loadSessionEvents = async (sessionId: string): Promise<DashboardEvent[]> => {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("sessionId", sessionId)
      .order("timestamp", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const events: DashboardEvent[] = [];
    for (const row of data ?? []) {
      const parsed = DashboardEventSchema.safeParse(row);
      if (parsed.success) {
        events.push(parsed.data);
      }
    }

    return events;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown session replay load error";
    console.error(`[dashboard] failed to load session events: ${message}`);
    return [];
  }
};

export default async function SessionReplayPage({ params }: SessionReplayPageProps): Promise<JSX.Element> {
  const events = await loadSessionEvents(params.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session Replay</h1>
        <span className="rounded border border-slate-700 px-3 py-1 font-mono text-xs text-slate-400">
          {params.id}
        </span>
      </div>
      <p className="text-sm text-slate-400">{events.length} events in this session</p>
      {events.length === 0 ? (
        <p className="text-slate-400">No events found for this session.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventRow event={event} key={event.id} />
          ))}
        </div>
      )}
    </div>
  );
}
