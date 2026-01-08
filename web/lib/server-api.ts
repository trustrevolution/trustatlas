/**
 * Server-side API utilities for Next.js Server Components
 *
 * These functions fetch data during SSR/SSG with appropriate caching.
 * Used by page.tsx to pre-fetch chart data before hydration.
 */

import type { Stats, USATrends, MultiCountryData } from './api'
import type { TrustInversionInitialData } from '@/components/charts/TrustInversion'
import type { FinancialParadoxInitialData } from '@/components/charts/FinancialTrustParadox'
import {
  RULE_LAW_ISO3,
  COVID_ISO3,
  COLLAPSE_ISO3,
  INVERSION_ISO3,
  FINANCIAL_ISO3,
} from './chart-countries'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://trustatlas-api.vercel.app'

// Revalidate every hour (faster updates, still reasonable cache)
const REVALIDATE_SECONDS = 3600

/**
 * Fetch with error handling - returns null on failure for graceful degradation
 */
async function safeFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error(`API error: ${endpoint} returned ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.error(`API fetch failed: ${endpoint}`, err)
    return null
  }
}

// ============================================================================
// Individual fetch functions for each chart's data needs
// ============================================================================

export async function fetchStats(): Promise<Stats | null> {
  return safeFetch<Stats>('/stats')
}

export async function fetchUSATrends(): Promise<USATrends | null> {
  return safeFetch<USATrends>('/trends/usa')
}

// RuleLawTrends: WJP governance data for improvers + decliners
export async function fetchRuleLawTrends(): Promise<MultiCountryData | null> {
  const iso3 = RULE_LAW_ISO3.join(',')
  return safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=institutions&source=WJP`)
}

// CovidTrustImpact: ESS institutional trust for European countries
export async function fetchCovidImpact(): Promise<MultiCountryData | null> {
  const iso3 = COVID_ISO3.join(',')
  return safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=institutions`)
}

// TrustCollapse: WVS interpersonal trust for countries with dramatic collapses
export async function fetchTrustCollapse(): Promise<MultiCountryData | null> {
  const iso3 = COLLAPSE_ISO3.join(',')
  return safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=social`)
}

// TrustInversion: Both social and institutions pillars for comparison
export async function fetchTrustInversion(): Promise<TrustInversionInitialData> {
  const iso3 = INVERSION_ISO3.join(',')
  const [social, institutions] = await Promise.all([
    safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=social`),
    safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=institutions`),
  ])
  return { social, institutions }
}

// FinancialTrustParadox: Financial trust + governance quality
export async function fetchFinancialParadox(): Promise<FinancialParadoxInitialData> {
  const iso3 = FINANCIAL_ISO3.join(',')
  const [financial, governance] = await Promise.all([
    safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=financial`),
    safeFetch<MultiCountryData>(`/trends/countries?iso3=${iso3}&pillar=institutions&source=WGI`),
  ])
  return { financial, governance }
}

// ============================================================================
// Aggregated fetch for all homepage charts
// ============================================================================

export interface HomePageData {
  stats: Stats | null
  usaTrends: USATrends | null
  ruleLawTrends: MultiCountryData | null
  covidImpact: MultiCountryData | null
  trustCollapse: MultiCountryData | null
  trustInversion: TrustInversionInitialData
  financialParadox: FinancialParadoxInitialData
}

export async function fetchAllHomePageData(): Promise<HomePageData> {
  const [
    stats,
    usaTrends,
    ruleLawTrends,
    covidImpact,
    trustCollapse,
    trustInversion,
    financialParadox,
  ] = await Promise.all([
    fetchStats(),
    fetchUSATrends(),
    fetchRuleLawTrends(),
    fetchCovidImpact(),
    fetchTrustCollapse(),
    fetchTrustInversion(),
    fetchFinancialParadox(),
  ])

  return {
    stats,
    usaTrends,
    ruleLawTrends,
    covidImpact,
    trustCollapse,
    trustInversion,
    financialParadox,
  }
}
