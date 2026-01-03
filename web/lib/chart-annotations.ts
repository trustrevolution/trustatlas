/**
 * Chart Annotation Helpers
 *
 * Standardized functions for creating ECharts annotations:
 * - Event markers (vertical lines)
 * - Threshold lines (horizontal lines)
 * - Period bands (shaded areas)
 * - Text annotations (positioned text)
 */

// =============================================================================
// Types
// =============================================================================

export interface EventMarkerOptions {
  /** X-axis value (year or category index) */
  x: number | string
  /** Label text */
  label: string
  /** Line and label color */
  color?: string
  /** Label position: 'start' (top) or 'end' (bottom) */
  position?: 'start' | 'end'
}

export interface ThresholdLineOptions {
  /** Y-axis value */
  y: number
  /** Label text */
  label: string
  /** Line and label color */
  color?: string
  /** Line style: 'solid', 'dashed', 'dotted' */
  lineType?: 'solid' | 'dashed' | 'dotted'
}

export interface PeriodBandOptions {
  /** Start X-axis value */
  from: number | string
  /** End X-axis value */
  to: number | string
  /** Optional label text */
  label?: string
  /** Fill color (RGBA recommended) */
  color?: string
  /** Label position */
  labelPosition?: 'insideTop' | 'insideBottom' | 'insideLeft' | 'insideRight'
}

export interface TextAnnotationOptions {
  /** Annotation text (use \n for line breaks) */
  text: string
  /** Left position (percentage or pixels) */
  left: string | number
  /** Top position (percentage or pixels) */
  top: string | number
  /** Text color */
  color?: string
  /** Font size in pixels */
  fontSize?: number
  /** Font weight */
  fontWeight?: number | 'normal' | 'bold'
  /** Line height for multiline text */
  lineHeight?: number
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a vertical event marker line (e.g., "Watergate 1974")
 *
 * @example
 * ```typescript
 * markLine: {
 *   data: [
 *     eventMarker({ x: 1974, label: 'Watergate', color: '#ef4444' }),
 *     eventMarker({ x: 2001, label: '9/11', color: '#f59e0b' }),
 *   ]
 * }
 * ```
 */
export function eventMarker(opts: EventMarkerOptions) {
  const { x, label, color = '#64748b', position = 'start' } = opts

  return {
    xAxis: x,
    lineStyle: {
      color,
      type: 'dashed' as const,
      width: 1,
    },
    label: {
      show: true,
      formatter: label,
      position,
      color,
      fontSize: 10,
      fontWeight: 500,
    },
  }
}

/**
 * Create a horizontal threshold/reference line (e.g., "Global Average: 45%")
 *
 * @example
 * ```typescript
 * markLine: {
 *   data: [
 *     thresholdLine({ y: 50, label: 'Global Average', color: '#94a3b8' }),
 *   ]
 * }
 * ```
 */
export function thresholdLine(opts: ThresholdLineOptions) {
  const { y, label, color = '#94a3b8', lineType = 'dashed' } = opts

  return {
    yAxis: y,
    lineStyle: {
      color,
      type: lineType,
      width: 1,
    },
    label: {
      show: true,
      formatter: label,
      position: 'end' as const,
      color,
      fontSize: 10,
      fontWeight: 500,
    },
  }
}

/**
 * Create a shaded time period band (e.g., pandemic 2020-2022)
 *
 * Returns data for markArea.data array.
 *
 * @example
 * ```typescript
 * markArea: {
 *   data: [
 *     periodBand({ from: 2020, to: 2022, label: 'Pandemic', color: 'rgba(100,100,100,0.1)' }),
 *   ]
 * }
 * ```
 */
export function periodBand(opts: PeriodBandOptions) {
  const {
    from,
    to,
    label,
    color = 'rgba(100, 116, 139, 0.1)',
    labelPosition = 'insideTop',
  } = opts

  return [
    {
      name: label,
      xAxis: from,
      itemStyle: {
        color,
      },
      label: label
        ? {
            show: true,
            position: labelPosition,
            color: '#64748b',
            fontSize: 10,
          }
        : { show: false },
    },
    {
      xAxis: to,
    },
  ]
}

/**
 * Create a positioned text annotation (graphic element)
 *
 * Use in the `graphic` array of ECharts options.
 *
 * @example
 * ```typescript
 * graphic: [
 *   textAnnotation({
 *     text: '75% of countries\ndeclined',
 *     left: '10%',
 *     top: '55%',
 *     color: 'rgba(239, 68, 68, 0.7)',
 *   }),
 * ]
 * ```
 */
export function textAnnotation(opts: TextAnnotationOptions) {
  const {
    text,
    left,
    top,
    color = '#64748b',
    fontSize = 11,
    fontWeight = 600,
    lineHeight = 14,
  } = opts

  return {
    type: 'text' as const,
    left,
    top,
    style: {
      text,
      fill: color,
      fontSize,
      fontWeight,
      lineHeight,
    },
    z: 100,
  }
}

/**
 * Create a markLine config with silent defaults
 *
 * Convenience wrapper that adds common markLine defaults.
 *
 * @example
 * ```typescript
 * series: [{
 *   type: 'line',
 *   data: [...],
 *   ...createMarkLine([
 *     eventMarker({ x: 1974, label: 'Watergate' }),
 *     eventMarker({ x: 2001, label: '9/11' }),
 *   ]),
 * }]
 * ```
 */
export function createMarkLine(data: ReturnType<typeof eventMarker | typeof thresholdLine>[]) {
  return {
    markLine: {
      silent: true,
      symbol: 'none',
      data,
    },
  }
}

/**
 * Create a markArea config with silent defaults
 *
 * @example
 * ```typescript
 * series: [{
 *   type: 'line',
 *   data: [...],
 *   ...createMarkArea([
 *     periodBand({ from: 2020, to: 2022, label: 'Pandemic' }),
 *   ]),
 * }]
 * ```
 */
export function createMarkArea(data: ReturnType<typeof periodBand>[]) {
  return {
    markArea: {
      silent: true,
      data,
    },
  }
}
