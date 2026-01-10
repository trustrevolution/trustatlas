import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import 'dotenv/config'

// Import routes
import countriesRoute from './routes/countries'
import scoreRoute from './routes/score'
import countryRoute from './routes/country'
import methodologyRoute from './routes/methodology'
import trendsRoute from './routes/trends'
import statsRoute from './routes/stats'
import sourcesRoute from './routes/sources'
import indicatorsRoute from './routes/indicators'

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
  }
})

// Register plugins
server.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://trustatlas.org',
        'https://www.trustatlas.org',
        // Vercel preview URLs - only allow trustatlas project deployments
        /^https:\/\/trustatlas(-[a-z0-9]+)?-trustrevolution\.vercel\.app$/,
      ]
    : true,  // Allow all origins in development
  credentials: true,
})

// Rate limiting - 100 requests per minute per IP
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  }),
})

// Security headers and cache control
server.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Ensure CORS headers aren't cached incorrectly
  reply.header('Vary', 'Origin')

  // HSTS - enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Content Security Policy - API returns JSON, restrict everything
  reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
})

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', version: '0.1.0' }
})

// Register API routes (no prefix - subdomain is api.trustatlas.org)
server.register(countriesRoute)
server.register(scoreRoute)
server.register(countryRoute)
server.register(methodologyRoute)
server.register(trendsRoute)
server.register(statsRoute)
server.register(sourcesRoute)
server.register(indicatorsRoute)

// Error handler - sanitize error responses in production
server.setErrorHandler((error, request, reply) => {
  request.log.error(error)

  const isProduction = process.env.NODE_ENV === 'production'

  if (error.validation) {
    reply.status(400).send({
      error: 'Validation failed',
      // Only expose validation details in development
      ...(isProduction ? {} : { details: error.validation })
    })
  } else {
    reply.status(500).send({
      error: 'Internal server error'
    })
  }
})

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001')
    const host = process.env.NODE_ENV === 'development' ? '0.0.0.0' : 'localhost'
    
    await server.listen({ port, host })
    console.log(`🚀 API server ready at http://${host}:${port}`)
    console.log(`📊 Health check: http://${host}:${port}/health`)
    console.log(`📋 API endpoints: http://${host}:${port}/`)
    
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

// Handle shutdown gracefully
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)
  await server.close()
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()