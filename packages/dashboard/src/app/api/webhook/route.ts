import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../lib/supabase-server";

// ─── Signature ────────────────────────────────────────────────────────────────

const verifySignature = (rawBody: string, signature: string, secret: string): boolean => {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");
  if (digestBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
};

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const SubscriptionAttributesSchema = z.object({
  user_email: z.string().email(),
  status: z.string(),
  renews_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional()
});

const OrderAttributesSchema = z.object({
  user_email: z.string().email(),
  status: z.string()
});

const LemonWebhookSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    // custom_data is passed from our checkout URL params
    custom_data: z.record(z.unknown()).optional()
  }),
  data: z.object({
    id: z.string(),
    attributes: z.record(z.unknown())
  })
});

// Lemon Squeezy sometimes puts user_email in attributes, sometimes in custom_data.
// We check both and fall back gracefully.
const resolveEmail = (
  attributes: Record<string, unknown>,
  customData: Record<string, unknown> | undefined
): string | null => {
  const fromAttrs = typeof attributes.user_email === "string" ? attributes.user_email : null;
  const fromCustom =
    typeof customData?.user_email === "string" ? customData.user_email : null;
  return fromAttrs ?? fromCustom;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const upsertSubscription = async (
  id: string,
  attrs: z.infer<typeof SubscriptionAttributesSchema>
): Promise<void> => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("subscriptions").upsert({
    id,
    user_email: attrs.user_email,
    status: attrs.status,
    plan: "pro",
    renews_at: attrs.renews_at ?? null,
    ends_at: attrs.ends_at ?? null,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
};

const updateSubscriptionStatus = async (
  id: string,
  status: string,
  ends_at?: string | null
): Promise<void> => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status, ends_at: ends_at ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Supabase update failed: ${error.message}`);
};

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    if (!signature || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = LemonWebhookSchema.parse(JSON.parse(rawBody) as unknown);
    const { event_name, custom_data } = payload.meta;
    const { id, attributes } = payload.data;

    switch (event_name) {
      case "subscription_created":
      case "subscription_updated": {
        const email = resolveEmail(attributes, custom_data);
        if (email) {
          const attrs = SubscriptionAttributesSchema.parse({ ...attributes, user_email: email });
          await upsertSubscription(id, attrs);
        }
        break;
      }

      case "subscription_cancelled": {
        const email = resolveEmail(attributes, custom_data);
        const ends_at =
          typeof attributes.ends_at === "string" ? attributes.ends_at : null;
        await updateSubscriptionStatus(id, "cancelled", ends_at);
        if (email) {
          // Also mark by email in case the ID lookup misses
          const supabase = getSupabaseServerClient();
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("user_email", email);
        }
        break;
      }

      case "subscription_expired": {
        await updateSubscriptionStatus(id, "expired");
        break;
      }

      case "subscription_paused": {
        await updateSubscriptionStatus(id, "paused");
        break;
      }

      case "subscription_unpaused": {
        await updateSubscriptionStatus(id, "active");
        break;
      }

      case "order_created": {
        const email = resolveEmail(attributes, custom_data);
        const status = typeof attributes.status === "string" ? attributes.status : "";
        if (email && status === "paid") {
          const supabase = getSupabaseServerClient();
          const { error } = await supabase.from("subscriptions").upsert({
            id: `order_${id}`,
            user_email: email,
            status: "active",
            plan: "pro",
            renews_at: null,
            ends_at: null,
            updated_at: new Date().toISOString()
          });
          if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ ok: true, event: event_name, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
