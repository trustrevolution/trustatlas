-- Migration: Remove GTI (Global Trust Index) composite scoring
-- Date: 2026-01-03
-- Reason: Trust Atlas displays pillars independently, not as a composite index
--         See CLAUDE.md: "we do NOT combine them into a composite index"

-- Remove GTI column and index from country_year
ALTER TABLE country_year DROP COLUMN IF EXISTS gti;
DROP INDEX IF EXISTS idx_country_year_gti;

-- Remove GTI exclusion columns from observations
ALTER TABLE observations DROP COLUMN IF EXISTS exclude_from_gti;
ALTER TABLE observations DROP COLUMN IF EXISTS exclusion_reason;
DROP INDEX IF EXISTS idx_observations_exclude;
