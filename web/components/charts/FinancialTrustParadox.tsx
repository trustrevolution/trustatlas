/**
 * Financial Trust Paradox
 *
 * Diverging horizontal bar chart (butterfly) showing the inverse relationship
 * between governance quality and financial (bank) trust.
 *
 * Bank Trust extends LEFT, Governance extends RIGHT.
 * The asymmetry instantly shows the paradox.
 */

'use client'

import { useMemo } from 'react'
import { api, MultiCountryData } from '@/lib/api'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import { ChartLoading, ChartError } from './ChartState'
import { ChartWithControls } from './ChartWithControls'
import {
  type ChartProvenance,
  type DataTableRow,
} from '@/components/data-provenance'
import { TOOLTIP_STYLES } from '@/lib/charts'
import { FINANCIAL_COUNTRIES, FINANCIAL_ISO3 } from '@/lib/chart-countries'

// Re-export for local use
const COUNTRIES = FINANCIAL_COUNTRIES

const COLORS = {
  financial: '#10b981',
  governance: '#3b82f6',
}

export const financialTrustParadoxProvenance: ChartProvenance = {
  id: 'bank-trust-paradox',
  title: 'The Bank Trust Paradox',
  subtitle:
    'Wealthy democracies have the least trust in banks despite the best-regulated financial systems',
  sources: [
    { source: 'WVS', seriesNames: ['Financial Trust'], confidence: 'B' },
    { source: 'WGI', seriesNames: ['Governance Quality'], confidence: 'A' },
  ],
  years: '2017-2024',
  confidence: 'B',
  methodologyAnchor: '#supplementary-indicators',
  narrative:
    'Countries like Australia (12%), USA (10%), and UK (14%) have high governance quality but very low bank trust—a post-2008 hangover. Meanwhile, China (91%) and Vietnam (94%) lead the world in bank trust despite weaker governance. State-controlled banking systems with implicit guarantees vs. informed skepticism in democracies.',
}

/** Pre-fetched data for FinancialTrustParadox */
export interface FinancialParadoxInitialData {
  financial: MultiCountryData | null
  governance: MultiCountryData | null
}

interface FinancialTrustParadoxProps {
  /** Pre-fetched data from server - skips client fetch if provided */
  initialData?: FinancialParadoxInitialData | null
}

interface ChartDataPoint {
  name: string
  financial: number
  governance: number
}

export default function FinancialTrustParadox({ initialData }: FinancialTrustParadoxProps = {}) {
  // If initialData provided, convert to tuple format
  const prefetchedData = initialData?.financial && initialData?.governance
    ? [initialData.financial, initialData.governance] as [MultiCountryData, MultiCountryData]
    : undefined

  // Fetch both financial trust and governance data
  const { data: rawData, loading, error } = useFetchChartData(
    () => Promise.all([
      api.getMultiCountryTrends(FINANCIAL_ISO3, { pillar: 'financial' }),
      api.getMultiCountryTrends(FINANCIAL_ISO3, { pillar: 'institutions', source: 'WGI' }),
    ]),
    { initialData: prefetchedData }
  )

  // Transform API response to chart data format
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!rawData) return []
    const [financialData, governanceData] = rawData

    const results = COUNTRIES.map((c) => {
      // Get latest financial trust score
      const financial = financialData.countries[c.iso3]?.financial || []
      const latestFinancial = financial.length > 0 ? financial[financial.length - 1].score : 0

      // Get latest governance score (from WGI)
      const governance = governanceData.countries[c.iso3]?.institutions?.governance || []
      const latestGovernance = governance.length > 0 ? governance[governance.length - 1].score : 0

      return {
        name: c.name,
        financial: Math.round(latestFinancial * 10) / 10,
        governance: Math.round(latestGovernance * 10) / 10,
      }
    })

    // Sort by financial trust descending (authoritarian at top)
    return results.sort((a, b) => b.financial - a.financial)
  }, [rawData])

  const tableData: DataTableRow[] = useMemo(() => {
    return chartData.flatMap((d) => [
      { label: `${d.name} (Bank Trust)`, year: 2023, value: d.financial, source: 'WVS', confidence: 'B' as const },
      { label: `${d.name} (Governance)`, year: 2023, value: d.governance, source: 'WGI', confidence: 'A' as const },
    ])
  }, [chartData])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: {
      top: 30,
      right: 20,
      bottom: 60,
      left: 90,
    },
    tooltip: {
      ...TOOLTIP_STYLES,
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (params: unknown) => {
        const p = params as Array<{ name: string; seriesName: string; value: number }>
        if (!p || p.length === 0) return ''
        const country = p[0].name
        const d = chartData.find(x => x.name === country)
        if (!d) return ''
        return `<div style="font-size:12px"><strong>${country}</strong><br/><span style="color:${COLORS.financial}">◀</span> Bank Trust: ${d.financial}%<br/><span style="color:${COLORS.governance}">▶</span> Governance: ${d.governance}%</div>`
      },
    },
    xAxis: {
      type: 'value' as const,
      min: -100,
      max: 100,
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (v: number) => Math.abs(v) + '%',
      },
    },
    yAxis: {
      type: 'category' as const,
      data: chartData.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: 12, fontWeight: 500 },
    },
    series: [
      {
        name: 'Bank Trust',
        type: 'bar' as const,
        stack: 'total',
        data: chartData.map((d) => -d.financial),
        itemStyle: { color: COLORS.financial },
        barWidth: 16,
        label: {
          show: true,
          position: 'left' as const,
          formatter: (p: { value: number }) => Math.abs(p.value).toFixed(0) + '%',
          color: '#065f46',
          fontSize: 10,
        },
      },
      {
        name: 'Governance',
        type: 'bar' as const,
        stack: 'total',
        data: chartData.map((d) => d.governance),
        itemStyle: { color: COLORS.governance },
        barWidth: 16,
        label: {
          show: true,
          position: 'right' as const,
          formatter: (p: { value: number }) => p.value.toFixed(0) + '%',
          color: '#1e40af',
          fontSize: 10,
        },
      },
    ],
    legend: {
      show: true,
      bottom: 5,
      data: [
        { name: 'Bank Trust', icon: 'rect' },
        { name: 'Governance', icon: 'rect' },
      ],
      textStyle: { color: '#64748b', fontSize: 11 },
    },
  }), [chartData])

  if (loading) {
    return <ChartLoading />
  }

  if (error || chartData.length === 0) {
    return <ChartError error={error} />
  }

  return (
    <ChartWithControls
      provenance={financialTrustParadoxProvenance}
      tableData={tableData}
      option={option}
      height={{ mobile: '420px', desktop: '450px' }}
    />
  )
}
