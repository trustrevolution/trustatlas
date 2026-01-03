'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/lib/echarts'
// Using Record<string, any> instead of EChartsOption to avoid strict type issues
// with chart options that have complex nested types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartOption = Record<string, any>
import { cn } from '@/lib/utils'
import { downloadTableCSV, type TableExportRow } from '@/lib/export'
import type {
  ChartProvenance,
  ChartVariant,
  ResponsiveHeight,
  DataTableRow,
  DataPointMeta,
  SourceId,
} from './types'
import { DATA_SOURCES, CONFIDENCE_TIERS } from './tokens'
import { ConfidenceBadge } from './ConfidenceBadge'
import { ChartControls, SourceLine } from './ChartControls'
import { SourceDisclosure } from './SourceDisclosure'
import { AccessibleDataTable } from './AccessibleDataTable'

// =============================================================================
// Props
// =============================================================================

export interface ProvenanceChartProps {
  /** Provenance metadata for the chart */
  provenance: ChartProvenance
  /** ECharts option configuration */
  option: ChartOption
  /** Data for accessible table (required for full accessibility) */
  tableData?: DataTableRow[]
  /** Chart height - string or responsive object */
  height?: string | ResponsiveHeight
  /** Visual variant */
  variant?: ChartVariant
  /** Show chart header with title/subtitle */
  showHeader?: boolean
  /** Show source footer */
  showFooter?: boolean
  /** Show accessible data table toggle */
  showTable?: boolean
  /** Show expandable source disclosure panel */
  showDisclosure?: boolean
  /** Additional class names */
  className?: string
  /** Event handler for data point clicks */
  onDataPointClick?: (point: DataPointMeta) => void
  /** Event handler for source badge clicks */
  onSourceClick?: (source: SourceId) => void
  /** Children to render after the chart (before footer) */
  children?: React.ReactNode
}

// =============================================================================
// Component
// =============================================================================

/**
 * ProvenanceChart - Standardized wrapper for all Trust Atlas charts.
 *
 * Provides consistent:
 * - Container styling (3 variants)
 * - Source attribution footer
 * - Accessible data tables
 * - Deep linking via URL fragments
 * - ARIA labels for screen readers
 *
 * @example
 * ```tsx
 * const PROVENANCE: ChartProvenance = {
 *   id: 'usa-trust-timeline',
 *   title: 'U.S. Trust Trends',
 *   sources: [{ source: 'ANES' }, { source: 'GSS' }],
 *   years: '1958-2024',
 *   confidence: 'A',
 * }
 *
 * <ProvenanceChart
 *   provenance={PROVENANCE}
 *   option={chartOption}
 *   tableData={data}
 *   variant="editorial"
 * />
 * ```
 */
export function ProvenanceChart({
  provenance,
  option,
  tableData,
  height = { mobile: '320px', desktop: '400px' },
  variant = 'default',
  showHeader = false,
  showFooter = true,
  showTable = true,
  showDisclosure = false,
  className,
  onDataPointClick,
  onSourceClick: _onSourceClick,
  children,
}: ProvenanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReactEChartsCore>(null)
  const [showTableView, setShowTableView] = useState(false)

  // ==========================================================================
  // Deep linking - scroll into view and highlight when URL hash matches
  // ==========================================================================
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith(`#${provenance.id}`)) {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })

        // Add highlight pulse animation
        containerRef.current?.classList.add('chart-highlight-pulse')
        setTimeout(() => {
          containerRef.current?.classList.remove('chart-highlight-pulse')
        }, 2000)

        // Parse optional data point specifiers: #chart-id:year or #chart-id:country:year
        const parts = hash.slice(1).split(':')
        if (parts.length > 1) {
          // Could dispatch highlight event to chart here
          // For now, just log for debugging
          console.debug('[ProvenanceChart] Deep link params:', parts.slice(1))
        }
      }
    }

    // Check on mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [provenance.id])

  // ==========================================================================
  // Generate ARIA label from provenance metadata
  // ==========================================================================
  const ariaLabel = useMemo(() => {
    const sourceNames = provenance.sources
      .map((s) => DATA_SOURCES[s.source]?.name || s.source)
      .join(', ')

    const parts = [
      provenance.title,
      provenance.subtitle,
      provenance.narrative,
      `Data from ${sourceNames}`,
      `Years ${provenance.years}`,
      provenance.confidence &&
        `Confidence: ${CONFIDENCE_TIERS[provenance.confidence]?.label || provenance.confidence}`,
    ]

    return parts.filter(Boolean).join('. ')
  }, [provenance])

  // ==========================================================================
  // Extract source IDs for footer/disclosure
  // ==========================================================================
  const sourceIds = provenance.sources.map((s) => s.source)

  // ==========================================================================
  // CSV Download handler
  // ==========================================================================
  const handleDownloadCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return

    const exportData: TableExportRow[] = tableData.map((row) => ({
      label: row.label,
      year: row.year,
      value: row.value,
      source: row.source,
      confidence: row.confidence,
    }))

    downloadTableCSV(exportData, {
      title: provenance.title,
      sources: sourceIds,
      years: provenance.years,
    }, provenance.id)
  }, [tableData, provenance, sourceIds])

  // ==========================================================================
  // Container variant classes
  // ==========================================================================
  const variantClasses = {
    default: 'provenance-chart',
    compact: 'provenance-chart provenance-chart-compact',
    editorial: 'provenance-chart provenance-chart-editorial',
  }

  // ==========================================================================
  // Height handling - responsive or fixed
  // ==========================================================================
  const heightStyle = useMemo(() => {
    if (typeof height === 'string') {
      return { height }
    }
    // For responsive, we use CSS variables that globals.css can reference
    return {
      '--chart-height-mobile': height.mobile,
      '--chart-height-desktop': height.desktop,
    } as React.CSSProperties
  }, [height])

  const chartHeightClass =
    typeof height === 'object' ? 'chart-responsive-height' : ''

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div
      ref={containerRef}
      id={provenance.id}
      className={cn(variantClasses[variant], className)}
      role="figure"
      aria-label={ariaLabel}
    >
      {/* Skip link for keyboard users */}
      <a
        href={`#after-${provenance.id}`}
        className="chart-skip-link"
      >
        Skip chart: {provenance.title}
      </a>

      {/* Optional header */}
      {showHeader && (
        <div className="chart-header">
          <h3 className="chart-title">
            {provenance.title}
            {provenance.confidence && provenance.confidence !== 'A' && (
              <ConfidenceBadge
                tier={provenance.confidence}
                size="sm"
                showTooltip
              />
            )}
          </h3>
          {provenance.subtitle && (
            <p className="chart-subtitle">{provenance.subtitle}</p>
          )}
        </div>
      )}

      {/* Chart container with controls */}
      <div
        className={cn('chart-container relative', chartHeightClass)}
        style={heightStyle}
      >
        {/* Unified controls - positioned top-right */}
        <ChartControls
          chartRef={chartRef}
          chartTitle={provenance.title}
          onDownloadCSV={tableData && tableData.length > 0 ? handleDownloadCSV : undefined}
          onToggleTable={
            showTable && tableData && tableData.length > 0
              ? () => setShowTableView(!showTableView)
              : undefined
          }
          tableActive={showTableView}
          methodologyUrl={
            provenance.methodologyAnchor
              ? `/methodology${provenance.methodologyAnchor}`
              : undefined
          }
          position="top-right"
        />

        {/* Chart or Table view */}
        {showTableView && tableData ? (
          <div className="h-full overflow-auto p-4">
            <AccessibleDataTable
              caption={`${provenance.title} - Data table`}
              data={tableData}
              showSource
              showConfidence
              collapsible={false}
            />
          </div>
        ) : (
          <ReactEChartsCore
            echarts={echarts}
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
            onEvents={
              onDataPointClick
                ? {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    click: (params: any) => {
                      if (params.data) {
                        // Find the source for this series
                        const seriesSource = provenance.sources.find((s) =>
                          s.seriesNames?.includes(params.seriesName)
                        )
                        onDataPointClick({
                          year: params.data[0] || params.data.year,
                          score: params.data[1] || params.data.value,
                          source: seriesSource?.source || sourceIds[0],
                          confidence:
                            seriesSource?.confidence ||
                            provenance.confidence ||
                            'B',
                        })
                      }
                    },
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Custom content slot */}
      {children}

      {/* Minimal source attribution line */}
      {showFooter && (
        <SourceLine
          sources={sourceIds}
          years={provenance.years}
          className="px-4 py-2"
        />
      )}

      {/* Expandable source disclosure (optional detailed view) */}
      {showDisclosure && (
        <SourceDisclosure
          sources={sourceIds}
          showMethodology
          showLicense
          showLinks
          dark={variant === 'editorial'}
          className="border-t border-slate-100"
        />
      )}

      {/* Skip link target */}
      <span id={`after-${provenance.id}`} />
    </div>
  )
}

export default ProvenanceChart
