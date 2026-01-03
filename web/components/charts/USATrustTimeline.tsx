'use client'

import { useMemo } from 'react'
import { api, USATrends } from '@/lib/api'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import { ChartLoading, ChartError } from './ChartState'
import { USA_TRUST_COLORS } from '@/lib/design-tokens'
import { escapeHtml } from '@/lib/utils'
import { ChartWithControls } from './ChartWithControls'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance'
import {
  createChartOption,
  line,
  eventMarker,
  timeAxis,
  percentAxis,
  TOOLTIP_STYLES,
  CHART_GRID,
} from '@/lib/charts'

// Multi-source provenance for this chart
const provenance: ChartProvenance = {
  id: 'american-trust-crisis',
  title: 'The American Trust Crisis',
  subtitle: 'Trust in American government peaked in 1964. After Watergate, it never recovered. Today, partisan trust has collapsed to historic lows.',
  sources: [
    {
      source: 'ANES',
      seriesNames: ['Institutional', 'Partisan'],
      years: '1958-2024',
      confidence: 'A',
    },
    {
      source: 'GSS',
      seriesNames: ['Interpersonal'],
      years: '1972-2024',
      confidence: 'A',
    },
    {
      source: 'WVS',
      seriesNames: ['Interpersonal'],
      years: '1981-2022',
      confidence: 'B',
    },
  ],
  years: '1958-2024',
  confidence: 'A',
  methodologyAnchor: '#usa-specific',
  narrative: 'Trust in American government peaked in 1964. After Watergate, it never fully recovered. Partisan trust has collapsed from 53% in 1978 to 19% in 2024.',
}

function USATrustTimeline() {
  const { data, loading, error } = useFetchChartData<USATrends>(
    () => api.getUSATrends()
  )

  // Generate table data for accessibility
  const tableData: DataTableRow[] = useMemo(() => {
    if (!data) return []

    const rows: DataTableRow[] = []

    // Institutional (ANES)
    data.series.institutional.forEach((d) => {
      rows.push({
        label: 'Institutional',
        year: d.year,
        value: d.score,
        source: 'ANES',
        confidence: 'A',
      })
    })

    // Interpersonal (GSS)
    data.series.interpersonal.forEach((d) => {
      rows.push({
        label: 'Interpersonal',
        year: d.year,
        value: d.score,
        source: d.source || 'GSS',
        confidence: 'A',
      })
    })

    // Partisan (ANES)
    data.series.partisan.forEach((d) => {
      rows.push({
        label: 'Partisan',
        year: d.year,
        value: d.score,
        source: 'ANES',
        confidence: 'A',
      })
    })

    return rows.sort((a, b) => a.year - b.year)
  }, [data])

  if (loading) {
    return <ChartLoading />
  }

  if (error || !data) {
    return <ChartError error={error} />
  }

  // Custom tooltip formatter for multi-series display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (params: any) => {
    if (!params || params.length === 0) return ''
    const year = params[0]?.data?.[0] || params[0]?.value?.[0]
    let html = `<div style="font-weight:600;margin-bottom:6px;color:#f8fafc">${escapeHtml(year)}</div>`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params.forEach((p: any) => {
      const val = p.data?.[1] ?? p.value?.[1]
      if (val !== undefined && p.seriesName && !p.seriesName.startsWith('__')) {
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
    grid: { ...CHART_GRID.standard, bottom: 50 },
    xAxis: timeAxis({ range: [1955, 2025] }),
    yAxis: percentAxis({ label: 'Trust %' }),
    tooltip: { ...TOOLTIP_STYLES, trigger: 'axis', formatter: tooltipFormatter },
    legend: ['Institutional', 'Interpersonal', 'Partisan'],
    series: [
      line({ name: 'Institutional', data: data.series.institutional.map(d => [d.year, d.score] as [number, number]), color: USA_TRUST_COLORS.institutional }),
      line({ name: 'Interpersonal', data: data.series.interpersonal.map(d => [d.year, d.score] as [number, number]), color: USA_TRUST_COLORS.interpersonal }),
      line({ name: 'Partisan', data: data.series.partisan.map(d => [d.year, d.score] as [number, number]), color: USA_TRUST_COLORS.partisan }),
      eventMarker({ year: 1974, label: 'Watergate', color: '#ef4444' }),
      eventMarker({ year: 2001, label: '9/11', color: '#f59e0b' }),
      eventMarker({ year: 2008, label: 'Financial Crisis', color: '#ef4444', offsetY: 15 }),
    ],
  })

  return (
    <ChartWithControls
      option={option}
      provenance={provenance}
      tableData={tableData}
      height={{ mobile: '280px', desktop: '400px' }}
    />
  )
}

// Attach provenance as static property for external access
USATrustTimeline.provenance = provenance

export { provenance as usaTrustTimelineProvenance }
export default USATrustTimeline
