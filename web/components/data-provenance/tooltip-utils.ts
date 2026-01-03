/**
 * Tooltip Utilities for ECharts
 *
 * Helper functions for creating source-aware tooltips that display
 * data provenance information in ECharts visualizations.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// ECharts callback params have complex types that vary by chart type.
// Using `any` is intentional for flexibility with formatter functions.

import { getSourceConfig, getConfidenceConfig } from './tokens'
import type { DataPointMeta } from './types'

/**
 * Escape HTML entities to prevent XSS in tooltip content.
 */
function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return ''
  const s = String(str)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Format a number for display in tooltips.
 */
function formatValue(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

/**
 * Create a source-aware tooltip formatter for ECharts.
 *
 * @example
 * ```ts
 * const option = {
 *   tooltip: {
 *     trigger: 'axis',
 *     formatter: createSourceAwareTooltip({
 *       getMetaForPoint: (params) => ({
 *         year: params.data[0],
 *         score: params.data[1],
 *         source: 'WVS',
 *         confidence: 'A',
 *       }),
 *     }),
 *   },
 * }
 * ```
 */
export function createSourceAwareTooltip(options: {
  /** Function to extract metadata from ECharts params */
  getMetaForPoint?: (params: any) => Partial<DataPointMeta> | null
  /** Show source abbreviation */
  showSource?: boolean
  /** Show confidence indicator */
  showConfidence?: boolean
  /** Show methodology note */
  showMethodology?: boolean
  /** Show sample size */
  showSampleSize?: boolean
  /** Custom title formatter */
  formatTitle?: (params: any) => string
}): (params: any) => string {
  const {
    getMetaForPoint,
    showSource = true,
    showConfidence = true,
    showMethodology = false,
    showSampleSize = false,
    formatTitle,
  } = options

  return (params: any) => {
    if (!params || params.length === 0) return ''

    const firstParam = params[0]
    const title = formatTitle
      ? formatTitle(firstParam)
      : escapeHtml(firstParam.name || firstParam.data?.[0])

    let html = `
      <div style="font-family: system-ui, sans-serif; max-width: 280px;">
        <div style="font-weight: 600; color: #f8fafc; margin-bottom: 8px; font-size: 13px;">
          ${title}
        </div>
    `

    // Each series
    params.forEach((p: any) => {
      const value = p.data?.[1] ?? p.value?.[1] ?? p.value
      if (value == null) return

      const meta = getMetaForPoint?.(p)
      const sourceConfig = meta?.source ? getSourceConfig(meta.source) : null
      const confConfig = meta?.confidence ? getConfidenceConfig(meta.confidence) : null

      html += `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin: 6px 0; padding: 4px 0;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${escapeHtml(p.color)}; flex-shrink: 0; margin-top: 3px;"></span>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px;">
              <span style="color: #cbd5e1; font-size: 12px;">${escapeHtml(p.seriesName)}</span>
              <span style="font-weight: 600; color: #f8fafc; font-size: 14px;">${formatValue(value)}%</span>
            </div>
      `

      // Source and confidence row
      if ((showSource && sourceConfig) || (showConfidence && confConfig)) {
        html += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px;">`

        if (showConfidence && confConfig) {
          html += `
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${confConfig.colorHex};"></span>
          `
        }

        if (showSource && sourceConfig) {
          html += `<span style="color: #64748b;">${escapeHtml(sourceConfig.abbrev)}</span>`
        }

        if (showSampleSize && meta?.sampleSize) {
          html += `<span style="color: #475569;">n=${meta.sampleSize.toLocaleString()}</span>`
        }

        html += `</div>`
      }

      // Methodology note
      if (showMethodology && meta?.methodology) {
        html += `
          <div style="color: #64748b; font-size: 10px; margin-top: 4px; font-style: italic;">
            ${escapeHtml(meta.methodology)}
          </div>
        `
      }

      html += `
          </div>
        </div>
      `
    })

    html += `</div>`
    return html
  }
}

/**
 * Create a simple tooltip with year and values.
 * Enhanced version that includes optional source info.
 */
export function createSimpleTooltip(options?: {
  showYear?: boolean
  source?: string
  yearRange?: string
}): (params: any) => string {
  const { showYear = true, source, yearRange } = options || {}

  return (params: any) => {
    if (!params || params.length === 0) return ''

    const first = params[0]
    const year = showYear ? first.name || first.data?.[0] : null

    let html = `<div style="font-family: system-ui, sans-serif;">`

    if (year) {
      html += `<div style="font-weight: 600; color: #f8fafc; margin-bottom: 6px;">${escapeHtml(year)}</div>`
    }

    params.forEach((p: any) => {
      const val = p.data?.[1] ?? p.value?.[1] ?? p.value
      if (val == null) return

      html += `
        <div style="display: flex; align-items: center; gap: 6px; margin: 3px 0;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${escapeHtml(p.color)};"></span>
          <span style="color: #cbd5e1;">${escapeHtml(p.seriesName)}:</span>
          <span style="font-weight: 600; color: #f8fafc;">${formatValue(val)}%</span>
        </div>
      `
    })

    // Source footer
    if (source) {
      html += `
        <div style="border-top: 1px solid #334155; margin-top: 8px; padding-top: 6px; font-size: 10px; color: #64748b;">
          Source: ${escapeHtml(source)}${yearRange ? ` (${escapeHtml(yearRange)})` : ''}
        </div>
      `
    }

    html += `</div>`
    return html
  }
}

/**
 * Standard ECharts tooltip configuration with Trust Atlas styling.
 */
export const TOOLTIP_BASE_CONFIG = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(71, 85, 105, 0.5)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: {
    color: '#f8fafc',
    fontSize: 12,
  },
  extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
} as const

/**
 * Create a complete tooltip configuration with source awareness.
 */
export function createTooltipConfig(options?: {
  trigger?: 'axis' | 'item'
  formatter?: (params: any) => string
  getMetaForPoint?: (params: any) => Partial<DataPointMeta> | null
  showSource?: boolean
  showConfidence?: boolean
}) {
  const { trigger = 'axis', formatter, getMetaForPoint, showSource, showConfidence } = options || {}

  return {
    ...TOOLTIP_BASE_CONFIG,
    trigger,
    formatter:
      formatter ||
      createSourceAwareTooltip({
        getMetaForPoint,
        showSource,
        showConfidence,
      }),
  }
}
