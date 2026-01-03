-- Migration: Add exclude_from_gti flag for methodology breaks
-- Purpose: Mark observations that should be preserved but not used in GTI calculations
-- due to incompatible methodology changes between survey waves

-- Add exclusion flag to observations
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS exclude_from_gti BOOLEAN DEFAULT FALSE;

-- Add exclusion reason for documentation
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS exclusion_reason TEXT;

-- Index for filtering excluded observations
CREATE INDEX IF NOT EXISTS idx_observations_exclude
  ON observations(exclude_from_gti)
  WHERE exclude_from_gti = TRUE;

-- Mark Asian Barometer Wave 1-2 institutional trust as excluded
-- Reason: Wave 1-2 (2002, 2007) institutional trust scales are incompatible with Wave 3+
-- Wave 1-2 produces inverted patterns compared to later waves, suggesting different
-- question wording or response scale coding that cannot be reliably harmonized.
-- Data preserved for transparency but excluded from GTI calculations.
UPDATE observations
SET
  exclude_from_gti = TRUE,
  exclusion_reason = 'Asian Barometer Wave 1-2 institutional trust uses incompatible scale - cannot be harmonized with Wave 3+ data'
WHERE source = 'Asian Barometer'
  AND trust_type = 'institutional'
  AND year IN (2002, 2007);

COMMENT ON COLUMN observations.exclude_from_gti IS 'If TRUE, observation is preserved but excluded from GTI calculations due to methodology incompatibility';
COMMENT ON COLUMN observations.exclusion_reason IS 'Documents why observation was excluded from GTI (methodology break, scale incompatibility, etc.)';

-- Mark Latinobarometro 1996-2002 interpersonal trust as excluded
-- Reason: These early years use inconsistent variables (p9, sp9, sp9a, P9N, p9st, p9no2)
-- and different scales (binary, ternary, quaternary) across years, producing wild swings
-- (e.g., 25% → 93% → 76% for same countries). Cannot be reliably harmonized.
UPDATE observations
SET
  exclude_from_gti = TRUE,
  exclusion_reason = 'Latinobarometro 1996-2002 interpersonal trust uses inconsistent variables and scales across years - cannot be reliably harmonized'
WHERE source = 'Latinobarometro'
  AND trust_type = 'interpersonal'
  AND year <= 2002;

-- Fix Afrobarometer R8 (2020) methodology tag
-- R8 uses binary interpersonal question but was incorrectly tagged as 4point
UPDATE observations
SET methodology = 'binary'
WHERE source = 'Afrobarometer'
  AND trust_type = 'interpersonal'
  AND year = 2020
  AND methodology = '4point';

-- Fix Latinobarometro methodology tags for detected binary years
-- 2020 and 2023 use binary question format (p9stgbs) with WVS-compatible scores
UPDATE observations
SET methodology = 'binary'
WHERE source = 'Latinobarometro'
  AND trust_type = 'interpersonal'
  AND method_notes LIKE '%(binary)%'
  AND exclude_from_gti IS NOT TRUE;

-- Exclude Latinobarometro institutional trust for years with methodology breaks
-- 2015: avg 76% vs 2013 avg 38% and 2020 avg 22% - clearly different scale/variable
-- 2001, 2003: Very early years with different format
-- 2009: Only 3 countries, incomplete data
UPDATE observations
SET
  exclude_from_gti = TRUE,
  exclusion_reason = 'Latinobarometro institutional trust shows methodology breaks - 2015 avg 76% vs 2020 avg 22% suggests different scale'
WHERE source = 'Latinobarometro'
  AND trust_type = 'institutional'
  AND year IN (2001, 2003, 2009, 2015);
