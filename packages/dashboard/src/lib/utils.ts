export const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
};

export const anomalyLevel = (score: number): "low" | "medium" | "high" => {
  if (score >= 0.85) {
    return "high";
  }
  if (score >= 0.5) {
    return "medium";
  }
  return "low";
};
