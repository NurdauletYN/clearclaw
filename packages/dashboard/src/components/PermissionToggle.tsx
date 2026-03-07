"use client";

import { useState } from "react";

type PermissionToggleProps = {
  label: string;
  defaultEnabled?: boolean;
};

export const PermissionToggle = ({ label, defaultEnabled = false }: PermissionToggleProps): JSX.Element => {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>{label}</span>
      <button
        className={`rounded px-3 py-1 text-sm ${enabled ? "bg-emerald-700" : "bg-slate-700"}`}
        onClick={() => setEnabled((value) => !value)}
        type="button"
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </label>
  );
};
