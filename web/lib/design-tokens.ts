/**
 * Design Tokens for Trust Atlas
 *
 * This file provides TypeScript constants for design values that need to be
 * used in JavaScript contexts (ECharts, inline styles, conditional logic).
 *
 * Colors are defined as CSS custom properties in globals.css and referenced
 * here as hex values for JS contexts that don't support CSS vars.
 */

import type { Pillar } from '@/app/explore/page'

// =============================================================================
// Pillar Configuration
// =============================================================================

export interface PillarConfig {
  label: string
  shortLabel: string
  description: string
  icon: 'Users' | 'Building2' | 'Newspaper'
  // Legacy colors - used in charts only, NOT for identity on explore page
  // On explore page, pillar identity is conveyed through icons/labels, not color
  colorHex: string
  colorVar: string
  tailwindText: string
  tailwindBg: string
}

export const PILLARS: Record<Pillar, PillarConfig> = {
  social: {
    label: 'Social Trust',
    shortLabel: 'Social',
    description: 'Trust in other people',
    icon: 'Users',
    colorHex: '#38bdf8',
    colorVar: 'var(--color-pillar-social)',
    tailwindText: 'text-sky-400',
    tailwindBg: 'from-sky-500 to-sky-400',
  },
  institutions: {
    label: 'Institutional Trust',
    shortLabel: 'Institutions',
    description: 'Trust in government',
    icon: 'Building2',
    colorHex: '#f59e0b',
    colorVar: 'var(--color-pillar-institutions)',
    tailwindText: 'text-amber-400',
    tailwindBg: 'from-amber-500 to-amber-400',
  },
  media: {
    label: 'Media Trust',
    shortLabel: 'Media',
    description: 'Trust in news media',
    icon: 'Newspaper',
    colorHex: '#6366f1',
    colorVar: 'var(--color-pillar-media)',
    tailwindText: 'text-indigo-400',
    tailwindBg: 'from-indigo-500 to-indigo-400',
  },
} as const

// =============================================================================
// Region Colors
// =============================================================================

export const REGION_COLORS: Record<string, string> = {
  'Europe': '#3b82f6',
  'Americas': '#f59e0b',
  'Asia': '#10b981',
  'Africa': '#ef4444',
  'Oceania': '#8b5cf6',
  'Middle East & North Africa': '#06b6d4',
  'MENA': '#06b6d4',
  // Aliases for different API formats
  'Latin America': '#f59e0b',
  'North America': '#06b6d4',
  'Middle East': '#8b5cf6',
} as const

// =============================================================================
// Map Gradient (low → high trust)
// =============================================================================

export const TRUST_GRADIENT = [
  '#ef4444', // 0-20: red
  '#f97316', // 20-40: orange
  '#eab308', // 40-60: yellow
  '#84cc16', // 60-80: lime
  '#22c55e', // 80-100: green
] as const

// =============================================================================
// ECharts Configuration
// =============================================================================

export const CHART_COLORS = {
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(71, 85, 105, 0.5)',
    textStyle: { color: '#fff' },
  },
  axis: {
    lineColor: '#475569',
    labelColor: '#94a3b8',
  },
  grid: {
    lineColor: '#334155',
  },
} as const

export const CHART_GRID = {
  standard: { left: 60, right: 40, top: 80, bottom: 60 },
  compact: { left: 40, right: 20, top: 20, bottom: 30 },
  wide: { left: 120, right: 40, top: 80, bottom: 40 },
} as const

/**
 * Creates a standard ECharts tooltip configuration
 */
export function createTooltipConfig(formatter?: (params: unknown) => string) {
  return {
    trigger: 'axis' as const,
    backgroundColor: CHART_COLORS.tooltip.backgroundColor,
    borderColor: CHART_COLORS.tooltip.borderColor,
    textStyle: CHART_COLORS.tooltip.textStyle,
    ...(formatter && { formatter }),
  }
}

/**
 * Creates a standard ECharts axis configuration
 */
export function createAxisConfig(type: 'category' | 'value', options?: {
  min?: number
  max?: number
  data?: (string | number)[]
}) {
  const base = {
    type,
    axisLine: { lineStyle: { color: CHART_COLORS.axis.lineColor } },
    axisLabel: { color: CHART_COLORS.axis.labelColor, fontSize: 10 },
  }

  if (type === 'value') {
    return {
      ...base,
      min: options?.min ?? 0,
      max: options?.max ?? 100,
      splitLine: { lineStyle: { color: CHART_COLORS.grid.lineColor } },
    }
  }

  return {
    ...base,
    data: options?.data ?? [],
  }
}

// =============================================================================
// USA Trust Timeline Colors
// =============================================================================

// Colors for USA-specific trust timeline (different from global pillars for visual distinction)
export const USA_TRUST_COLORS = {
  institutional: '#3b82f6',  // blue
  interpersonal: '#10b981',  // green
  partisan: '#f59e0b',       // amber
} as const

// =============================================================================
// Map Configuration
// =============================================================================

export const MAP_CONFIG = {
  initialZoom: 1.2,
  minZoom: 1,
  maxZoom: 8,
  visualMap: {
    left: 20,
    bottom: 20,
    fontSize: 11,
  },
  border: {
    color: '#334155',
    width: 0.5,
  },
  emphasis: {
    areaColor: '#64748b',
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  select: {
    areaColor: '#f59e0b',
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  itemStyle: {
    areaColor: '#1e293b',
  },
} as const

// =============================================================================
// Chart Symbol/Line Configuration
// =============================================================================

export const CHART_SERIES = {
  symbolSize: 6,
  lineWidth: 3,
} as const

// =============================================================================
// Historical Event Colors (for USA timeline)
// =============================================================================

export const EVENT_COLORS = {
  crisis: '#ef4444',    // red - financial crisis, etc.
  warning: '#f59e0b',   // amber - significant events
} as const

// =============================================================================
// Brand Colors
// =============================================================================

export const BRAND = {
  trustRevolution: '#F04E23',
} as const

// =============================================================================
// Chart Toolbox Configuration
// =============================================================================

/**
 * ECharts toolbox is DISABLED.
 *
 * All chart controls (PNG, CSV, Table) are handled by our custom
 * ChartControls component which provides better UX and consistent styling.
 *
 * This config exists for backwards compatibility but sets show: false.
 */
export const CHART_TOOLBOX = {
  show: false,
} as const
