/**
 * Shared country constants for charts
 *
 * Used by both chart components and server-api.ts to ensure
 * server-side prefetch matches client-side expectations.
 */

// Rule of Law (Against the Tide) - WJP data
export const RULE_LAW_IMPROVERS = [
  { iso3: 'MDA', name: 'Moldova', color: '#059669' },
  { iso3: 'EST', name: 'Estonia', color: '#0284c7' },
  { iso3: 'UZB', name: 'Uzbekistan', color: '#d97706' },
] as const

export const RULE_LAW_DECLINERS = [
  { iso3: 'HUN', name: 'Hungary' },
  { iso3: 'TUR', name: 'Turkey' },
  { iso3: 'BRA', name: 'Brazil' },
  { iso3: 'VEN', name: 'Venezuela' },
  { iso3: 'EGY', name: 'Egypt' },
  { iso3: 'NIC', name: 'Nicaragua' },
] as const

export const RULE_LAW_ISO3 = [
  ...RULE_LAW_IMPROVERS.map(c => c.iso3),
  ...RULE_LAW_DECLINERS.map(c => c.iso3),
]

// COVID Trust Impact - ESS institutional trust
export const COVID_DECLINERS = [
  { iso3: 'NLD', name: 'Netherlands', color: '#ef4444' },
  { iso3: 'AUT', name: 'Austria', color: '#f97316' },
  { iso3: 'SWE', name: 'Sweden', color: '#eab308' },
  { iso3: 'FRA', name: 'France', color: '#ec4899' },
  { iso3: 'GBR', name: 'United Kingdom', color: '#f43f5e' },
  { iso3: 'BEL', name: 'Belgium', color: '#fb7185' },
  { iso3: 'DNK', name: 'Denmark', color: '#fda4af' },
] as const

export const COVID_STABLE = [
  { iso3: 'CHE', name: 'Switzerland', color: '#10b981' },
  { iso3: 'IRL', name: 'Ireland', color: '#34d399' },
  { iso3: 'FIN', name: 'Finland', color: '#06b6d4' },
] as const

export const COVID_COUNTRIES = [...COVID_DECLINERS, ...COVID_STABLE] as const
export const COVID_ISO3 = COVID_COUNTRIES.map(c => c.iso3)

// Trust Collapse - WVS interpersonal trust
export const COLLAPSE_COUNTRIES = [
  { iso3: 'IRN', name: 'Iran', color: '#dc2626', drop: '−55pp' },
  { iso3: 'IDN', name: 'Indonesia', color: '#ea580c', drop: '−46pp' },
  { iso3: 'IRQ', name: 'Iraq', color: '#d97706', drop: '−36pp' },
  { iso3: 'EGY', name: 'Egypt', color: '#ca8a04', drop: '−31pp' },
] as const

export const COLLAPSE_ISO3 = COLLAPSE_COUNTRIES.map(c => c.iso3)

// Trust Inversion - WVS social vs institutional
export const INVERSION_COUNTRIES = [
  { iso3: 'BRA', name: 'Brazil' },
  { iso3: 'GRC', name: 'Greece' },
  { iso3: 'TUR', name: 'Turkey' },
  { iso3: 'CYP', name: 'Cyprus' },
] as const

export const INVERSION_ISO3 = INVERSION_COUNTRIES.map(c => c.iso3)

// Financial Trust Paradox - WVS financial + WGI governance
export const FINANCIAL_COUNTRIES = [
  { iso3: 'VNM', name: 'Vietnam' },
  { iso3: 'CHN', name: 'China' },
  { iso3: 'TJK', name: 'Tajikistan' },
  { iso3: 'UZB', name: 'Uzbekistan' },
  { iso3: 'DEU', name: 'Germany' },
  { iso3: 'CAN', name: 'Canada' },
  { iso3: 'NLD', name: 'Netherlands' },
  { iso3: 'GBR', name: 'United Kingdom' },
  { iso3: 'AUS', name: 'Australia' },
  { iso3: 'USA', name: 'United States' },
] as const

export const FINANCIAL_ISO3 = FINANCIAL_COUNTRIES.map(c => c.iso3)
