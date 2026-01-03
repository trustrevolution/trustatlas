-- Migration: Add EVS source metadata
--
-- European Values Study uses identical methodology to WVS (same A165 question)
-- and is a valid source for interpersonal and institutional trust pillars.

-- Add source metadata for EVS
INSERT INTO source_metadata (source, description, cadence, coverage, license, access_mode)
VALUES
  ('EVS', 'European Values Study', 'Wave (~9 years)', '35 European countries', 'Academic Terms', 'Bulk Download')
ON CONFLICT (source) DO UPDATE SET
  description = EXCLUDED.description,
  cadence = EXCLUDED.cadence,
  coverage = EXCLUDED.coverage,
  license = EXCLUDED.license,
  access_mode = EXCLUDED.access_mode,
  updated_at = NOW();
