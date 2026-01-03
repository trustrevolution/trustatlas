/**
 * SourceDisclosure - Expandable panel for detailed source information
 *
 * Progressive disclosure component that shows source metadata,
 * methodology details, and licensing information.
 *
 * @example
 * ```tsx
 * // Compact mode (collapsible in footer)
 * <SourceDisclosure sources={['WVS', 'CPI']} />
 *
 * // Expanded detail panel
 * <SourceDisclosure
 *   sources={['WVS', 'GSS', 'ANES']}
 *   defaultExpanded
 *   showMethodology
 *   showLicense
 * />
 * ```
 */
'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, Scale } from 'lucide-react'
import Link from 'next/link'
import { getSourceConfig } from './tokens'
import { LicenseBadge } from './SourceBadge'
import type { SourceId, SourceConfig, DataProvenanceBaseProps } from './types'
import { cn } from '@/lib/utils'

export interface SourceDisclosureProps extends DataProvenanceBaseProps {
  /** Array of source IDs or abbreviations */
  sources: (SourceId | string)[]
  /** Start expanded */
  defaultExpanded?: boolean
  /** Show full methodology descriptions */
  showMethodology?: boolean
  /** Show license badges */
  showLicense?: boolean
  /** Show links to source documentation */
  showLinks?: boolean
  /** Custom title for the section */
  title?: string
  /** Variant: 'panel' for card style, 'inline' for minimal */
  variant?: 'panel' | 'inline'
  /** Dark theme (for use on dark backgrounds) */
  dark?: boolean
}

export function SourceDisclosure({
  sources,
  defaultExpanded = false,
  showMethodology = true,
  showLicense = true,
  showLinks = true,
  title = 'Data Sources',
  variant = 'panel',
  dark = false,
  className,
}: SourceDisclosureProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Get source configs
  const sourceConfigs = sources
    .map(getSourceConfig)
    .filter((s): s is SourceConfig => s !== undefined)

  if (sourceConfigs.length === 0) {
    return null
  }

  const isInline = variant === 'inline'

  return (
    <div
      className={cn(
        isInline
          ? ''
          : dark
            ? 'border-t border-slate-700 pt-4'
            : 'border-t border-slate-200 pt-4',
        className
      )}
    >
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 w-full text-left transition-colors',
          dark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900',
          isInline ? 'text-xs py-1' : 'text-sm font-medium py-2'
        )}
        aria-expanded={expanded}
        aria-controls="source-disclosure-content"
        title={expanded ? 'Hide source details' : 'Show source details'}
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform flex-shrink-0',
            expanded && 'rotate-180'
          )}
        />
        <span>{title}</span>
        <span className={cn('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
          ({sourceConfigs.length})
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div
          id="source-disclosure-content"
          className={cn('mt-3 space-y-3', isInline && 'ml-6')}
        >
          {sourceConfigs.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              showMethodology={showMethodology}
              showLicense={showLicense}
              showLinks={showLinks}
              dark={dark}
            />
          ))}

          {/* Attribution link */}
          <Link
            href="/attribution"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs transition-colors mt-2',
              dark
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-amber-600 hover:text-amber-700'
            )}
          >
            <Scale className="w-3 h-3" />
            View citation requirements
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

/**
 * SourceCard - Individual source detail card
 */
function SourceCard({
  source,
  showMethodology,
  showLicense,
  showLinks,
  dark,
}: {
  source: SourceConfig
  showMethodology: boolean
  showLicense: boolean
  showLinks: boolean
  dark: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3',
        dark ? 'bg-slate-800' : 'bg-slate-50 border border-slate-200'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={cn(
                'font-medium text-sm',
                dark ? 'text-slate-200' : 'text-slate-800'
              )}
            >
              {source.name}
            </h4>
            <span
              className={cn(
                'text-xs font-mono',
                dark ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              ({source.abbrev})
            </span>
          </div>

          {/* Badges */}
          {showLicense && (
            <div className="flex items-center gap-2 mt-2">
              <LicenseBadge license={source.license} size="sm" />
              {source.frequency && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {source.frequency}
                </span>
              )}
            </div>
          )}
        </div>

        {/* External link */}
        {showLinks && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'p-1.5 rounded transition-colors flex-shrink-0',
              dark
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
            )}
            aria-label={`Visit ${source.name} website`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Methodology */}
      {showMethodology && source.methodology && (
        <p
          className={cn(
            'text-xs mt-2 leading-relaxed',
            dark ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {source.methodology}
        </p>
      )}

      {/* Pillars */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className={cn('text-[10px]', dark ? 'text-slate-500' : 'text-slate-400')}>
          Pillars:
        </span>
        {source.pillars.map((pillar) => (
          <span
            key={pillar}
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded capitalize',
              dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
            )}
          >
            {pillar}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * SourceList - Simple inline list of sources with links
 */
export function SourceList({
  sources,
  separator = ', ',
  linked = false,
  className,
}: {
  sources: (SourceId | string)[]
  separator?: string
  linked?: boolean
  className?: string
}) {
  const sourceConfigs = sources
    .map(getSourceConfig)
    .filter((s): s is SourceConfig => s !== undefined)

  if (linked) {
    return (
      <span className={className}>
        {sourceConfigs.map((source, i) => (
          <span key={source.id}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 hover:underline"
            >
              {source.abbrev}
            </a>
            {i < sourceConfigs.length - 1 && separator}
          </span>
        ))}
      </span>
    )
  }

  return <span className={className}>{sourceConfigs.map((s) => s.abbrev).join(separator)}</span>
}

export default SourceDisclosure
