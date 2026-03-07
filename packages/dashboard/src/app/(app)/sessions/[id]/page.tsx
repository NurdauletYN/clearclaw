import type { DashboardEvent } from "../../../../types";

type SessionReplayPageProps = {
  params: {
    id: string;
  };
};

const mockEvents: DashboardEvent[] = [
  {
    id: "evt_1",
    source: "claude_code",
    type: "command_exec",
    sessionId: "session_1",
    timestamp: new Date().toISOString(),
    plainEnglish: "claude_code executed command: pnpm build.",
    anomalyScore: 0.1,
    anomalyReason: null
  }
];

export default function SessionReplayPage({ params }: SessionReplayPageProps): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Session Replay: {params.id}</h1>
      <ul className="space-y-2">
        {mockEvents.map((event) => (
          <li className="rounded border border-slate-800 p-3" key={event.id}>
            <p className="text-sm text-slate-300">{event.timestamp}</p>
            <p>{event.plainEnglish}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
