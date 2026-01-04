/**
 * Data Provenance Component Library - Type Definitions
 *
 * Shared TypeScript types for source attribution and data confidence
 * visualization components.
 *
 * @packageDocumentation
 */

// =============================================================================
// Confidence Types
// =============================================================================

/**
 * Confidence tier indicating data quality and recency.
 *
 * - **A**: High confidence - Recent survey data (within 3 years) + governance proxy
 * - **B**: Moderate confidence - Older survey data (3-7 years) or single pillar + governance
 * - **C**: Estimate - Governance proxy only (no valid surveys within 7 years)
 */
export type ConfidenceTier = 'A' | 'B' | 'C'

/**
 * Display configuration for a confidence tier.
 */
export interface ConfidenceConfig {
  /** Short label (e.g., "High confidence") */
  label: string
  /** Detailed description for tooltips */
  description: string
  /** Hex color value for JS contexts */
  colorHex: string
  /** Tailwind class for text color */
  tailwindText: string
  /** Tailwind class for background color */
  tailwindBg: string
  /** Tailwind class for border color */
  tailwindBorder: string
}

// =============================================================================
// Source Types
// =============================================================================

/**
 * Unique identifier for a data source.
 */
export type SourceId =
  | 'WVS'
  | 'EVS'
  | 'ESS'
  | 'GSS'
  | 'ANES'
  | 'CES'
  | 'CPI'
  | 'WGI'
  | 'WJP'
  | 'FH'
  | 'VDEM'
  | 'AFRO'
  | 'ARAB'
  | 'LATINO'
  | 'ASIAN'
  | 'OECD'
  // Media Trust sources
  | 'Reuters_DNR'
  | 'Eurobarometer'
  // Database aliases (map to canonical IDs)
  | 'FreedomHouse'
  | 'V-Dem'
  | 'WJP-Corruption'

/**
 * License type indicating usage restrictions.
 */
export type LicenseType =
  | 'Public Domain'
  | 'CC0'
  | 'CC BY 4.0'
  | 'CC BY-NC-SA'
  | 'Academic'
  | 'Non-commercial'
  | 'Restricted'

/**
 * Display configuration for a data source.
 */
export interface SourceConfig {
  /** Unique identifier */
  id: SourceId
  /** Short abbreviation (e.g., "WVS") */
  abbrev: string
  /** Full name (e.g., "World Values Survey") */
  name: string
  /** License type */
  license: LicenseType
  /** URL to source documentation or data */
  url: string
  /** Brief methodology description */
  methodology?: string
  /** Which pillars this source contributes to */
  pillars: Array<'interpersonal' | 'institutional' | 'governance' | 'media'>
  /** Data update frequency */
  frequency?: string
}

// =============================================================================
// Data Point Types
// =============================================================================

/**
 * Metadata for a single data point, used in tooltips and tables.
 */
export interface DataPointMeta {
  /** Year of data collection */
  year: number
  /** Normalized score (0-100) */
  score: number
  /** Source identifier */
  source: SourceId
  /** Confidence tier */
  confidence: ConfidenceTier
  /** Sample size (if available) */
  sampleSize?: number
  /** Short methodology note */
  methodology?: string
  /** Lower bound of confidence interval */
  ciLower?: number
  /** Upper bound of confidence interval */
  ciUpper?: number
}

/**
 * Row data for accessible data tables.
 */
export interface DataTableRow {
  /** Display label (e.g., country name, series name) */
  label: string
  /** Year of observation */
  year: number
  /** Normalized value (0-100) */
  value: number
  /** Source abbreviation */
  source: string
  /** Confidence tier */
  confidence: ConfidenceTier
  /** Optional sample size */
  sampleSize?: number
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Size variants for badges and indicators.
 */
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

/**
 * Visual style variants.
 */
export type BadgeVariant = 'filled' | 'outline' | 'subtle'

/**
 * Common props for all data provenance components.
 */
export interface DataProvenanceBaseProps {
  /** Additional CSS class names */
  className?: string
}

// =============================================================================
// Chart Provenance Types (for ProvenanceChart wrapper)
// =============================================================================

/**
 * Declaration of a data source used by a chart, with optional series mapping.
 */
export interface SourceDeclaration {
  /** Source identifier from DATA_SOURCES */
  source: SourceId
  /** Which series/lines in the chart use this source */
  seriesNames?: string[]
  /** Source-specific year range (if different from chart overall) */
  years?: string
  /** Source-specific confidence tier (for mixed-confidence charts) */
  confidence?: ConfidenceTier
}

/**
 * Complete provenance metadata for a chart visualization.
 * Used by ProvenanceChart wrapper to generate consistent attribution,
 * accessibility features, and deep linking.
 */
export interface ChartProvenance {
  /** Unique identifier for deep linking (e.g., "covid-trust-impact") */
  id: string
  /** Human-readable chart title */
  title: string
  /** Optional subtitle for additional context */
  subtitle?: string
  /** Data sources used by this chart */
  sources: SourceDeclaration[]
  /** Overall confidence tier for the chart */
  confidence?: ConfidenceTier
  /** Year or year range covered (e.g., "2015-2023") */
  years: string
  /** Anchor link to methodology section (e.g., "#institutional-trust") */
  methodologyAnchor?: string
  /** Narrative description for screen readers and accessibility */
  narrative?: string
}

/**
 * Visual variant for ProvenanceChart container styling.
 */
export type ChartVariant = 'default' | 'compact' | 'editorial'

/**
 * Responsive height configuration for charts.
 */
export interface ResponsiveHeight {
  mobile: string
  desktop: string
}
