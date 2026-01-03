/**
 * Data Provenance Component Library - Design Tokens
 *
 * Configuration constants for confidence tiers and data sources.
 * These tokens provide consistent styling and metadata across all
 * data provenance components.
 *
 * @packageDocumentation
 */

import type { ConfidenceTier, ConfidenceConfig, SourceId, SourceConfig } from './types'

// =============================================================================
// Confidence Tier Configuration
// =============================================================================

/**
 * Display configuration for each confidence tier.
 *
 * @example
 * ```tsx
 * const conf = CONFIDENCE_TIERS['A']
 * <span className={conf.tailwindText}>{conf.label}</span>
 * ```
 */
export const CONFIDENCE_TIERS: Record<ConfidenceTier, ConfidenceConfig> = {
  A: {
    label: 'High confidence',
    description: 'Recent survey data (within 3 years) combined with governance indicators',
    colorHex: '#34d399', // emerald-400
    tailwindText: 'text-emerald-400',
    tailwindBg: 'bg-emerald-400',
    tailwindBorder: 'border-emerald-400',
  },
  B: {
    label: 'Moderate confidence',
    description: 'Older survey data (3-7 years) or single pillar with governance proxy',
    colorHex: '#fbbf24', // amber-400
    tailwindText: 'text-amber-400',
    tailwindBg: 'bg-amber-400',
    tailwindBorder: 'border-amber-400',
  },
  C: {
    label: 'Estimate',
    description: 'Based on governance indicators only (no valid surveys within 7 years)',
    colorHex: '#94a3b8', // slate-400
    tailwindText: 'text-slate-400',
    tailwindBg: 'bg-slate-400',
    tailwindBorder: 'border-slate-400',
  },
} as const

// =============================================================================
// Data Source Configuration
// =============================================================================

/**
 * Metadata and display configuration for all data sources.
 *
 * @example
 * ```tsx
 * const source = DATA_SOURCES['WVS']
 * <a href={source.url}>{source.name}</a>
 * <span className="badge-license">{source.license}</span>
 * ```
 */
export const DATA_SOURCES: Record<SourceId, SourceConfig> = {
  // Survey Sources - Interpersonal & Institutional Trust
  WVS: {
    id: 'WVS',
    abbrev: 'WVS',
    name: 'World Values Survey',
    license: 'Non-commercial',
    url: 'https://www.worldvaluessurvey.org/',
    methodology: 'National probability samples, ~1,200 respondents per country',
    pillars: ['interpersonal', 'institutional', 'media'],
    frequency: '~5 years',
  },
  EVS: {
    id: 'EVS',
    abbrev: 'EVS',
    name: 'European Values Study',
    license: 'Non-commercial',
    url: 'https://europeanvaluesstudy.eu/',
    methodology: 'European probability samples, harmonized with WVS methodology',
    pillars: ['interpersonal'],
    frequency: '~9 years',
  },
  ESS: {
    id: 'ESS',
    abbrev: 'ESS',
    name: 'European Social Survey',
    license: 'CC BY-NC-SA',
    url: 'https://www.europeansocialsurvey.org/',
    methodology: 'Biennial cross-national survey, strict probability sampling',
    pillars: ['interpersonal', 'institutional'],
    frequency: '2 years',
  },
  GSS: {
    id: 'GSS',
    abbrev: 'GSS',
    name: 'General Social Survey',
    license: 'Public Domain',
    url: 'https://gss.norc.org/',
    methodology: 'US household probability sample, ~2,000 respondents',
    pillars: ['interpersonal', 'institutional'],
    frequency: '~2 years',
  },
  ANES: {
    id: 'ANES',
    abbrev: 'ANES',
    name: 'American National Election Studies',
    license: 'CC0',
    url: 'https://electionstudies.org/',
    methodology: 'US nationally representative sample, election cycle timing',
    pillars: ['institutional'],
    frequency: '2-4 years',
  },
  CES: {
    id: 'CES',
    abbrev: 'CES',
    name: 'Canadian Election Study',
    license: 'Academic',
    url: 'https://www.ces-eec.ca/',
    methodology: 'Canadian nationally representative sample',
    pillars: ['interpersonal', 'institutional'],
    frequency: '~4 years',
  },
  OECD: {
    id: 'OECD',
    abbrev: 'OECD',
    name: 'OECD Trust Indicators',
    license: 'CC BY 4.0',
    url: 'https://data.oecd.org/gga/trust-in-government.htm',
    methodology: 'Harmonized survey data from OECD member countries',
    pillars: ['institutional'],
    frequency: 'Annual',
  },

  // Regional Barometers
  AFRO: {
    id: 'AFRO',
    abbrev: 'Afro',
    name: 'Afrobarometer',
    license: 'Non-commercial',
    url: 'https://www.afrobarometer.org/',
    methodology: 'Face-to-face interviews in African countries',
    pillars: ['interpersonal', 'institutional'],
    frequency: '~2 years',
  },
  ARAB: {
    id: 'ARAB',
    abbrev: 'Arab',
    name: 'Arab Barometer',
    license: 'Non-commercial',
    url: 'https://www.arabbarometer.org/',
    methodology: 'Face-to-face interviews in MENA region',
    pillars: ['interpersonal', 'institutional'],
    frequency: '~2 years',
  },
  LATINO: {
    id: 'LATINO',
    abbrev: 'Latino',
    name: 'Latinobarómetro',
    license: 'Non-commercial',
    url: 'https://www.latinobarometro.org/',
    methodology: 'Face-to-face interviews in Latin America',
    pillars: ['interpersonal', 'institutional'],
    frequency: 'Annual',
  },
  ASIAN: {
    id: 'ASIAN',
    abbrev: 'Asian',
    name: 'Asian Barometer',
    license: 'Academic',
    url: 'https://www.asianbarometer.org/',
    methodology: 'Face-to-face interviews in Asian countries',
    pillars: ['interpersonal', 'institutional'],
    frequency: '~4 years',
  },

  // Governance Sources
  CPI: {
    id: 'CPI',
    abbrev: 'CPI',
    name: 'Transparency International CPI',
    license: 'CC BY 4.0',
    url: 'https://www.transparency.org/cpi',
    methodology: 'Composite of 13 expert assessments and business surveys',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  WGI: {
    id: 'WGI',
    abbrev: 'WGI',
    name: 'World Bank WGI',
    license: 'CC BY 4.0',
    url: 'https://info.worldbank.org/governance/wgi/',
    methodology: 'Aggregate of 30+ data sources across six governance dimensions',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  WJP: {
    id: 'WJP',
    abbrev: 'WJP',
    name: 'World Justice Project',
    license: 'Non-commercial',
    url: 'https://worldjusticeproject.org/',
    methodology: 'Household and expert surveys on rule of law',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  FH: {
    id: 'FH',
    abbrev: 'FH',
    name: 'Freedom House',
    license: 'CC BY 4.0',
    url: 'https://freedomhouse.org/',
    methodology: 'Expert assessment of political rights and civil liberties',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  VDEM: {
    id: 'VDEM',
    abbrev: 'V-Dem',
    name: 'Varieties of Democracy',
    license: 'CC BY 4.0',
    url: 'https://www.v-dem.net/',
    methodology: 'Expert coding of democracy indicators across 450+ variables',
    pillars: ['governance'],
    frequency: 'Annual',
  },

  // Media Trust Sources
  Reuters_DNR: {
    id: 'Reuters_DNR',
    abbrev: 'Reuters',
    name: 'Reuters Digital News Report',
    license: 'Non-commercial',
    url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report',
    methodology: 'Online survey of news consumers across 40+ countries',
    pillars: ['media'],
    frequency: 'Annual',
  },
  Eurobarometer: {
    id: 'Eurobarometer',
    abbrev: 'EB',
    name: 'Eurobarometer',
    license: 'CC BY 4.0',
    url: 'https://europa.eu/eurobarometer/',
    methodology: 'Face-to-face surveys in EU member states',
    pillars: ['institutional', 'media'],
    frequency: 'Biannual',
  },

  // Database Aliases (same config as canonical, for lookup compatibility)
  FreedomHouse: {
    id: 'FreedomHouse',
    abbrev: 'FH',
    name: 'Freedom House',
    license: 'CC BY 4.0',
    url: 'https://freedomhouse.org/',
    methodology: 'Expert assessment of political rights and civil liberties',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  'V-Dem': {
    id: 'V-Dem',
    abbrev: 'V-Dem',
    name: 'Varieties of Democracy',
    license: 'CC BY 4.0',
    url: 'https://www.v-dem.net/',
    methodology: 'Expert coding of democracy indicators across 450+ variables',
    pillars: ['governance'],
    frequency: 'Annual',
  },
  'WJP-Corruption': {
    id: 'WJP-Corruption',
    abbrev: 'WJP',
    name: 'World Justice Project - Corruption',
    license: 'Non-commercial',
    url: 'https://worldjusticeproject.org/',
    methodology: 'Household and expert surveys on corruption perception',
    pillars: ['governance'],
    frequency: 'Annual',
  },
} as const

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get confidence tier configuration with fallback to tier C.
 */
export function getConfidenceConfig(tier: string | null | undefined): ConfidenceConfig {
  if (tier && tier in CONFIDENCE_TIERS) {
    return CONFIDENCE_TIERS[tier as ConfidenceTier]
  }
  return CONFIDENCE_TIERS.C
}

/**
 * Get source configuration by ID or abbreviation.
 */
export function getSourceConfig(idOrAbbrev: string): SourceConfig | undefined {
  // Direct lookup
  if (idOrAbbrev in DATA_SOURCES) {
    return DATA_SOURCES[idOrAbbrev as SourceId]
  }
  // Search by abbreviation (case-insensitive)
  const normalized = idOrAbbrev.toUpperCase()
  return Object.values(DATA_SOURCES).find(
    (s) => s.abbrev.toUpperCase() === normalized || s.id === normalized
  )
}

/**
 * Get all sources that contribute to a specific pillar.
 */
export function getSourcesForPillar(
  pillar: 'interpersonal' | 'institutional' | 'governance' | 'media'
): SourceConfig[] {
  return Object.values(DATA_SOURCES).filter((s) => s.pillars.includes(pillar))
}

/**
 * Parse a comma-separated source string into SourceConfig array.
 *
 * @example
 * ```ts
 * parseSourceString('WVS, GSS') // [DATA_SOURCES.WVS, DATA_SOURCES.GSS]
 * ```
 */
export function parseSourceString(sources: string): SourceConfig[] {
  return sources
    .split(',')
    .map((s) => s.trim())
    .map(getSourceConfig)
    .filter((s): s is SourceConfig => s !== undefined)
}
