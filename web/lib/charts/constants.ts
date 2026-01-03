/**
 * Chart export and UI constants
 *
 * Centralized configuration for chart styling and export rendering.
 */

// =============================================================================
// PNG Export Configuration
// =============================================================================

export const CHART_EXPORT = {
  /** Canvas padding around chart */
  PADDING: 32,
  /** Header title height */
  TITLE_HEIGHT: 48,
  /** Subtitle line height */
  LINE_HEIGHT: 28,
  /** Gap between title and subtitle */
  TITLE_GAP: 4,
  /** Gap between subtitle and chart */
  SUBTITLE_GAP: 8,
  /** Gap between chart and footer */
  FOOTER_GAP: 24,
  /** Footer area height (source + license) */
  FOOTER_HEIGHT: 52,
  /** Logo size in pixels (matches w-4 h-4 = 16px in ChartTopRow) */
  LOGO_SIZE: 16,
  /** Gap between logo and brand text (matches gap-1.5 = 6px in ChartTopRow) */
  LOGO_GAP: 6,
  /** Logo vertical offset to align with text baseline */
  LOGO_OFFSET_Y: 4,
  /** Pixel ratio for high-DPI exports */
  PIXEL_RATIO: 2,

  FONTS: {
    /** Title font (Playfair Display for display text) */
    title: '600 42px "Playfair Display", Georgia, serif',
    /** Subtitle font */
    subtitle: '400 20px "Source Sans 3", system-ui, sans-serif',
    /** Body font (Source Sans 3 for readable text) */
    body: '400 18px "Source Sans 3", system-ui, sans-serif',
    /** Label font (slightly heavier for branding) */
    label: '500 20px "Source Sans 3", system-ui, sans-serif',
    /** Source attribution (matches text-[11px] in ChartFooter) */
    source: '400 11px "Source Sans 3", system-ui, sans-serif',
    /** Branding text (matches text-xs = 12px in ChartTopRow) */
    brand: '500 12px "Source Sans 3", system-ui, sans-serif',
  },

  COLORS: {
    /** Export background */
    background: '#ffffff',
    /** Title text color (slate-900) */
    title: '#0f172a',
    /** Subtitle text color (slate-600) */
    subtitle: '#475569',
    /** Body text color (slate-500) */
    text: '#64748b',
    /** Brand text color (slate-400 - matches ChartTopRow) */
    brand: '#94a3b8',
    /** Source attribution color (slate-500 - matches ChartFooter) */
    source: '#64748b',
  },
} as const

// =============================================================================
// Chart UI Configuration
// =============================================================================

export const CHART_UI = {
  /** Standard icon button size class */
  ICON_SIZE: 'w-3.5 h-3.5',
  /** Footer text size */
  FOOTER_TEXT_SIZE: 'text-[11px]',
  /** Dropdown animation classes */
  DROPDOWN_ANIMATION: 'animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
  /** Tooltip animation classes */
  TOOLTIP_ANIMATION: 'animate-in fade-in-0 zoom-in-95 duration-150',
} as const

// =============================================================================
// Grid Presets (for ECharts)
// All presets use containLabel: true for automatic label space calculation
// =============================================================================

export const CHART_GRID = {
  /** Auto-sizing - minimal padding, labels calculate their own space */
  auto: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
  /** Minimal padding for embedded charts */
  compact: { left: 8, right: 16, top: 16, bottom: 32, containLabel: true },
  /** Standard padding for standalone charts */
  standard: { left: 8, right: 16, top: 16, bottom: 40, containLabel: true },
  /** Extra right padding for end labels - containLabel OFF since we use gridRight() */
  withEndLabels: { left: 8, right: 80, top: 16, bottom: 40, containLabel: false },
  /** @deprecated Use withEndLabels instead */
  wide: { left: 8, right: 80, top: 16, bottom: 40, containLabel: true },
  /** Extra bottom padding for legend */
  withLegend: { left: 8, right: 16, top: 16, bottom: 56, containLabel: true },
} as const

export type GridPreset = keyof typeof CHART_GRID
