import { formatTimestamp } from "../lib/utils";
import type { Session } from "../types";

type SessionCardProps = {
  session: Session;
};

export const SessionCard = ({ session }: SessionCardProps): JSX.Element => {
  return (
    <article className="rounded border border-slate-800 p-4 hover:bg-slate-900/40">
      <h3 className="font-semibold">{session.id}</h3>
      <p className="text-sm text-slate-300">Agent: {session.agent}</p>
      <p className="text-sm text-slate-300">Started: {formatTimestamp(session.startedAt)}</p>
      <p className="text-sm text-slate-300">Events: {session.eventCount}</p>
    </article>
  );
};
