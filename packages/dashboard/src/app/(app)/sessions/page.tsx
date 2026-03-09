import Link from "next/link";
import { SessionCard } from "../../../components/SessionCard";
import { getSupabaseServerClient } from "../../../lib/supabase-server";
import type { Session } from "../../../types";

const loadSessions = async (): Promise<Session[]> => {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("sessionId, source, timestamp")
      .order("timestamp", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const sessionMap = new Map<
      string,
      { agent: "claude_code" | "openclaw"; startedAt: string; endedAt: string | null; count: number }
    >();

    for (const row of data ?? []) {
      const existing = sessionMap.get(row.sessionId);
      if (!existing) {
        sessionMap.set(row.sessionId, {
          agent: row.source,
          startedAt: row.timestamp,
          endedAt: row.timestamp,
          count: 1
        });
      } else {
        existing.endedAt = row.timestamp;
        existing.count += 1;
      }
    }

    return Array.from(sessionMap.entries())
      .map(([id, value]) => ({
        id,
        agent: value.agent,
        startedAt: value.startedAt,
        endedAt: value.endedAt,
        eventCount: value.count
      }))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown sessions load error";
    console.error(`[dashboard] failed to load sessions: ${message}`);
    return [];
  }
};

export default async function SessionsPage(): Promise<JSX.Element> {
  const sessions = await loadSessions();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sessions</h1>
      {sessions.length === 0 ? (
        <p className="text-slate-400">No sessions recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link href={`/sessions/${session.id}`} key={session.id}>
              <SessionCard session={session} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
