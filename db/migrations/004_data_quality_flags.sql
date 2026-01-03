-- Migration: Data Quality Flags Table
-- Purpose: Track outliers and data quality issues for review and resolution

CREATE TABLE IF NOT EXISTS data_quality_flags (
  id BIGSERIAL PRIMARY KEY,
  observation_id BIGINT REFERENCES observations(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,  -- 'statistical_outlier', 'yoy_anomaly', 'cross_source', 'methodology_mismatch', 'sample_size', 'coverage_gap'
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error')),
  details JSONB,            -- {expected_range: [10, 55], actual: 97.7, ...}
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,  -- NULL until manually reviewed
  resolution_notes TEXT,

  -- Prevent duplicate flags for same observation/type
  UNIQUE(observation_id, flag_type)
);

-- Index for finding unresolved flags
CREATE INDEX IF NOT EXISTS idx_flags_unresolved
  ON data_quality_flags(resolved_at)
  WHERE resolved_at IS NULL;

-- Index for finding flags by type
CREATE INDEX IF NOT EXISTS idx_flags_type ON data_quality_flags(flag_type);

-- Index for looking up flags by observation
CREATE INDEX IF NOT EXISTS idx_flags_observation ON data_quality_flags(observation_id);

COMMENT ON TABLE data_quality_flags IS 'Tracks data quality issues detected by sweep.py for manual review';
COMMENT ON COLUMN data_quality_flags.flag_type IS 'Type of issue: statistical_outlier, yoy_anomaly, cross_source, methodology_mismatch, sample_size, coverage_gap';
COMMENT ON COLUMN data_quality_flags.severity IS 'warning = needs review, error = likely data bug';
COMMENT ON COLUMN data_quality_flags.details IS 'JSON with context: expected values, comparison data, etc.';
