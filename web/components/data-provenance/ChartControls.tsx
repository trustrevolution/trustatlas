/**
 * ChartControls - Unified control bar for Trust Atlas charts
 *
 * Replaces scattered controls (ECharts toolbox, footer buttons) with
 * a consolidated, minimal toolbar featuring human-centered tooltips.
 *
 * Design principles:
 * - Group related actions (Share, View, Learn)
 * - Tooltips explain value, not just function
 * - Minimal visual footprint until hover
 * - Keyboard accessible
 */
'use client'

import { useState, useCallback, type RefObject } from 'react'
import { Download, Image, Table2, Info } from 'lucide-react'
import type ReactEChartsCore from 'echarts-for-react/lib/core'
import { cn } from '@/lib/utils'

// =============================================================================
// Tooltip Component - Positioned popover with helpful context
// =============================================================================

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
  align?: 'center' | 'right' // Alignment to prevent clipping on edges
}

function Tooltip({ content, children, position = 'bottom', align = 'center' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-[11px] leading-snug',
            'bg-slate-900 text-slate-100 rounded-md shadow-lg',
            'whitespace-nowrap pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            position === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'right' && 'right-0'
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-slate-900 rotate-45',
              position === 'bottom' ? '-top-1' : '-bottom-1',
              align === 'center' && 'left-1/2 -translate-x-1/2',
              align === 'right' && 'right-3'
            )}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Control Button - Minimal, accessible button with tooltip
// =============================================================================

interface ControlButtonProps {
  icon: React.ReactNode
  label: string
  tooltip: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  tooltipPosition?: 'top' | 'bottom'
}

function ControlButton({
  icon,
  label,
  tooltip,
  onClick,
  active = false,
  disabled = false,
  tooltipPosition = 'bottom',
}: ControlButtonProps) {
  return (
    <Tooltip content={tooltip} position={tooltipPosition}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md',
          'text-[11px] font-medium transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
          active
            ? 'bg-slate-800 text-white'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
        aria-label={label}
        aria-pressed={active}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
    </Tooltip>
  )
}

// =============================================================================
// Main ChartControls Component
// =============================================================================

export interface ChartControlsProps {
  /** Reference to the ECharts instance for PNG export */
  chartRef: RefObject<ReactEChartsCore | null>
  /** Chart title for filename */
  chartTitle: string
  /** Callback to download CSV */
  onDownloadCSV?: () => void
  /** Callback to toggle table view */
  onToggleTable?: () => void
  /** Whether table view is currently active */
  tableActive?: boolean
  /** Methodology URL (if provided, shows info button) */
  methodologyUrl?: string
  /** Position of the controls */
  position?: 'top-right' | 'bottom-right'
  /** Additional class names */
  className?: string
}

export function ChartControls({
  chartRef,
  chartTitle,
  onDownloadCSV,
  onToggleTable,
  tableActive = false,
  methodologyUrl,
  position = 'top-right',
  className,
}: ChartControlsProps) {
  const [isZooming, setIsZooming] = useState(false)

  // -------------------------------------------------------------------------
  // PNG Export - Uses ECharts getDataURL
  // -------------------------------------------------------------------------
  const handleSavePNG = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) return

    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
      excludeComponents: ['toolbox'],
    })

    const link = document.createElement('a')
    link.download = `${chartTitle.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = url
    link.click()
  }, [chartRef, chartTitle])

  // -------------------------------------------------------------------------
  // Zoom toggle - Uses ECharts dataZoom (prepared for future implementation)
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleZoomToggle = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) return

    if (isZooming) {
      // Reset zoom
      chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
      setIsZooming(false)
    } else {
      // Enable zoom mode - ECharts handles this via toolbox internally
      // For custom zoom, we'd need more complex implementation
      setIsZooming(true)
    }
  }, [chartRef, isZooming])

  // -------------------------------------------------------------------------
  // Reset chart (prepared for future implementation)
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleReset = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) return

    chart.dispatchAction({ type: 'restore' })
    setIsZooming(false)
  }, [chartRef])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-lg',
        'bg-white/80 backdrop-blur-sm border border-slate-200/60',
        'shadow-sm',
        position === 'top-right' && 'absolute top-3 right-3 z-10',
        position === 'bottom-right' && '',
        className
      )}
      role="toolbar"
      aria-label="Chart controls"
    >
      {/* Share group */}
      <ControlButton
        icon={<Image className="w-3.5 h-3.5" />}
        label="PNG"
        tooltip="Save image to share or include in presentations"
        onClick={handleSavePNG}
      />

      {onDownloadCSV && (
        <ControlButton
          icon={<Download className="w-3.5 h-3.5" />}
          label="CSV"
          tooltip="Download raw data for your own analysis"
          onClick={onDownloadCSV}
        />
      )}

      {/* Divider */}
      {onToggleTable && <div className="w-px h-4 bg-slate-200 mx-1" />}

      {/* View group */}
      {onToggleTable && (
        <ControlButton
          icon={<Table2 className="w-3.5 h-3.5" />}
          label="Table"
          tooltip={
            tableActive
              ? 'Switch back to chart visualization'
              : 'View underlying data in accessible table format'
          }
          onClick={onToggleTable}
          active={tableActive}
        />
      )}

      {/* Divider */}
      {methodologyUrl && <div className="w-px h-4 bg-slate-200 mx-1" />}

      {/* Learn - subtle info icon (right-aligned tooltip to prevent clipping) */}
      {methodologyUrl && (
        <Tooltip content="Learn how this data is collected and processed" align="right">
          <a
            href={methodologyUrl}
            className={cn(
              'inline-flex items-center justify-center w-7 h-7 rounded-md',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50'
            )}
            aria-label="View methodology"
          >
            <Info className="w-3.5 h-3.5" />
          </a>
        </Tooltip>
      )}
    </div>
  )
}

// =============================================================================
// Minimal source line for footer
// =============================================================================

export interface SourceLineProps {
  sources: string[]
  years?: string
  className?: string
}

export function SourceLine({ sources, years, className }: SourceLineProps) {
  return (
    <div
      className={cn(
        'text-[10px] text-slate-400 leading-relaxed',
        className
      )}
    >
      <span className="text-slate-500">Source{sources.length > 1 ? 's' : ''}:</span>{' '}
      {sources.join(', ')}
      {years && <span className="text-slate-500"> ({years})</span>}
    </div>
  )
}

export default ChartControls
