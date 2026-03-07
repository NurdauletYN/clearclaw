import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const LemonWebhookSchema = z.object({
  meta: z.object({
    event_name: z.string()
  }),
  data: z.object({
    id: z.string()
  })
});

const verifySignature = (rawBody: string, signature: string, secret: string): boolean => {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Webhook secret is not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    if (!signature || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = LemonWebhookSchema.parse(JSON.parse(rawBody) as unknown);
    return NextResponse.json({ ok: true, event: payload.meta.event_name, id: payload.data.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
