import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ImageValidationError, validateAndPrepareImage } from "@/lib/image-validation";
import { searchGoogleLens, uploadImageToSerpApi } from "@/lib/serpapi";
import { checkSearchRateLimit } from "@/lib/rate-limit";

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

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded || request.headers.get("x-real-ip") || "unknown-client";
  const identifier = createHash("sha256").update(clientIp).digest("hex");
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

  try {
    const preparedImage = await validateAndPrepareImage(file);
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
    });
  } catch (error) {
    if (error instanceof ImageValidationError) return json({ error: error.message }, 400);
    const message = error instanceof Error ? error.message : "Something went wrong while searching this image.";
    const status = message.includes("SERPAPI_API_KEY") ? 503 : 502;
    return json({ error: status === 503 ? "Reverse image search is temporarily unavailable." : message }, status);
  }
}
