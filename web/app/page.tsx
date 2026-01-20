/**
 * Homepage - Server Component
 *
 * Fetches all chart data server-side in parallel, then passes to client component.
 * This eliminates the loading waterfall that was causing 2-3 second delays.
 *
 * Data is revalidated every 24 hours (ISR) since ETL runs at most daily.
 */

import { fetchAllHomePageData } from '@/lib/server-api'
import HomePageClient from '@/components/HomePageClient'

// Revalidate daily to pick up weekly hero rotation changes
export const revalidate = 86400

// Number of stories (for hero rotation)
const STORY_COUNT = 6

/**
 * Compute hero indices server-side to avoid hydration mismatch.
 * Week-based deterministic rotation - same heroes all week, rotates automatically.
 */
function computeHeroIndices(): [number, number] {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const offset = week % STORY_COUNT
  return [offset, (offset + 1) % STORY_COUNT]
}

export default async function HomePage() {
  // Fetch all data in parallel - single network round-trip
  const data = await fetchAllHomePageData()

  // Compute hero indices on server for consistent hydration
  const heroIndices = computeHeroIndices()

  return (
    <HomePageClient
      stats={data.stats}
      chartData={{
        usaTrends: data.usaTrends,
        ruleLawTrends: data.ruleLawTrends,
        covidImpact: data.covidImpact,
        trustCollapse: data.trustCollapse,
        trustInversion: data.trustInversion,
        financialParadox: data.financialParadox,
      }}
      heroIndices={heroIndices}
    />
  )
}
