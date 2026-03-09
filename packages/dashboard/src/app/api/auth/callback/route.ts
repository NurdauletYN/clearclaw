import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);

  // Supabase sends error params when the link is invalid/expired
  const supabaseError = searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    const msg = encodeURIComponent(decodeURIComponent(supabaseError));
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=config_error`);
  }

  const cookieStore = cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[agentaudit:auth] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
