/**
 * ConfidenceBadge - Visual indicator for data confidence tiers
 *
 * Displays confidence level (A/B/C) with appropriate styling and
 * optional tooltip explanation.
 *
 * @example
 * ```tsx
 * <ConfidenceBadge tier="A" />
 * <ConfidenceBadge tier="B" showLabel />
 * <ConfidenceBadge tier="C" size="lg" showTooltip />
 * ```
 */
'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { getConfidenceConfig } from './tokens'
import type { ConfidenceTier, BadgeSize, DataProvenanceBaseProps } from './types'
import { cn } from '@/lib/utils'

export interface ConfidenceBadgeProps extends DataProvenanceBaseProps {
  /** Confidence tier (A, B, or C) */
  tier: ConfidenceTier | string | null | undefined
  /** Show the label text (e.g., "High confidence") */
  showLabel?: boolean
  /** Show info icon with tooltip on hover */
  showTooltip?: boolean
  /** Size variant */
  size?: BadgeSize
  /** Show only the dot indicator */
  dotOnly?: boolean
}

const sizeStyles: Record<BadgeSize, { dot: string; text: string; icon: string }> = {
  xs: { dot: 'w-1 h-1', text: 'text-[10px]', icon: 'w-2.5 h-2.5' },
  sm: { dot: 'w-1.5 h-1.5', text: 'text-xs', icon: 'w-3 h-3' },
  md: { dot: 'w-2 h-2', text: 'text-sm', icon: 'w-3.5 h-3.5' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-base', icon: 'w-4 h-4' },
}

export function ConfidenceBadge({
  tier,
  showLabel = false,
  showTooltip = false,
  size = 'md',
  dotOnly = false,
  className,
}: ConfidenceBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const config = getConfidenceConfig(tier)
  const styles = sizeStyles[size]

  // Dot-only mode: just the colored dot
  if (dotOnly) {
    return (
      <span
        className={cn('rounded-full inline-block', styles.dot, config.tailwindBg, className)}
        role="img"
        aria-label={config.label}
        title={config.label}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {/* Colored dot */}
      <span
        className={cn('rounded-full flex-shrink-0', styles.dot, config.tailwindBg)}
        aria-hidden="true"
      />

      {/* Optional label */}
      {showLabel && (
        <span className={cn('font-medium', styles.text, config.tailwindText)}>{config.label}</span>
      )}

      {/* Tier letter (if no label) */}
      {!showLabel && (
        <span className={cn('font-medium', styles.text, config.tailwindText)}>
          {tier?.toUpperCase() || 'C'}
        </span>
      )}

      {/* Optional tooltip */}
      {showTooltip && (
        <span className="relative">
          <button
            type="button"
            className="text-slate-500 hover:text-slate-400 cursor-help focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
            onFocus={() => setTooltipOpen(true)}
            onBlur={() => setTooltipOpen(false)}
            aria-describedby={tooltipOpen ? 'confidence-tooltip' : undefined}
          >
            <Info className={styles.icon} aria-hidden="true" />
            <span className="sr-only">More information about confidence level</span>
          </button>

          {tooltipOpen && (
            <span
              id="confidence-tooltip"
              role="tooltip"
              className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 w-52 shadow-lg z-50"
            >
              {config.description}
            </span>
          )}
        </span>
      )}

      {/* Screen reader description */}
      <span className="sr-only">{config.description}</span>
    </span>
  )
}

/**
 * ConfidenceDot - Minimal dot-only indicator
 *
 * Convenience wrapper for the most common use case in charts.
 */
export function ConfidenceDot({
  tier,
  className,
}: {
  tier: ConfidenceTier | string | null | undefined
  className?: string
}) {
  return <ConfidenceBadge tier={tier} dotOnly className={className} />
}

export default ConfidenceBadge
