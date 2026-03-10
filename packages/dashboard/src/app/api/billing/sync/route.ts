import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

/**
 * POST /api/billing/sync
 *
 * Checks whether the logged-in user already has an active subscription in our
 * database.  Previously this called the Lemon Squeezy API; with PayPal the
 * source of truth is the Supabase subscriptions table (updated manually by the
 * admin after verifying the PayPal payment, or via the /api/billing/claim
 * endpoint for pending claims).
 */
export async function POST(): Promise<NextResponse> {
  try {
    const authClient = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ subscribed: false, error: "Not authenticated" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_email", user.email)
      .in("status", ["active", "paused"])
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ subscribed: existing !== null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[clearclaw:billing] sync check failed:", message);
    return NextResponse.json({ subscribed: false, error: message }, { status: 500 });
  }
}
