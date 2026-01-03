'use client'

import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/lib/echarts'
import { PILLARS } from '@/lib/design-tokens'
import { escapeHtml } from '@/lib/utils'
import type { Pillar } from '@/lib/grapher-state'

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

interface GrapherChartProps {
  countries: CountryData[]
  pillar: Pillar
  className?: string
}

// Generate distinct colors for multiple countries
const COUNTRY_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

export function GrapherChart({ countries, pillar, className }: GrapherChartProps) {
  if (countries.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">
        <p className="text-slate-400 text-sm">Select countries to view data</p>
      </div>
    )
  }

  const pillarConfig = PILLARS[pillar]

  // Find min/max years across all countries
  const allYears = countries.flatMap((c) => c.data.map((d) => d.year))
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1980
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2024

  // Calculate y-axis range based on data
  const allScores = countries.flatMap((c) => c.data.map((d) => d.score))
  const minScore = allScores.length > 0 ? Math.floor(Math.min(...allScores) / 10) * 10 : 0
  const maxScore = allScores.length > 0 ? Math.ceil(Math.max(...allScores) / 10) * 10 : 100

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'transparent',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
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
      },
    },
    legend: {
      show: countries.length > 1,
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 11 },
      data: countries.map((c) => c.name),
    },
    grid: {
      left: 50,
      right: 30,
      top: 40,
      bottom: countries.length > 1 ? 70 : 30,
    },
    xAxis: {
      type: 'value',
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#64748b', fontSize: 11, fontWeight: 500 },
      min: minYear - 1,
      max: maxYear + 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (v: number) => v.toString(),
      },
    },
    yAxis: {
      type: 'value',
      name: pillarConfig.label,
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#64748b', fontSize: 11, fontWeight: 500 },
      min: minScore,
      max: Math.min(maxScore + 10, 100),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (v: number) => `${v}%`,
      },
    },
    series: countries.map((country, index) => ({
      name: country.name,
      type: 'line',
      data: country.data.map((d) => [d.year, d.score]),
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2.5,
        color: countries.length === 1 ? pillarConfig.colorHex : COUNTRY_COLORS[index % COUNTRY_COLORS.length],
      },
      itemStyle: {
        color: countries.length === 1 ? pillarConfig.colorHex : COUNTRY_COLORS[index % COUNTRY_COLORS.length],
        borderColor: '#fff',
        borderWidth: 2,
      },
      emphasis: {
        focus: 'series',
        lineStyle: { width: 3 },
      },
    })),
    aria: {
      enabled: true,
    },
  }

  return (
    <div className={className}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: '400px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}

export default GrapherChart
