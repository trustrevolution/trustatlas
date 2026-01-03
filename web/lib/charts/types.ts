/**
 * Chart Builder Type Definitions
 */

import type { CHART_GRID } from './constants'

// =============================================================================
// Grid Types
// =============================================================================

export type GridPreset = keyof typeof CHART_GRID

export interface GridConfig {
  left: number
  right: number
  top: number
  bottom: number
}

// =============================================================================
// Axis Types
// =============================================================================

export interface TimeAxisOptions {
  /** Year range [start, end] */
  range: [number, number]
  /** Interval between tick labels */
  interval?: number
}

export interface PercentAxisOptions {
  /** Axis label (e.g., "Trust %") - centered along axis */
  label?: string
  /** Value range [min, max], default [0, 100] */
  range?: [number, number]
  /** Interval between tick labels */
  interval?: number
  /** Add % suffix to axis labels, default false */
  formatPercent?: boolean
  /** Gap between label and axis, default 35 */
  nameGap?: number
}

// =============================================================================
// Series Types
// =============================================================================

export interface LineOptions {
  /** Series name (shown in legend/tooltip) */
  name: string
  /** Data points as [year, value] tuples */
  data: [number, number][]
  /** Line color */
  color: string
  /** Enable smooth interpolation, default true. Use number 0-1 for custom */
  smooth?: boolean | number
  /** Line width in pixels, default 3 */
  lineWidth?: number
  /** Symbol size for data points, default 6 */
  symbolSize?: number
  /** Show end label: true = series name, string = custom text */
  endLabel?: boolean | string
  /** Symbol display: 'end' = last only, 'endpoints' = first/last, 'all' = every point, 'none' = hide */
  symbols?: 'end' | 'endpoints' | 'all' | 'none'
  /** Z-index for layering */
  z?: number
  /** Area fill style (ECharts areaStyle config) */
  areaStyle?: Record<string, unknown>
}

export interface EventMarkerOptions {
  /** Year position for vertical line */
  year: number
  /** Label text */
  label: string
  /** Line and label color, default #ef4444 */
  color?: string
  /** Vertical offset in pixels - positive pushes label down from top, use to stagger overlapping labels */
  offsetY?: number
}

export interface PeriodBandOptions {
  /** Start year */
  start: number
  /** End year */
  end: number
  /** Optional label */
  label?: string
  /** Band color, default rgba(100, 116, 139, 0.1) */
  color?: string
}

// =============================================================================
// Tooltip & Legend Types
// =============================================================================

export type TooltipPreset = 'simple' | 'axis' | 'none'
export type LegendPreset = 'bottom' | 'none'

// =============================================================================
// Main Builder Types
// =============================================================================

export interface ChartOptionConfig {
  /** Grid preset name or custom config */
  grid?: GridPreset | GridConfig
  /** X-axis configuration */
  xAxis: Record<string, unknown>
  /** Y-axis configuration */
  yAxis: Record<string, unknown>
  /** Array of series configurations */
  series: Record<string, unknown>[]
  /** Tooltip preset or custom config */
  tooltip?: TooltipPreset | Record<string, unknown>
  /** Legend preset, custom config, or array of series names to show */
  legend?: LegendPreset | string[] | Record<string, unknown>
  /** Enable ARIA accessibility features, default true */
  aria?: boolean
}
