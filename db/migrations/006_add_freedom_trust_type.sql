-- Migration: Add 'freedom' trust_type for FreedomHouse and V-Dem data
-- These measure political freedom, not corruption/institutional quality (CPI/WGI)
-- Separating them prevents methodology mixing in governance pillar

-- Drop old constraint and add new one with 'freedom'
ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_trust_type_check;
ALTER TABLE observations ADD CONSTRAINT observations_trust_type_check
  CHECK (trust_type IN ('interpersonal', 'institutional', 'governance', 'partisan', 'cpi', 'wgi', 'oecd', 'derived', 'freedom'));

-- Migrate existing FreedomHouse and V-Dem records from governance to freedom
UPDATE observations
SET trust_type = 'freedom'
WHERE source IN ('FreedomHouse', 'V-Dem')
  AND trust_type = 'governance';
