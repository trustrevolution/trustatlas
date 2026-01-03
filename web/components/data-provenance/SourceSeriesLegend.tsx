'use client'

import { cn } from '@/lib/utils'
import type { SourceDeclaration } from './types'
import { DATA_SOURCES } from './tokens'

// =============================================================================
// Props
// =============================================================================

export interface SourceSeriesLegendProps {
  /** Source declarations with series mappings */
  sources: SourceDeclaration[]
  /** Series colors keyed by series name */
  seriesColors?: Record<string, string>
  /** Dark mode (for editorial variant) */
  dark?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * SourceSeriesLegend - Shows which chart series use which data sources.
 *
 * Useful for multi-source charts like USATrustTimeline where different lines
 * come from different sources (ANES, GSS, WVS).
 *
 * @example
 * ```tsx
 * <SourceSeriesLegend
 *   sources={[
 *     { source: 'ANES', seriesNames: ['Institutional', 'Partisan'] },
 *     { source: 'GSS', seriesNames: ['Interpersonal'] },
 *   ]}
 *   seriesColors={{
 *     Institutional: '#3b82f6',
 *     Interpersonal: '#10b981',
 *     Partisan: '#f59e0b',
 *   }}
 * />
 * ```
 */
export function SourceSeriesLegend({
  sources,
  seriesColors = {},
  dark = false,
  className,
}: SourceSeriesLegendProps) {
  // Filter to only sources that have series mappings
  const mappedSources = sources.filter(
    (s) => s.seriesNames && s.seriesNames.length > 0
  )

  if (mappedSources.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'source-series-legend',
        dark && 'source-series-legend-dark',
        className
      )}
    >
      {mappedSources.map((src) => {
        const sourceConfig = DATA_SOURCES[src.source]
        const sourceName = sourceConfig?.abbrev || src.source

        return (
          <div key={src.source} className="source-series-group">
            <span
              className={cn(
                'source-series-source',
                dark ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {sourceName}:
            </span>
            <span className="source-series-items">
              {src.seriesNames?.map((seriesName, idx) => (
                <span key={seriesName} className="source-series-item">
                  {seriesColors[seriesName] && (
                    <span
                      className="source-series-dot"
                      style={{ backgroundColor: seriesColors[seriesName] }}
                    />
                  )}
                  <span
                    className={cn(
                      dark ? 'text-slate-300' : 'text-slate-600'
                    )}
                  >
                    {seriesName}
                  </span>
                  {idx < (src.seriesNames?.length || 0) - 1 && (
                    <span className="text-slate-400">,</span>
                  )}
                </span>
              ))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default SourceSeriesLegend
