import { createHash } from "node:crypto";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 8;
const localHits = new Map<string, { count: number; resetAt: number }>();

export async function checkSearchRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const keyHash = createHash("sha256").update(identifier).digest("hex").slice(0, 32);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const key = `trace:search:${keyHash}`;
      const response = await fetch(`${redisUrl}/incr/${key}`, { headers: { Authorization: `Bearer ${redisToken}` }, cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (!response.ok) throw new Error("Rate-limit store unavailable");
      const data = await response.json() as { result?: number };
      const count = Number(data.result ?? 0);
      if (count === 1) await fetch(`${redisUrl}/expire/${key}/${WINDOW_SECONDS}`, { headers: { Authorization: `Bearer ${redisToken}` }, cache: "no-store", signal: AbortSignal.timeout(2500) });
      return { allowed: count <= MAX_REQUESTS, retryAfter: WINDOW_SECONDS };
    } catch {
      // Fail closed: do not allow unmetered paid-provider requests if configured Redis is unavailable.
      return { allowed: false, retryAfter: 30 };
    }
  }

  // Development fallback only. Serverless instances do not share this memory; configure Upstash for production.
  const now = Date.now();
  const current = localHits.get(keyHash);
  if (!current || current.resetAt <= now) {
    localHits.set(keyHash, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    if (localHits.size > 2000) for (const [key, value] of localHits) if (value.resetAt <= now) localHits.delete(key);
    return { allowed: true, retryAfter: WINDOW_SECONDS };
  }
  current.count += 1;
  return { allowed: current.count <= MAX_REQUESTS, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
