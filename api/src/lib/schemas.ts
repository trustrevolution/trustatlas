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

// Source parameter schema - alphanumeric with underscores/hyphens, reasonable length
export const sourceParamSchema = z.object({
  source: z.string().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/, 'Invalid source identifier')
})

// Digital indicators query schema
export const digitalIndicatorsQuerySchema = z.object({
  iso3: z.string().max(200).optional(), // comma-separated ISO3 codes
  year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').optional(),
  indicator: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Invalid indicator name').default('social_media_penetration')
})

// Valid pillars for trends endpoints (includes legacy names)
const validPillars = ['social', 'institutions', 'media', 'interpersonal', 'institutional', 'governance'] as const

// Trends query schemas
export const trendsGlobalQuerySchema = z.object({
  pillar: z.enum(validPillars).default('social')
})

export const trendsCountriesQuerySchema = z.object({
  iso3: z.string().min(3).max(200), // required, comma-separated ISO3 codes
  pillar: z.enum([...validPillars, 'financial']).optional(),
  source: z.string().max(20).regex(/^[A-Z_]+$/, 'Invalid source').optional()
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