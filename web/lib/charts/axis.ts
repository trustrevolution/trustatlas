/**
 * Chart Axis Builders
 *
 * Factory functions for creating ECharts axis configurations.
 */

import type { TimeAxisOptions, PercentAxisOptions } from './types'

// =============================================================================
// Shared Styles
// =============================================================================

const AXIS_LABEL_STYLE = {
  color: '#64748b',
  fontSize: 11,
}

const HIDDEN_AXIS_LINE = {
  axisLine: { show: false },
  axisTick: { show: false },
}

const DASHED_SPLIT_LINE = {
  splitLine: {
    lineStyle: { color: '#e2e8f0', type: 'dashed' as const },
  },
}

// =============================================================================
// Time Axis (X-axis for year-based data)
// =============================================================================

/**
 * Create a time/year axis configuration
 *
 * @example
 * timeAxis({ range: [1955, 2025] })
 * timeAxis({ range: [2015, 2024], interval: 2 })
 */
export function timeAxis(opts: TimeAxisOptions): Record<string, unknown> {
  const { range, interval } = opts

  return {
    type: 'value',
    min: range[0],
    max: range[1],
    ...HIDDEN_AXIS_LINE,
    splitLine: { show: false },
    axisLabel: {
      ...AXIS_LABEL_STYLE,
      formatter: (value: number) => value.toString(),
    },
    ...(interval && { interval }),
  }
}

// =============================================================================
// Percent Axis (Y-axis for 0-100 percentage data)
// =============================================================================

/**
 * Create a percentage Y-axis configuration
 *
 * @example
 * percentAxis({ label: 'Trust %' })
 * percentAxis({ label: 'Institutional Trust', range: [15, 70], formatPercent: true })
 */
export function percentAxis(opts: PercentAxisOptions = {}): Record<string, unknown> {
  const { label, range = [0, 100], interval, formatPercent = false, nameGap = 35 } = opts

  return {
    type: 'value',
    min: range[0],
    max: range[1],
    ...HIDDEN_AXIS_LINE,
    ...DASHED_SPLIT_LINE,
    axisLabel: {
      ...AXIS_LABEL_STYLE,
      ...(formatPercent && { formatter: (v: number) => `${v}%` }),
    },
    ...(label && {
      name: label,
      nameLocation: 'middle',
      nameGap,
      nameTextStyle: {
        color: '#64748b',
        fontSize: 11,
      },
    }),
    ...(interval && { interval }),
  }
}
