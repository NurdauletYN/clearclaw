import type { ReactNode } from "react";
import { AppNav } from "../../components/AppNav";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
