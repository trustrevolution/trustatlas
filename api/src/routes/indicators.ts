import { FastifyInstance } from 'fastify'
import db from '../lib/db'

interface DigitalQuerystring {
  iso3?: string
  year?: string
  indicator?: string
}

export default async function indicatorsRoute(fastify: FastifyInstance) {
  // GET /indicators/digital - Get digital penetration data
  // Query params: iso3 (comma-separated), year, indicator
  fastify.get<{ Querystring: DigitalQuerystring }>(
    '/indicators/digital',
    async (request, reply) => {
      try {
      const { iso3, year, indicator = 'social_media_penetration' } = request.query

      let query = `
        SELECT
          d.iso3,
          c.name as country,
          d.year,
          d.indicator,
          d.value,
          d.source
        FROM digital_indicators d
        JOIN countries c ON d.iso3 = c.iso3
        WHERE d.indicator = $1
      `
      const params: (string | number | string[])[] = [indicator]
      let paramIndex = 2

      // Filter by countries if specified
      if (iso3) {
        const countries = iso3.split(',').map((s) => s.trim().toUpperCase())
        query += ` AND d.iso3 = ANY($${paramIndex}::text[])`
        params.push(countries)
        paramIndex++
      }

      // Filter by year if specified
      if (year) {
        query += ` AND d.year = $${paramIndex}`
        params.push(parseInt(year))
        paramIndex++
      }

      query += ' ORDER BY d.iso3, d.year'

      const result = await db.query(query, params)

      // Group by country for easier consumption
      const byCountry: Record<
        string,
        { name: string; data: Array<{ year: number; value: number }> }
      > = {}

      for (const row of result.rows) {
        if (!byCountry[row.iso3]) {
          byCountry[row.iso3] = { name: row.country, data: [] }
        }
        byCountry[row.iso3].data.push({
          year: row.year,
          value: parseFloat(row.value),
        })
      }

      return {
        indicator,
        source: 'DataReportal',
        countries: byCountry,
      }
      } catch (error) {
        request.log.error(error)
        console.error('Indicators error:', error)
        reply.status(500).send({ error: 'Internal server error' })
      }
    }
  )
}
