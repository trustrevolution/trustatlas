'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import { ChartLoading, ChartError } from './ChartState'
import { ChartWithControls } from './ChartWithControls'
import {
  type ChartProvenance,
  type DataTableRow,
} from '@/components/data-provenance'
import { TOOLTIP_STYLES, CHART_GRID } from '@/lib/charts'

// Countries where institutional > interpersonal (inverted trust)
const COUNTRIES = [
  { iso3: 'BRA', name: 'Brazil' },
  { iso3: 'GRC', name: 'Greece' },
  { iso3: 'TUR', name: 'Turkey' },
  { iso3: 'CYP', name: 'Cyprus' },
] as const

interface TrustData {
  name: string
  interpersonal: number
  institutional: number
  gap: number
  year: number
}

const COLORS = {
  interpersonal: '#0ea5e9',  // Sky-500 - pillar color for interpersonal
  institutional: '#f59e0b',  // Amber-500 - pillar color for institutional
  gap: '#e2e8f0',            // Slate-200 - neutral connector
}

const provenance: ChartProvenance = {
  id: 'trust-inversion',
  title: 'Trust Inversion',
  subtitle:
    'In most countries, people trust each other more than institutions. In these four, it\'s reversed.',
  sources: [
    { source: 'WVS', seriesNames: ['Interpersonal', 'Institutional'], confidence: 'A' },
  ],
  years: '2024',
  confidence: 'A',
  methodologyAnchor: '#three-pillars',
  narrative:
    'Brazil: only 4% say most people can be trusted, yet 28% trust government. Greece, Turkey, and Cyprus show similar inversions. What creates societies where strangers distrust each other but still trust institutions?',
}

function TrustInversion() {
  // Fetch both pillars in parallel
  const { data: rawData, loading, error } = useFetchChartData(
    () => Promise.all([
      api.getMultiCountryTrends(COUNTRIES.map((c) => c.iso3), { pillar: 'social' }),
      api.getMultiCountryTrends(COUNTRIES.map((c) => c.iso3), { pillar: 'institutions' }),
    ])
  )

  // Transform API response to chart data format
  const data = useMemo((): TrustData[] => {
    if (!rawData) return []
    const [interpersonalData, institutionalData] = rawData

    const results = COUNTRIES.map((c) => {
      const interp = interpersonalData.countries[c.iso3]?.social || []
      const inst = institutionalData.countries[c.iso3]?.institutions?.institutional || []

      const latestInterp = interp.length > 0 ? interp[interp.length - 1] : null
      const latestInst = inst.length > 0 ? inst[inst.length - 1] : null

      // Use the most recent year from either pillar
      const year = Math.max(latestInterp?.year || 0, latestInst?.year || 0)

      return {
        name: c.name,
        interpersonal: Math.round((latestInterp?.score || 0) * 10) / 10,
        institutional: Math.round((latestInst?.score || 0) * 10) / 10,
        gap: Math.round(((latestInst?.score || 0) - (latestInterp?.score || 0)) * 10) / 10,
        year,
      }
    })

    return results.sort((a, b) => b.gap - a.gap)
  }, [rawData])

  const tableData: DataTableRow[] = useMemo(() => {
    return data.flatMap((d) => [
      { label: `${d.name} (Interpersonal)`, year: d.year, value: d.interpersonal, source: 'WVS', confidence: 'A' as const },
      { label: `${d.name} (Institutional)`, year: d.year, value: d.institutional, source: 'WVS', confidence: 'A' as const },
    ])
  }, [data])

  if (loading) {
    return <ChartLoading />
  }

  if (error || data.length === 0) {
    return <ChartError error={error} />
  }

  // Calculate dynamic x-axis max based on data (round up to nearest 10)
  const maxInstitutional = Math.max(...data.map((d) => d.institutional))
  const xAxisMax = Math.ceil(maxInstitutional / 10) * 10 // Clean grid lines at 10% intervals

  // Custom horizontal dumbbell chart using ECharts custom series
  const option = {
    backgroundColor: 'transparent',
    grid: { ...CHART_GRID.auto, right: 45, bottom: 50 },
    tooltip: {
      ...TOOLTIP_STYLES,
      trigger: 'axis',
      axisPointer: { type: 'none' },
      formatter: (params: unknown) => {
        const p = params as Array<{ dataIndex: number }>
        const d = data[p[0]?.dataIndex]
        if (!d) return ''
        return `
          <div style="font-size:12px">
            <strong>${d.name}</strong><br/>
            <span style="color:${COLORS.interpersonal}">●</span> Interpersonal: ${d.interpersonal}%<br/>
            <span style="color:${COLORS.institutional}">●</span> Institutional: ${d.institutional}%<br/>
            <span style="color:#94a3b8">Gap: +${d.gap}pp</span>
          </div>
        `
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: xAxisMax,
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: {
        color: '#64748b',
        formatter: '{value}%',
        fontSize: 11,
      },
      name: 'Trust %',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#334155',
        fontSize: 13,
        fontWeight: 500,
      },
    },
    series: [
      // Connecting line (the gap)
      {
        type: 'custom',
        renderItem: (_params: unknown, api: {
          value: (idx: number) => number
          coord: (val: [number, number]) => [number, number]
          size: (val: [number, number]) => [number, number]
        }) => {
          const idx = api.value(0)
          const d = data[idx]
          if (!d) return null

          const startPoint = api.coord([d.interpersonal, idx])
          const endPoint = api.coord([d.institutional, idx])

          return {
            type: 'line',
            shape: {
              x1: startPoint[0],
              y1: startPoint[1],
              x2: endPoint[0],
              y2: endPoint[1],
            },
            style: {
              stroke: COLORS.gap,
              lineWidth: 8,
              lineCap: 'round',
            },
          }
        },
        data: data.map((_, i) => [i]),
        z: 1,
      },
      // Interpersonal dots (left, sky blue)
      {
        name: 'Interpersonal',
        type: 'scatter',
        data: data.map((d) => d.interpersonal),
        symbolSize: 16,
        itemStyle: {
          color: COLORS.interpersonal,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'left',
          distance: 10,
          formatter: (params: { value: number }) => `${params.value}%`,
          color: '#0284c7',
          fontSize: 11,
          fontWeight: 600,
        },
        z: 2,
      },
      // Institutional dots (right, amber)
      {
        name: 'Institutional',
        type: 'scatter',
        data: data.map((d) => d.institutional),
        symbolSize: 16,
        itemStyle: {
          color: COLORS.institutional,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'right',
          distance: 10,
          formatter: (params: { value: number }) => `${params.value}%`,
          color: '#d97706',
          fontSize: 11,
          fontWeight: 600,
        },
        z: 2,
      },
    ],
  }

  return (
    <div>
      {/* Legend */}
      <div className="chart-legend-row">
        <div className="chart-legend-item">
          <span
            className="chart-legend-dot"
            style={{ backgroundColor: COLORS.interpersonal }}
          />
          <span className="text-slate-700 font-medium">Interpersonal</span>
          <span className="text-slate-500 text-xs">trust in people</span>
        </div>
        <div className="chart-legend-item">
          <span
            className="chart-legend-dot"
            style={{ backgroundColor: COLORS.institutional }}
          />
          <span className="text-slate-700 font-medium">Institutional</span>
          <span className="text-slate-500 text-xs">trust in government</span>
        </div>
      </div>

      <ChartWithControls
        option={option}
        provenance={provenance}
        tableData={tableData}
        height={{ mobile: '280px', desktop: '320px' }}
      />
    </div>
  )
}

TrustInversion.provenance = provenance

export { provenance as trustInversionProvenance }
export default TrustInversion
