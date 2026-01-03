-- Migration 001: Add confidence interval columns
-- Replaces tier labels with numeric confidence intervals following CPI/WGI methodology

-- Add CI columns to country_year
ALTER TABLE country_year
ADD COLUMN IF NOT EXISTS ci_lower NUMERIC(5,1) CHECK (ci_lower >= 0 AND ci_lower <= 100),
ADD COLUMN IF NOT EXISTS ci_upper NUMERIC(5,1) CHECK (ci_upper >= 0 AND ci_upper <= 100);

-- Backfill from existing confidence_tier
-- Tier A (recent surveys): ±5 points
-- Tier B (older/partial surveys): ±10 points
-- Tier C (governance only): ±15 points
UPDATE country_year
SET
  ci_lower = GREATEST(0, gti - CASE confidence_tier
    WHEN 'A' THEN 5
    WHEN 'B' THEN 10
    ELSE 15
  END),
  ci_upper = LEAST(100, gti + CASE confidence_tier
    WHEN 'A' THEN 5
    WHEN 'B' THEN 10
    ELSE 15
  END)
WHERE ci_lower IS NULL OR ci_upper IS NULL;

-- Add comment explaining the confidence intervals
COMMENT ON COLUMN country_year.ci_lower IS 'Lower bound of 90% confidence interval based on data quality';
COMMENT ON COLUMN country_year.ci_upper IS 'Upper bound of 90% confidence interval based on data quality';
