"use client";

import { useState } from "react";
import type { PermissionKey } from "../lib/supabase-server";

type PermissionToggleProps = {
  label: string;
  settingKey: PermissionKey;
  defaultEnabled?: boolean;
};

export const PermissionToggle = ({
  label,
  settingKey,
  defaultEnabled = false
}: PermissionToggleProps): JSX.Element => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [saving, setSaving] = useState(false);

  const toggle = async (): Promise<void> => {
    const next = !enabled;
    setEnabled(next); // optimistic

    setSaving(true);
    try {
      const res = await fetch("/api/settings/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: next })
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      setEnabled(!next); // revert
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          enabled ? "bg-emerald-700 hover:bg-emerald-600" : "bg-slate-700 hover:bg-slate-600"
        } ${saving ? "opacity-50" : ""}`}
        onClick={() => void toggle()}
        disabled={saving}
        type="button"
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </label>
  );
};
