'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { escapeHtml } from '@/lib/utils'
import { ChartWithControls } from './ChartWithControls'
import { ChartLoading, ChartError } from './ChartState'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance'
import {
  createChartOption,
  line,
  timeAxis,
  percentAxis,
  gridRight,
  TOOLTIP_STYLES,
  CHART_GRID,
} from '@/lib/charts'

// Countries to display with their colors
const COUNTRIES = [
  { iso3: 'BRA', name: 'Brazil', color: '#10b981' },   // emerald
  { iso3: 'POL', name: 'Poland', color: '#3b82f6' },   // blue
  { iso3: 'RUS', name: 'Russia', color: '#f59e0b' },   // amber
] as const

interface CountryData {
  iso3: string
  name: string
  color: string
  data: Array<{ year: number; score: number }>
}

// Chart provenance metadata
const provenance: ChartProvenance = {
  id: 'trust-trajectories',
  title: 'Institutional Trust Over Time',
  subtitle: 'Three countries, three trajectories. Institutional trust in government varies widely.',
  sources: [
    {
      source: 'WVS',
      seriesNames: COUNTRIES.map(c => c.name),
      confidence: 'A',
    },
  ],
  years: '1990-2022',
  confidence: 'A',
  methodologyAnchor: '#institutional-trust',
  narrative: 'Brazil, Poland, and Russia show distinctly different patterns of institutional trust over the past three decades.',
}

function TrustTrajectories() {
  // Batch fetch all countries in a single request (was N+1 before)
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
        data: institutional.map((d) => ({ year: d.year, score: d.score })),
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
        source: 'WVS',
        confidence: 'A' as const,
      }))
    )
  }, [countries])

  if (loading) {
    return <ChartLoading height="h-80" />
  }

  if (error || countries.length === 0) {
    return <ChartError error={error} height="h-80" />
  }

  // Find year range across all countries
  const allYears = countries.flatMap((c) => c.data.map((d) => d.year))
  const minYear = Math.min(...allYears) - 2
  const maxYear = Math.max(...allYears) + 2

  // End labels for grid calculation
  const endLabels = countries.map((c) => c.name)

  // Custom tooltip formatter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (params: any) => {
    if (!params || params.length === 0) return ''
    const year = params[0]?.data?.[0] || params[0]?.value?.[0]
    let html = `<div style="font-weight:600;margin-bottom:6px;color:#f8fafc">${escapeHtml(year)}</div>`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params.forEach((p: any) => {
      const val = p.data?.[1] ?? p.value?.[1]
      if (val !== undefined && p.seriesName) {
        html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
          <span style="width:8px;height:8px;border-radius:50%;background:${escapeHtml(p.color)}"></span>
          <span style="color:#cbd5e1">${escapeHtml(p.seriesName)}:</span>
          <span style="font-weight:600;color:#f8fafc">${escapeHtml(val.toFixed(1))}%</span>
        </div>`
      }
    })
    return html
  }

  const option = createChartOption({
    grid: { ...CHART_GRID.withEndLabels, right: gridRight(endLabels) },
    xAxis: timeAxis({ range: [minYear, maxYear] }),
    yAxis: percentAxis({ label: 'Institutional Trust', formatPercent: true }),
    tooltip: { ...TOOLTIP_STYLES, trigger: 'axis', formatter: tooltipFormatter },
    legend: countries.map((c) => c.name),
    series: countries.map((c) =>
      line({
        name: c.name,
        data: c.data.map((d) => [d.year, d.score] as [number, number]),
        color: c.color,
        endLabel: c.name,
      })
    ),
  })

  return (
    <ChartWithControls
      option={option}
      provenance={provenance}
      tableData={tableData}
      height={{ mobile: '280px', desktop: '350px' }}
    />
  )
}

// Attach provenance as static property for external access
TrustTrajectories.provenance = provenance

export { provenance as trustTrajectoriesProvenance }
export default TrustTrajectories
