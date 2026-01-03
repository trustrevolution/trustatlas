/**
 * ChartSourceFooter - Standardized footer for chart source attribution
 *
 * Displays source information below charts with optional interactivity,
 * links to methodology, and year ranges.
 *
 * @example
 * ```tsx
 * // Simple text footer
 * <ChartSourceFooter sources={['WVS', 'GSS']} years="2015-2024" />
 *
 * // Interactive with methodology link
 * <ChartSourceFooter
 *   sources={['WVS', 'ESS', 'OECD']}
 *   years="2010-2023"
 *   interactive
 *   onMethodologyClick={() => openMethodologyPanel()}
 * />
 * ```
 */
'use client'

import { Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getSourceConfig } from './tokens'
import { SourceBadge } from './SourceBadge'
import { ConfidenceDot } from './ConfidenceBadge'
import type { SourceId, ConfidenceTier, DataProvenanceBaseProps } from './types'
import { cn } from '@/lib/utils'

export interface ChartSourceFooterProps extends DataProvenanceBaseProps {
  /** Array of source IDs or comma-separated string */
  sources: SourceId[] | string[] | string
  /** Year or year range (e.g., "2024" or "2015-2024") */
  years?: string
  /** Enable interactive source badges */
  interactive?: boolean
  /** Show confidence tier indicator */
  confidence?: ConfidenceTier | string
  /** Show methodology link */
  showMethodology?: boolean
  /** Custom methodology click handler */
  onMethodologyClick?: () => void
  /** Custom methodology URL (defaults to /methodology) */
  methodologyUrl?: string
  /** Compact mode for tight spaces */
  compact?: boolean
}

export function ChartSourceFooter({
  sources,
  years,
  interactive = false,
  confidence,
  showMethodology = false,
  onMethodologyClick,
  methodologyUrl = '/methodology',
  compact = false,
  className,
}: ChartSourceFooterProps) {
  // Normalize sources to array
  const sourceArray: string[] =
    typeof sources === 'string' ? sources.split(',').map((s) => s.trim()) : sources

  // Get source configs
  const sourceConfigs = sourceArray.map(getSourceConfig).filter(Boolean)

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 text-[10px] text-slate-400',
          className
        )}
      >
        <span className="flex items-center gap-1.5">
          {confidence && <ConfidenceDot tier={confidence} />}
          <span>
            Source{sourceArray.length > 1 ? 's' : ''}: {sourceArray.join(', ')}
          </span>
          {years && <span className="text-slate-500">({years})</span>}
        </span>
        {showMethodology && (
          <MethodologyLink url={methodologyUrl} onClick={onMethodologyClick} compact />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3',
        className
      )}
    >
      {/* Sources */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-slate-400">
        {confidence && (
          <span className="flex items-center gap-1.5">
            <ConfidenceDot tier={confidence} />
          </span>
        )}

        <span className="text-slate-500">Sources:</span>

        {interactive ? (
          sourceConfigs.map((config) => (
            <SourceBadge
              key={config!.id}
              source={config!.id}
              size="sm"
              variant="subtle"
              linked
              showIcon
            />
          ))
        ) : (
          <span>
            {sourceArray.join(', ')}
            {years && <span className="text-slate-500 ml-1">({years})</span>}
          </span>
        )}

        {interactive && years && <span className="text-slate-500">({years})</span>}
      </div>

      {/* Methodology link */}
      {showMethodology && (
        <MethodologyLink url={methodologyUrl} onClick={onMethodologyClick} />
      )}
    </div>
  )
}

function MethodologyLink({
  url,
  onClick,
  compact = false,
}: {
  url: string
  onClick?: () => void
  compact?: boolean
}) {
  const content = (
    <>
      <Info className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {!compact && <span>Methodology</span>}
      <ChevronRight className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
    </>
  )

  const baseClasses = cn(
    'inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors',
    compact ? 'text-[10px]' : 'text-xs'
  )

  const tooltipText = 'View data methodology and source details'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses} title={tooltipText}>
        {content}
      </button>
    )
  }

  return (
    <Link href={url} className={baseClasses} title={tooltipText}>
      {content}
    </Link>
  )
}

/**
 * ChartSourceLine - Simple one-line source attribution
 *
 * Minimal footer for charts where space is constrained.
 */
export function ChartSourceLine({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <div className={cn('text-[10px] sm:text-xs text-slate-400', className)}>
      {text}
    </div>
  )
}

export default ChartSourceFooter
