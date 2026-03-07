import { PermissionToggle } from "../../../components/PermissionToggle";

export default function SettingsPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Permission Profiles</h1>
      <div className="rounded border border-slate-800 p-4">
        <PermissionToggle label="Block shell commands with sudo" defaultEnabled />
      </div>
      <div className="rounded border border-slate-800 p-4">
        <PermissionToggle label="Alert on secrets file access" defaultEnabled />
      </div>
      <div className="rounded border border-slate-800 p-4">
        <PermissionToggle label="Require confirmation for network calls" />
      </div>
    </div>
  );
}
