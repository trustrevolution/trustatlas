-- Migration: Add methodology column to observations
-- Purpose: Distinguish binary (WVS-compatible) from 4-point scale measurements
-- This allows filtering interpersonal trust to use only comparable methodologies

-- Step 1: Add the methodology column
ALTER TABLE observations ADD COLUMN IF NOT EXISTS methodology VARCHAR(20);

-- Step 2: Tag binary-methodology sources for interpersonal trust
-- These use the standard "most people can be trusted" binary question
UPDATE observations SET methodology = 'binary'
WHERE source IN ('WVS', 'GSS', 'CES', 'ANES')
  AND trust_type = 'interpersonal';

UPDATE observations SET methodology = 'binary'
WHERE source = 'ESS'
  AND trust_type = 'interpersonal';

UPDATE observations SET methodology = 'binary'
WHERE source = 'EU-SILC'
  AND trust_type = 'interpersonal';

-- Step 3: Tag 4-point scale sources for interpersonal trust
-- These use "trust a lot/somewhat/not much/not at all" scales
-- which systematically yield higher percentages than binary
UPDATE observations SET methodology = '4point'
WHERE source IN ('Afrobarometer', 'Arab Barometer', 'Asian Barometer',
                 'Latinobarometro', 'LiTS', 'CaucasusBarometer', 'Eurobarometer')
  AND trust_type = 'interpersonal';

-- Step 4: Tag institutional trust (all use similar 4-point confidence scales)
UPDATE observations SET methodology = '4point'
WHERE trust_type = 'institutional'
  AND methodology IS NULL;

-- Step 5: Delete known erroneous observations
-- Peru 2002 Latinobarometro: 95.5% on binary scale is inverted coding
DELETE FROM observations
WHERE iso3 = 'PER' AND year = 2002 AND source = 'Latinobarometro'
  AND trust_type = 'interpersonal' AND score_0_100 > 90;

-- Verify the distribution
-- SELECT methodology, trust_type, COUNT(*)
-- FROM observations
-- GROUP BY methodology, trust_type
-- ORDER BY trust_type, methodology;
