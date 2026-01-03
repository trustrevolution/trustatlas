import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'

interface SourceMetadata {
  source: string
  description: string
  cadence: string | null
  coverage: string | null
  license: string | null
  access_mode: string | null
  citation_template: string | null
  attribution_text: string | null
  url: string | null
  redistribution_allowed: boolean
  commercial_use_allowed: boolean
  requires_registration: boolean
  data_type: string
}

const sourcesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /sources
   * Returns metadata for all data sources including licensing and attribution requirements
   */
  fastify.get('/sources', async (request, reply) => {
    try {
      const result = await db.query<SourceMetadata>(`
        SELECT
          source,
          description,
          cadence,
          coverage,
          license,
          access_mode,
          citation_template,
          attribution_text,
          url,
          COALESCE(redistribution_allowed, true) as redistribution_allowed,
          COALESCE(commercial_use_allowed, true) as commercial_use_allowed,
          COALESCE(requires_registration, false) as requires_registration,
          COALESCE(data_type, 'aggregated') as data_type
        FROM source_metadata
        ORDER BY source
      `)

      const sources = result.rows.map(row => ({
        source: row.source,
        description: row.description,
        cadence: row.cadence,
        coverage: row.coverage,
        license: row.license,
        access_mode: row.access_mode,
        citation_template: row.citation_template,
        attribution_text: row.attribution_text,
        url: row.url,
        compliance: {
          redistribution_allowed: row.redistribution_allowed,
          commercial_use_allowed: row.commercial_use_allowed,
          requires_registration: row.requires_registration,
          data_type: row.data_type
        }
      }))

      reply
        .header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
        .send({
          count: sources.length,
          sources,
          note: 'Trust Atlas uses only derived aggregate statistics from survey sources. Raw microdata is not redistributed.'
        })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  /**
   * GET /sources/:source
   * Returns metadata for a specific data source
   */
  fastify.get('/sources/:source', async (request, reply) => {
    try {
      const { source } = request.params as { source: string }

      const result = await db.query<SourceMetadata>(`
        SELECT
          source,
          description,
          cadence,
          coverage,
          license,
          access_mode,
          citation_template,
          attribution_text,
          url,
          COALESCE(redistribution_allowed, true) as redistribution_allowed,
          COALESCE(commercial_use_allowed, true) as commercial_use_allowed,
          COALESCE(requires_registration, false) as requires_registration,
          COALESCE(data_type, 'aggregated') as data_type
        FROM source_metadata
        WHERE LOWER(source) = LOWER($1)
      `, [source])

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Source not found' })
      }

      const row = result.rows[0]

      reply
        .header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
        .send({
          source: row.source,
          description: row.description,
          cadence: row.cadence,
          coverage: row.coverage,
          license: row.license,
          access_mode: row.access_mode,
          citation_template: row.citation_template,
          attribution_text: row.attribution_text,
          url: row.url,
          compliance: {
            redistribution_allowed: row.redistribution_allowed,
            commercial_use_allowed: row.commercial_use_allowed,
            requires_registration: row.requires_registration,
            data_type: row.data_type
          }
        })

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default sourcesRoute
