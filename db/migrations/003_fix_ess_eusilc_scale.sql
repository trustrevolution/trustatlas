-- Migration: Fix ESS and EU-SILC methodology tagging
-- Problem: These sources use 0-10 mean scales, not binary questions
-- They were incorrectly tagged as 'binary' which inflates interpersonal scores ~25 points

-- Step 1: Retag EU-SILC interpersonal as 0-10 scale (not binary)
UPDATE observations SET methodology = '0-10scale'
WHERE source = 'EU-SILC'
  AND trust_type = 'interpersonal';

-- Step 2: Retag ESS interpersonal as 0-10 scale (not binary)
UPDATE observations SET methodology = '0-10scale'
WHERE source = 'ESS'
  AND trust_type = 'interpersonal';

-- Verify: Binary sources should now only be WVS, GSS, CES, ANES
-- SELECT DISTINCT source FROM observations
-- WHERE trust_type = 'interpersonal' AND methodology = 'binary';
