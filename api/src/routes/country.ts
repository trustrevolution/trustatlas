import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'
import { countryQuerySchema, iso3ParamSchema } from '../lib/schemas'

const countryRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/country/:iso3', async (request, reply) => {
    try {
      const { iso3 } = iso3ParamSchema.parse(request.params)
      const { from, to } = countryQuerySchema.parse(request.query)

      // Get country info
      const countryResult = await db.query(`
        SELECT iso3, name, region FROM countries WHERE iso3 = $1
      `, [iso3])

      if (countryResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Country not found' })
      }

      const country = countryResult.rows[0]

      // Build year filter
      let yearFilter = ''
      const queryParams: (string | number)[] = [iso3]

      if (from && to) {
        yearFilter = 'AND year BETWEEN $2 AND $3'
        queryParams.push(from, to)
      } else if (from) {
        yearFilter = 'AND year >= $2'
        queryParams.push(from)
      } else if (to) {
        yearFilter = 'AND year <= $2'
        queryParams.push(to)
      }

      // Get time series data with pillar-specific confidence tiers
      const seriesResult = await db.query(`
        SELECT
          year,
          interpersonal,
          institutional,
          governance,
          media,
          confidence_tier,
          ci_lower,
          ci_upper,
          interpersonal_confidence_tier,
          interpersonal_ci_lower,
          interpersonal_ci_upper,
          institutional_confidence_tier,
          institutional_ci_lower,
          institutional_ci_upper,
          governance_confidence_tier,
          governance_ci_lower,
          governance_ci_upper,
          media_confidence_tier,
          media_ci_lower,
          media_ci_upper,
          sources_used
        FROM country_year
        WHERE iso3 = $1 ${yearFilter}
        ORDER BY year DESC
      `, queryParams)

      // Map to new 3-pillar structure with trust_quality_gap
      const series = seriesResult.rows.map(row => {
        const institutionalScore = row.institutional ? parseFloat(row.institutional) : null
        const governanceScore = row.governance ? parseFloat(row.governance) : null

        // Calculate trust_quality_gap when both values exist
        const trustQualityGap = (institutionalScore !== null && governanceScore !== null)
          ? Math.round((institutionalScore - governanceScore) * 10) / 10
          : null

        return {
          year: parseInt(row.year),
          // New pillar structure
          social: row.interpersonal ? {
            score: parseFloat(row.interpersonal),
            confidence_tier: row.interpersonal_confidence_tier || row.confidence_tier,
            ci_lower: row.interpersonal_ci_lower ? parseFloat(row.interpersonal_ci_lower) : (row.ci_lower ? parseFloat(row.ci_lower) : null),
            ci_upper: row.interpersonal_ci_upper ? parseFloat(row.interpersonal_ci_upper) : (row.ci_upper ? parseFloat(row.ci_upper) : null)
          } : null,
          institutions: {
            institutional_trust: institutionalScore !== null ? {
              score: institutionalScore,
              confidence_tier: row.institutional_confidence_tier || row.confidence_tier,
              ci_lower: row.institutional_ci_lower ? parseFloat(row.institutional_ci_lower) : (row.ci_lower ? parseFloat(row.ci_lower) : null),
              ci_upper: row.institutional_ci_upper ? parseFloat(row.institutional_ci_upper) : (row.ci_upper ? parseFloat(row.ci_upper) : null)
            } : null,
            governance_quality: governanceScore !== null ? {
              score: governanceScore,
              confidence_tier: row.governance_confidence_tier || 'A',
              ci_lower: row.governance_ci_lower ? parseFloat(row.governance_ci_lower) : null,
              ci_upper: row.governance_ci_upper ? parseFloat(row.governance_ci_upper) : null
            } : null,
            trust_quality_gap: trustQualityGap
          },
          media: row.media ? {
            score: parseFloat(row.media),
            confidence_tier: row.media_confidence_tier,
            ci_lower: row.media_ci_lower ? parseFloat(row.media_ci_lower) : null,
            ci_upper: row.media_ci_upper ? parseFloat(row.media_ci_upper) : null
          } : null,
          // Legacy fields for backward compatibility
          interpersonal: row.interpersonal ? {
            score: parseFloat(row.interpersonal),
            confidence_tier: row.interpersonal_confidence_tier || row.confidence_tier,
            ci_lower: row.interpersonal_ci_lower ? parseFloat(row.interpersonal_ci_lower) : (row.ci_lower ? parseFloat(row.ci_lower) : null),
            ci_upper: row.interpersonal_ci_upper ? parseFloat(row.interpersonal_ci_upper) : (row.ci_upper ? parseFloat(row.ci_upper) : null)
          } : null,
          institutional: row.institutional ? {
            score: parseFloat(row.institutional),
            confidence_tier: row.institutional_confidence_tier || row.confidence_tier,
            ci_lower: row.institutional_ci_lower ? parseFloat(row.institutional_ci_lower) : (row.ci_lower ? parseFloat(row.ci_lower) : null),
            ci_upper: row.institutional_ci_upper ? parseFloat(row.institutional_ci_upper) : (row.ci_upper ? parseFloat(row.ci_upper) : null)
          } : null,
          governance: row.governance ? {
            score: parseFloat(row.governance),
            confidence_tier: row.governance_confidence_tier || 'A',
            ci_lower: row.governance_ci_lower ? parseFloat(row.governance_ci_lower) : null,
            ci_upper: row.governance_ci_upper ? parseFloat(row.governance_ci_upper) : null
          } : null,
          confidence_tier: row.confidence_tier,
          ci_lower: row.ci_lower ? parseFloat(row.ci_lower) : null,
          ci_upper: row.ci_upper ? parseFloat(row.ci_upper) : null
        }
      })

      // Aggregate sources_used across all years
      const allSources = seriesResult.rows
        .filter(row => row.sources_used)
        .reduce((acc, row) => {
          // Handle both string (from older data) and object (JSONB) formats
          let sources: Record<string, string[]>
          try {
            sources = typeof row.sources_used === 'string'
              ? JSON.parse(row.sources_used)
              : row.sources_used
          } catch {
            // Skip malformed JSON data
            return acc
          }
          if (sources && typeof sources === 'object') {
            Object.keys(sources).forEach(pillar => {
              if (!acc[pillar]) acc[pillar] = new Set()
              if (Array.isArray(sources[pillar])) {
                sources[pillar].forEach((source: string) => acc[pillar].add(source))
              }
            })
          }
          return acc
        }, {} as Record<string, Set<string>>)

      const sourcesUsed = Object.fromEntries(
        Object.entries(allSources).map(([pillar, sourceSet]) => [
          pillar,
          Array.from(sourceSet as Set<string>)
        ])
      )

      const response = {
        iso3: country.iso3,
        name: country.name,
        region: country.region,
        series,
        sources_used: sourcesUsed
      }

      reply
        .header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
        .send(response)

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default countryRoute