-- Migration 009: Add media trust pillar
-- Adds support for Reuters Digital News Report media trust data

-- Add media column to country_year table
ALTER TABLE country_year
ADD COLUMN IF NOT EXISTS media NUMERIC
  CHECK (media >= 0 AND media <= 100);

-- Add 'media' to observations trust_type constraint
-- First drop the existing constraint, then recreate with new value
ALTER TABLE observations
  DROP CONSTRAINT IF EXISTS observations_trust_type_check;

ALTER TABLE observations
  ADD CONSTRAINT observations_trust_type_check
  CHECK (trust_type IN (
    'interpersonal',
    'institutional',
    'governance',
    'cpi',
    'wgi',
    'oecd',
    'derived',
    'freedom',
    'vdem',
    'wjp',
    'partisan',  -- Existing value
    'media'      -- NEW: Reuters Digital News Report
  ));

-- Add Reuters DNR to source_metadata
INSERT INTO source_metadata (source, description, url, license, commercial_use_allowed)
VALUES (
  'Reuters_DNR',
  'Reuters Digital News Report - Annual survey of news consumption and trust across 47 countries',
  'https://reutersinstitute.politics.ox.ac.uk/digital-news-report',
  'CC BY',
  true
)
ON CONFLICT (source) DO UPDATE SET
  license = EXCLUDED.license,
  commercial_use_allowed = EXCLUDED.commercial_use_allowed;

-- Add comment to explain the new pillar
COMMENT ON COLUMN country_year.media IS 'Media trust pillar: Trust in news media from Reuters Digital News Report (0-100 scale)';
