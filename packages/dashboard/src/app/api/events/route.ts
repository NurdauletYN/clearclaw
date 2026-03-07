import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../lib/supabase-server";

const IncomingEventSchema = z.object({
  id: z.string(),
  source: z.enum(["claude_code", "openclaw"]),
  type: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  plainEnglish: z.string(),
  anomalyScore: z.number().min(0).max(1),
  anomalyReason: z.string().nullable()
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    const event = IncomingEventSchema.parse(body);
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from("events").insert(event);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown events API error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
