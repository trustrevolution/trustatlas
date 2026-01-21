import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'

const countriesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/countries', async (request, reply) => {
    try {
      // LIMIT 500 as safety bound - currently ~200 countries exist
      const result = await db.query(`
        SELECT iso3, name, region
        FROM countries
        ORDER BY name
        LIMIT 500
      `)

      const countries = result.rows.map(row => ({
        iso3: row.iso3,
        name: row.name,
        region: row.region
      }))

      reply
        .header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
        .send(countries)

    } catch (error) {
      request.log.error(error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default countriesRoute