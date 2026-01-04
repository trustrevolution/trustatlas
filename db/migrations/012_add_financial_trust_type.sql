-- Migration: Add financial trust type
-- Adds 'financial' to allowed trust_type values for WVS E069_12 (Confidence in Banks)

-- Drop existing constraint
ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_trust_type_check;

-- Add new constraint with 'financial' included
ALTER TABLE observations ADD CONSTRAINT observations_trust_type_check
CHECK (trust_type = ANY (ARRAY[
    'interpersonal', 'institutional', 'governance', 'partisan',
    'cpi', 'wgi', 'oecd', 'derived', 'freedom', 'media', 'financial'
]));

-- Add source metadata for financial trust
INSERT INTO source_metadata (source, description, cadence, coverage, license, access_mode, weighting_notes)
VALUES (
    'WVS-Financial',
    'World Values Survey E069_12: Confidence in Banks. Measures % expressing "a great deal" or "quite a lot" of confidence in banks.',
    '~5-7 years (wave-based)',
    '100+ countries, 1990-2023',
    'Academic use with attribution',
    'Bulk download (registration required)',
    'Supplementary indicator - not included in core pillar calculations'
)
ON CONFLICT (source) DO UPDATE SET
    description = EXCLUDED.description,
    cadence = EXCLUDED.cadence,
    coverage = EXCLUDED.coverage,
    weighting_notes = EXCLUDED.weighting_notes;
