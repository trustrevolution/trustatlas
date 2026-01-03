/**
 * Chart Series Builders
 *
 * Factory functions for creating ECharts series configurations.
 */

import type { LineOptions, EventMarkerOptions, PeriodBandOptions } from './types'

// =============================================================================
// Line Series
// =============================================================================

/**
 * Create a line series with sensible defaults
 *
 * @example
 * line({ name: 'Institutional', data: [[1958, 73], ...], color: '#3b82f6' })
 * line({ name: 'NLD', data, color: '#ef4444', symbols: 'endpoints', endLabel: true })
 */
export function line(opts: LineOptions): Record<string, unknown> {
  const {
    name,
    data,
    color,
    smooth = true,
    lineWidth = 3,
    symbolSize = 6,
    endLabel = false,
    symbols = 'all',
    z,
    areaStyle,
  } = opts

  // Symbol sizing based on display mode
  const getSymbolSize = () => {
    if (symbols === 'none') return 0
    if (symbols === 'endpoints') {
      // Show symbols at first and last data points
      return (_value: unknown, params: { dataIndex: number }) =>
        params.dataIndex === 0 || params.dataIndex === data.length - 1 ? 8 : 0
    }
    if (symbols === 'end') {
      // Only show symbol at last data point
      return (_value: unknown, params: { dataIndex: number }) =>
        params.dataIndex === data.length - 1 ? 8 : 0
    }
    return symbolSize
  }

  return {
    name,
    type: 'line',
    data,
    smooth,
    symbol: symbols === 'none' ? 'none' : 'circle',
    symbolSize: getSymbolSize(),
    lineStyle: { width: lineWidth },
    itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
    connectNulls: true,
    ...(endLabel && {
      endLabel: {
        show: true,
        formatter: typeof endLabel === 'string' ? endLabel : '{a}',
        offset: [5, 0],
        color,
        fontSize: 10,
        fontWeight: 600,
      },
    }),
    ...(z !== undefined && { z }),
    ...(areaStyle && { areaStyle }),
  }
}

// =============================================================================
// Event Marker (vertical dashed line)
// =============================================================================

/**
 * Create a vertical event marker line
 *
 * @example
 * eventMarker({ year: 1974, label: 'Watergate' })
 * eventMarker({ year: 2008, label: 'Financial Crisis', offsetY: 15 })
 */
export function eventMarker(opts: EventMarkerOptions): Record<string, unknown> {
  const { year, label, color = '#ef4444', offsetY = 0 } = opts

  return {
    name: `__event_${label}`,
    type: 'line',
    data: [],
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: {
        color,
        type: 'dashed',
        width: 1,
      },
      data: [{ xAxis: year }],
      label: {
        formatter: label,
        position: 'end',
        offset: [0, offsetY],
        fontSize: 10,
        color,
      },
    },
  }
}

// =============================================================================
// Period Band (shaded vertical region)
// =============================================================================

/**
 * Create a shaded period band (e.g., for pandemic era)
 *
 * @example
 * periodBand({ start: 2020, end: 2022, label: 'COVID-19' })
 */
export function periodBand(opts: PeriodBandOptions): Record<string, unknown> {
  const { start, end, label, color = 'rgba(100, 116, 139, 0.1)' } = opts

  return {
    name: `__period_${label || `${start}-${end}`}`,
    type: 'line',
    data: [],
    markArea: {
      silent: true,
      itemStyle: { color },
      data: [[{ xAxis: start }, { xAxis: end }]],
      ...(label && {
        label: {
          show: true,
          position: 'top',
          formatter: label,
          fontSize: 10,
          color: '#64748b',
        },
      }),
    },
    // Dashed line at period start (no label - markArea label at top is sufficient)
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: {
        color: '#94a3b8',
        type: 'dashed',
        width: 1,
      },
      data: [{ xAxis: start }],
      label: { show: false },
    },
  }
}
