export default function ConnectPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Connect AgentAudit</h1>
      <p className="text-slate-300">Run the installer locally to connect this machine:</p>
      <pre className="rounded bg-slate-900 p-3 text-sm">pnpm dlx agentaudit install</pre>
      <p className="text-slate-400">After installation, refresh this page to verify daemon heartbeat.</p>
    </div>
  );
}
