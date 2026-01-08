/**
 * ChartWithControls - OWID-style chart composition wrapper
 *
 * Layout:
 * +-----------------------------------------------------------------------+
 * |  [Chart] [Table]                              Trust Atlas  [Actions]  |  <- TOP ROW
 * +-----------------------------------------------------------------------+
 * |                                                                       |
 * |                        CHART AREA (clear)                             |
 * |                                                                       |
 * +-----------------------------------------------------------------------+
 * |  [▶]  1984 |------------------o--------------| 2022                   |  <- TIME SLIDER
 * +-----------------------------------------------------------------------+
 * |  Source: ESS (2015-2023) – Learn more                                 |  <- FOOTER
 * |  trustatlas.org | CC BY-SA              [Download] [Share] [⛶]        |
 * +-----------------------------------------------------------------------+
 */
'use client'

import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { EChartsWrapper, type EChartsWrapperRef } from './EChartsWrapper'
import { echarts } from '@/lib/echarts'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccessibleDataTable } from '@/components/data-provenance/AccessibleDataTable'
import { CONFIDENCE_TIERS } from '@/components/data-provenance/tokens'
import type {
  ChartProvenance,
  DataTableRow,
  ResponsiveHeight,
} from '@/components/data-provenance/types'

import { ChartTopRow } from './ChartTopRow'
import { ChartFooter } from './ChartFooter'
import { TimeSlider } from './TimeSlider'
import { useFullscreen } from '@/lib/hooks/useFullscreen'
import { usePNGExport } from '@/lib/hooks/usePNGExport'
import { useCSVExport } from '@/lib/hooks/useCSVExport'
import { DATA_SOURCES } from '@/components/data-provenance/tokens'
import type { ViewType } from './ViewTabs'

// =============================================================================
// Types
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartOption = Record<string, any>

export interface ChartWithControlsProps {
  /** ECharts option configuration */
  option: ChartOption
  /** Provenance metadata for attribution footer */
  provenance: ChartProvenance
  /** Data for accessible table view */
  tableData?: DataTableRow[]
  /** Chart height */
  height?: string | ResponsiveHeight
  /** Show controls (top row + footer) */
  showControls?: boolean
  /** Additional class names */
  className?: string
  /** Callback for data point clicks */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDataPointClick?: (params: any) => void

  // --- Title Override ---
  /** Override title for fullscreen header, exports, and ARIA (uses provenance.title if not set) */
  displayTitle?: string
  /** Override subtitle for ARIA label */
  displaySubtitle?: string

  // --- View Tabs ---
  /** Initial view mode */
  defaultView?: ViewType
  /** Callback when view changes */
  onViewChange?: (view: ViewType) => void

  // --- Time Slider ---
  /** Show time slider */
  showTimeSlider?: boolean
  /** Available years for time slider */
  timeSeriesYears?: number[]
  /** Initial year (null = show all) */
  initialYear?: number | null
  /** Callback when year changes */
  onYearChange?: (year: number | null) => void

  // --- Top Row ---
  /** Show Trust Atlas brand badge */
  showBrand?: boolean
  /** Custom actions for top row right side */
  topRowActions?: React.ReactNode

  // --- Footer ---
  /** Show fullscreen button */
  showFullscreen?: boolean

  // --- Lazy Loading ---
  /** Defer rendering until scrolled into view (default: false - use with static charts only) */
  lazyLoad?: boolean
  /** Custom skeleton to show while lazy loading */
  loadingSkeleton?: React.ReactNode
}

// =============================================================================
// Main Component
// =============================================================================

export function ChartWithControls({
  option,
  provenance,
  tableData,
  height = '400px',
  showControls = true,
  className,
  onDataPointClick,
  // Title override
  displayTitle,
  displaySubtitle,
  // View
  defaultView = 'chart',
  onViewChange: externalOnViewChange,
  // Time slider
  showTimeSlider = false,
  timeSeriesYears,
  initialYear = null,
  onYearChange: externalOnYearChange,
  // Top row
  showBrand = true,
  topRowActions,
  // Footer
  showFullscreen = true,
  // Lazy loading
  lazyLoad = false,
  loadingSkeleton,
}: ChartWithControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsWrapperRef>(null)

  // Track mount state for safe cleanup during HMR
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      // Don't manually dispose - let echarts-for-react handle its own cleanup
      // Manual disposal conflicts with library's componentWillUnmount
    }
  }, [])

  // Lazy loading state - only render chart when visible
  const [isVisible, setIsVisible] = useState(!lazyLoad)
  const hasAnimated = useRef(false)

  // Resolved title/subtitle (override or fallback to provenance)
  const title = displayTitle ?? provenance.title
  const subtitle = displaySubtitle ?? provenance.subtitle

  // ---------------------------------------------------------------------------
  // Lazy loading - IntersectionObserver
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!lazyLoad) return

    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [lazyLoad])

  // ---------------------------------------------------------------------------
  // Deep link - bypass lazy loading when URL hash matches this chart's section
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash.slice(1)
    if (hash === provenance.id) {
      // Bypass lazy loading for deep-linked chart
      setIsVisible(true)
    }
  }, [provenance.id])

  // View state
  const [activeView, setActiveView] = useState<ViewType>(defaultView)

  // Time slider state
  const [currentYear, setCurrentYear] = useState<number | null>(initialYear)

  // Fullscreen
  const { isFullscreen, toggleFullscreen, isSupported: fullscreenSupported } = useFullscreen(containerRef)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view)
    externalOnViewChange?.(view)
  }, [externalOnViewChange])

  const handleYearChange = useCallback((year: number | null) => {
    setCurrentYear(year)
    externalOnYearChange?.(year)
  }, [externalOnYearChange])

  // ---------------------------------------------------------------------------
  // Height handling
  // ---------------------------------------------------------------------------

  const heightStyle = useMemo(() => {
    if (typeof height === 'string') {
      return { height }
    }
    return {
      '--chart-height-mobile': height.mobile,
      '--chart-height-desktop': height.desktop,
    } as React.CSSProperties
  }, [height])

  const heightClass = typeof height === 'object' ? 'chart-responsive-height' : ''

  // ---------------------------------------------------------------------------
  // Chart option (disable toolbox)
  // ---------------------------------------------------------------------------

  const chartOption = useMemo(() => {
    // Disable animation after first render to prevent double animation
    const shouldAnimate = !hasAnimated.current
    if (shouldAnimate) {
      hasAnimated.current = true
    }

    return {
      ...option,
      toolbox: { show: false },
      // Remove title since we show it in our header
      title: { show: false },
      // Pass through grid config - charts use CHART_GRID presets with containLabel
      grid: option.grid,
      // Only animate on first render
      animation: shouldAnimate,
    }
  }, [option])

  // ---------------------------------------------------------------------------
  // Source info (for footer display)
  // ---------------------------------------------------------------------------

  const sourceNames = useMemo(() =>
    provenance.sources.map((s) => DATA_SOURCES[s.source]?.name || s.source).join(', '),
    [provenance.sources]
  )


  // ---------------------------------------------------------------------------
  // Export hooks
  // ---------------------------------------------------------------------------

  const handleSavePNG = usePNGExport({
    chartRef,
    title,
    subtitle,
    sourceNames,
    years: provenance.years,
  })

  const handleDownloadCSV = useCSVExport({ tableData, provenance })

  // ---------------------------------------------------------------------------
  // ARIA label
  // ---------------------------------------------------------------------------

  const ariaLabel = useMemo(() => {
    return [
      title,
      subtitle,
      `Data from ${sourceNames}`,
      `Years ${provenance.years}`,
      provenance.confidence &&
        `Confidence: ${CONFIDENCE_TIERS[provenance.confidence]?.label || provenance.confidence}`,
    ]
      .filter(Boolean)
      .join('. ')
  }, [title, subtitle, provenance, sourceNames])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const hasTableData = tableData && tableData.length > 0
  const showTimeSliderActual = showTimeSlider && timeSeriesYears && timeSeriesYears.length > 1

  // Default loading skeleton
  const defaultSkeleton = (
    <div
      className={cn('bg-slate-100 rounded-lg animate-pulse flex items-center justify-center', heightClass)}
      style={heightStyle}
    >
      <div className="text-slate-400 text-sm">Loading chart...</div>
    </div>
  )

  // Show skeleton until visible (lazy loading)
  if (!isVisible) {
    return (
      <div ref={containerRef} className={className}>
        {loadingSkeleton ?? defaultSkeleton}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-white rounded-lg border border-slate-200',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0 overflow-auto',
        className
      )}
      role="figure"
      aria-label={ariaLabel}
    >
      {/* FULLSCREEN HEADER */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-xl font-display text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors touch-target"
            aria-label="Exit fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TOP ROW: View tabs + brand/actions */}
      {showControls && (hasTableData || showBrand || topRowActions) && (
        <ChartTopRow
          activeView={activeView}
          onViewChange={handleViewChange}
          showBrand={showBrand}
          showViewTabs={hasTableData}
          actions={topRowActions}
        />
      )}

      {/* CHART/TABLE AREA */}
      <div
        id={activeView === 'chart' ? 'chart-panel' : 'table-panel'}
        role="tabpanel"
        className={cn('relative', heightClass)}
        style={heightStyle}
      >
        {activeView === 'table' && tableData ? (
          <div className="h-full overflow-auto p-4">
            <AccessibleDataTable
              caption={`${title} - Data table`}
              data={tableData}
              showSource
              showConfidence
              collapsible={false}
            />
          </div>
        ) : (
          <EChartsWrapper
            key={provenance.id}
            echarts={echarts}
            ref={chartRef}
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
            notMerge
            onEvents={
              onDataPointClick
                ? { click: onDataPointClick }
                : undefined
            }
          />
        )}
      </div>

      {/* TIME SLIDER (optional) */}
      {showTimeSliderActual && (
        <TimeSlider
          years={timeSeriesYears!}
          currentYear={currentYear}
          onYearChange={handleYearChange}
        />
      )}

      {/* FOOTER */}
      {showControls && (
        <ChartFooter
          provenance={provenance}
          onDownloadPNG={handleSavePNG}
          onDownloadCSV={hasTableData ? handleDownloadCSV : undefined}
          onFullscreen={fullscreenSupported ? toggleFullscreen : undefined}
          isFullscreen={isFullscreen}
          showFullscreen={showFullscreen && fullscreenSupported}
        />
      )}
    </div>
  )
}

export default ChartWithControls
