import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearClaw",
  description: "Little Snitch for AI agents"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main>{children}</main>
      </body>
    </html>
  );
}
