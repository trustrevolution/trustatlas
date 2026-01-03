/**
 * AccessibleDataTable - Screen reader friendly data table
 *
 * Provides an accessible alternative to visual charts, showing
 * data with source attribution in a structured table format.
 * Uses progressive disclosure (details/summary) to avoid cluttering
 * the visual presentation.
 *
 * @example
 * ```tsx
 * <AccessibleDataTable
 *   caption="Interpersonal Trust Scores by Country"
 *   data={[
 *     { label: 'Norway', year: 2022, value: 74.2, source: 'WVS', confidence: 'A' },
 *     { label: 'Sweden', year: 2022, value: 63.1, source: 'WVS', confidence: 'A' },
 *   ]}
 * />
 * ```
 */
'use client'

import { CONFIDENCE_TIERS, getSourceConfig } from './tokens'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { DataTableRow, ConfidenceTier, DataProvenanceBaseProps } from './types'
import { cn } from '@/lib/utils'

export interface AccessibleDataTableProps extends DataProvenanceBaseProps {
  /** Table caption for screen readers */
  caption: string
  /** Data rows to display */
  data: DataTableRow[]
  /** Show confidence column */
  showConfidence?: boolean
  /** Show source column */
  showSource?: boolean
  /** Show sample size column */
  showSampleSize?: boolean
  /** Use details/summary for progressive disclosure */
  collapsible?: boolean
  /** Summary text when collapsed */
  summaryText?: string
  /** Dark theme */
  dark?: boolean
  /** Columns to display (default: all) */
  columns?: Array<'label' | 'year' | 'value' | 'source' | 'confidence' | 'sampleSize'>
}

export function AccessibleDataTable({
  caption,
  data,
  showConfidence = true,
  showSource = true,
  showSampleSize = false,
  collapsible = true,
  summaryText,
  dark = false,
  columns,
  className,
}: AccessibleDataTableProps) {
  // Determine which columns to show
  const defaultColumns: Array<'label' | 'year' | 'value' | 'source' | 'confidence' | 'sampleSize'> =
    ['label', 'year', 'value']
  if (showSource) defaultColumns.push('source')
  if (showConfidence) defaultColumns.push('confidence')
  if (showSampleSize) defaultColumns.push('sampleSize')

  const displayColumns = columns || defaultColumns

  const table = (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn(
          'w-full text-sm',
          dark ? 'text-slate-300' : 'text-slate-700'
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr
            className={cn(
              'border-b',
              dark ? 'border-slate-700' : 'border-slate-200'
            )}
          >
            {displayColumns.includes('label') && (
              <th scope="col" className="text-left py-2 px-3 font-medium">
                Name
              </th>
            )}
            {displayColumns.includes('year') && (
              <th scope="col" className="text-right py-2 px-3 font-medium">
                Year
              </th>
            )}
            {displayColumns.includes('value') && (
              <th scope="col" className="text-right py-2 px-3 font-medium">
                Value
              </th>
            )}
            {displayColumns.includes('source') && (
              <th scope="col" className="text-left py-2 px-3 font-medium">
                Source
              </th>
            )}
            {displayColumns.includes('confidence') && (
              <th scope="col" className="text-left py-2 px-3 font-medium">
                Confidence
              </th>
            )}
            {displayColumns.includes('sampleSize') && (
              <th scope="col" className="text-right py-2 px-3 font-medium">
                Sample Size
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.label}-${row.year}-${i}`}
              className={cn(
                'border-b',
                dark ? 'border-slate-800' : 'border-slate-100'
              )}
            >
              {displayColumns.includes('label') && (
                <td className="py-2 px-3">{row.label}</td>
              )}
              {displayColumns.includes('year') && (
                <td className="py-2 px-3 text-right tabular-nums">{row.year}</td>
              )}
              {displayColumns.includes('value') && (
                <td className="py-2 px-3 text-right tabular-nums font-medium">
                  {row.value.toFixed(1)}%
                </td>
              )}
              {displayColumns.includes('source') && (
                <td className="py-2 px-3">
                  <SourceCell source={row.source} dark={dark} />
                </td>
              )}
              {displayColumns.includes('confidence') && (
                <td className="py-2 px-3">
                  <ConfidenceCell confidence={row.confidence} />
                </td>
              )}
              {displayColumns.includes('sampleSize') && (
                <td className="py-2 px-3 text-right tabular-nums">
                  {row.sampleSize?.toLocaleString() || '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (!collapsible) {
    return table
  }

  return (
    <details
      className={cn(
        'mt-4 rounded-lg',
        dark ? 'bg-slate-800' : 'bg-slate-50 border border-slate-200'
      )}
    >
      <summary
        className={cn(
          'px-4 py-3 cursor-pointer text-sm font-medium select-none',
          dark
            ? 'text-slate-400 hover:text-slate-300'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        {summaryText || `View data as table (${data.length} rows)`}
      </summary>
      <div className={cn('px-4 pb-4', dark ? 'border-t border-slate-700' : 'border-t border-slate-200')}>
        {table}
      </div>
    </details>
  )
}

function SourceCell({ source, dark }: { source: string; dark: boolean }) {
  const config = getSourceConfig(source)

  return (
    <span className={cn('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>
      {config ? (
        <abbr title={config.name} className="no-underline">
          {config.abbrev}
        </abbr>
      ) : (
        source
      )}
    </span>
  )
}

function ConfidenceCell({ confidence }: { confidence: ConfidenceTier }) {
  const config = CONFIDENCE_TIERS[confidence]

  return (
    <span className="flex items-center gap-1.5">
      <ConfidenceBadge tier={confidence} size="sm" />
      <span className="sr-only">{config.description}</span>
    </span>
  )
}

/**
 * ChartDataTableToggle - Toggle between chart and table view
 */
export function ChartDataTableToggle({
  showTable,
  onToggle,
  dark = false,
  className,
}: {
  showTable: boolean
  onToggle: () => void
  dark?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'text-xs px-2 py-1 rounded transition-colors',
        dark
          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
        className
      )}
      aria-pressed={showTable}
      title={showTable ? 'Switch to chart view' : 'View data in accessible table format'}
    >
      {showTable ? 'View chart' : 'View as table'}
    </button>
  )
}

export default AccessibleDataTable
