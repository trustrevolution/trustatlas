import { Pool } from '@neondatabase/serverless'

// In production, require explicit configuration - no defaults
// In development, allow fallback to local defaults
const isDevelopment = process.env.NODE_ENV !== 'production'

function buildConnectionString(): string {
  // Prefer DATABASE_URL if set (Neon standard)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Fall back to individual env vars for local development
  const host = process.env.POSTGRES_HOST || (isDevelopment ? 'localhost' : '')
  const port = process.env.POSTGRES_PORT || '5432'
  const database = process.env.POSTGRES_DB || (isDevelopment ? 'trust' : '')
  const user = process.env.POSTGRES_USER || (isDevelopment ? 'trust' : '')
  const password = process.env.POSTGRES_PASSWORD || (isDevelopment ? 'trust' : '')

  if (!host || !database || !user) {
    throw new Error('Missing required database configuration. Set DATABASE_URL or POSTGRES_* env vars.')
  }

  const sslParam = isDevelopment ? '' : '?sslmode=require'
  return `postgresql://${user}:${password}@${host}:${port}/${database}${sslParam}`
}

// Neon serverless driver - uses WebSockets for faster cold starts on Vercel
const pool = new Pool({ connectionString: buildConnectionString() })

export default pool
