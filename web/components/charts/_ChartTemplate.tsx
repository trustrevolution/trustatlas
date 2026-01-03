/**
 * Chart Template
 *
 * Copy this file and rename to create a new chart.
 * See docs/CHART_STANDARDS.md for full documentation.
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
// import { api } from '@/lib/api' // Uncomment when fetching data
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
  CHART_GRID,
  TOOLTIP_STYLES,
  // Uncomment if needed:
  // eventMarker,
  // periodBand,
  // gridRight,
} from '@/lib/charts'

// =============================================================================
// Configuration
// =============================================================================

// TODO: Define your data structure
interface DataPoint {
  year: number
  score: number
}

interface ChartData {
  name: string
  data: DataPoint[]
}

// TODO: Define countries/series with colors
// Use design token colors where possible
const SERIES_CONFIG = [
  { iso3: 'NLD', name: 'Netherlands', color: '#3b82f6' },
  { iso3: 'DEU', name: 'Germany', color: '#10b981' },
] as const

// =============================================================================
// Provenance Metadata
// =============================================================================

const PROVENANCE: ChartProvenance = {
  id: 'my-chart-id', // TODO: Unique ID for deep linking
  title: 'Chart Title', // TODO: Update
  subtitle: 'Optional subtitle describing what this shows',
  sources: [
    {
      source: 'WVS', // TODO: Update source
      seriesNames: SERIES_CONFIG.map((s) => s.name),
      confidence: 'A',
    },
  ],
  years: '2016-2023', // TODO: Update year range
  confidence: 'A',
  methodologyAnchor: '#interpersonal', // TODO: Link to relevant methodology section
  narrative:
    'Brief narrative explaining what this chart shows and why it matters.',
}

// =============================================================================
// Component
// =============================================================================

export default function ChartTemplate() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API call
        // Example: const response = await api.getMultiCountryTrends(
        //   SERIES_CONFIG.map(c => c.iso3),
        //   { pillar: 'interpersonal' }
        // )

        // TODO: Transform API response to ChartData[]
        const results: ChartData[] = SERIES_CONFIG.map((config) => ({
          name: config.name,
          data: [], // TODO: Map from API response
        }))

        setData(results)
      } catch (err) {
        setError('Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ---------------------------------------------------------------------------
  // Table Data (for accessibility)
  // ---------------------------------------------------------------------------

  const tableData: DataTableRow[] = useMemo(() => {
    return data.flatMap((series) =>
      series.data.map((d) => ({
        label: series.name,
        year: d.year,
        value: d.score,
        source: 'WVS', // TODO: Update source
        confidence: 'A' as const,
      }))
    )
  }, [data])

  // ---------------------------------------------------------------------------
  // Loading & Error States
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="text-slate-400 text-sm">Loading data...</div>
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="text-red-700 text-sm">{error || 'No data available'}</div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Chart Configuration
  // ---------------------------------------------------------------------------

  const option = createChartOption({
    grid: CHART_GRID.standard,
    xAxis: timeAxis({ range: [2016, 2023] }), // TODO: Update range
    yAxis: percentAxis({
      label: 'Trust %',
      range: [0, 100],
      formatPercent: true,
    }),
    tooltip: {
      ...TOOLTIP_STYLES,
      trigger: 'axis',
      formatter: createSimpleTooltip({
        source: 'WVS', // TODO: Update source
        yearRange: '2016-2023', // TODO: Update range
      }),
    },
    legend: 'none', // Use 'bottom' or ['Series1', 'Series2'] for multi-series
    series: data.map((series, idx) => {
      const config = SERIES_CONFIG[idx]
      return line({
        name: series.name,
        data: series.data.map((d) => [d.year, d.score] as [number, number]),
        color: config.color,
        // Uncomment for end labels:
        // endLabel: config.iso3,
      })
    }),
  })

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ChartWithControls
      option={option}
      provenance={PROVENANCE}
      tableData={tableData}
      height={{ mobile: '320px', desktop: '400px' }}
    />
  )
}
