import { createHash } from "node:crypto";

function positiveInt(value: string | undefined, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

const DAILY_LIMIT = positiveInt(process.env.SEARCH_DAILY_LIMIT, 3, 25);
const MONTHLY_LIMIT = positiveInt(process.env.SEARCH_MONTHLY_BUDGET, 200, 100000);
const localUsage = new Map<string, number>();

type UsageState = { usedToday: number; dailyLimit: number; remainingToday: number; resetAt: string; monthlyCapReached: boolean };

function utcWindows(now = new Date()) {
  const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const dayKey = `visufind:quota:day:${now.toISOString().slice(0, 10)}`;
  const monthKey = `visufind:quota:month:${now.toISOString().slice(0, 7)}`;
  return {
    dayKey,
    monthKey,
    dayTtl: Math.max(60, Math.ceil((dayEnd.getTime() - now.getTime()) / 1000)),
    monthTtl: Math.max(60, Math.ceil((monthEnd.getTime() - now.getTime()) / 1000)),
    resetAt: dayEnd.toISOString(),
  };
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = redisConfig();
  if (!config) throw new Error("Production search quota requires Upstash Redis.");
  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error("Quota store unavailable.");
  const body = await response.json() as { result?: T; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result as T;
}

export function getClientIdentifier(request: Request) {
  // Vercel supplies x-real-ip. Prefer it over the client-controllable first XFF value.
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown-client";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function getSearchUsage(identifier: string): Promise<UsageState> {
  const now = new Date();
  const windows = utcWindows(now);
  const dailyKey = `${windows.dayKey}:${identifier}`;
  if (!redisConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("Search quota is not configured.");
    const usedToday = localUsage.get(dailyKey) || 0;
    return { usedToday, dailyLimit: DAILY_LIMIT, remainingToday: Math.max(0, DAILY_LIMIT - usedToday), resetAt: windows.resetAt, monthlyCapReached: false };
  }
  const values = await redisCommand<(string | null)[]>(["MGET", dailyKey, windows.monthKey]);
  const usedToday = Number(values?.[0] || 0);
  const usedThisMonth = Number(values?.[1] || 0);
  return { usedToday, dailyLimit: DAILY_LIMIT, remainingToday: Math.max(0, DAILY_LIMIT - usedToday), resetAt: windows.resetAt, monthlyCapReached: usedThisMonth >= MONTHLY_LIMIT };
}

export async function reserveSearch(identifier: string): Promise<{ allowed: boolean; reason?: "daily_limit" | "monthly_limit"; usage: UsageState }> {
  const now = new Date();
  const windows = utcWindows(now);
  const dailyKey = `${windows.dayKey}:${identifier}`;
  if (!redisConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("Search quota is not configured. Add Upstash Redis before production deployment.");
    const usedToday = localUsage.get(dailyKey) || 0;
    if (usedToday >= DAILY_LIMIT) return { allowed: false, reason: "daily_limit", usage: await getSearchUsage(identifier) };
    localUsage.set(dailyKey, usedToday + 1);
    return { allowed: true, usage: await getSearchUsage(identifier) };
  }

  // Reserve the per-IP and global monthly credits atomically. The monthly ceiling
  // intentionally leaves a buffer below the provider's advertised free allowance.
  const script = `
    local daily = tonumber(redis.call('GET', KEYS[1]) or '0')
    local monthly = tonumber(redis.call('GET', KEYS[2]) or '0')
    if daily >= tonumber(ARGV[1]) then return {0, daily, monthly} end
    if monthly >= tonumber(ARGV[2]) then return {-1, daily, monthly} end
    daily = redis.call('INCR', KEYS[1])
    monthly = redis.call('INCR', KEYS[2])
    if daily == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3])) end
    if monthly == 1 then redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4])) end
    return {1, daily, monthly}
  `;
  const result = await redisCommand<number[]>(["EVAL", script, "2", dailyKey, windows.monthKey, String(DAILY_LIMIT), String(MONTHLY_LIMIT), String(windows.dayTtl), String(windows.monthTtl)]);
  const allowed = Number(result?.[0]) === 1;
  const reason = Number(result?.[0]) === -1 ? "monthly_limit" : Number(result?.[0]) === 0 ? "daily_limit" : undefined;
  const usage = await getSearchUsage(identifier);
  return { allowed, reason, usage };
}

export const SEARCH_DAILY_LIMIT_VALUE = DAILY_LIMIT;
export const SEARCH_MONTHLY_BUDGET_VALUE = MONTHLY_LIMIT;
