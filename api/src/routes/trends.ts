import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'
import { iso3ParamSchema, trendsGlobalQuerySchema, trendsCountriesQuerySchema } from '../lib/schemas'

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
  // ?pillar=social|institutions|media (default: social)
  // Legacy support: interpersonal|institutional|governance still work
  fastify.get('/trends/global', async (request, reply) => {
    try {
      const { pillar } = trendsGlobalQuerySchema.parse(request.query)

      // Map new pillar names to internal handling, with legacy support
      const pillarMap: Record<string, string> = {
        'social': 'social',
        'institutions': 'institutions',
        'media': 'media',
        // Legacy mappings
        'interpersonal': 'social',
        'institutional': 'institutions',
        'governance': 'institutions',
      }

      const normalizedPillar = pillarMap[pillar]
      // Schema already validates pillar, but keep for type narrowing
      if (!normalizedPillar) {
        return reply.status(400).send({
          error: `Invalid pillar. Must be one of: social, institutions, media`
        })
      }

      // Build query based on normalized pillar
      // For social, only use binary methodology (WVS-family)
      // For institutions, combine institutional trust + governance quality with gap
      // For media, use Reuters DNR

      if (normalizedPillar === 'social') {
        const query = `
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
        const result = await db.query(query)
        const countries = result.rows.map(row => ({
          iso3: row.iso3,
          name: row.name,
          region: row.region,
          year: parseInt(row.year),
          score: parseFloat(row.score),
          source: row.source
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'social', countries })

      } else if (normalizedPillar === 'institutions') {
        // Institutions pillar: combines institutional trust + governance quality + gap
        const query = `
          WITH latest_institutional AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              o.year as inst_year,
              o.score_0_100 as institutional_trust,
              o.source as inst_source
            FROM observations o
            WHERE o.trust_type = 'institutional'
            ORDER BY o.iso3, o.year DESC
          ),
          latest_governance AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              o.year as gov_year,
              ROUND(AVG(o.score_0_100)::numeric, 1) as governance_quality,
              STRING_AGG(DISTINCT o.source, ', ' ORDER BY o.source) as gov_sources
            FROM observations o
            WHERE o.trust_type = 'governance'
              AND o.source IN ('CPI', 'WGI')
            GROUP BY o.iso3, o.year
            ORDER BY o.iso3, o.year DESC
          )
          SELECT
            COALESCE(li.iso3, lg.iso3) as iso3,
            c.name,
            c.region,
            li.inst_year,
            ROUND(li.institutional_trust::numeric, 1) as institutional_trust,
            li.inst_source,
            lg.gov_year,
            lg.governance_quality,
            lg.gov_sources,
            CASE
              WHEN li.institutional_trust IS NOT NULL AND lg.governance_quality IS NOT NULL
              THEN ROUND((li.institutional_trust - lg.governance_quality)::numeric, 1)
              ELSE NULL
            END as trust_quality_gap
          FROM latest_institutional li
          FULL OUTER JOIN latest_governance lg ON li.iso3 = lg.iso3
          JOIN countries c ON COALESCE(li.iso3, lg.iso3) = c.iso3
          ORDER BY trust_quality_gap DESC NULLS LAST
        `
        const result = await db.query(query)
        const countries = result.rows.map(row => ({
          iso3: row.iso3,
          name: row.name,
          region: row.region,
          institutional_trust: row.institutional_trust ? parseFloat(row.institutional_trust) : null,
          institutional_year: row.inst_year ? parseInt(row.inst_year) : null,
          institutional_source: row.inst_source,
          governance_quality: row.governance_quality ? parseFloat(row.governance_quality) : null,
          governance_year: row.gov_year ? parseInt(row.gov_year) : null,
          governance_sources: row.gov_sources,
          trust_quality_gap: row.trust_quality_gap ? parseFloat(row.trust_quality_gap) : null
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'institutions', countries })

      } else {
        // media - Reuters Digital News Report
        const query = `
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
        const result = await db.query(query)
        const countries = result.rows.map(row => ({
          iso3: row.iso3,
          name: row.name,
          region: row.region,
          year: parseInt(row.year),
          score: parseFloat(row.score),
          source: row.source
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'media', countries })
      }

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Regional comparison - average pillar score by region
  // ?pillar=social|institutions|media (default: social)
  // Legacy support: interpersonal|institutional|governance still work
  fastify.get('/trends/regions', async (request, reply) => {
    try {
      const { pillar } = trendsGlobalQuerySchema.parse(request.query)

      // Map new pillar names to internal handling, with legacy support
      const pillarMap: Record<string, string> = {
        'social': 'social',
        'institutions': 'institutions',
        'media': 'media',
        // Legacy mappings
        'interpersonal': 'social',
        'institutional': 'institutions',
        'governance': 'institutions',
      }

      const normalizedPillar = pillarMap[pillar]
      // Schema already validates pillar, but keep for type narrowing
      if (!normalizedPillar) {
        return reply.status(400).send({
          error: `Invalid pillar. Must be one of: social, institutions, media`
        })
      }

      if (normalizedPillar === 'social') {
        const query = `
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
        const result = await db.query(query)
        const regions = result.rows.map(row => ({
          region: row.region,
          countryCount: parseInt(row.country_count),
          avgScore: parseFloat(row.avg_score),
          minScore: parseFloat(row.min_score),
          maxScore: parseFloat(row.max_score)
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'social', regions })

      } else if (normalizedPillar === 'institutions') {
        // Institutions pillar: average of institutional trust and governance quality per region
        // Also includes average trust_quality_gap
        const query = `
          WITH latest_institutional AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              c.region,
              o.score_0_100 as institutional_trust
            FROM observations o
            JOIN countries c ON o.iso3 = c.iso3
            WHERE o.trust_type = 'institutional'
              AND c.region IS NOT NULL AND c.region != ''
            ORDER BY o.iso3, o.year DESC
          ),
          latest_governance AS (
            SELECT DISTINCT ON (o.iso3)
              o.iso3,
              ROUND(AVG(o.score_0_100)::numeric, 1) as governance_quality
            FROM observations o
            WHERE o.trust_type = 'governance'
              AND o.source IN ('CPI', 'WGI')
            GROUP BY o.iso3, o.year
            ORDER BY o.iso3, o.year DESC
          ),
          combined AS (
            SELECT
              COALESCE(li.iso3, lg.iso3) as iso3,
              COALESCE(li.region, c.region) as region,
              li.institutional_trust,
              lg.governance_quality,
              CASE
                WHEN li.institutional_trust IS NOT NULL AND lg.governance_quality IS NOT NULL
                THEN li.institutional_trust - lg.governance_quality
                ELSE NULL
              END as trust_quality_gap
            FROM latest_institutional li
            FULL OUTER JOIN latest_governance lg ON li.iso3 = lg.iso3
            LEFT JOIN countries c ON lg.iso3 = c.iso3
            WHERE COALESCE(li.region, c.region) IS NOT NULL
          )
          SELECT
            region,
            COUNT(*) as country_count,
            ROUND(AVG(institutional_trust)::numeric, 1) as avg_institutional_trust,
            ROUND(AVG(governance_quality)::numeric, 1) as avg_governance_quality,
            ROUND(AVG(trust_quality_gap)::numeric, 1) as avg_trust_quality_gap
          FROM combined
          GROUP BY region
          ORDER BY avg_institutional_trust DESC NULLS LAST
        `
        const result = await db.query(query)
        const regions = result.rows.map(row => ({
          region: row.region,
          countryCount: parseInt(row.country_count),
          // Include avgScore for consistency with other pillars (use institutional trust as primary)
          avgScore: row.avg_institutional_trust ? parseFloat(row.avg_institutional_trust) : 0,
          minScore: 0, // Not applicable for composite pillar
          maxScore: 100,
          // Additional fields for institutions pillar
          avgInstitutionalTrust: row.avg_institutional_trust ? parseFloat(row.avg_institutional_trust) : null,
          avgGovernanceQuality: row.avg_governance_quality ? parseFloat(row.avg_governance_quality) : null,
          avgTrustQualityGap: row.avg_trust_quality_gap ? parseFloat(row.avg_trust_quality_gap) : null
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'institutions', regions })

      } else {
        // media
        const query = `
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
        const result = await db.query(query)
        const regions = result.rows.map(row => ({
          region: row.region,
          countryCount: parseInt(row.country_count),
          avgScore: parseFloat(row.avg_score),
          minScore: parseFloat(row.min_score),
          maxScore: parseFloat(row.max_score)
        }))
        return reply
          .header('Cache-Control', 's-maxage=86400')
          .send({ pillar: 'media', regions })
      }

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
  // &pillar=social|institutions|media (optional, defaults to all)
  // Legacy support: interpersonal|institutional|governance still work
  // &source=WJP|CPI|WGI|WVS (optional, filter to specific source)
  fastify.get('/trends/countries', async (request, reply) => {
    try {
      const { iso3, pillar, source } = trendsCountriesQuerySchema.parse(request.query)

      // Parse and validate ISO3 codes
      const countries = iso3.split(',').map(c => c.trim().toUpperCase()).filter(c => /^[A-Z]{3}$/.test(c))

      if (countries.length === 0) {
        return reply.status(400).send({ error: 'No valid ISO3 codes provided' })
      }

      if (countries.length > 20) {
        return reply.status(400).send({ error: 'Maximum 20 countries per request' })
      }

      // Map new pillar names to internal handling, with legacy support
      const pillarMap: Record<string, string> = {
        'social': 'social',
        'institutions': 'institutions',
        'media': 'media',
        // Legacy mappings
        'interpersonal': 'social',
        'institutional': 'institutions',
        'governance': 'institutions',
      }

      // Supplementary indicators (not pillars)
      const supplementaryTypes = ['financial']

      const normalizedPillar = pillar ? pillarMap[pillar] : undefined
      const isSupplementary = pillar && supplementaryTypes.includes(pillar)

      if (pillar && !normalizedPillar && !isSupplementary) {
        return reply.status(400).send({
          error: `Invalid pillar. Must be one of: social, institutions, media (or supplementary: financial)`
        })
      }

      // Build WHERE clauses based on normalized pillar or supplementary type
      const conditions = ['o.iso3 = ANY($1)']
      const params: (string | string[])[] = [countries]

      if (isSupplementary) {
        // Supplementary indicator - use trust_type directly (parameterized for safety)
        conditions.push(`o.trust_type = $${params.length + 1}`)
        params.push(pillar)
      } else if (normalizedPillar === 'social') {
        conditions.push("o.trust_type = 'interpersonal'")
        conditions.push("o.methodology = 'binary'")
      } else if (normalizedPillar === 'institutions') {
        conditions.push("o.trust_type IN ('institutional', 'governance')")
      } else if (normalizedPillar === 'media') {
        conditions.push("o.trust_type = 'media'")
      }

      if (source) {
        conditions.push(`o.source = $${params.length + 1}`)
        params.push(source.toUpperCase())
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
      // Map trust_types to new pillar structure in response
      const data: Record<string, {
        name: string
        region: string
        social?: Array<{ year: number; score: number; source: string }>
        institutions?: {
          institutional?: Array<{ year: number; score: number; source: string }>
          governance?: Array<{ year: number; score: number; source: string }>
        }
        media?: Array<{ year: number; score: number; source: string }>
        // Supplementary indicators
        financial?: Array<{ year: number; score: number; source: string }>
      }> = {}

      for (const row of result.rows) {
        if (!data[row.iso3]) {
          data[row.iso3] = {
            name: row.name,
            region: row.region,
          }
        }

        const dataPoint = {
          year: parseInt(row.year),
          score: parseFloat(row.score),
          source: row.sources
        }

        if (row.trust_type === 'interpersonal') {
          if (!data[row.iso3].social) data[row.iso3].social = []
          data[row.iso3].social!.push(dataPoint)
        } else if (row.trust_type === 'institutional') {
          if (!data[row.iso3].institutions) data[row.iso3].institutions = {}
          if (!data[row.iso3].institutions!.institutional) data[row.iso3].institutions!.institutional = []
          data[row.iso3].institutions!.institutional!.push(dataPoint)
        } else if (row.trust_type === 'governance') {
          if (!data[row.iso3].institutions) data[row.iso3].institutions = {}
          if (!data[row.iso3].institutions!.governance) data[row.iso3].institutions!.governance = []
          data[row.iso3].institutions!.governance!.push(dataPoint)
        } else if (row.trust_type === 'media') {
          if (!data[row.iso3].media) data[row.iso3].media = []
          data[row.iso3].media!.push(dataPoint)
        } else if (row.trust_type === 'financial') {
          if (!data[row.iso3].financial) data[row.iso3].financial = []
          data[row.iso3].financial!.push(dataPoint)
        }
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
