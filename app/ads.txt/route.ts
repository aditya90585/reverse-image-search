import { NextResponse } from "next/server";
export function GET() {
  const raw = process.env.ADSENSE_PUBLISHER_ID || process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const publisherId = raw.replace(/^ca-/, "").trim();
  const body = /^pub-\d+$/.test(publisherId) ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n` : "# Add your AdSense publisher ID as ADSENSE_PUBLISHER_ID after your account is approved.\n";
  return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
