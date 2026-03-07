type AnomalyAlertProps = {
  message: string;
  severity: "info" | "warning" | "critical";
};

const alertClass: Record<AnomalyAlertProps["severity"], string> = {
  info: "border-blue-700 bg-blue-950/30 text-blue-200",
  warning: "border-amber-700 bg-amber-950/30 text-amber-200",
  critical: "border-red-700 bg-red-950/30 text-red-200"
};

export const AnomalyAlert = ({ message, severity }: AnomalyAlertProps): JSX.Element => {
  return <div className={`rounded border p-3 text-sm ${alertClass[severity]}`}>{message}</div>;
};
