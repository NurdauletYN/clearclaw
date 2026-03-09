import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import {
  DEFAULT_PERMISSIONS,
  getSupabaseServerClient,
  type PermissionKey,
  type Permissions
} from "../../../../lib/supabase-server";

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
      .eq("key", "permissions")
      .single();

    if (error) throw error;
    const permissions = (data?.value as Permissions | null) ?? DEFAULT_PERMISSIONS;
    return NextResponse.json(permissions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const PermissionBodySchema = z.object({
  key: z.enum(["block_sudo", "alert_secrets", "require_network_confirm"]),
  value: z.boolean()
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = PermissionBodySchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    // Read current permissions, merge the change, write back
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "permissions")
      .single();

    const current: Permissions = (data?.value as Permissions | null) ?? DEFAULT_PERMISSIONS;
    const updated: Permissions = { ...current, [body.key as PermissionKey]: body.value };

    const { error } = await supabase.from("settings").upsert({
      key: "permissions",
      value: updated,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
