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
  timeAxis,
  percentAxis,
  gridRight,
  TOOLTIP_STYLES,
  CHART_GRID,
} from '@/lib/charts'

// Countries with dramatic trust collapses - ordered by magnitude
const COUNTRIES = [
  { iso3: 'IRN', name: 'Iran', color: '#dc2626', drop: '−55pp' },        // Deepest red
  { iso3: 'IDN', name: 'Indonesia', color: '#ea580c', drop: '−46pp' },  // Orange-red
  { iso3: 'IRQ', name: 'Iraq', color: '#d97706', drop: '−36pp' },       // Amber
  { iso3: 'EGY', name: 'Egypt', color: '#ca8a04', drop: '−31pp' },      // Yellow-amber
] as const

interface DataPoint {
  year: number
  score: number
}

interface CountryData {
  iso3: string
  name: string
  color: string
  drop: string
  data: DataPoint[]
  startScore?: number
  endScore?: number
}

const provenance: ChartProvenance = {
  id: 'when-trust-dies',
  title: 'When Trust Dies',
  subtitle:
    'Four countries where interpersonal trust collapsed over a generation.',
  sources: [
    {
      source: 'WVS',
      seriesNames: COUNTRIES.map((c) => c.name),
      confidence: 'A',
    },
  ],
  years: '2000-2020',
  confidence: 'A',
  methodologyAnchor: '#interpersonal-trust',
  narrative:
    'Iran dropped 50 points between 2000 and 2007, with a small recovery since. Indonesia fell steadily from 52% to 5%. Iraq and Egypt show similar declines through years of conflict and instability.',
}

function TrustCollapse() {
  const { data: rawData, loading, error } = useFetchChartData(
    () => api.getMultiCountryTrends(
      COUNTRIES.map((c) => c.iso3),
      { pillar: 'social' }
    )
  )

  // Transform API response to chart data format
  const countries = useMemo((): CountryData[] => {
    if (!rawData) return []
    return COUNTRIES.map((c) => {
      const countryData = rawData.countries[c.iso3]
      const interpersonal = countryData?.social || []
      const filtered = interpersonal
        .filter((d: { year: number; score: number }) => d.year >= 2000 && d.year <= 2020)
        .map((d: { year: number; score: number }) => ({ year: d.year, score: d.score }))

      return {
        iso3: c.iso3,
        name: c.name,
        color: c.color,
        drop: c.drop,
        data: filtered,
        startScore: filtered[0]?.score,
        endScore: filtered[filtered.length - 1]?.score,
      }
    })
  }, [rawData])

  const tableData: DataTableRow[] = useMemo(() => {
    return countries.flatMap((c) =>
      c.data.map((d) => ({
        label: c.name,
        year: d.year,
        value: d.score,
        source: 'WVS',
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

  // Use readable names for end labels (not cryptic ISO3 codes)
  const endLabels = countries.map((c) => c.name)

  const option = createChartOption({
    grid: { ...CHART_GRID.withEndLabels, right: gridRight(endLabels) },
    xAxis: timeAxis({ range: [2000, 2020], interval: 5 }),
    yAxis: percentAxis({
      label: 'Interpersonal Trust',
      range: [0, 70],
      interval: 10,
      formatPercent: true,
      nameGap: 38,
    }),
    tooltip: {
      ...TOOLTIP_STYLES,
      trigger: 'axis',
      formatter: createSimpleTooltip({ source: 'WVS', yearRange: '2000-2020' }),
    },
    legend: 'none',
    series: countries.map((c) =>
      line({
        name: c.name,
        data: c.data.map((d) => [d.year, d.score] as [number, number]),
        color: c.color,
        endLabel: c.name, // Use readable name, not ISO3 code
        lineWidth: 3,
      })
    ),
  })

  return (
    <div>
      {/* Stat callouts */}
      <div className="chart-legend-row">
        {countries.map((c) => (
          <div
            key={c.iso3}
            className="chart-stat-pill"
            style={{ backgroundColor: c.color + '20' }}
          >
            <span
              className="chart-stat-pill-dot"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-slate-700 font-medium">{c.name}</span>
            <span
              className="font-bold tabular-nums"
              style={{ color: c.color }}
            >
              {c.drop}
            </span>
          </div>
        ))}
      </div>

      <ChartWithControls
        option={option}
        provenance={provenance}
        tableData={tableData}
        height={{ mobile: '320px', desktop: '400px' }}
      />
    </div>
  )
}

TrustCollapse.provenance = provenance

export { provenance as trustCollapseProvenance }
export default TrustCollapse
