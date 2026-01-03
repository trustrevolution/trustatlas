'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import { ChartLoading, ChartError } from './ChartState'
import { ChartWithControls } from './ChartWithControls'
import {
  createSimpleTooltip,
  type ChartProvenance,
  type DataTableRow,
} from '@/components/data-provenance'
import {
  createChartOption,
  line,
  periodBand,
  timeAxis,
  percentAxis,
  gridRight,
  TOOLTIP_STYLES,
  CHART_GRID,
} from '@/lib/charts'
import { shortName } from '@/lib/countries'

// Countries with COVID-era institutional trust data
// Dropped significantly
const DECLINERS = [
  { iso3: 'NLD', name: 'Netherlands', color: '#ef4444' },
  { iso3: 'AUT', name: 'Austria', color: '#f97316' },
  { iso3: 'SWE', name: 'Sweden', color: '#eab308' },
  { iso3: 'FRA', name: 'France', color: '#ec4899' },
  { iso3: 'GBR', name: 'United Kingdom', color: '#f43f5e' },
  { iso3: 'BEL', name: 'Belgium', color: '#fb7185' },
  { iso3: 'DNK', name: 'Denmark', color: '#fda4af' },
] as const

// Stayed stable (consistent ESS data throughout)
const STABLE = [
  { iso3: 'CHE', name: 'Switzerland', color: '#10b981' },
  { iso3: 'IRL', name: 'Ireland', color: '#34d399' },
  { iso3: 'FIN', name: 'Finland', color: '#06b6d4' },
] as const

const COUNTRIES = [...DECLINERS, ...STABLE]

interface DataPoint {
  year: number
  score: number
}

interface CountryData {
  iso3: string
  name: string
  color: string
  data: DataPoint[]
}

// Chart provenance metadata
const provenance: ChartProvenance = {
  id: 'did-covid-break-trust',
  title: 'Did COVID Break Trust?',
  subtitle: 'Institutional trust dropped sharply in several countries after 2020. Was it the pandemic, the policy response, or something else?',
  sources: [
    {
      source: 'ESS',
      seriesNames: COUNTRIES.map((c) => c.name),
      confidence: 'A',
    },
  ],
  years: '2016-2023',
  confidence: 'A',
  methodologyAnchor: '#institutional-trust',
  narrative: 'Seven European democracies experienced significant declines in institutional trust during COVID-19, while Switzerland, Ireland, and Finland maintained relative stability.',
}

function CovidTrustImpact() {
  const { data: rawData, loading, error } = useFetchChartData(
    () => api.getMultiCountryTrends(
      COUNTRIES.map(c => c.iso3),
      { pillar: 'institutional' }
    )
  )

  // Transform API response to chart data format
  const countries = useMemo((): CountryData[] => {
    if (!rawData) return []
    return COUNTRIES.map((c) => {
      const countryData = rawData.countries[c.iso3]
      const institutional = countryData?.institutional || []
      return {
        iso3: c.iso3,
        name: c.name,
        color: c.color,
        data: institutional
          .filter((d) => d.year >= 2016 && d.year <= 2023)
          .map((d) => ({ year: d.year, score: d.score })),
      }
    })
  }, [rawData])

  // Generate table data for accessibility
  const tableData: DataTableRow[] = useMemo(() => {
    return countries.flatMap((c) =>
      c.data.map((d) => ({
        label: c.name,
        year: d.year,
        value: d.score,
        source: 'ESS',
        confidence: 'A' as const,
      }))
    )
  }, [countries])

  if (loading) {
    return <ChartLoading />
  }

  if (error || countries.length === 0) {
    return <ChartError error={error} />
  }

  // Build end labels for grid calculation (use readable names, not ISO3 codes)
  const endLabels = countries.map((c) => shortName(c.iso3, c.name))

  const option = createChartOption({
    grid: { ...CHART_GRID.withEndLabels, right: gridRight(endLabels) },
    xAxis: timeAxis({ range: [2016, 2023], interval: 2 }),
    yAxis: percentAxis({ label: 'Institutional Trust', range: [15, 70], interval: 15, formatPercent: true, nameGap: 38 }),
    tooltip: {
      ...TOOLTIP_STYLES,
      trigger: 'axis',
      formatter: createSimpleTooltip({ source: 'ESS', yearRange: '2016-2023' }),
    },
    legend: 'none',
    series: [
      periodBand({ start: 2020, end: 2022, label: 'COVID-19' }),
      ...countries.map((c) =>
        line({
          name: c.name,
          data: c.data.map((d) => [d.year, d.score] as [number, number]),
          color: c.color,
          endLabel: shortName(c.iso3, c.name),
        })
      ),
    ],
  })

  return (
    <ChartWithControls
      option={option}
      provenance={provenance}
      tableData={tableData}
      height={{ mobile: '320px', desktop: '400px' }}
    />
  )
}

// Attach provenance as static property for external access
CovidTrustImpact.provenance = provenance

export { provenance as covidTrustImpactProvenance }
export default CovidTrustImpact
