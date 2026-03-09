import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

const requireAuth = async (): Promise<boolean> => {
  try {
    const client = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await client.auth.getUser();
    return user !== null;
  } catch {
    return false;
  }
};

export async function GET(): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "daemon_paused")
      .single();

    if (error) throw error;
    return NextResponse.json({ paused: data?.value === true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const PauseBodySchema = z.object({ paused: z.boolean() });

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = PauseBodySchema.parse(await request.json());
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "daemon_paused", value: body.paused, updated_at: new Date().toISOString() });

    if (error) throw error;
    return NextResponse.json({ paused: body.paused });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
