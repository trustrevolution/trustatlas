/**
 * Country Label Utilities
 *
 * Provides consistent, human-readable country name formatting
 * for chart labels, tooltips, and accessibility.
 *
 * Design principle: Never use cryptic ISO3 codes (like "IRN") as user-facing labels.
 * Instead, use recognizable names ("Iran") or common abbreviations ("UK", "US").
 */

/**
 * Country label variants for different contexts
 */
export interface CountryLabels {
  iso3: string
  /** Human-friendly short label for chart labels (default) */
  displayLabel: string
  /** Complete name for tooltips and accessibility */
  fullName: string
}

/**
 * Common abbreviations that are more recognizable than full names or ISO codes
 * Only override when the abbreviation is universally recognized
 */
const DISPLAY_OVERRIDES: Record<string, string> = {
  // Universally recognized abbreviations
  GBR: 'UK',
  USA: 'US',
  ARE: 'UAE',

  // Directional prefixes (shorter than full names)
  PRK: 'N. Korea',
  KOR: 'S. Korea',

  // Common short forms
  HKG: 'Hong Kong',
  TWN: 'Taiwan',
  CZE: 'Czechia',
  MKD: 'N. Macedonia',
  BIH: 'Bosnia',
  CAF: 'C. Africa',
  COD: 'DR Congo',
  COG: 'Congo',
  DOM: 'Dominican Rep.',
  PNG: 'Papua N.G.',
  TTO: 'Trinidad',
  VCT: 'St. Vincent',
  KNA: 'St. Kitts',
  LCA: 'St. Lucia',
}

/**
 * Get display label for a country
 *
 * Returns a human-readable label suitable for chart end labels, legends, etc.
 * Uses common abbreviations (UK, US, UAE) where universally recognized,
 * otherwise returns the full name.
 *
 * @param iso3 - ISO 3166-1 alpha-3 code
 * @param fullName - Full country name
 * @returns Human-readable short label
 *
 * @example
 * shortName('GBR', 'United Kingdom') // => 'UK'
 * shortName('IRN', 'Iran')           // => 'Iran'
 * shortName('NLD', 'Netherlands')    // => 'Netherlands'
 */
export function shortName(iso3: string, fullName: string): string {
  return DISPLAY_OVERRIDES[iso3] ?? fullName
}

/**
 * Get all label variants for a country
 *
 * @param iso3 - ISO 3166-1 alpha-3 code
 * @param fullName - Full country name
 * @returns Object with all label variants
 */
export function getCountryLabels(iso3: string, fullName: string): CountryLabels {
  return {
    iso3,
    displayLabel: shortName(iso3, fullName),
    fullName,
  }
}

/**
 * Pre-built labels for commonly used countries in Trust Atlas charts
 * Saves repeated lookups and ensures consistency
 */
export const COUNTRY_LABELS = {
  // High-income democracies (common in COVID/institutional trust charts)
  GBR: { iso3: 'GBR', displayLabel: 'UK', fullName: 'United Kingdom' },
  USA: { iso3: 'USA', displayLabel: 'US', fullName: 'United States' },
  NLD: { iso3: 'NLD', displayLabel: 'Netherlands', fullName: 'Netherlands' },
  DEU: { iso3: 'DEU', displayLabel: 'Germany', fullName: 'Germany' },
  FRA: { iso3: 'FRA', displayLabel: 'France', fullName: 'France' },
  CHE: { iso3: 'CHE', displayLabel: 'Switzerland', fullName: 'Switzerland' },
  AUT: { iso3: 'AUT', displayLabel: 'Austria', fullName: 'Austria' },
  BEL: { iso3: 'BEL', displayLabel: 'Belgium', fullName: 'Belgium' },
  DNK: { iso3: 'DNK', displayLabel: 'Denmark', fullName: 'Denmark' },
  SWE: { iso3: 'SWE', displayLabel: 'Sweden', fullName: 'Sweden' },
  FIN: { iso3: 'FIN', displayLabel: 'Finland', fullName: 'Finland' },
  IRL: { iso3: 'IRL', displayLabel: 'Ireland', fullName: 'Ireland' },

  // Middle East / North Africa
  IRN: { iso3: 'IRN', displayLabel: 'Iran', fullName: 'Iran' },
  IRQ: { iso3: 'IRQ', displayLabel: 'Iraq', fullName: 'Iraq' },
  EGY: { iso3: 'EGY', displayLabel: 'Egypt', fullName: 'Egypt' },
  TUR: { iso3: 'TUR', displayLabel: 'Turkey', fullName: 'Turkey' },
  ARE: { iso3: 'ARE', displayLabel: 'UAE', fullName: 'United Arab Emirates' },

  // Asia
  IDN: { iso3: 'IDN', displayLabel: 'Indonesia', fullName: 'Indonesia' },
  KOR: { iso3: 'KOR', displayLabel: 'S. Korea', fullName: 'South Korea' },
  PRK: { iso3: 'PRK', displayLabel: 'N. Korea', fullName: 'North Korea' },

  // Latin America
  BRA: { iso3: 'BRA', displayLabel: 'Brazil', fullName: 'Brazil' },
  VEN: { iso3: 'VEN', displayLabel: 'Venezuela', fullName: 'Venezuela' },
  NIC: { iso3: 'NIC', displayLabel: 'Nicaragua', fullName: 'Nicaragua' },

  // Europe (non-EU or special cases)
  GRC: { iso3: 'GRC', displayLabel: 'Greece', fullName: 'Greece' },
  CYP: { iso3: 'CYP', displayLabel: 'Cyprus', fullName: 'Cyprus' },
  HUN: { iso3: 'HUN', displayLabel: 'Hungary', fullName: 'Hungary' },
  MDA: { iso3: 'MDA', displayLabel: 'Moldova', fullName: 'Moldova' },
  EST: { iso3: 'EST', displayLabel: 'Estonia', fullName: 'Estonia' },
  UZB: { iso3: 'UZB', displayLabel: 'Uzbekistan', fullName: 'Uzbekistan' },
} as const
