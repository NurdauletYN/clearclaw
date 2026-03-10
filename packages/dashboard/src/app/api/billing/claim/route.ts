import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

/**
 * POST /api/billing/claim
 *
 * Called after a user returns from PayPal and asserts they completed payment.
 * Creates a "pending" subscription record which the admin activates manually
 * by setting status = 'active' in Supabase once the PayPal payment is verified.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const authClient = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = user.email;
    const supabase = getSupabaseServerClient();

    // Check for any existing record first
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_email", email)
      .in("status", ["active", "paused", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.status === "active" || existing?.status === "paused") {
      return NextResponse.json({ subscribed: true, status: existing.status });
    }

    if (existing?.status === "pending") {
      // Already claimed — just tell them it's still pending
      return NextResponse.json({ subscribed: false, status: "pending", claimed: true });
    }

    // Create a new pending record
    const id = `paypal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const { error } = await supabase.from("subscriptions").insert({
      id,
      user_email: email,
      status: "pending",
      plan: "lifetime",
      renews_at: null,
      ends_at: null,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("[clearclaw:billing] claim insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[clearclaw:billing] pending claim created for ${email} (id: ${id})`);
    return NextResponse.json({ subscribed: false, status: "pending", claimed: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[clearclaw:billing] claim route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
