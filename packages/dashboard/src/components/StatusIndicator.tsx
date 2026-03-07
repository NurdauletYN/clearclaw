type StatusIndicatorProps = {
  online: boolean;
};

export const StatusIndicator = ({ online }: StatusIndicatorProps): JSX.Element => {
  return (
    <div className="flex items-center gap-2 rounded border border-slate-800 px-3 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="text-sm">{online ? "Daemon online" : "Daemon offline"}</span>
    </div>
  );
};
