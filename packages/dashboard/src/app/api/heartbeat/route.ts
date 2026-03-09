import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServerClient();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "heartbeat")
      .gte("timestamp", twoMinutesAgo);

    if (error) {
      return NextResponse.json({ online: false }, { status: 200 });
    }

    return NextResponse.json({ online: (count ?? 0) > 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown heartbeat error";
    console.error(`[dashboard] heartbeat check failed: ${message}`);
    return NextResponse.json({ online: false }, { status: 200 });
  }
}
