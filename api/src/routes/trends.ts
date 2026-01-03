import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'
import { iso3ParamSchema } from '../lib/schemas'

const trendsRoute: FastifyPluginAsync = async (fastify) => {
  // USA trust timeline - all trust types over time
  fastify.get('/trends/usa', async (request, reply) => {
    try {
      // Aggregate multiple sources for same year/trust_type by averaging
      // For interpersonal trust, only use binary methodology (WVS-compatible) to avoid
      // mixing incompatible scales (binary vs 4-point) which creates chart artifacts
      const result = await db.query(`
        SELECT
          year,
          trust_type,
          ROUND(AVG(score_0_100)::numeric, 1) as score,
          STRING_AGG(DISTINCT source, ', ' ORDER BY source) as sources
        FROM observations
        WHERE iso3 = 'USA'
          AND (
            trust_type IN ('institutional', 'partisan')
            OR (trust_type = 'interpersonal' AND methodology = 'binary')
          )
        GROUP BY year, trust_type
        ORDER BY trust_type, year
      `)

      // Group by trust type for chart series
      const series: Record<string, Array<{ year: number; score: number; source: string }>> = {
        interpersonal: [],
        institutional: [],
        partisan: []
      }

      for (const row of result.rows) {
        if (series[row.trust_type]) {
          series[row.trust_type].push({
            year: parseInt(row.year),
            score: parseFloat(row.score),
            source: row.sources
          })
        }
      }

      reply
        .header('Cache-Control', 's-maxage=86400')
        .send({ series })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Global trust - latest score by country for a specific pillar (for map)
  // ?pillar=interpersonal|institutional|governance (default: interpersonal)
  fastify.get('/trends/global', async (request, reply) => {
    try {
      const { pillar = 'interpersonal' } = request.query as { pillar?: string }

      // Validate pillar
      const validPillars = ['interpersonal', 'institutional', 'governance', 'media']
      if (!validPillars.includes(pillar)) {
        return reply.status(400).send({
          error: `Invalid pillar. Must be one of: ${validPillars.join(', ')}`
        })
      }

      // Build query based on pillar
      // For interpersonal, only use binary methodology (WVS-family)
      // For institutional, use WVS-family sources only
      // For governance, use CPI/WGI
      // For media, use Reuters DNR
      let query: string

      if (pillar === 'interpersonal') {
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              o.year,
              o.score_0_100,
              o.source
            FROM observations o
            WHERE o.trust_type = 'interpersonal'
              AND o.methodology = 'binary'
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            l.iso3,
            c.name,
            c.region,
            l.year,
            ROUND(l.score_0_100::numeric, 1) as score,
            l.source
          FROM latest l
          JOIN countries c ON l.iso3 = c.iso3
          ORDER BY l.score_0_100 DESC
        `
      } else if (pillar === 'institutional') {
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              o.year,
              o.score_0_100,
              o.source
            FROM observations o
            WHERE o.trust_type = 'institutional'
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            l.iso3,
            c.name,
            c.region,
            l.year,
            ROUND(l.score_0_100::numeric, 1) as score,
            l.source
          FROM latest l
          JOIN countries c ON l.iso3 = c.iso3
          ORDER BY l.score_0_100 DESC
        `
      } else if (pillar === 'governance') {
        // governance - average CPI and WGI for each country-year
        query = `
          WITH yearly_avg AS (
            SELECT
              o.iso3,
              o.year,
              ROUND(AVG(o.score_0_100)::numeric, 1) as score,
              STRING_AGG(DISTINCT o.source, ', ' ORDER BY o.source) as sources
            FROM observations o
            WHERE o.trust_type = 'governance'
              AND o.source IN ('CPI', 'WGI')
            GROUP BY o.iso3, o.year
          ),
          latest AS (
            SELECT DISTINCT ON (iso3)
              iso3, year, score, sources
            FROM yearly_avg
            ORDER BY iso3, year DESC
          )
          SELECT
            l.iso3,
            c.name,
            c.region,
            l.year,
            l.score,
            l.sources as source
          FROM latest l
          JOIN countries c ON l.iso3 = c.iso3
          ORDER BY l.score DESC
        `
      } else {
        // media - Reuters Digital News Report
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              o.year,
              o.score_0_100,
              o.source
            FROM observations o
            WHERE o.trust_type = 'media'
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            l.iso3,
            c.name,
            c.region,
            l.year,
            ROUND(l.score_0_100::numeric, 1) as score,
            l.source
          FROM latest l
          JOIN countries c ON l.iso3 = c.iso3
          ORDER BY l.score_0_100 DESC
        `
      }

      const result = await db.query(query)

      const countries = result.rows.map(row => ({
        iso3: row.iso3,
        name: row.name,
        region: row.region,
        year: parseInt(row.year),
        score: parseFloat(row.score),
        source: row.source
      }))

      reply
        .header('Cache-Control', 's-maxage=86400')
        .send({ pillar, countries })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Regional comparison - average pillar score by region
  // ?pillar=interpersonal|institutional|governance|media (default: interpersonal)
  fastify.get('/trends/regions', async (request, reply) => {
    try {
      const { pillar = 'interpersonal' } = request.query as { pillar?: string }

      // Validate pillar
      const validPillars = ['interpersonal', 'institutional', 'governance', 'media']
      if (!validPillars.includes(pillar)) {
        return reply.status(400).send({
          error: `Invalid pillar. Must be one of: ${validPillars.join(', ')}`
        })
      }

      let query: string

      if (pillar === 'interpersonal') {
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              c.region,
              o.score_0_100 as score
            FROM observations o
            JOIN countries c ON o.iso3 = c.iso3
            WHERE o.trust_type = 'interpersonal'
              AND o.methodology = 'binary'
              AND c.region IS NOT NULL AND c.region != ''
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            region,
            COUNT(*) as country_count,
            ROUND(AVG(score)::numeric, 1) as avg_score,
            ROUND(MIN(score)::numeric, 1) as min_score,
            ROUND(MAX(score)::numeric, 1) as max_score
          FROM latest
          GROUP BY region
          ORDER BY avg_score DESC
        `
      } else if (pillar === 'institutional') {
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              c.region,
              o.score_0_100 as score
            FROM observations o
            JOIN countries c ON o.iso3 = c.iso3
            WHERE o.trust_type = 'institutional'
              AND c.region IS NOT NULL AND c.region != ''
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            region,
            COUNT(*) as country_count,
            ROUND(AVG(score)::numeric, 1) as avg_score,
            ROUND(MIN(score)::numeric, 1) as min_score,
            ROUND(MAX(score)::numeric, 1) as max_score
          FROM latest
          GROUP BY region
          ORDER BY avg_score DESC
        `
      } else if (pillar === 'governance') {
        // governance - average CPI and WGI for each country, then aggregate by region
        query = `
          WITH yearly_avg AS (
            SELECT
              o.iso3,
              o.year,
              ROUND(AVG(o.score_0_100)::numeric, 1) as score
            FROM observations o
            WHERE o.trust_type = 'governance'
              AND o.source IN ('CPI', 'WGI')
            GROUP BY o.iso3, o.year
          ),
          latest AS (
            SELECT DISTINCT ON (ya.iso3)
              ya.iso3,
              c.region,
              ya.score
            FROM yearly_avg ya
            JOIN countries c ON ya.iso3 = c.iso3
            WHERE c.region IS NOT NULL AND c.region != ''
            ORDER BY ya.iso3, ya.year DESC
          )
          SELECT
            region,
            COUNT(*) as country_count,
            ROUND(AVG(score)::numeric, 1) as avg_score,
            ROUND(MIN(score)::numeric, 1) as min_score,
            ROUND(MAX(score)::numeric, 1) as max_score
          FROM latest
          GROUP BY region
          ORDER BY avg_score DESC
        `
      } else {
        // media - Reuters Digital News Report by region
        query = `
          WITH latest AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              c.region,
              o.score_0_100 as score
            FROM observations o
            JOIN countries c ON o.iso3 = c.iso3
            WHERE o.trust_type = 'media'
              AND c.region IS NOT NULL AND c.region != ''
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            region,
            COUNT(*) as country_count,
            ROUND(AVG(score)::numeric, 1) as avg_score,
            ROUND(MIN(score)::numeric, 1) as min_score,
            ROUND(MAX(score)::numeric, 1) as max_score
          FROM latest
          GROUP BY region
          ORDER BY avg_score DESC
        `
      }

      const result = await db.query(query)

      const regions = result.rows.map(row => ({
        region: row.region,
        countryCount: parseInt(row.country_count),
        avgScore: parseFloat(row.avg_score),
        minScore: parseFloat(row.min_score),
        maxScore: parseFloat(row.max_score)
      }))

      reply
        .header('Cache-Control', 's-maxage=86400')
        .send({ pillar, regions })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Country timeline - all trust data for a specific country
  fastify.get('/trends/country/:iso3', async (request, reply) => {
    try {
      const { iso3 } = iso3ParamSchema.parse(request.params)

      // Get country info
      const countryResult = await db.query(`
        SELECT iso3, name, region FROM countries WHERE iso3 = $1
      `, [iso3])

      if (countryResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Country not found' })
      }

      const country = countryResult.rows[0]

      // Get observations, aggregating multiple sources for same year/trust_type
      // For interpersonal trust, only use binary methodology (WVS-compatible) to avoid
      // mixing incompatible scales (binary vs 4-point) which creates chart artifacts
      // For governance, use WJP only for consistent single-source trend lines
      const result = await db.query(`
        SELECT
          year,
          trust_type,
          ROUND(AVG(score_0_100)::numeric, 1) as score,
          STRING_AGG(DISTINCT source, ', ' ORDER BY source) as sources
        FROM observations
        WHERE iso3 = $1
          AND (
            trust_type IN ('institutional', 'partisan')
            OR (trust_type = 'interpersonal' AND methodology = 'binary')
            OR (trust_type = 'governance' AND source = 'WJP')
          )
        GROUP BY year, trust_type
        ORDER BY trust_type, year
      `, [iso3])

      // Group by trust type
      const series: Record<string, Array<{ year: number; score: number; source: string }>> = {}

      for (const row of result.rows) {
        if (!series[row.trust_type]) {
          series[row.trust_type] = []
        }
        series[row.trust_type].push({
          year: parseInt(row.year),
          score: parseFloat(row.score),
          source: row.sources
        })
      }

      reply
        .header('Cache-Control', 's-maxage=86400')
        .send({
          iso3: country.iso3,
          name: country.name,
          region: country.region,
          series
        })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Multi-country trends - batch fetch for any countries/pillars
  // ?iso3=MDA,EST,UZB (required, comma-separated)
  // &pillar=governance|interpersonal|institutional (optional, defaults to all)
  // &source=WJP|CPI|WGI|WVS (optional, filter to specific source)
  fastify.get('/trends/countries', async (request, reply) => {
    try {
      const { iso3, pillar, source } = request.query as {
        iso3?: string
        pillar?: string
        source?: string
      }

      if (!iso3) {
        return reply.status(400).send({
          error: 'Missing required parameter: iso3 (comma-separated ISO3 codes)'
        })
      }

      const countries = iso3.split(',').map(c => c.trim().toUpperCase()).filter(c => c.length === 3)

      if (countries.length === 0) {
        return reply.status(400).send({ error: 'No valid ISO3 codes provided' })
      }

      if (countries.length > 20) {
        return reply.status(400).send({ error: 'Maximum 20 countries per request' })
      }

      // Build WHERE clauses
      const conditions = ['o.iso3 = ANY($1)']
      const params: (string | string[])[] = [countries]

      if (pillar) {
        const validPillars = ['interpersonal', 'institutional', 'governance', 'media']
        if (!validPillars.includes(pillar)) {
          return reply.status(400).send({
            error: `Invalid pillar. Must be one of: ${validPillars.join(', ')}`
          })
        }
        // Map pillar name to trust_type value in database
        const trustType = pillar === 'media' ? 'media' : pillar
        conditions.push(`o.trust_type = $${params.length + 1}`)
        params.push(trustType)
      }

      if (source) {
        conditions.push(`o.source = $${params.length + 1}`)
        params.push(source.toUpperCase())
      }

      // For interpersonal, only use binary methodology (WVS-compatible)
      if (pillar === 'interpersonal') {
        conditions.push("o.methodology = 'binary'")
      }

      const result = await db.query(`
        SELECT
          o.iso3,
          c.name,
          c.region,
          o.trust_type,
          o.year,
          ROUND(AVG(o.score_0_100)::numeric, 1) as score,
          STRING_AGG(DISTINCT o.source, ', ' ORDER BY o.source) as sources
        FROM observations o
        JOIN countries c ON o.iso3 = c.iso3
        WHERE ${conditions.join(' AND ')}
        GROUP BY o.iso3, c.name, c.region, o.trust_type, o.year
        ORDER BY o.iso3, o.trust_type, o.year
      `, params)

      // Group by country, then by trust_type
      const data: Record<string, {
        name: string
        region: string
        [key: string]: string | Array<{ year: number; score: number; source: string }>
      }> = {}

      for (const row of result.rows) {
        if (!data[row.iso3]) {
          data[row.iso3] = {
            name: row.name,
            region: row.region,
          }
        }
        if (!data[row.iso3][row.trust_type]) {
          data[row.iso3][row.trust_type] = []
        }
        (data[row.iso3][row.trust_type] as Array<{ year: number; score: number; source: string }>).push({
          year: parseInt(row.year),
          score: parseFloat(row.score),
          source: row.sources
        })
      }

      reply
        .header('Cache-Control', 's-maxage=86400')
        .send({ countries: data })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default trendsRoute
