/**
 * Chart Builder System
 *
 * Composable primitives for creating ECharts configurations.
 *
 * @example
 * import { createChartOption, line, eventMarker, timeAxis, percentAxis } from '@/lib/charts'
 *
 * const option = createChartOption({
 *   grid: 'withLegend',
 *   xAxis: timeAxis({ range: [1955, 2025] }),
 *   yAxis: percentAxis({ label: 'Trust %' }),
 *   legend: ['Institutional', 'Interpersonal', 'Partisan'],
 *   series: [
 *     line({ name: 'Institutional', data, color: '#3b82f6' }),
 *     eventMarker({ year: 1974, label: 'Watergate' }),
 *   ],
 * })
 */

import { CHART_GRID } from './constants'
import type { ChartOptionConfig, GridPreset, GridConfig, TooltipPreset, LegendPreset } from './types'

// =============================================================================
// Re-exports
// =============================================================================

export { line, eventMarker, periodBand } from './series'
export { timeAxis, percentAxis } from './axis'
export { CHART_GRID, CHART_EXPORT, CHART_UI } from './constants'
export type * from './types'

// =============================================================================
// Tooltip Configuration
// =============================================================================

/** Dark tooltip style - standard for Trust Atlas charts */
export const TOOLTIP_STYLES = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'transparent',
  textStyle: {
    color: '#f8fafc',
    fontSize: 12,
  },
} as const

function getTooltipConfig(tooltip: TooltipPreset | Record<string, unknown> | undefined) {
  if (!tooltip || tooltip === 'none') {
    return { show: false }
  }

  if (tooltip === 'simple') {
    return { ...TOOLTIP_STYLES, trigger: 'item' }
  }

  if (tooltip === 'axis') {
    return { ...TOOLTIP_STYLES, trigger: 'axis' }
  }

  // Custom config - merge with base
  return { ...TOOLTIP_STYLES, ...tooltip }
}

// =============================================================================
// Legend Configuration
// =============================================================================

function getLegendConfig(
  legend: LegendPreset | string[] | Record<string, unknown> | undefined,
  series: Record<string, unknown>[]
) {
  if (!legend || legend === 'none') {
    return { show: false }
  }

  const baseStyle = {
    show: true,
    bottom: 10,
    textStyle: {
      color: '#64748b',
      fontSize: 11,
    },
  }

  // Array of series names to show
  if (Array.isArray(legend)) {
    return { ...baseStyle, data: legend }
  }

  // 'bottom' preset - auto-filter out __prefixed series
  if (legend === 'bottom') {
    const seriesNames = series
      .map((s) => s.name as string)
      .filter((name) => name && !name.startsWith('__'))
    return { ...baseStyle, data: seriesNames }
  }

  // Custom config
  return { ...baseStyle, ...legend }
}

// =============================================================================
// Grid Configuration
// =============================================================================

interface GridRightOptions {
  fontSize?: number  // default: 10 (matches line() builder)
  offset?: number    // default: 5 (matches line() builder)
}

/**
 * Calculate right margin based on end labels
 *
 * @example
 * gridRight(['Indonesia']) // → 64 (9 × 6 + 10, using defaults)
 * gridRight(['Uzbekistan'], { fontSize: 12, offset: 8 }) // → 85 (10 × 7.2 + 13)
 */
export function gridRight(endLabels: string[], opts?: GridRightOptions): number {
  if (endLabels.length === 0) return 45
  const { fontSize = 10, offset = 5 } = opts ?? {}
  const charWidth = fontSize * 0.6  // char width ≈ 60% of font size at 600 weight
  const buffer = 5
  const longest = Math.max(...endLabels.map(l => l.length))
  return Math.max(45, Math.ceil(longest * charWidth + offset + buffer))
}

function getGridConfig(grid: GridPreset | GridConfig | undefined): GridConfig {
  if (!grid) {
    return CHART_GRID.standard
  }

  if (typeof grid === 'string') {
    return CHART_GRID[grid]
  }

  return grid
}

// =============================================================================
// Main Builder
// =============================================================================

/**
 * Create a complete ECharts option configuration
 */
export function createChartOption(config: ChartOptionConfig): Record<string, unknown> {
  const {
    grid,
    xAxis,
    yAxis,
    series,
    tooltip = 'axis',
    legend = 'none',
    aria = true,
  } = config

  return {
    backgroundColor: 'transparent',
    grid: getGridConfig(grid),
    xAxis,
    yAxis,
    series,
    tooltip: getTooltipConfig(tooltip),
    legend: getLegendConfig(legend, series),
    ...(aria && {
      aria: {
        enabled: true,
        decal: { show: true },
      },
    }),
  }
}
