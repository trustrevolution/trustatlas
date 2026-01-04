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
import { ChartWithControls } from './ChartWithControls'
import {
  type ChartProvenance,
  type DataTableRow,
} from '@/components/data-provenance'
import { TOOLTIP_STYLES } from '@/lib/charts'

// Sorted by bank trust descending - authoritarian at top, democracies at bottom
const DATA = [
  { name: 'Vietnam', financial: 94.1, governance: 38.0 },
  { name: 'China', financial: 91.2, governance: 32.9 },
  { name: 'Tajikistan', financial: 85.9, governance: 17.6 },
  { name: 'Uzbekistan', financial: 79.3, governance: 35.3 },
  { name: 'Germany', financial: 49.8, governance: 82.1 },
  { name: 'Canada', financial: 24.3, governance: 81.9 },
  { name: 'Netherlands', financial: 15.5, governance: 84.7 },
  { name: 'UK', financial: 13.7, governance: 79.6 },
  { name: 'Australia', financial: 11.6, governance: 83.3 },
  { name: 'USA', financial: 10.3, governance: 77.4 },
]

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
  ],
  years: '2017-2023',
  confidence: 'B',
  methodologyAnchor: '#supplementary-indicators',
  narrative:
    'Countries like Australia (12%), USA (10%), and UK (14%) have high governance quality but very low bank trust—a post-2008 hangover. Meanwhile, China (91%) and Vietnam (94%) lead the world in bank trust despite weaker governance. State-controlled banking systems with implicit guarantees vs. informed skepticism in democracies.',
}

export default function FinancialTrustParadox() {
  const tableData: DataTableRow[] = useMemo(() => {
    return DATA.flatMap((d) => [
      { label: `${d.name} (Bank Trust)`, year: 2023, value: d.financial, source: 'WVS', confidence: 'B' as const },
      { label: `${d.name} (Governance)`, year: 2023, value: d.governance, source: 'WGI', confidence: 'A' as const },
    ])
  }, [])

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
        const d = DATA.find(x => x.name === country)
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
      data: DATA.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: 12, fontWeight: 500 },
    },
    series: [
      {
        name: 'Bank Trust',
        type: 'bar' as const,
        stack: 'total',
        data: DATA.map((d) => -d.financial),
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
        data: DATA.map((d) => d.governance),
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
  }), [])

  return (
    <ChartWithControls
      provenance={financialTrustParadoxProvenance}
      tableData={tableData}
      option={option}
      height={{ mobile: '420px', desktop: '450px' }}
    />
  )
}
