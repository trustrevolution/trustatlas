-- Migration 007: Complete source metadata with compliance information
-- Adds citation requirements, attribution text, and compliance flags for all data sources

-- Add new columns for compliance tracking
ALTER TABLE source_metadata
ADD COLUMN IF NOT EXISTS citation_template TEXT,
ADD COLUMN IF NOT EXISTS attribution_text TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS redistribution_allowed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS commercial_use_allowed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requires_registration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_type TEXT DEFAULT 'aggregated';

-- Update existing sources with compliance information
UPDATE source_metadata SET
    citation_template = 'Corruption Perceptions Index (YEAR) by Transparency International is licensed under CC BY 4.0',
    attribution_text = 'Data from Transparency International Corruption Perceptions Index',
    url = 'https://www.transparency.org/cpi',
    redistribution_allowed = TRUE,
    commercial_use_allowed = TRUE,
    requires_registration = FALSE
WHERE source = 'CPI';

UPDATE source_metadata SET
    citation_template = 'Worldwide Governance Indicators, YEAR Revision, World Bank (www.govindicators.org), Accessed on DATE',
    attribution_text = 'Data from World Bank Worldwide Governance Indicators',
    url = 'https://info.worldbank.org/governance/wgi/',
    redistribution_allowed = TRUE,
    commercial_use_allowed = TRUE,
    requires_registration = FALSE
WHERE source = 'WGI';

UPDATE source_metadata SET
    citation_template = 'World Values Survey: Round Seven - Country-Pooled Datafile Version X.X. Madrid, Spain & Vienna, Austria: JD Systems Institute & WVSA Secretariat. doi:10.14281/18241.20',
    attribution_text = 'Data from World Values Survey Association',
    url = 'https://www.worldvaluessurvey.org',
    redistribution_allowed = TRUE,
    commercial_use_allowed = FALSE,
    requires_registration = TRUE,
    license = 'Custom Terms (non-commercial academic use)'
WHERE source = 'WVS';

-- Fix ESS license (was incorrectly CC BY-NC 4.0, should be CC BY-NC-SA 4.0)
UPDATE source_metadata SET
    license = 'CC BY-NC-SA 4.0',
    citation_template = 'ESS ERIC (YEAR) ESSXX - integrated file, edition X.X [Data set]. Sikt. https://doi.org/...',
    attribution_text = 'Data from European Social Survey ERIC',
    url = 'https://www.europeansocialsurvey.org',
    notification_email = 'ess@europeansocialsurvey.org',
    redistribution_allowed = TRUE,
    commercial_use_allowed = FALSE,
    requires_registration = TRUE
WHERE source = 'ESS';

UPDATE source_metadata SET
    citation_template = 'OECD (YEAR), (dataset name), (data source) DOI or URL (accessed on DATE)',
    attribution_text = 'Data from OECD. This is an adaptation of an original work by the OECD. The opinions expressed and arguments employed should not be reported as representing the official views of the OECD or of its Member countries.',
    url = 'https://stats.oecd.org/',
    redistribution_allowed = TRUE,
    commercial_use_allowed = TRUE,
    requires_registration = FALSE
WHERE source = 'OECD';

-- Insert new sources
INSERT INTO source_metadata (source, description, cadence, coverage, license, access_mode, citation_template, attribution_text, url, redistribution_allowed, commercial_use_allowed, requires_registration) VALUES

-- Core WVS-family sources
('GSS', 'General Social Survey', 'Annual (with gaps)', 'USA', 'Public Domain', 'Bulk Download',
 'Davern, Michael; Bautista, Rene; Freese, Jeremy; Herd, Pamela; and Morgan, Stephen L.; General Social Survey 1972-YEAR. [Machine-readable data file]. NORC ed. Chicago, YEAR.',
 'The General Social Survey (GSS) is a project of the independent research organization NORC at the University of Chicago, with principal funding from the National Science Foundation.',
 'https://gss.norc.org/', TRUE, TRUE, FALSE),

('ANES', 'American National Election Studies', 'Election years', 'USA', 'CC0', 'Bulk Download',
 'American National Election Studies. YEAR. ANES YEAR Time Series Study Full Release [dataset and documentation]. www.electionstudies.org',
 'Data from American National Election Studies. The original collector of the data, ANES, and the relevant funding agency/agencies bear no responsibility for use of the data or for interpretations or inferences based upon such uses.',
 'https://electionstudies.org/', TRUE, TRUE, FALSE),

('CES', 'Canadian Election Study', 'Election years', 'Canada', 'Academic Use', 'Harvard Dataverse',
 'Stephenson, Laura B; Harell, Allison; Rubenson, Daniel; Loewen, Peter John, YEAR, "YEAR Canadian Election Study - Online Survey", https://doi.org/..., Harvard Dataverse',
 'Data from the Canadian Election Study',
 'https://ces-eec.arts.ubc.ca/', TRUE, FALSE, TRUE),

-- Regional Barometers (derived statistics only - raw data not redistributed)
('Afrobarometer', 'Afrobarometer Survey', '~3 year rounds', 'Sub-Saharan Africa (~40 countries)', 'Non-commercial with attribution', 'Bulk Download',
 'Afrobarometer Data, [Country(ies)], [Round(s)], [Year(s)], available at http://www.afrobarometer.org',
 'Data from Afrobarometer, a pan-African, nonpartisan survey research project',
 'https://www.afrobarometer.org/', TRUE, FALSE, TRUE),

('Latinobarometro', 'Latinobarómetro Survey', 'Annual', 'Latin America (~18 countries)', 'Non-commercial academic use', 'Bulk Download',
 'Latinobarómetro YEAR. Latinobarómetro Corporation. www.latinobarometro.org',
 'Data from Latinobarómetro Corporation. Note: Trust Atlas uses only derived aggregate statistics, not raw microdata.',
 'https://www.latinobarometro.org/', FALSE, FALSE, TRUE),

('AsianBarometer', 'Asian Barometer Survey', 'Wave-based', 'East/Southeast Asia (~18 countries)', 'Academic use only', 'Bulk Download',
 'Asian Barometer Project (YEAR-YEAR), co-directed by Professors Fu Hu and Yun-han Chu. The Asian Barometer Project Office (www.asianbarometer.org) is solely responsible for the data distribution.',
 'Data from Asian Barometer Survey, organized by Academia Sinica and National Taiwan University',
 'https://www.asianbarometer.org/', TRUE, FALSE, TRUE),

('ArabBarometer', 'Arab Barometer Survey', 'Irregular', 'Arab region (~15 countries)', 'Non-commercial with attribution', 'Bulk Download',
 'Arab Barometer: Public Opinion Survey Conducted in [countries], [years]. Princeton University.',
 'Data from Arab Barometer. Note: Trust Atlas uses only derived aggregate statistics.',
 'https://www.arabbarometer.org/', FALSE, FALSE, FALSE),

('LAPOP', 'LAPOP AmericasBarometer', 'Biennial', 'Americas (~28 countries)', 'Research purposes only', 'Bulk Download',
 'LAPOP Lab, AmericasBarometer YEAR. www.vanderbilt.edu/lapop',
 'These data were supplied by the Latin American Public Opinion Project at Vanderbilt University, which takes no responsibility for any interpretation of the data. Note: Trust Atlas uses only derived aggregate statistics.',
 'https://www.vanderbilt.edu/lapop/', FALSE, FALSE, TRUE),

-- Governance/quality sources
('FreedomHouse', 'Freedom House Freedom in the World', 'Annual', 'Global (210+ countries)', 'Non-commercial with citation', 'Manual Download',
 'Freedom House. Freedom in the World YEAR. Washington, DC: Freedom House, YEAR. https://freedomhouse.org/report/freedom-world',
 'Data from Freedom House. Freedom House encourages those seeking permission to use its content to make a donation to help support their work.',
 'https://freedomhouse.org/report/freedom-world', TRUE, FALSE, FALSE),

('V-Dem', 'Varieties of Democracy', 'Annual', 'Global (179 countries)', 'CC BY-SA 4.0', 'Bulk Download',
 'Coppedge, Michael, et al. YEAR. "V-Dem [Country-Year/Country-Date] Dataset vXX" Varieties of Democracy (V-Dem) Project. https://doi.org/10.23696/vdemdsvXX',
 'Data from V-Dem Institute, University of Gothenburg',
 'https://www.v-dem.net/', TRUE, TRUE, FALSE),

('WJP', 'World Justice Project Rule of Law Index', 'Annual', 'Global (140+ countries)', 'Non-commercial', 'Manual Download',
 'World Justice Project. Rule of Law Index YEAR. Washington, DC: World Justice Project.',
 'Data from World Justice Project Rule of Law Index',
 'https://worldjusticeproject.org/rule-of-law-index/', TRUE, FALSE, FALSE),

-- European surveys
('Eurobarometer', 'Standard Eurobarometer (via GESIS)', 'Semi-annual', 'EU (27+ countries)', 'Scientific research/training', 'GESIS Archive',
 'European Commission, Brussels (YEAR): Eurobarometer XX.X. [producer]. GESIS Data Archive, Cologne. ZA#### doi:...',
 'Data from Eurobarometer surveys, archived at GESIS',
 'https://www.gesis.org/en/eurobarometer-data-service', TRUE, FALSE, TRUE),

('EU-SILC', 'EU Statistics on Income and Living Conditions', 'Annual', 'Europe (38 countries)', 'CC BY 4.0 (aggregates)', 'Eurostat API',
 'Source: Eurostat, EU-SILC [ilc_pw03], accessed on DATE',
 'Data from Eurostat. Reuse of statistical data for commercial or non-commercial purposes is authorised provided the source is acknowledged.',
 'https://ec.europa.eu/eurostat/', TRUE, TRUE, FALSE),

('LiTS', 'EBRD Life in Transition Survey', 'Periodic (~5 years)', 'Eastern Europe/Central Asia (37 countries)', 'Non-commercial', 'Manual Download',
 'EBRD Life in Transition Survey YEAR. London: European Bank for Reconstruction and Development.',
 'Data from EBRD Life in Transition Survey. This information is free for use in a non-commercial context but the EBRD must be credited as the source.',
 'https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html', TRUE, FALSE, FALSE),

('CaucasusBarometer', 'CRRC Caucasus Barometer', 'Annual', 'Armenia, Georgia, Azerbaijan', 'Free with citation', 'Bulk Download',
 'Caucasus Research Resource Centers. YEAR "Caucasus Barometer". Retrieved from http://caucasusbarometer.org on DATE',
 'Data from Caucasus Research Resource Centers (CRRC)',
 'https://caucasusbarometer.org/', TRUE, TRUE, TRUE)

ON CONFLICT (source) DO UPDATE SET
    description = EXCLUDED.description,
    cadence = EXCLUDED.cadence,
    coverage = EXCLUDED.coverage,
    license = EXCLUDED.license,
    access_mode = EXCLUDED.access_mode,
    citation_template = EXCLUDED.citation_template,
    attribution_text = EXCLUDED.attribution_text,
    url = EXCLUDED.url,
    redistribution_allowed = EXCLUDED.redistribution_allowed,
    commercial_use_allowed = EXCLUDED.commercial_use_allowed,
    requires_registration = EXCLUDED.requires_registration,
    updated_at = NOW();

-- Add comment documenting the compliance status
COMMENT ON TABLE source_metadata IS 'Data source metadata including licensing and attribution requirements.
Trust Atlas uses only derived aggregate statistics from survey sources, not raw microdata.
This means redistribution restrictions on raw data files do not apply to our computed country-level scores.
Updated: 2024 with compliance verification for all 20 sources.';
