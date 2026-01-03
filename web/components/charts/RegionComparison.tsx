'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { ChartWithControls } from './ChartWithControls'
import { ChartLoading, ChartError } from './ChartState'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance'
import { REGION_COLORS } from '@/lib/design-tokens'
import { CHART_GRID } from '@/lib/charts'

// Chart provenance metadata
const provenance: ChartProvenance = {
  id: 'region-comparison',
  title: 'Global Trust by Region',
  subtitle: 'Average trust scores by world region, based on countries with survey data.',
  sources: [
    { source: 'WVS', seriesNames: ['Regional Averages'], confidence: 'A' },
    { source: 'CPI', seriesNames: ['Governance'], confidence: 'A' },
    { source: 'WGI', seriesNames: ['Governance'], confidence: 'A' },
  ],
  years: '2024',
  confidence: 'A',
  methodologyAnchor: '#regional-aggregation',
  narrative: 'Regional averages are calculated from countries with available survey data. Coverage varies by region.',
}

function RegionComparison() {
  const { data: rawData, loading, error } = useFetchChartData(
    () => api.getRegionStats().then(r => r.regions)
  )

  // Generate table data for accessibility
  const tableData: DataTableRow[] = useMemo(() => {
    if (!rawData) return []
    return rawData.map((r) => ({
      label: r.region,
      year: 2024,
      value: r.avgScore,
      source: 'Composite',
      confidence: 'A' as const,
    }))
  }, [rawData])

  if (loading) {
    return <ChartLoading height="h-80" />
  }

  if (error || !rawData) {
    return <ChartError error={error} height="h-80" />
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { ...CHART_GRID.auto, right: 50, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'transparent',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const d = params[0]
        const region = rawData.find(r => r.region === d.name)
        if (!region) return ''
        return `
          <div style="font-weight:600;margin-bottom:4px">${region.region}</div>
          <div>Average: ${region.avgScore.toFixed(1)}</div>
          <div style="color:#94a3b8">Range: ${region.minScore.toFixed(1)} – ${region.maxScore.toFixed(1)}</div>
          <div style="color:#94a3b8">${region.countryCount} countries</div>
        `
      },
    },
    xAxis: {
      type: 'value',
      name: 'Trust Score (0-100)',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      min: 0,
      max: 100,
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: rawData.map(d => d.region),
      axisLabel: { color: '#334155', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Average Score',
        type: 'bar',
        data: rawData.map(d => ({
          value: d.avgScore,
          itemStyle: {
            color: REGION_COLORS[d.region] || '#64748b',
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => `${params.value.toFixed(1)}`,
          color: '#64748b',
          fontSize: 11,
        },
      },
    ],
  }

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
RegionComparison.provenance = provenance

export { provenance as regionComparisonProvenance }
export default RegionComparison
