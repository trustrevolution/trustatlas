-- Migration 011: Add schema_migrations tracking table
-- Provides visibility into which migrations have been applied to each database

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backfill all existing migrations (since they're already applied)
INSERT INTO schema_migrations (version) VALUES
  ('000_init'),
  ('001_confidence_intervals'),
  ('002_methodology'),
  ('003_fix_ess_eusilc_scale'),
  ('004_data_quality_flags'),
  ('005_exclude_from_gti'),
  ('006_add_freedom_trust_type'),
  ('006_remove_gti'),
  ('007_source_metadata_compliance'),
  ('008_add_evs_source'),
  ('009_add_media_trust'),
  ('010_pillar_confidence_tiers'),
  ('011_schema_migrations')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE schema_migrations IS 'Tracks which migrations have been applied to this database';
