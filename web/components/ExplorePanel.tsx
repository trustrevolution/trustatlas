'use client'

import { useEffect, useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/lib/echarts'
import { X, TrendingUp, TrendingDown, Users, Building2, Scale, Newspaper } from 'lucide-react'
import type { Pillar } from '@/app/explore/page'
import { PILLARS, CHART_COLORS, CHART_GRID } from '@/lib/design-tokens'
import { escapeHtml } from '@/lib/utils'
import { api, type RegionStats } from '@/lib/api'
import {
  ConfidenceBadge,
  SourceDisclosure,
} from '@/components/data-provenance'

// Icon mapping for pillars
const PILLAR_ICONS = {
  interpersonal: Users,
  institutional: Building2,
  governance: Scale,
  media: Newspaper,
} as const

const PILLAR_ORDER: Pillar[] = ['interpersonal', 'institutional', 'media', 'governance']

interface PillarData {
  score: number
  confidence_tier: string
  ci_lower: number | null
  ci_upper: number | null
}

interface CountryDetail {
  iso3: string
  name: string
  region: string
  series: Array<{
    year: number
    interpersonal: PillarData | null
    institutional: PillarData | null
    governance: PillarData | null
    media: PillarData | null
    confidence_tier: string
    ci_lower: number | null
    ci_upper: number | null
  }>
  sources_used: Record<string, string[]>
}

interface ExplorePanelProps {
  selectedCountry: string | null
  onClose: () => void
  selectedPillar: Pillar
  onPillarChange: (pillar: Pillar) => void
}

export default function ExplorePanel({ selectedCountry, onClose, selectedPillar, onPillarChange }: ExplorePanelProps) {
  // Get pillar config from design tokens
  const pillarConfig = PILLARS[selectedPillar]
  const [regions, setRegions] = useState<RegionStats[]>([])
  const [countryData, setCountryData] = useState<CountryDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch regional data for default view (changes with pillar)
  useEffect(() => {
    api.getRegionStats(selectedPillar)
      .then(result => setRegions(result.regions || []))
      .catch(err => console.error('Failed to fetch regions:', err))
  }, [selectedPillar])

  // Fetch country data when selected
  useEffect(() => {
    if (!selectedCountry) {
      setCountryData(null)
      return
    }

    setLoading(true)
    api.getCountryDetail(selectedCountry)
      .then(result => {
        // Map to local interface (API returns slightly different shape)
        setCountryData(result as unknown as CountryDetail)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch country:', err)
        setLoading(false)
      })
  }, [selectedCountry])

  // Default view: Global/Regional summary
  if (!selectedCountry) {
    const totalCountries = regions.reduce((sum, r) => sum + r.countryCount, 0)
    const globalAvg = regions.length > 0
      ? regions.reduce((sum, r) => sum + r.avgScore * r.countryCount, 0) / totalCountries
      : 0

    return (
      <div className="panel-container">
        <h2 className="font-display text-2xl text-white mb-2">Global Overview</h2>
        <p className={`text-sm mb-6 ${pillarConfig.tailwindText}`}>{pillarConfig.label}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="panel-dark">
            <div className="text-3xl font-display text-white">{totalCountries}</div>
            <div className="text-slate-400 text-sm">Countries</div>
          </div>
          <div className="panel-dark">
            <div className={`text-3xl font-display ${pillarConfig.tailwindText}`}>{globalAvg.toFixed(1)}</div>
            <div className="text-slate-400 text-sm">Global Average</div>
          </div>
        </div>

        {/* Regional breakdown */}
        <h3 className="text-slate-300 font-semibold mb-4">By Region</h3>
        <div className="space-y-3">
          {regions.map(region => (
            <div key={region.region} className="panel-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{region.region}</span>
                <span className={`${pillarConfig.tailwindText} font-display text-xl`}>{region.avgScore.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{region.countryCount} countries</span>
                <span>Range: {region.minScore.toFixed(0)} - {region.maxScore.toFixed(0)}</span>
              </div>
              {/* Mini bar */}
              <div className="progress-bar mt-2">
                <div
                  className={`progress-bar-fill bg-gradient-to-r ${pillarConfig.tailwindBg}`}
                  style={{ width: `${region.avgScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-sm mt-6">
          Click a country on the map to see detailed data.
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="panel-container flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  // Country detail view
  if (!countryData) {
    return (
      <div className="panel-container flex items-center justify-center">
        <div className="text-slate-400">Country not found</div>
      </div>
    )
  }

  // Get latest data point (first in series, which is sorted descending by year)
  const latestDataPoint = countryData.series[0]

  // Build pillar summary - what data is available for each pillar
  const pillarSummary = PILLAR_ORDER.map(pillarId => {
    const series = countryData.series.filter(d => d[pillarId]?.score != null)
    const latest = series[0]
    const oldest = series[series.length - 1]
    const pillarData = latest?.[pillarId]
    const value = pillarData?.score ?? null
    const hasData = value != null

    // Calculate trend if we have multiple data points
    let trend = null
    if (series.length >= 2 && value != null) {
      const oldValue = oldest?.[pillarId]?.score
      if (oldValue != null) {
        const diff = value - oldValue
        if (Math.abs(diff) >= 3) {
          trend = diff > 0
            ? { icon: TrendingUp, text: `+${diff.toFixed(0)}`, color: 'text-green-400' }
            : { icon: TrendingDown, text: diff.toFixed(0), color: 'text-red-400' }
        }
      }
    }

    return {
      pillarId,
      config: PILLARS[pillarId],
      Icon: PILLAR_ICONS[pillarId],
      value,
      hasData,
      trend,
      confidenceTier: pillarData?.confidence_tier ?? null,
      yearRange: hasData ? `${oldest?.year}–${latest?.year}` : null,
      sources: countryData.sources_used[pillarId] || [],
    }
  })

  // Get detailed data for selected pillar
  const selectedPillarData = pillarSummary.find(p => p.pillarId === selectedPillar)!
  const pillarSeries = countryData.series.filter(d => d[selectedPillar]?.score != null)
  const pillarSources = countryData.sources_used[selectedPillar] || []

  // Chart options for time series - show only selected pillar
  const chartOption = pillarSeries.length > 1 ? {
    backgroundColor: 'transparent',
    grid: CHART_GRID.compact,
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART_COLORS.tooltip.backgroundColor,
      borderColor: CHART_COLORS.tooltip.borderColor,
      textStyle: CHART_COLORS.tooltip.textStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const point = params[0]
        if (!point || point.value === null) return ''
        return `<div class="font-sans">
          <div class="text-slate-400 text-xs">${escapeHtml(point.name)}</div>
          <div class="text-lg font-bold text-white">${escapeHtml(point.value?.toFixed(1))}%</div>
        </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: [...pillarSeries].reverse().map(d => d.year),
      axisLine: { lineStyle: { color: CHART_COLORS.axis.lineColor } },
      axisLabel: { color: CHART_COLORS.axis.labelColor, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisLabel: { color: CHART_COLORS.axis.labelColor, fontSize: 10 },
      splitLine: { lineStyle: { color: CHART_COLORS.grid.lineColor } }
    },
    series: [
      {
        name: pillarConfig.label,
        type: 'line',
        data: [...pillarSeries].reverse().map(d => d[selectedPillar]?.score),
        smooth: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#e2e8f0', width: 1.5 },
        itemStyle: { color: '#e2e8f0', borderWidth: 0 },
        emphasis: {
          itemStyle: { color: '#fbbf24', borderColor: '#fbbf24', borderWidth: 0 }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(148, 163, 184, 0.08)' },
              { offset: 1, color: 'rgba(148, 163, 184, 0)' }
            ]
          }
        }
      }
    ]
  } : null

  // Find other pillars with data (for guidance when selected pillar has no data)
  const pillarsWithData = pillarSummary.filter(p => p.hasData).map(p => p.pillarId)

  return (
    <div className="panel-container !p-0">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="font-display text-2xl text-white">{countryData.name}</h2>
          <p className="text-slate-400 text-sm">{countryData.region}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* All 3 Pillars Summary - clickable cards */}
        <div className="space-y-2">
          <h3 className="text-slate-500 text-xs uppercase tracking-wider">Trust Profile</h3>
          <div className="grid gap-2">
            {pillarSummary.map(({ pillarId, config, Icon, value, hasData, trend }) => {
              const isSelected = pillarId === selectedPillar
              return (
                <button
                  key={pillarId}
                  onClick={() => hasData && onPillarChange(pillarId)}
                  disabled={!hasData}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all
                    ${isSelected
                      ? 'bg-white/10 ring-2 ring-white/20'
                      : hasData
                        ? 'bg-slate-800/50 hover:bg-slate-800'
                        : 'bg-slate-800/30 opacity-60 cursor-not-allowed'
                    }
                  `}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {config.shortLabel}
                        </div>
                        <div className="text-xs text-slate-500">{config.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {hasData ? (
                        <>
                          <div className={`text-xl font-display ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {value!.toFixed(0)}%
                          </div>
                          {trend && (
                            <div className={`flex items-center justify-end gap-1 text-xs ${trend.color}`}>
                              <trend.icon className="w-3 h-3" />
                              <span>{trend.text}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-slate-500">No data</div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected pillar detail */}
        {selectedPillarData.hasData ? (
          <>
            {/* Confidence badge */}
            {selectedPillarData.confidenceTier && (
              <div className="flex items-center gap-2">
                <ConfidenceBadge
                  tier={selectedPillarData.confidenceTier}
                  showLabel
                  showTooltip
                  size="sm"
                />
                {selectedPillarData.yearRange && (
                  <span className="text-xs text-slate-500">{selectedPillarData.yearRange}</span>
                )}
              </div>
            )}

            {/* Time series chart */}
            {chartOption && (
              <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                  {pillarConfig.shortLabel} Over Time
                </h3>
                <div className="chart-panel">
                  <ReactEChartsCore
                    echarts={echarts}
                    key={`${selectedCountry}-${selectedPillar}`}
                    option={chartOption}
                    style={{ height: 180, position: 'relative', zIndex: 1 }}
                    notMerge={true}
                  />
                </div>
              </div>
            )}

            {/* Sources */}
            {pillarSources.length > 0 && (
              <SourceDisclosure
                sources={pillarSources}
                showMethodology
                showLicense
                showLinks
                dark
                className="mt-2"
              />
            )}
          </>
        ) : (
          /* Empty state guidance */
          <div className="panel-dark p-4 text-center">
            <div className="text-slate-400 mb-2">
              No {pillarConfig.shortLabel.toLowerCase()} data available for {countryData.name}.
            </div>
            {pillarsWithData.length > 0 && (
              <div className="text-sm text-slate-500">
                Try viewing:{' '}
                {pillarsWithData.map((pId, idx) => (
                  <span key={pId}>
                    {idx > 0 && ', '}
                    <button
                      onClick={() => onPillarChange(pId)}
                      className="text-white hover:underline"
                    >
                      {PILLARS[pId].shortLabel}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
