'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGrapherState } from '@/lib/grapher-state'
import { api, type Country } from '@/lib/api'
import { PILLARS } from '@/lib/design-tokens'
import { type ExportDataPoint } from '@/lib/export'
import { PillarToggle } from './PillarToggle'
import { CountryPicker } from './CountryPicker'
import { GrapherChart } from './GrapherChart'
import { DownloadButton } from './DownloadButton'
import { ShareButton } from './ShareButton'

interface DataPoint {
  year: number
  score: number
  source?: string
}

interface CountryData {
  iso3: string
  name: string
  data: DataPoint[]
}

interface GrapherProps {
  className?: string
}

export function Grapher({ className }: GrapherProps) {
  const { state, addCountry, removeCountry, setPillar } = useGrapherState()
  const [allCountries, setAllCountries] = useState<Country[]>([])
  const [chartData, setChartData] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch list of all countries for picker
  useEffect(() => {
    api.getCountries().then(setAllCountries).catch(console.error)
  }, [])

  // Fetch data when countries or pillar changes
  useEffect(() => {
    if (state.countries.length === 0) {
      setChartData([])
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await api.getMultiCountryTrends(state.countries, {
          pillar: state.pillar,
        })

        const results: CountryData[] = state.countries.map((iso3) => {
          const countryInfo = allCountries.find((c) => c.iso3 === iso3)
          const countryData = data.countries[iso3]

          // Handle different data structures for each pillar
          let pillarData: Array<{ year: number; score: number; source?: string }> = []
          if (state.pillar === 'social') {
            pillarData = countryData?.social || []
          } else if (state.pillar === 'institutions') {
            // For institutions, use the institutional trust data
            pillarData = countryData?.institutions?.institutional || []
          } else {
            pillarData = countryData?.media || []
          }

          return {
            iso3,
            name: countryInfo?.name || iso3,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: pillarData.map((d: any) => ({
              year: d.year,
              score: d.score,
              source: d.source,
            })),
          }
        })

        setChartData(results)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [state.countries, state.pillar, allCountries])

  // Prepare export data
  const exportData: ExportDataPoint[] = useMemo(() => {
    return chartData.flatMap((country) =>
      country.data.map((d) => ({
        country: country.name,
        iso3: country.iso3,
        year: d.year,
        pillar: state.pillar,
        score: d.score,
        source: d.source || 'Unknown',
      }))
    )
  }, [chartData, state.pillar])

  // Collect unique sources
  const sources = useMemo(() => {
    const sourceSet = new Set<string>()
    chartData.forEach((country) => {
      country.data.forEach((d) => {
        if (d.source) {
          d.source.split(',').forEach((s) => sourceSet.add(s.trim()))
        }
      })
    })
    return Array.from(sourceSet)
  }, [chartData])

  const pillarConfig = PILLARS[state.pillar]

  // Use custom title from URL or fall back to pillar label
  const displayTitle = state.title || `${pillarConfig.label} by Country`

  return (
    <div className={className}>
      {/* Header with controls */}
      <div className="mb-6 space-y-4">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-display text-slate-900">
              {displayTitle}
            </h1>
            {state.subtitle && (
              <p className="text-base text-slate-600 max-w-2xl">
                {state.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShareButton />
            <DownloadButton
              data={exportData}
              countries={state.countries}
              pillar={state.pillar}
              sources={sources}
            />
          </div>
        </div>

        {/* Pillar toggle */}
        <PillarToggle value={state.pillar} onChange={setPillar} />

        {/* Country picker */}
        <CountryPicker
          countries={allCountries}
          selectedCountries={state.countries}
          onAdd={addCountry}
          onRemove={removeCountry}
        />
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">
          <div className="text-slate-400 text-sm">Loading data...</div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <GrapherChart countries={chartData} pillar={state.pillar} />

          {/* Source attribution */}
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Sources: {sources.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Empty state hint */}
      {state.countries.length === 0 && !loading && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
          <strong>Tip:</strong> Search for countries above to add them to the chart.
          Try "United States", "Germany", or "Japan".
        </div>
      )}
    </div>
  )
}

export default Grapher
