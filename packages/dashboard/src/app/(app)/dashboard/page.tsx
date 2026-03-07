import { AnomalyAlert } from "../../../components/AnomalyAlert";
import { EventFeed } from "../../../components/EventFeed";
import { PauseButton } from "../../../components/PauseButton";
import { StatusIndicator } from "../../../components/StatusIndicator";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Feed</h1>
        <StatusIndicator online />
      </div>
      <AnomalyAlert message="No critical anomalies detected in the last 5 minutes." severity="info" />
      <PauseButton />
      <EventFeed />
    </div>
  );
}
