# Data Model & Schema

This document describes the PostgreSQL database schema for Trust Atlas, including table structures, relationships, constraints, indexes, and common query patterns.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌───────────────────┐         ┌───────────────────────────────────────┐   │
│  │    countries      │         │           source_metadata             │   │
│  ├───────────────────┤         ├───────────────────────────────────────┤   │
│  │ iso3 (PK)    TEXT │         │ source (PK)           TEXT            │   │
│  │ iso2         TEXT │         │ description           TEXT            │   │
│  │ name         TEXT │         │ cadence               TEXT            │   │
│  │ region       TEXT │         │ coverage              TEXT            │   │
│  │ income_group TEXT │         │ license               TEXT            │   │
│  │ created_at   TSZ  │         │ access_mode           TEXT            │   │
│  └─────────┬─────────┘         │ weighting_notes       TEXT            │   │
│            │                   │ updated_at            TIMESTAMPTZ     │   │
│            │                   └───────────────────────────────────────┘   │
│            │                                                                │
│            │ 1:N                                                            │
│            ▼                                                                │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         observations                               │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │ id (PK)        BIGSERIAL    │ Auto-incrementing ID                 │     │
│  │ iso3 (FK)      TEXT         │ → countries.iso3                     │     │
│  │ year           INTEGER      │ Data collection year                 │     │
│  │ source         TEXT         │ "CPI", "WGI", "WVS", etc.            │     │
│  │ trust_type     TEXT         │ Pillar classification                │     │
│  │ raw_value      NUMERIC      │ Original scale value                 │     │
│  │ raw_unit       TEXT         │ Description of original scale        │     │
│  │ score_0_100    NUMERIC      │ Normalized value (0-100)             │     │
│  │ sample_n       INTEGER      │ Survey sample size (if applicable)   │     │
│  │ method_notes   TEXT         │ Transformation/provenance notes      │     │
│  │ source_url     TEXT         │ Link to source documentation         │     │
│  │ ingested_at    TIMESTAMPTZ  │ When data was loaded                 │     │
│  │                                                                     │     │
│  │ UNIQUE(iso3, year, source, trust_type)                             │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│            │                                                                │
│            │ (computed from observations)                                   │
│            ▼                                                                │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         country_year                               │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │ iso3 (PK,FK)       TEXT     │ → countries.iso3                     │     │
│  │ year (PK)          INTEGER  │ Score year                           │     │
│  │ interpersonal      NUMERIC  │ Pillar score (0-100)                 │     │
│  │ institutional      NUMERIC  │ Pillar score (0-100)                 │     │
│  │ governance         NUMERIC  │ Pillar score (0-100)                 │     │
│  │ media              NUMERIC  │ Pillar score (0-100)                 │     │
│  │ confidence_score   NUMERIC  │ Confidence value (0-1)               │     │
│  │ confidence_tier    CHAR(1)  │ 'A', 'B', or 'C'                     │     │
│  │ sources_used       JSONB    │ {"pillar": ["SOURCE1", ...]}         │     │
│  │ version            TEXT     │ Methodology version                  │     │
│  │ computed_at        TIMESTAMPTZ                                     │     │
│  │                                                                     │     │
│  │ PRIMARY KEY(iso3, year)                                            │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Table Definitions

### countries

Reference table containing 208 countries with ISO codes and classification data.

```sql
CREATE TABLE countries (
    iso3 TEXT PRIMARY KEY,          -- ISO 3166-1 alpha-3 code
    iso2 TEXT,                       -- ISO 3166-1 alpha-2 code
    name TEXT NOT NULL,              -- Common English name
    region TEXT,                     -- Geographic region
    income_group TEXT,               -- World Bank income classification
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Data:**
| iso3 | iso2 | name | region | income_group |
|------|------|------|--------|--------------|
| USA | US | United States | North America | High income |
| DEU | DE | Germany | Europe | High income |
| BRA | BR | Brazil | South America | Upper middle income |
| NGA | NG | Nigeria | Africa | Lower middle income |
| IND | IN | India | Asia | Lower middle income |

**Regions:**
- North America
- South America
- Europe
- Africa
- Asia
- Oceania
- Middle East

**Income Groups (World Bank Classification):**
- High income
- Upper middle income
- Lower middle income
- Low income

### observations

Raw normalized data points from all trust data sources. This is the primary fact table.

```sql
CREATE TABLE observations (
    id BIGSERIAL PRIMARY KEY,
    iso3 TEXT REFERENCES countries(iso3),
    year INTEGER NOT NULL,
    source TEXT NOT NULL,
    trust_type TEXT NOT NULL CHECK (trust_type IN (
        'interpersonal', 'institutional', 'governance',
        'cpi', 'wgi', 'oecd', 'derived'
    )),
    raw_value NUMERIC,
    raw_unit TEXT,
    score_0_100 NUMERIC NOT NULL CHECK (score_0_100 >= 0 AND score_0_100 <= 100),
    sample_n INTEGER,
    method_notes TEXT,
    source_url TEXT,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(iso3, year, source, trust_type)
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Auto-incrementing primary key |
| `iso3` | TEXT | Foreign key to countries table |
| `year` | INTEGER | Year the data was collected/published |
| `source` | TEXT | Data source identifier (e.g., "CPI", "WGI", "WVS") |
| `trust_type` | TEXT | Trust pillar classification |
| `raw_value` | NUMERIC | Original value in source's native scale |
| `raw_unit` | TEXT | Description of the original scale |
| `score_0_100` | NUMERIC | **Normalized score (0-100)** - always use this |
| `sample_n` | INTEGER | Survey sample size (NULL for non-survey data) |
| `method_notes` | TEXT | How the value was calculated/normalized |
| `source_url` | TEXT | URL to source documentation or data download |
| `ingested_at` | TIMESTAMPTZ | Timestamp when row was inserted |

**Trust Types:**

| Value | Description | Sources |
|-------|-------------|---------|
| `interpersonal` | Trust in other people ("most people can be trusted") | WVS, ESS, GSS |
| `institutional` | Trust in national government/institutions | WVS, ESS, OECD |
| `governance` | Institutional quality composite | Computed from CPI+WGI |
| `cpi` | Corruption Perceptions Index (raw) | CPI |
| `wgi` | World Governance Indicators (raw) | WGI |
| `oecd` | OECD Trust in Government | OECD |
| `derived` | Computed or interpolated values | Various |

**Example Data:**
```sql
INSERT INTO observations (iso3, year, source, trust_type, raw_value, raw_unit, score_0_100, sample_n, method_notes, source_url)
VALUES
    ('USA', 2023, 'CPI', 'cpi', 69, 'CPI Score (0-100)', 69.0, NULL, 'Direct score', 'https://www.transparency.org/cpi'),
    ('USA', 2022, 'WVS', 'interpersonal', 0.38, 'Proportion (0-1)', 38.0, 2507, 'Q57: Can most people be trusted?', 'https://www.worldvaluessurvey.org/'),
    ('DEU', 2021, 'ESS', 'institutional', 5.8, 'Mean (0-10)', 58.0, 2310, 'Trust in parliament (Q10)', 'https://europeansocialsurvey.org/');
```

### country_year

Computed pillar scores with confidence metadata. Updated by the assembly pipeline.

> **Note:** The `gti` column is deprecated as of methodology v0.3.0. Trust Atlas now displays pillars independently without computing a composite score.

```sql
CREATE TABLE country_year (
    iso3 TEXT REFERENCES countries(iso3),
    year INTEGER NOT NULL,
    interpersonal NUMERIC CHECK (interpersonal >= 0 AND interpersonal <= 100),
    institutional NUMERIC CHECK (institutional >= 0 AND institutional <= 100),
    governance NUMERIC CHECK (governance >= 0 AND governance <= 100),
    gti NUMERIC CHECK (gti >= 0 AND gti <= 100),
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    confidence_tier CHAR(1) CHECK (confidence_tier IN ('A', 'B', 'C')),
    sources_used JSONB,
    version TEXT DEFAULT '0.1.0',
    computed_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (iso3, year)
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| `iso3` | TEXT | Composite primary key with year |
| `year` | INTEGER | Score year |
| `interpersonal` | NUMERIC | Interpersonal trust pillar (0-100) |
| `institutional` | NUMERIC | Institutional trust pillar (0-100) |
| `governance` | NUMERIC | Governance quality pillar (0-100) |
| `gti` | NUMERIC | **DEPRECATED** - No longer computed (was composite score) |
| `confidence_score` | NUMERIC | Numeric confidence (0-1) |
| `confidence_tier` | CHAR(1) | 'A' (high), 'B' (medium), 'C' (low) |
| `sources_used` | JSONB | Which sources contributed to each pillar |
| `version` | TEXT | Methodology version that computed this row |
| `computed_at` | TIMESTAMPTZ | When this score was last computed |

**Confidence Tiers:**

| Tier | Criteria | Typical Scenario |
|------|----------|------------------|
| **A** | Recent survey data (≤3 years) + governance | Full survey coverage + governance |
| **B** | Older survey data (3-7 years) or single pillar + governance | Partial survey coverage |
| **C** | Governance only, or data >7 years old | No recent survey data |

**sources_used JSON Structure:**
```json
{
  "interpersonal": ["WVS", "EVS"],
  "institutional": ["WVS", "ANES"],
  "media": ["Reuters_DNR", "Eurobarometer", "WVS"],
  "governance": ["CPI", "WGI", "WJP", "FreedomHouse", "V-Dem"]
}
```

**Example Data:**
```sql
INSERT INTO country_year (iso3, year, interpersonal, institutional, governance, gti, confidence_score, confidence_tier, sources_used, version)
VALUES (
    'USA', 2023,
    38.0,   -- interpersonal
    45.2,   -- institutional
    69.0,   -- governance
    51.3,   -- gti = 0.3*38 + 0.4*45.2 + 0.3*69
    0.85,   -- confidence_score
    'A',    -- confidence_tier
    '{"interpersonal": ["WVS"], "institutional": ["WVS", "OECD"], "governance": ["CPI", "WGI"]}',
    '0.1.0'
);
```

### source_metadata

Reference table documenting data source characteristics, licenses, and access methods.

```sql
CREATE TABLE source_metadata (
    source TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    cadence TEXT,
    coverage TEXT,
    license TEXT,
    access_mode TEXT,
    weighting_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed Data:**
| source | description | cadence | coverage | license | access_mode |
|--------|-------------|---------|----------|---------|-------------|
| CPI | Transparency International Corruption Perceptions Index | Annual | Global | CC BY-ND 4.0 | CSV Download |
| WGI | World Bank Worldwide Governance Indicators | Annual | Global | CC BY 4.0 | API + CSV |
| WVS | World Values Survey | Wave (~5 years) | Global (uneven) | Custom Terms | Bulk Download |
| ESS | European Social Survey | Biennial | Europe | CC BY-NC 4.0 | API + Download |
| OECD | OECD Trust Indicators | Irregular | OECD Countries | OECD Terms | OECD.Stat API |

## Indexes

The schema includes indexes optimized for common query patterns:

```sql
-- Fast lookup by country and year (most common filter)
CREATE INDEX idx_observations_country_year ON observations(iso3, year);

-- Filter by trust type across years (pillar analysis)
CREATE INDEX idx_observations_trust_type_year ON observations(trust_type, year);

-- Year-based queries on computed scores
CREATE INDEX idx_country_year_year ON country_year(year);

-- Ranking countries by governance (or other pillars)
CREATE INDEX idx_country_year_governance ON country_year(governance DESC);

-- JSONB containment queries on sources_used
CREATE INDEX idx_country_year_sources_gin ON country_year USING GIN(sources_used);
```

## Constraints

### Check Constraints

All scores are bounded to valid ranges:

```sql
-- observations.score_0_100 must be 0-100
CHECK (score_0_100 >= 0 AND score_0_100 <= 100)

-- country_year pillar scores must be 0-100
CHECK (interpersonal >= 0 AND interpersonal <= 100)
CHECK (institutional >= 0 AND institutional <= 100)
CHECK (governance >= 0 AND governance <= 100)
CHECK (gti >= 0 AND gti <= 100)

-- Confidence score is 0-1
CHECK (confidence_score >= 0 AND confidence_score <= 1)

-- Confidence tier is A, B, or C
CHECK (confidence_tier IN ('A', 'B', 'C'))

-- Trust type is from allowed set
CHECK (trust_type IN ('interpersonal', 'institutional', 'governance', 'cpi', 'wgi', 'oecd', 'derived'))
```

### Uniqueness Constraints

```sql
-- One observation per country-year-source-trust_type
UNIQUE(iso3, year, source, trust_type)

-- One computed score per country-year
PRIMARY KEY(iso3, year)  -- on country_year
```

### Foreign Keys

```sql
-- All observations must reference valid countries
observations.iso3 REFERENCES countries(iso3)

-- All computed scores must reference valid countries
country_year.iso3 REFERENCES countries(iso3)
```

## Common Query Patterns

### Get Latest Pillar Scores for All Countries

```sql
SELECT
    cy.iso3,
    c.name,
    c.region,
    cy.interpersonal,
    cy.institutional,
    cy.governance,
    cy.confidence_tier,
    cy.year
FROM country_year cy
JOIN countries c ON c.iso3 = cy.iso3
WHERE cy.year = (SELECT MAX(year) FROM country_year)
ORDER BY cy.governance DESC;
```

### Get Country Time Series

```sql
SELECT
    year,
    interpersonal,
    institutional,
    governance,
    confidence_tier,
    sources_used
FROM country_year
WHERE iso3 = 'USA'
ORDER BY year DESC;
```

### Get Regional Averages by Pillar

```sql
SELECT
    c.region,
    AVG(cy.interpersonal) as avg_interpersonal,
    AVG(cy.institutional) as avg_institutional,
    AVG(cy.governance) as avg_governance,
    COUNT(*) as country_count
FROM country_year cy
JOIN countries c ON c.iso3 = cy.iso3
WHERE cy.year = 2023
GROUP BY c.region
ORDER BY avg_governance DESC;
```

### Get All Observations for a Country

```sql
SELECT
    year,
    source,
    trust_type,
    score_0_100,
    sample_n,
    method_notes
FROM observations
WHERE iso3 = 'DEU'
ORDER BY year DESC, source;
```

### Find Countries with Specific Source Coverage

```sql
-- Countries with WVS data
SELECT DISTINCT cy.iso3, c.name
FROM country_year cy
JOIN countries c ON c.iso3 = cy.iso3
WHERE cy.sources_used @> '{"interpersonal": ["WVS"]}';
```

### Get Governance Pillar Breakdown

```sql
-- CPI and WGI values for a country
SELECT
    year,
    source,
    score_0_100
FROM observations
WHERE iso3 = 'BRA'
  AND trust_type IN ('cpi', 'wgi')
ORDER BY year DESC, source;
```

## Data Lifecycle

### 1. Country Reference Data

Loaded once from `data/reference/iso_map.csv`. Rarely changes.

```sql
-- scripts/dev_seed.py loads this
INSERT INTO countries (iso3, iso2, name, region, income_group)
SELECT iso3, iso2, name, region, income_group
FROM csv_file
ON CONFLICT (iso3) DO NOTHING;
```

### 2. Observations

Added by ETL jobs via upsert pattern:

```sql
INSERT INTO observations (iso3, year, source, trust_type, ...)
VALUES (...)
ON CONFLICT (iso3, year, source, trust_type)
DO UPDATE SET
    score_0_100 = EXCLUDED.score_0_100,
    ingested_at = NOW();
```

### 3. Computed Scores

Generated by `etl/pipelines/assemble.py`:

```sql
-- Clear existing scores for the year
DELETE FROM country_year WHERE year = $1;

-- Insert new computed scores
INSERT INTO country_year (iso3, year, interpersonal, institutional, governance, gti, ...)
VALUES (...);
```

## Performance Considerations

### Observation Table Size

With ~200 countries × ~30 years × ~6 sources × ~3 trust types:
- Maximum theoretical rows: ~108,000
- Current actual rows: ~6,000
- Row size: ~200 bytes average
- Total size: ~1.2 MB (negligible)

### Query Optimization Tips

1. **Always filter by year first** - Most queries only need latest or specific year
2. **Use country_year for aggregates** - Pre-computed, no need to aggregate observations
3. **Use GIN index for JSONB** - `sources_used @>` queries use the index
4. **Join through iso3** - All tables use consistent key

### Connection Pooling

The API uses a PostgreSQL connection pool:

```typescript
// api/src/lib/db.ts
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 20,  // Maximum connections in pool
});
```

## Migration Strategy

### Current State

Single migration file: `db/migrations/000_init.sql`

- Uses `CREATE TABLE IF NOT EXISTS` for idempotency
- Uses `ON CONFLICT DO NOTHING` for seed data
- Applied via `make migrate` (runs psql)

### Future Migrations

For schema changes:

1. Create new migration file: `db/migrations/001_add_column.sql`
2. Update `make migrate` or use a migration tool
3. Test in development first
4. Apply to production with backup

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [ETL_PIPELINE.md](./ETL_PIPELINE.md) - How data gets into the database
- [METHODOLOGY.md](./METHODOLOGY.md) - How GTI is calculated
- [API_REFERENCE.md](./API_REFERENCE.md) - How data is queried
