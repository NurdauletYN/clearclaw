"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseAuthBrowserClient } from "../../../lib/supabase-auth";

export default function AuthConfirmPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase forwards error params when the link is invalid or expired
    const supabaseError =
      searchParams.get("error_description") ?? searchParams.get("error");
    if (supabaseError) {
      const msg = decodeURIComponent(supabaseError);
      setErrorMsg(msg);
      setTimeout(() => router.replace(`/login?error=${encodeURIComponent(msg)}`), 2500);
      return;
    }

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (!code) {
      router.replace("/login?error=missing_code");
      return;
    }

    const supabase = getSupabaseAuthBrowserClient();

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setErrorMsg(error.message);
          setTimeout(() => {
            router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          }, 2500);
        } else {
          const safeNext = next.startsWith("/") ? next : "/dashboard";
          router.replace(safeNext);
          router.refresh();
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setErrorMsg(msg);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="w-full max-w-sm space-y-3 text-center">
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <p className="text-slate-500 text-xs">Redirecting to sign-in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      <p className="text-sm text-slate-400">Signing you in…</p>
    </div>
  );
}
