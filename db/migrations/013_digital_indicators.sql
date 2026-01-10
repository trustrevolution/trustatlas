-- Digital Indicators Table
-- Migration 013: New table for digital penetration metrics (social media, internet)

-- Create table for digital indicators
CREATE TABLE IF NOT EXISTS digital_indicators (
    id SERIAL PRIMARY KEY,
    iso3 CHAR(3) NOT NULL REFERENCES countries(iso3),
    year INTEGER NOT NULL,
    indicator VARCHAR(50) NOT NULL,  -- 'social_media_penetration', 'internet_penetration'
    value NUMERIC(5,2) NOT NULL CHECK (value >= 0 AND value <= 100),  -- percentage 0-100
    source VARCHAR(100) NOT NULL,
    source_url TEXT,
    retrieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(iso3, year, indicator, source)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_digital_iso3_year ON digital_indicators(iso3, year);
CREATE INDEX IF NOT EXISTS idx_digital_indicator ON digital_indicators(indicator);

-- Add source metadata
INSERT INTO source_metadata (source, description, cadence, coverage, license, access_mode) VALUES
    ('DataReportal', 'Digital penetration data from We Are Social + Meltwater partnership', 'Annual', 'Global', 'Public Statistics', 'Data Export')
ON CONFLICT (source) DO NOTHING;

COMMENT ON TABLE digital_indicators IS 'Digital penetration metrics (social media, internet) for correlation analysis with trust data';
COMMENT ON COLUMN digital_indicators.indicator IS 'Type: social_media_penetration, internet_penetration';
COMMENT ON COLUMN digital_indicators.value IS 'Percentage of population (0-100)';
