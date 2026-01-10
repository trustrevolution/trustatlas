import type { VercelRequest, VercelResponse } from '@vercel/node'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'

import { checkRateLimit } from './lib/ratelimit'

// Import routes
import countriesRoute from './routes/countries'
import scoreRoute from './routes/score'
import countryRoute from './routes/country'
import methodologyRoute from './routes/methodology'
import trendsRoute from './routes/trends'
import statsRoute from './routes/stats'
import indicatorsRoute from './routes/indicators'

const app = Fastify({ logger: false })

// Register CORS - explicitly allow both www and non-www
app.register(cors, {
  origin: [
    'https://trustatlas.org',
    'https://www.trustatlas.org',
    /^https:\/\/trustatlas(-[a-z0-9]+)?(-shawnyeager)?\.vercel\.app$/,
  ],
  credentials: true,
})

// Rate limiting - 100 requests per minute per IP
app.addHook('onRequest', async (request, reply) => {
  const ip = request.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown'
  const { success, remaining } = await checkRateLimit(ip)

  reply.header('X-RateLimit-Remaining', remaining.toString())

  if (!success) {
    reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    })
  }
})

// Security headers and cache control
app.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // Ensure CORS headers aren't cached incorrectly
  reply.header('Vary', 'Origin')
  reply.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
})

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', version: '0.1.0', env: process.env.NODE_ENV || 'unknown' }
})

// Register API routes (no prefix - subdomain is api.trustatlas.org)
app.register(countriesRoute)
app.register(scoreRoute)
app.register(countryRoute)
app.register(methodologyRoute)
app.register(trendsRoute)
app.register(statsRoute)
app.register(indicatorsRoute)

// Error handler
app.setErrorHandler((error, _request, reply) => {
  console.error('Fastify error:', error)
  reply.status(500).send({ error: 'Internal server error' })
})

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await app.ready()

    const response = await app.inject({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
      url: req.url || '/',
      headers: req.headers as Record<string, string>,
      payload: req.body,
    })

    res.status(response.statusCode)
    for (const [key, value] of Object.entries(response.headers)) {
      if (value) res.setHeader(key, value as string)
    }
    res.send(response.body)
  } catch (err) {
    console.error('Handler error:', err)
    res.status(500).json({ error: 'Internal server error', message: String(err) })
  }
}
