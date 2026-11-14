import { NextResponse } from "next/server";
import { ImageValidationError, validateAndPrepareImage } from "@/lib/image-validation";
import { searchGoogleLens, uploadImageToSerpApi } from "@/lib/serpapi";
import { checkSearchRateLimit } from "@/lib/rate-limit";
import { getClientIdentifier, reserveSearch } from "@/lib/usage-limits";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024;
const json = (body: unknown, status = 200, extraHeaders: HeadersInit = {}) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff", ...extraHeaders } });

export async function POST(request: Request) {
  // This endpoint is intended for same-origin browser submissions only.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return json({ error: "Cross-origin requests are not allowed." }, 403);
    } catch { return json({ error: "Invalid request origin." }, 403); }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ error: "The prepared upload is too large. Please choose a smaller image." }, 413);

  const identifier = getClientIdentifier(request);
  const limit = await checkSearchRateLimit(identifier);
  if (!limit.allowed) return json({ error: "Too many searches in a short period. Please wait a minute and try again." }, 429, { "Retry-After": String(limit.retryAfter) });

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return json({ error: "Reverse image search is temporarily unavailable. Please try again later." }, 503);

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return json({ error: "Could not read the uploaded image. Please select it again." }, 400); }

  const file = formData.get("image");
  if (!(file instanceof File)) return json({ error: "No image was received. Choose an image and try again." }, 400);
  if (file.size > MAX_REQUEST_BYTES || file.size === 0) return json({ error: "The prepared image is empty or too large. Please choose another image." }, file.size === 0 ? 400 : 413);

  let preparedImage: Buffer;
  try {
    preparedImage = await validateAndPrepareImage(file);
  } catch (error) {
    if (error instanceof ImageValidationError) return json({ error: error.message }, 400);
    return json({ error: "The uploaded image could not be processed. Please try another file." }, 400);
  }

  let reservation: Awaited<ReturnType<typeof reserveSearch>>;
  try {
    reservation = await reserveSearch(identifier);
  } catch {
    return json({ error: "Search is temporarily unavailable because usage protection is not configured. Please try again later.", code: "QUOTA_UNAVAILABLE" }, 503);
  }
  if (!reservation.allowed) {
    const monthly = reservation.reason === "monthly_limit";
    const retryAt = monthly
      ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).getTime()
      : new Date(reservation.usage.resetAt).getTime();
    return json({
      error: monthly ? "The service has reached its monthly search allowance. Please try again next month." : "You have used today's free searches. Your allowance resets at midnight UTC.",
      code: monthly ? "MONTHLY_LIMIT" : "DAILY_LIMIT",
      usage: reservation.usage,
    }, 429, { "Retry-After": String(Math.max(60, Math.ceil((retryAt - Date.now()) / 1000))) });
  }

  try {
    const imageId = await uploadImageToSerpApi(preparedImage, apiKey);
    const search = await searchGoogleLens(imageId, apiKey);
    const exactCount = search.results.filter((result) => result.matchType === "provider_exact").length;
    const visualCount = search.results.length - exactCount;
    return json({
      results: search.results,
      total: search.results.length,
      exactCount,
      visualCount,
      queryId: search.queryId,
      searchedAt: new Date().toISOString(),
      usage: reservation.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong while searching this image.";
    const status = message.includes("SERPAPI_API_KEY") ? 503 : 502;
    return json({ error: status === 503 ? "Reverse image search is temporarily unavailable." : message, usage: reservation.usage }, status);
  }
}
