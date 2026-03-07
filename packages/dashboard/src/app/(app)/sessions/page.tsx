import Link from "next/link";
import { SessionCard } from "../../../components/SessionCard";
import type { Session } from "../../../types";

const mockSessions: Session[] = [
  {
    id: "session_1",
    agent: "claude_code",
    startedAt: new Date().toISOString(),
    endedAt: null,
    eventCount: 42
  }
];

export default function SessionsPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sessions</h1>
      <div className="space-y-3">
        {mockSessions.map((session) => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <SessionCard session={session} />
          </Link>
        ))}
      </div>
    </div>
  );
}
