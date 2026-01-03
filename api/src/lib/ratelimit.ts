import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Only initialize if Upstash credentials are available
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    })
  : null

export async function checkRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (!ratelimit) {
    return { success: true, remaining: 100 } // No-op in dev without Upstash
  }
  const result = await ratelimit.limit(ip)
  return { success: result.success, remaining: result.remaining }
}
