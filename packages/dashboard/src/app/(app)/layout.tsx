import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return <div className="mx-auto max-w-6xl p-6">{children}</div>;
}
