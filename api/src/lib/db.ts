import { Pool } from '@neondatabase/serverless'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL not set')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

export default {
  query: (text: string, params?: unknown[]) => getPool().query(text, params),
}
