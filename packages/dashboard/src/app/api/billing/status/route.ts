import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

export async function GET(): Promise<NextResponse> {
  try {
    const authClient = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ subscribed: false });
    }

    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_email", user.email)
      .in("status", ["active", "paused"])
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ subscribed: data !== null });
  } catch {
    return NextResponse.json({ subscribed: false });
  }
}
