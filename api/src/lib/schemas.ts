import { z } from 'zod'

// Path parameter schemas
export const iso3ParamSchema = z.object({
  iso3: z.string().regex(/^[A-Z]{3}$/, 'Invalid ISO3 country code')
})

// Query parameter schemas
export const scoreQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  trust_type: z.enum(['interpersonal', 'institutional', 'governance']).default('governance')
})

export const countryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  to: z.string().regex(/^\d{4}$/).transform(Number).optional()
})

// Response schemas
export const countrySchema = z.object({
  iso3: z.string(),
  name: z.string(),
  region: z.string().nullable()
})

export const countryResponseSchema = {
  type: 'object',
  required: ['iso3', 'name'],
  properties: {
    iso3: { type: 'string' },
    name: { type: 'string' },
    region: { type: ['string', 'null'] }
  }
}

export const scoreSchema = z.object({
  iso3: z.string(),
  year: z.number(),
  score: z.number().nullable(),
  confidence_tier: z.enum(['A', 'B', 'C']).nullable()
})

export const countryDetailSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  region: z.string().nullable(),
  series: z.array(z.object({
    year: z.number(),
    interpersonal: z.number().nullable(),
    institutional: z.number().nullable(),
    governance: z.number().nullable(),
    confidence_tier: z.enum(['A', 'B', 'C']).nullable()
  })),
  sources_used: z.record(z.array(z.string())).optional()
})

export type Country = z.infer<typeof countrySchema>
export type Score = z.infer<typeof scoreSchema>
export type CountryDetail = z.infer<typeof countryDetailSchema>