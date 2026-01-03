/**
 * SourceBadge - Clickable badge displaying a data source
 *
 * Shows source abbreviation with optional license info and link
 * to source documentation.
 *
 * @example
 * ```tsx
 * <SourceBadge source="WVS" />
 * <SourceBadge source="CPI" showLicense />
 * <SourceBadge source="GSS" variant="subtle" />
 * ```
 */
'use client'

import { ExternalLink } from 'lucide-react'
import { getSourceConfig } from './tokens'
import type { SourceId, BadgeSize, BadgeVariant, DataProvenanceBaseProps } from './types'
import { cn } from '@/lib/utils'

export interface SourceBadgeProps extends DataProvenanceBaseProps {
  /** Source identifier or abbreviation */
  source: SourceId | string
  /** Show license badge alongside source */
  showLicense?: boolean
  /** Make the badge a link to source URL */
  linked?: boolean
  /** Show external link icon */
  showIcon?: boolean
  /** Size variant */
  size?: BadgeSize
  /** Visual style variant */
  variant?: BadgeVariant
  /** Click handler (if not linked) */
  onClick?: () => void
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-0.5 gap-1.5',
  lg: 'text-sm px-2.5 py-1 gap-2',
}

const variantStyles: Record<BadgeVariant, string> = {
  filled: 'bg-slate-800 text-slate-300 hover:bg-slate-700',
  outline: 'bg-transparent border border-slate-600 text-slate-400 hover:border-slate-500',
  subtle: 'bg-slate-900 text-slate-500 hover:text-slate-400',
}

const iconSizes: Record<BadgeSize, string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
}

export function SourceBadge({
  source,
  showLicense = false,
  linked = false,
  showIcon = false,
  size = 'md',
  variant = 'filled',
  onClick,
  className,
}: SourceBadgeProps) {
  const config = getSourceConfig(source)

  if (!config) {
    // Fallback for unknown sources
    return (
      <span
        className={cn(
          'inline-flex items-center rounded font-medium',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
      >
        {source}
      </span>
    )
  }

  const content = (
    <>
      <span>{config.abbrev}</span>
      {showLicense && (
        <span className="text-slate-500 font-normal">({config.license})</span>
      )}
      {(linked || showIcon) && <ExternalLink className={cn('flex-shrink-0', iconSizes[size])} />}
    </>
  )

  const baseClasses = cn(
    'inline-flex items-center rounded font-medium transition-colors',
    sizeStyles[size],
    variantStyles[variant],
    className
  )

  if (linked) {
    return (
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClasses, 'no-underline')}
        title={`${config.name} - ${config.license}`}
      >
        {content}
        <span className="sr-only">(opens in new tab)</span>
      </a>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClasses, 'cursor-pointer')}
        title={config.name}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={baseClasses} title={config.name}>
      {content}
    </span>
  )
}

/**
 * LicenseBadge - Displays license type with appropriate styling
 */
export function LicenseBadge({
  license,
  size = 'sm',
  className,
}: {
  license: string
  size?: BadgeSize
  className?: string
}) {
  // Color based on license openness
  const licenseColors: Record<string, string> = {
    'Public Domain': 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
    'CC0': 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
    'CC BY 4.0': 'bg-sky-900/50 text-sky-400 border-sky-700',
    'CC BY-NC-SA': 'bg-amber-900/50 text-amber-400 border-amber-700',
    'Academic': 'bg-slate-800 text-slate-400 border-slate-600',
    'Non-commercial': 'bg-amber-900/50 text-amber-400 border-amber-700',
    'Restricted': 'bg-red-900/50 text-red-400 border-red-700',
  }

  const colorClass = licenseColors[license] || 'bg-slate-800 text-slate-400 border-slate-600'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-medium',
        sizeStyles[size],
        colorClass,
        className
      )}
    >
      {license}
    </span>
  )
}

export default SourceBadge
