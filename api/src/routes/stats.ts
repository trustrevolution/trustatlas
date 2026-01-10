import { FastifyInstance } from 'fastify'
import db from '../lib/db'

export default async function statsRoute(fastify: FastifyInstance) {
  // GET /stats - Get aggregate statistics for homepage
  fastify.get('/stats', async (_request, _reply) => {
    // Count observations for the 3 primary pillars only
    // Supplementary indicators (freedom, financial, partisan) are excluded
    const result = await db.query(`
      SELECT
        (SELECT COUNT(DISTINCT iso3) FROM observations
         WHERE trust_type IN ('interpersonal', 'institutional', 'governance', 'media')
        ) as country_count,
        (SELECT COUNT(*) FROM observations
         WHERE trust_type IN ('interpersonal', 'institutional', 'governance', 'media')
        ) as observation_count,
        (SELECT COUNT(DISTINCT source) FROM (
           SELECT source FROM observations
           WHERE trust_type IN ('interpersonal', 'institutional', 'governance', 'media')
           UNION
           SELECT source FROM digital_indicators
         ) all_sources) as source_count
    `)

    const stats = result.rows[0]

    return {
      countries: parseInt(stats.country_count),
      observations: parseInt(stats.observation_count),
      sources: parseInt(stats.source_count),
    }
  })
}
