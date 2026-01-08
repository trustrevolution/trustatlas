'use client'

import { useMemo } from 'react'
import { api, MultiCountryData } from '@/lib/api'
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
import { COVID_DECLINERS, COVID_STABLE, COVID_COUNTRIES, COVID_ISO3 } from '@/lib/chart-countries'

interface CovidTrustImpactProps {
  /** Pre-fetched data from server - skips client fetch if provided */
  initialData?: MultiCountryData | null
}

// Re-export for local use
const DECLINERS = COVID_DECLINERS
const STABLE = COVID_STABLE
const COUNTRIES = COVID_COUNTRIES

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
  id: 'covid-break-trust',
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

function CovidTrustImpact({ initialData }: CovidTrustImpactProps = {}) {
  const { data: rawData, loading, error } = useFetchChartData(
    () => api.getMultiCountryTrends(COVID_ISO3, { pillar: 'institutions' }),
    { initialData }
  )

  // Transform API response to chart data format
  const countries = useMemo((): CountryData[] => {
    if (!rawData) return []
    return COUNTRIES.map((c) => {
      const countryData = rawData.countries[c.iso3]
      const institutional = countryData?.institutions?.institutional || []
      return {
        iso3: c.iso3,
        name: c.name,
        color: c.color,
        data: institutional
          .filter((d: { year: number; score: number }) => d.year >= 2016 && d.year <= 2023)
          .map((d: { year: number; score: number }) => ({ year: d.year, score: d.score })),
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
