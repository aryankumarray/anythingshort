import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { ApiError } from "@/lib/errors";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

export async function checkRateLimit(identifier: string): Promise<void> {
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    throw new ApiError(429, "Too many requests, slow down.");
  }
}