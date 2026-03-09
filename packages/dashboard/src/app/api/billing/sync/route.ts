import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase-auth-server";
import { getSupabaseServerClient } from "../../../../lib/supabase-server";

const LS_API = "https://api.lemonsqueezy.com/v1";

const lsFetch = async (path: string): Promise<Response> => {
  const key = process.env.LEMON_SQUEEZY_API_KEY;
  if (!key) throw new Error("LEMON_SQUEEZY_API_KEY is not set");
  return fetch(`${LS_API}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.api+json"
    },
    // Disable Next.js fetch cache — we always want fresh data
    cache: "no-store"
  });
};

// ─── Zod schemas for LS API responses ─────────────────────────────────────────

const LSSubscriptionSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        user_email: z.string(),
        status: z.string(),
        renews_at: z.string().nullable().optional(),
        ends_at: z.string().nullable().optional()
      })
    })
  )
});

const LSOrderSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        user_email: z.string(),
        status: z.string()
      })
    })
  )
});

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(): Promise<NextResponse> {
  try {
    // 1. Get the logged-in user's email
    const authClient = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ subscribed: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = user.email;
    const supabase = getSupabaseServerClient();

    // 2. Check if subscription already exists in our DB
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_email", email)
      .in("status", ["active", "paused"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ subscribed: true });
    }

    // 3. Query Lemon Squeezy subscriptions API
    const subRes = await lsFetch(
      `/subscriptions?filter[user_email]=${encodeURIComponent(email)}&filter[status]=active`
    );

    if (subRes.ok) {
      const subData = LSSubscriptionSchema.safeParse(await subRes.json());
      if (subData.success && subData.data.data.length > 0) {
        const sub = subData.data.data[0];
        const { error } = await supabase.from("subscriptions").upsert({
          id: sub.id,
          user_email: email,
          status: sub.attributes.status,
          plan: "pro",
          renews_at: sub.attributes.renews_at ?? null,
          ends_at: sub.attributes.ends_at ?? null,
          updated_at: new Date().toISOString()
        });
        if (!error) {
          console.log(`[clearclaw:billing] synced subscription ${sub.id} for ${email}`);
          return NextResponse.json({ subscribed: true });
        }
      }
    }

    // 4. Fall back to checking orders (one-time purchase)
    const orderRes = await lsFetch(
      `/orders?filter[user_email]=${encodeURIComponent(email)}`
    );

    if (orderRes.ok) {
      const orderData = LSOrderSchema.safeParse(await orderRes.json());
      if (orderData.success) {
        const paidOrder = orderData.data.data.find((o) => o.attributes.status === "paid");
        if (paidOrder) {
          const { error } = await supabase.from("subscriptions").upsert({
            id: `order_${paidOrder.id}`,
            user_email: email,
            status: "active",
            plan: "pro",
            renews_at: null,
            ends_at: null,
            updated_at: new Date().toISOString()
          });
          if (!error) {
            console.log(`[clearclaw:billing] synced order ${paidOrder.id} for ${email}`);
            return NextResponse.json({ subscribed: true });
          }
        }
      }
    }

    return NextResponse.json({ subscribed: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[clearclaw:billing] sync failed:", message);
    return NextResponse.json({ subscribed: false, error: message }, { status: 500 });
  }
}
