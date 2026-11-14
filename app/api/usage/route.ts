import { NextResponse } from "next/server";
import { getClientIdentifier, getSearchUsage } from "@/lib/usage-limits";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const usage = await getSearchUsage(getClientIdentifier(request));
    return NextResponse.json(usage, { headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Usage information is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
