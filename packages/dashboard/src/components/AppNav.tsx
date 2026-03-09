"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseAuthBrowserClient } from "../lib/supabase-auth";

const navLinks = [
  { href: "/dashboard", label: "Live Feed" },
  { href: "/sessions", label: "Sessions" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
  { href: "/connect", label: "Connect" }
];

export const AppNav = (): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseAuthBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          Agent<span className="text-brand-500">Audit</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                href={link.href}
                key={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100 disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
};
