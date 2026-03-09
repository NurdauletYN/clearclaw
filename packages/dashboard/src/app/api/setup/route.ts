import { NextResponse } from "next/server";
import { z } from "zod";

const SetupPayloadSchema = z.object({
  installToken: z.string().min(10)
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    const payload = SetupPayloadSchema.parse(body);

    const expectedToken = process.env.CLEARCLAW_INSTALL_TOKEN ?? "";
    if (!expectedToken || payload.installToken !== expectedToken) {
      return NextResponse.json({ ok: false, error: "Invalid install token" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown setup API error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
