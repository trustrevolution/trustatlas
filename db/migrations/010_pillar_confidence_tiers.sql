-- Migration 010: Pillar-Specific Confidence Tiers
--
-- Rationale: WGI and V-Dem use pillar-specific confidence. Media has annual updates
-- (Reuters/Eurobarometer) vs 5-year WVS cycles for interpersonal/institutional.
-- A single composite tier misrepresents precision.
--
-- Best practice: Each pillar gets its own confidence tier based on data freshness
-- and source availability for that specific pillar.

-- Add pillar-specific confidence tier columns
ALTER TABLE country_year
ADD COLUMN IF NOT EXISTS interpersonal_confidence_tier VARCHAR(1),
ADD COLUMN IF NOT EXISTS institutional_confidence_tier VARCHAR(1),
ADD COLUMN IF NOT EXISTS governance_confidence_tier VARCHAR(1),
ADD COLUMN IF NOT EXISTS media_confidence_tier VARCHAR(1);

-- Add pillar-specific confidence intervals
ALTER TABLE country_year
ADD COLUMN IF NOT EXISTS interpersonal_ci_lower NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS interpersonal_ci_upper NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS institutional_ci_lower NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS institutional_ci_upper NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS governance_ci_lower NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS governance_ci_upper NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS media_ci_lower NUMERIC(5,1),
ADD COLUMN IF NOT EXISTS media_ci_upper NUMERIC(5,1);

-- Backfill from existing confidence_tier for backward compatibility
-- Governance is always tier A (annual CPI/WGI data)
UPDATE country_year SET
  interpersonal_confidence_tier = confidence_tier,
  institutional_confidence_tier = confidence_tier,
  governance_confidence_tier = CASE WHEN governance IS NOT NULL THEN 'A' ELSE NULL END
WHERE interpersonal_confidence_tier IS NULL
   OR institutional_confidence_tier IS NULL
   OR governance_confidence_tier IS NULL;

-- Backfill confidence intervals based on tier
-- Tier A: ±5, Tier B: ±10, Tier C: ±15
UPDATE country_year SET
  interpersonal_ci_lower = CASE
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'A' THEN GREATEST(0, interpersonal - 5)
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'B' THEN GREATEST(0, interpersonal - 10)
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'C' THEN GREATEST(0, interpersonal - 15)
    ELSE NULL
  END,
  interpersonal_ci_upper = CASE
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'A' THEN LEAST(100, interpersonal + 5)
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'B' THEN LEAST(100, interpersonal + 10)
    WHEN interpersonal IS NOT NULL AND interpersonal_confidence_tier = 'C' THEN LEAST(100, interpersonal + 15)
    ELSE NULL
  END,
  institutional_ci_lower = CASE
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'A' THEN GREATEST(0, institutional - 5)
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'B' THEN GREATEST(0, institutional - 10)
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'C' THEN GREATEST(0, institutional - 15)
    ELSE NULL
  END,
  institutional_ci_upper = CASE
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'A' THEN LEAST(100, institutional + 5)
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'B' THEN LEAST(100, institutional + 10)
    WHEN institutional IS NOT NULL AND institutional_confidence_tier = 'C' THEN LEAST(100, institutional + 15)
    ELSE NULL
  END,
  governance_ci_lower = CASE
    WHEN governance IS NOT NULL THEN GREATEST(0, governance - 5)  -- Always tier A
    ELSE NULL
  END,
  governance_ci_upper = CASE
    WHEN governance IS NOT NULL THEN LEAST(100, governance + 5)  -- Always tier A
    ELSE NULL
  END
WHERE interpersonal_ci_lower IS NULL
   OR institutional_ci_lower IS NULL
   OR governance_ci_lower IS NULL;

-- Note: media_confidence_tier will be set by aggregate_media.py based on:
-- Tier A: Reuters or Eurobarometer ≤1 year
-- Tier B: Reuters/Eurobarometer 1-2y OR WVS ≤3y
-- Tier C: No media data ≤3 years

-- Add comment documenting the tier logic
COMMENT ON COLUMN country_year.interpersonal_confidence_tier IS 'A: WVS ≤3y, B: WVS 3-7y, C: no survey ≤7y';
COMMENT ON COLUMN country_year.institutional_confidence_tier IS 'A: WVS ≤3y, B: WVS 3-7y, C: no survey ≤7y';
COMMENT ON COLUMN country_year.governance_confidence_tier IS 'Always A (annual CPI/WGI data)';
COMMENT ON COLUMN country_year.media_confidence_tier IS 'A: Reuters/EB ≤1y, B: Reuters/EB 1-2y or WVS ≤3y, C: no data ≤3y';
