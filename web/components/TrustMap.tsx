'use client'

import { useEffect, useRef, useState } from 'react'
import { echarts, type EChartsOption } from '@/lib/echarts'
import type { Pillar } from '@/app/explore/page'
import { PILLARS, CHART_COLORS, TRUST_GRADIENT, MAP_CONFIG } from '@/lib/design-tokens'
import { escapeHtml } from '@/lib/utils'

// Standard pillar data (social, media)
interface CountryData {
  iso3: string
  name: string
  region: string
  year: number
  score: number
  source: string
  ci_lower?: number | null
  ci_upper?: number | null
}

// Institutions pillar data (includes gap)
interface InstitutionsCountryData {
  iso3: string
  name: string
  region: string
  institutional_trust: number | null
  institutional_year: number | null
  institutional_source: string | null
  governance_quality: number | null
  governance_year: number | null
  governance_sources: string | null
  trust_quality_gap: number | null
}

type MapCountryData = CountryData | InstitutionsCountryData

// Type guard to check if data is institutions format
function isInstitutionsData(data: MapCountryData): data is InstitutionsCountryData {
  return 'institutional_trust' in data
}

interface TrustMapProps {
  onCountrySelect: (iso3: string | null) => void
  selectedCountry: string | null
  pillar: Pillar
}

// Map API country names to ECharts country names
const nameToEchartsName: Record<string, string> = {
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
  'Russia': 'Russia',
  'South Korea': 'S. Korea',
  'Korea, Republic of': 'S. Korea',
  'Korea': 'S. Korea',
  'North Korea': 'N. Korea',
  'Vietnam': 'Vietnam',
  'Viet Nam': 'Vietnam',
  'Laos': 'Laos',
  'Iran': 'Iran',
  'Iran, Islamic Republic of': 'Iran',
  'Syria': 'Syria',
  'Syrian Arab Republic': 'Syria',
  'Venezuela': 'Venezuela',
  'Bolivia': 'Bolivia',
  'Tanzania': 'Tanzania',
  'Tanzania, United Republic of': 'Tanzania',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Congo, Democratic Republic of the': 'Dem. Rep. Congo',
  'Czechia': 'Czech Rep.',
  'Czech Republic': 'Czech Rep.',
  'Slovakia': 'Slovakia',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'North Macedonia': 'Macedonia',
  'Macedonia': 'Macedonia',
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Ivory Coast': "Côte d'Ivoire",
  'Brunei': 'Brunei',
  'Brunei Darussalam': 'Brunei',
  'United Arab Emirates': 'United Arab Emirates',
  'Saudi Arabia': 'Saudi Arabia',
  'South Africa': 'South Africa',
  'New Zealand': 'New Zealand',
  'Dominican Republic': 'Dominican Rep.',
  'Costa Rica': 'Costa Rica',
  'Puerto Rico': 'Puerto Rico',
  'Trinidad and Tobago': 'Trinidad and Tobago',
  'El Salvador': 'El Salvador',
  'Republic of the Congo': 'Congo',
  'Congo': 'Congo',
  'Central African Republic': 'Central African Rep.',
  'Antigua and Barbuda': 'Antigua and Barb.',
  'Eswatini': 'Swaziland',
  'Swaziland': 'Swaziland',
}

// Map ISO3 to ECharts names (fallback)
const iso3ToName: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  RUS: 'Russia',
  KOR: 'S. Korea',
  PRK: 'N. Korea',
  CZE: 'Czech Rep.',
  BIH: 'Bosnia and Herz.',
  MKD: 'Macedonia',
  COD: 'Dem. Rep. Congo',
  COG: 'Congo',
  CAF: 'Central African Rep.',
  DOM: 'Dominican Rep.',
  ATG: 'Antigua and Barb.',
  SWZ: 'Swaziland',
}

export default function TrustMap({ onCountrySelect, selectedCountry, pillar }: TrustMapProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [data, setData] = useState<MapCountryData[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch trust data based on selected pillar
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/trends/global?pillar=${pillar}`)
      .then(res => res.json())
      .then(result => {
        setData(result.countries || [])
      })
      .catch(err => console.error('Failed to fetch trust data:', err))
  }, [pillar])

  // Load world map GeoJSON
  useEffect(() => {
    const loadMap = async () => {
      try {
        // Try local first, then CDN fallbacks
        const sources = [
          '/world.json',
          'https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json',
        ]

        for (const url of sources) {
          try {
            const res = await fetch(url)
            if (res.ok) {
              const worldMap = await res.json()
              echarts.registerMap('world', worldMap)
              setMapLoaded(true)
              return
            }
          } catch {
            continue
          }
        }

        // If all CDNs fail, show error
        setError('Could not load world map')
      } catch (err) {
        console.error('Failed to load world map:', err)
        setError('Could not load world map')
      }
    }

    loadMap()
  }, [])

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !mapLoaded || data.length === 0) return

    // Initialize chart if not exists
    const isFirstRender = !chartInstance.current
    if (isFirstRender) {
      chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' })
    }

    // Preserve current zoom/center if chart already exists (pillar change shouldn't reset view)
    let currentZoom = MAP_CONFIG.initialZoom
    let currentCenter: [number, number] | undefined
    if (!isFirstRender && chartInstance.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentOption = chartInstance.current.getOption() as any
      if (currentOption?.series?.[0]) {
        currentZoom = currentOption.series[0].zoom ?? MAP_CONFIG.initialZoom
        currentCenter = currentOption.series[0].center
      }
    }

    // Transform data for ECharts - try name mapping first, then ISO3 fallback
    const mapData = data.map(country => {
      if (isInstitutionsData(country)) {
        // Institutions pillar - use institutional_trust as the primary value
        return {
          name: nameToEchartsName[country.name] || iso3ToName[country.iso3] || country.name,
          value: country.institutional_trust,
          iso3: country.iso3,
          year: country.institutional_year,
          source: country.institutional_source,
          region: country.region,
          // Institutions-specific
          governance_quality: country.governance_quality,
          trust_quality_gap: country.trust_quality_gap,
        }
      } else {
        // Standard pillars (social, media)
        return {
          name: nameToEchartsName[country.name] || iso3ToName[country.iso3] || country.name,
          value: country.score,
          iso3: country.iso3,
          year: country.year,
          source: country.source,
          region: country.region,
          ci_lower: country.ci_lower,
          ci_upper: country.ci_upper,
        }
      }
    })

    const option: EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!params.data || params.data.value === undefined || params.data.value === null) {
            return `<div class="font-sans">
              <div class="font-semibold">${escapeHtml(params.name)}</div>
              <div class="text-slate-400 text-sm">No data for ${escapeHtml(PILLARS[pillar].label)}</div>
            </div>`
          }
          const currentYear = new Date().getFullYear()
          const dataAge = params.data.year ? currentYear - params.data.year : null
          const freshnessText = dataAge === null ? 'Unknown' :
            dataAge === 0 ? 'This year' :
            dataAge === 1 ? 'Last year' :
            `${dataAge} years ago`

          // Institutions pillar has special display with gap
          if (pillar === 'institutions' && params.data.trust_quality_gap !== undefined) {
            const gap = params.data.trust_quality_gap
            const gapText = gap !== null
              ? `<div class="text-xs mt-2 pt-2 border-t border-slate-600">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Governance Quality:</span>
                    <span>${params.data.governance_quality !== null ? params.data.governance_quality.toFixed(1) + '%' : 'N/A'}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1">
                    <span class="text-slate-400">Trust-Quality Gap:</span>
                    <span class="${gap > 0 ? 'text-amber-400' : gap < 0 ? 'text-cyan-400' : ''}">${gap > 0 ? '+' : ''}${gap.toFixed(1)}</span>
                  </div>
                </div>`
              : ''
            return `<div class="font-sans">
              <div class="font-semibold text-base">${escapeHtml(params.name)}</div>
              <div class="text-slate-400 text-xs mt-1">Institutional Trust</div>
              <div class="text-2xl font-bold text-amber-500">${escapeHtml(params.data.value.toFixed(1))}%</div>
              ${gapText}
              <div class="text-slate-500 text-xs mt-2">${params.data.year ? `${escapeHtml(String(params.data.year))} (${escapeHtml(freshnessText)})` : ''}</div>
            </div>`
          }

          return `<div class="font-sans">
            <div class="font-semibold text-base">${escapeHtml(params.name)}</div>
            <div class="text-2xl font-bold text-amber-500">${escapeHtml(params.data.value.toFixed(1))}%</div>
            <div class="text-slate-400 text-xs mt-1">Last measured: ${escapeHtml(String(params.data.year))} <span class="opacity-60">(${escapeHtml(freshnessText)})</span></div>
            <div class="text-slate-500 text-xs">${escapeHtml(params.data.source || '')}</div>
          </div>`
        },
        backgroundColor: CHART_COLORS.tooltip.backgroundColor,
        borderColor: CHART_COLORS.tooltip.borderColor,
        textStyle: CHART_COLORS.tooltip.textStyle,
        padding: [12, 16]
      },
      visualMap: {
        min: 0,
        max: 100,
        left: MAP_CONFIG.visualMap.left,
        bottom: MAP_CONFIG.visualMap.bottom,
        text: [`High ${PILLARS[pillar].label}`, `Low ${PILLARS[pillar].label}`],
        calculable: false,
        inRange: {
          color: [...TRUST_GRADIENT]
        },
        textStyle: {
          color: CHART_COLORS.axis.labelColor,
          fontSize: MAP_CONFIG.visualMap.fontSize
        }
      },
      series: [
        {
          name: PILLARS[pillar].label,
          type: 'map',
          map: 'world',
          roam: true,
          zoom: currentZoom,
          center: currentCenter,
          scaleLimit: {
            min: MAP_CONFIG.minZoom,
            max: MAP_CONFIG.maxZoom
          },
          emphasis: {
            label: {
              show: false
            },
            itemStyle: {
              areaColor: MAP_CONFIG.emphasis.areaColor,
              borderColor: MAP_CONFIG.emphasis.borderColor,
              borderWidth: MAP_CONFIG.emphasis.borderWidth
            }
          },
          select: {
            label: {
              show: false
            },
            itemStyle: {
              areaColor: MAP_CONFIG.select.areaColor,
              borderColor: MAP_CONFIG.select.borderColor,
              borderWidth: MAP_CONFIG.select.borderWidth
            }
          },
          itemStyle: {
            borderColor: MAP_CONFIG.border.color,
            borderWidth: MAP_CONFIG.border.width,
            areaColor: MAP_CONFIG.itemStyle.areaColor
          },
          data: mapData
        }
      ]
    }

    const chart = chartInstance.current!
    chart.setOption(option)

    // Handle click events
    chart.off('click')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart.on('click', (params: any) => {
      if (params.data?.iso3) {
        onCountrySelect(params.data.iso3)
      }
    })

    // Handle resize
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, mapLoaded, onCountrySelect, pillar])

  // Update selection visual
  useEffect(() => {
    if (!chartInstance.current || !mapLoaded) return

    const chart = chartInstance.current
    if (selectedCountry) {
      const countryName = iso3ToName[selectedCountry] || data.find(c => c.iso3 === selectedCountry)?.name
      if (countryName) {
        chart.dispatchAction({
          type: 'select',
          name: countryName
        })
      }
    } else {
      chart.dispatchAction({
        type: 'unselect'
      })
    }
  }, [selectedCountry, mapLoaded, data])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={chartRef} className="w-full h-full" />
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-slate-400">Loading map...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="text-red-400 mb-2">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="text-amber-400 hover:underline text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
