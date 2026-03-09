import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {children}
    </div>
  );
}
