import { Pool } from 'pg'

// In production, require explicit configuration - no defaults
// In development, allow fallback to local defaults
const isDevelopment = process.env.NODE_ENV !== 'production'

function getRequiredEnv(name: string, devDefault: string): string {
  const value = process.env[name]
  if (value) return value
  if (isDevelopment) return devDefault
  throw new Error(`Missing required environment variable: ${name}`)
}

const pool = new Pool({
  host: getRequiredEnv('POSTGRES_HOST', 'localhost'),
  port: parseInt(getRequiredEnv('POSTGRES_PORT', '5432')),
  database: getRequiredEnv('POSTGRES_DB', 'trust'),
  user: getRequiredEnv('POSTGRES_USER', 'trust'),
  password: getRequiredEnv('POSTGRES_PASSWORD', 'trust'),
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
})

export default pool
