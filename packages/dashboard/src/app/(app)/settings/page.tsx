import { PermissionToggle } from "../../../components/PermissionToggle";
import { DEFAULT_PERMISSIONS, getSupabaseServerClient, type Permissions } from "../../../lib/supabase-server";

const TOGGLES = [
  { key: "block_sudo" as const, label: "Block shell commands with sudo" },
  { key: "alert_secrets" as const, label: "Alert on secrets file access (.env, .pem, id_rsa…)" },
  { key: "require_network_confirm" as const, label: "Require confirmation for outbound network calls" }
];

export default async function SettingsPage(): Promise<JSX.Element> {
  let permissions: Permissions = DEFAULT_PERMISSIONS;

  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "permissions")
      .single();
    if (data?.value) {
      permissions = data.value as Permissions;
    }
  } catch {
    // Use defaults if settings table isn't seeded yet
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Permission Profiles</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure what the ClearClaw daemon watches and blocks. Changes take effect within 5
          seconds.
        </p>
      </div>

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {TOGGLES.map((t) => (
          <div key={t.key} className="px-5 py-4">
            <PermissionToggle
              label={t.label}
              settingKey={t.key}
              defaultEnabled={permissions[t.key]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
