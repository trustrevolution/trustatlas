import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'
import { scoreQuerySchema } from '../lib/schemas'

const scoreRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/score', async (request, reply) => {
    try {
      const { year, trust_type } = scoreQuerySchema.parse(request.query)

      // Default to latest year if not specified
      let targetYear = year
      if (!targetYear) {
        const latestYearResult = await db.query('SELECT MAX(year) as max_year FROM country_year')
        targetYear = latestYearResult.rows[0]?.max_year || new Date().getFullYear()
      }

      // Safe column mapping - uses CASE expression to avoid SQL injection
      const VALID_TRUST_TYPES = ['interpersonal', 'institutional', 'governance'] as const
      const trustTypeParam = trust_type && VALID_TRUST_TYPES.includes(trust_type as typeof VALID_TRUST_TYPES[number])
        ? trust_type
        : 'governance'

      const result = await db.query(`
        SELECT
          cy.iso3,
          cy.year,
          CASE $2
            WHEN 'interpersonal' THEN cy.interpersonal
            WHEN 'institutional' THEN cy.institutional
            ELSE cy.governance
          END as score,
          cy.confidence_tier
        FROM country_year cy
        JOIN countries c ON cy.iso3 = c.iso3
        WHERE cy.year = $1
          AND CASE $2
            WHEN 'interpersonal' THEN cy.interpersonal
            WHEN 'institutional' THEN cy.institutional
            ELSE cy.governance
          END IS NOT NULL
        ORDER BY c.name
      `, [targetYear, trustTypeParam])

      const scores = result.rows.map(row => ({
        iso3: row.iso3,
        year: parseInt(row.year),
        score: row.score ? parseFloat(row.score) : null,
        confidence_tier: row.confidence_tier
      }))

      reply
        .header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
        .send(scores)

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default scoreRoute