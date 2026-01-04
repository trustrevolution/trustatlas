'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { useFetchChartData } from '@/lib/hooks/useFetchChartData'
import { ChartLoading, ChartError } from './ChartState'
import { escapeHtml } from '@/lib/utils'
import { ChartWithControls } from './ChartWithControls'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance'
import { CHART_GRID, gridRight } from '@/lib/charts'

// Countries that improved against the global trend
const IMPROVERS = [
  { iso3: 'MDA', name: 'Moldova', color: '#059669' },     // emerald-600
  { iso3: 'EST', name: 'Estonia', color: '#0284c7' },     // sky-600
  { iso3: 'UZB', name: 'Uzbekistan', color: '#d97706' },  // amber-600
] as const

// Countries that declined - the "tide"
const DECLINERS = [
  { iso3: 'HUN', name: 'Hungary' },
  { iso3: 'TUR', name: 'Turkey' },
  { iso3: 'BRA', name: 'Brazil' },
  { iso3: 'VEN', name: 'Venezuela' },
  { iso3: 'EGY', name: 'Egypt' },
  { iso3: 'NIC', name: 'Nicaragua' },
] as const

interface DataPoint {
  year: number
  score: number
}

interface CountryData {
  iso3: string
  name: string
  color?: string
  data: DataPoint[]
  isImprover: boolean
}

// Chart provenance metadata
const provenance: ChartProvenance = {
  id: 'against-the-tide',
  title: 'Against the Tide',
  subtitle: 'Three out of four countries surveyed saw rule of law decline in the last decade. These didn\'t.',
  sources: [
    {
      source: 'WJP',
      seriesNames: ['Moldova', 'Estonia', 'Uzbekistan', 'Decliners'],
      confidence: 'A',
    },
  ],
  years: '2015-2024',
  confidence: 'A',
  methodologyAnchor: '#governance',
  narrative: 'This chart shows the three countries that most improved their rule of law scores between 2015 and 2024, contrasted against the declining trend seen across most of the world.',
}

function RuleLawTrends() {
  // Fetch all countries in a single batch request
  const { data: rawData, loading, error } = useFetchChartData(
    () => {
      const allCountries = [...IMPROVERS.map(c => c.iso3), ...DECLINERS.map(c => c.iso3)]
      return api.getMultiCountryTrends(allCountries, { pillar: 'institutions', source: 'WJP' })
    }
  )

  // Transform API response to chart data format
  const countries = useMemo((): CountryData[] => {
    if (!rawData) return []

    const improverResults = IMPROVERS.map((c) => {
      const countryData = rawData.countries[c.iso3]
      const governance = countryData?.institutions?.governance || []
      return {
        iso3: c.iso3,
        name: c.name,
        color: c.color,
        data: governance
          .filter((d: { year: number; score: number }) => d.year >= 2015)
          .map((d: { year: number; score: number }) => ({ year: d.year, score: d.score })),
        isImprover: true,
      }
    })

    const declinerResults = DECLINERS.map((c) => {
      const countryData = rawData.countries[c.iso3]
      const governance = countryData?.institutions?.governance || []
      return {
        iso3: c.iso3,
        name: c.name,
        data: governance
          .filter((d: { year: number; score: number }) => d.year >= 2015)
          .map((d: { year: number; score: number }) => ({ year: d.year, score: d.score })),
        isImprover: false,
      }
    })

    return [...declinerResults, ...improverResults]
  }, [rawData])

  // Generate table data for accessibility
  const tableData: DataTableRow[] = useMemo(() => {
    const improvers = countries.filter((c) => c.isImprover)
    return improvers.flatMap((country) =>
      country.data.map((d) => ({
        label: country.name,
        year: d.year,
        value: d.score,
        source: 'WJP',
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

  const improvers = countries.filter((c) => c.isImprover)
  const decliners = countries.filter((c) => !c.isImprover)

  // Calculate the "tide" band - min/max range of declining countries per year
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const tideBand = years.map((year): [number, number, number] => {
    const scoresAtYear = decliners
      .map((c) => c.data.find((d) => d.year === year)?.score)
      .filter((s): s is number => s !== undefined)

    if (scoresAtYear.length === 0) return [year, 0, 0]
    const min = Math.min(...scoresAtYear)
    const max = Math.max(...scoresAtYear)
    return [year, min, max]
  }).filter((d) => d[1] !== 0)

  // Chart option - ECharts handles typing internally
  const option = {
    backgroundColor: 'transparent',
    // Context annotation explaining the decline
    graphic: [
      {
        type: 'text',
        left: '8%',
        top: '58%',
        style: {
          text: '75% of countries\ndeclined 2015-2024',
          fill: 'rgba(185, 28, 28, 0.7)',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 14,
        },
        z: 100,
      },
    ],
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
        const improverParams = params.filter((p: any) =>
          IMPROVERS.some((i) => i.name === p.seriesName)
        )

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        improverParams.forEach((p: any) => {
          const val = p.data?.[1] ?? p.value?.[1]
          if (val !== undefined && p.seriesName) {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
              <span style="width:8px;height:8px;border-radius:50%;background:${escapeHtml(p.color)}"></span>
              <span style="color:#cbd5e1">${escapeHtml(p.seriesName)}:</span>
              <span style="font-weight:600;color:#f8fafc">${escapeHtml(val.toFixed(1))}</span>
            </div>`
          }
        })
        return html
      },
    },
    grid: { ...CHART_GRID.withEndLabels, right: gridRight(IMPROVERS.map(c => c.name), { fontSize: 12, offset: 8 }) },
    xAxis: {
      type: 'value',
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#64748b', fontSize: 11, fontWeight: 500 },
      min: 2015,
      max: 2024,
      interval: 3,
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
      name: 'Rule of Law Index (0–100)',
      nameLocation: 'middle',
      nameGap: 38,
      nameTextStyle: { color: '#64748b', fontSize: 11, fontWeight: 500 },
      min: 20,
      max: 85,
      interval: 15,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (v: number) => String(v),
      },
    },
    series: [
      // THE TIDE: Shaded band showing range of declining countries
      {
        name: 'Decline Range',
        type: 'custom',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem: (params: any, api: any) => {
          const points: Array<{ x: number; y: number }> = []
          const pointsReverse: Array<{ x: number; y: number }> = []

          tideBand.forEach((d) => {
            const x = api.coord([d[0], d[1]])[0]
            const yMin = api.coord([d[0], d[1]])[1]
            const yMax = api.coord([d[0], d[2]])[1]
            points.push({ x, y: yMax })
            pointsReverse.unshift({ x, y: yMin })
          })

          const allPoints = [...points, ...pointsReverse]

          return {
            type: 'polygon',
            shape: {
              points: allPoints.map((p) => [p.x, p.y]),
            },
            style: {
              fill: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
                  { offset: 1, color: 'rgba(239, 68, 68, 0.35)' },
                ],
              },
            },
          }
        },
        data: tideBand,
        z: 1,
      },
      // Individual decliner lines within the band
      ...decliners.map((c) => ({
        name: `decline_${c.name}`,
        type: 'line',
        data: c.data.map((d) => [d.year, d.score]),
        smooth: 0.3,
        symbol: 'none',
        lineStyle: {
          width: 1.5,
          color: '#ef4444',
          opacity: 0.5,
        },
        z: 2,
      })),
      // IMPROVERS: Bold lines with area fills
      ...improvers.map((c, idx) => ({
        name: c.name,
        type: 'line',
        data: c.data.map((d) => [d.year, d.score]),
        smooth: 0.3,
        symbol: 'circle',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        symbolSize: (value: number[], params: any) => {
          // Larger symbol at start and end
          return params.dataIndex === 0 || params.dataIndex === c.data.length - 1 ? 8 : 0
        },
        lineStyle: {
          width: 4,
          color: c.color,
          shadowColor: c.color,
          shadowBlur: 8,
          shadowOffsetY: 2,
        },
        itemStyle: {
          color: c.color,
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: c.color + '30' },
              { offset: 1, color: c.color + '05' },
            ],
          },
        },
        // End label showing country name
        endLabel: {
          show: true,
          formatter: '{a}',
          color: c.color,
          fontSize: 12,
          fontWeight: 600,
          offset: [8, 0],
        },
        z: 10 + idx,
      })),
      // Annotation: "DECLINE" label in the red zone
      {
        type: 'scatter',
        data: [[2016, 32]],
        symbol: 'none',
        label: {
          show: true,
          formatter: '↓ DECLINE',
          color: '#dc2626',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
        },
        z: 20,
      },
    ],
    aria: {
      enabled: true,
    },
  }

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
RuleLawTrends.provenance = provenance

export { provenance as ruleLawTrendsProvenance }
export default RuleLawTrends
