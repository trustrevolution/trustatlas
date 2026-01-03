/**
 * Data Provenance Component Library
 *
 * A collection of reusable React components and utilities for displaying
 * data source attribution, confidence indicators, and methodology
 * information in data visualizations.
 *
 * @packageDocumentation
 *
 * @example
 * ```tsx
 * import {
 *   ConfidenceBadge,
 *   SourceBadge,
 *   ChartSourceFooter,
 *   SourceDisclosure,
 *   AccessibleDataTable,
 *   createSourceAwareTooltip,
 *   CONFIDENCE_TIERS,
 *   DATA_SOURCES,
 * } from '@/components/data-provenance'
 *
 * // In a chart component
 * <ChartSourceFooter
 *   sources={['WVS', 'GSS']}
 *   years="2015-2024"
 *   showMethodology
 * />
 *
 * // In a detail panel
 * <SourceDisclosure
 *   sources={['WVS', 'CPI', 'WGI']}
 *   showMethodology
 *   showLicense
 * />
 *
 * // For screen reader accessibility
 * <AccessibleDataTable
 *   caption="Trust scores by country"
 *   data={chartData}
 * />
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  ConfidenceTier,
  ConfidenceConfig,
  SourceId,
  LicenseType,
  SourceConfig,
  DataPointMeta,
  DataTableRow,
  BadgeSize,
  BadgeVariant,
  DataProvenanceBaseProps,
  // Chart provenance types
  SourceDeclaration,
  ChartProvenance,
  ChartVariant,
  ResponsiveHeight,
} from './types'

// =============================================================================
// Tokens / Configuration
// =============================================================================

export {
  CONFIDENCE_TIERS,
  DATA_SOURCES,
  getConfidenceConfig,
  getSourceConfig,
  getSourcesForPillar,
  parseSourceString,
} from './tokens'

// =============================================================================
// Components
// =============================================================================

// Confidence indicators
export { ConfidenceBadge, ConfidenceDot } from './ConfidenceBadge'
export type { ConfidenceBadgeProps } from './ConfidenceBadge'

// Source badges
export { SourceBadge, LicenseBadge } from './SourceBadge'
export type { SourceBadgeProps } from './SourceBadge'

// Chart footer
export { ChartSourceFooter, ChartSourceLine } from './ChartSourceFooter'
export type { ChartSourceFooterProps } from './ChartSourceFooter'

// Source disclosure panel
export { SourceDisclosure, SourceList } from './SourceDisclosure'
export type { SourceDisclosureProps } from './SourceDisclosure'

// Accessible data table
export { AccessibleDataTable, ChartDataTableToggle } from './AccessibleDataTable'
export type { AccessibleDataTableProps } from './AccessibleDataTable'

// ProvenanceChart wrapper
export { ProvenanceChart } from './ProvenanceChart'
export type { ProvenanceChartProps } from './ProvenanceChart'

// Chart controls (unified toolbar with human-centered tooltips)
export { ChartControls, SourceLine } from './ChartControls'
export type { ChartControlsProps, SourceLineProps } from './ChartControls'

// Source-series legend for multi-source charts
export { SourceSeriesLegend } from './SourceSeriesLegend'
export type { SourceSeriesLegendProps } from './SourceSeriesLegend'

// =============================================================================
// Utilities
// =============================================================================

export {
  createSourceAwareTooltip,
  createSimpleTooltip,
  createTooltipConfig,
  TOOLTIP_BASE_CONFIG,
} from './tooltip-utils'
