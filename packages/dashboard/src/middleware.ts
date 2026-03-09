import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/sessions", "/settings", "/billing", "/connect"];
const PUBLIC_AUTH_PATHS = ["/login", "/confirm"];

// App routes that require an active subscription to access.
// /billing itself is excluded — that's where unpaid users are sent.
const SUBSCRIPTION_REQUIRED_PREFIXES = ["/dashboard", "/sessions", "/settings", "/connect"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p));
  const requiresSub = SUBSCRIPTION_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // 1. Must be logged in to access protected routes
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already logged in — redirect away from login/confirm
  if (isPublicAuthPath && user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Must have an active subscription for app routes (not /billing itself)
  if (requiresSub && user) {
    try {
      const { data: sub } = await supabase
        .from("subscriptions" as never)
        .select("id")
        .eq("user_email", user.email ?? "")
        .in("status", ["active", "paused"])
        .limit(1)
        .maybeSingle();

      if (!sub) {
        return NextResponse.redirect(new URL("/billing", request.url));
      }
    } catch {
      // If the table doesn't exist yet (migrations pending), let the request through
      // rather than accidentally locking everyone out.
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sessions/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/connect/:path*",
    "/login",
    "/confirm"
  ]
};
