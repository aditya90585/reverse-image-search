import type { SearchResult } from "@/types/search";

const SERPAPI_IMAGE_URL = "https://serpapi.com/image";
const SERPAPI_SEARCH_URL = "https://serpapi.com/search.json";
const REQUEST_TIMEOUT_MS = 45_000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Remove URL fragments and common analytics parameters so the same source
 * page is not shown several times just because tracking parameters differ.
 * Meaningful query parameters are retained.
 */
function canonicalizePageUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    const normalized = key.toLowerCase();
    if (
      normalized.startsWith("utm_") ||
      ["gclid", "fbclid", "igshid", "mc_cid", "mc_eid"].includes(normalized)
    ) {
      url.searchParams.delete(key);
    }
  }
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
  url.searchParams.sort();
  return url.toString();
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.error === "string") return body.error;
  } catch {
    // Provider may return a non-JSON error body.
  }
  return `SerpApi request failed (${response.status}).`;
}

function mapProviderError(message: string, status?: number): Error {
  const normalized = message.toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("invalid api key") ||
    normalized.includes("api key is invalid")
  ) {
    return new Error("SerpApi rejected the API key. Check SERPAPI_API_KEY in your environment settings.");
  }
  if (
    status === 429 ||
    normalized.includes("rate limit") ||
    normalized.includes("monthly searches") ||
    normalized.includes("searches per month") ||
    normalized.includes("run out of searches") ||
    normalized.includes("credit")
  ) {
    return new Error("The SerpApi request limit or available credits have been reached. Check your SerpApi account usage.");
  }
  if (normalized.includes("image_id") || normalized.includes("image upload")) {
    return new Error("SerpApi could not process the uploaded image. Try another image.");
  }
  return new Error("The reverse image provider could not complete this search. Please try again shortly.");
}

export async function uploadImageToSerpApi(image: Buffer, apiKey: string): Promise<string> {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "reverse-search.jpg");
  form.append("api_key", apiKey);

  let response: Response;
  try {
    response = await fetch(SERPAPI_IMAGE_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Image upload timed out. Please try again.");
    }
    throw new Error("Could not connect to the image search provider. Check your connection and try again.");
  }

  if (!response.ok) throw mapProviderError(await readProviderError(response), response.status);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload.image_id !== "string" || !payload.image_id) {
    if (isRecord(payload) && typeof payload.error === "string") throw mapProviderError(payload.error);
    throw new Error("The image provider returned an unexpected upload response. Please try again.");
  }
  return payload.image_id;
}

export async function searchGoogleLens(
  imageId: string,
  apiKey: string,
): Promise<{ results: SearchResult[]; queryId?: string }> {
  const url = new URL(SERPAPI_SEARCH_URL);
  url.searchParams.set("engine", "google_lens");
  url.searchParams.set("image_id", imageId);
  url.searchParams.set("type", "all");
  url.searchParams.set("hl", "en");
  url.searchParams.set("safe", "active");
  url.searchParams.set("api_key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Google Lens search timed out. Please try again.");
    }
    throw new Error("Could not connect to Google Lens through SerpApi. Please try again.");
  }

  if (!response.ok) throw mapProviderError(await readProviderError(response), response.status);
  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error("The search provider returned an unexpected response.");
  if (typeof payload.error === "string") throw mapProviderError(payload.error);

  const metadata = isRecord(payload.search_metadata) ? payload.search_metadata : undefined;
  if (metadata && typeof metadata.status === "string" && metadata.status.toLowerCase() === "error") {
    throw mapProviderError(typeof payload.error === "string" ? payload.error : "Search failed.");
  }

  // Preserve Google's distinction. Do not infer an "exact" match from visual
  // similarity, titles, clothing, faces, or other metadata.
  const candidates: Array<{ value: unknown; matchType: "provider_exact" | "visual" }> = [];
  if (Array.isArray(payload.exact_matches)) {
    candidates.push(...payload.exact_matches.map((value) => ({ value, matchType: "provider_exact" as const })));
  }
  if (Array.isArray(payload.visual_matches)) {
    candidates.push(...payload.visual_matches.map((value) => ({ value, matchType: "visual" as const })));
  }

  const seenPages = new Set<string>();
  const results: SearchResult[] = [];

  for (const candidate of candidates) {
    if (!isRecord(candidate.value)) continue;
    const item = candidate.value;
    const rawPageUrl = safeHttpUrl(item.link);
    if (!rawPageUrl) continue;

    const pageUrl = canonicalizePageUrl(rawPageUrl);
    if (seenPages.has(pageUrl)) continue;
    seenPages.add(pageUrl);

    let hostname = "";
    try {
      hostname = new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    results.push({
      id: `${candidate.matchType}-${results.length}`,
      title: text(item.title) ?? hostname,
      pageUrl,
      domain: text(item.source) ?? hostname,
      source: text(item.source),
      matchType: candidate.matchType,
      exactMatch: candidate.matchType === "provider_exact",
    });
  }

  return {
    results,
    queryId: metadata && typeof metadata.id === "string" ? metadata.id : undefined,
  };
}
