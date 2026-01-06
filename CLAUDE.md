# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trust Atlas** is an open data initiative that measures trust across three pillars using only programmatically accessible data sources. An open-source project from [Trust Revolution](https://trustrevolution.co).

### The Three Pillars

1. **Social Trust** - Survey data on whether "most people can be trusted"
2. **Institutional Trust** - Confidence in government, benchmarked against governance indices (CPI, WGI, WJP)
3. **Media Trust** - Trust in news media (Reuters DNR, Eurobarometer, WVS)

Each pillar is displayed independently—we do **not** combine them into a composite index. Governance indices provide a "reality check" benchmark within Institutional Trust, enabling comparison between what citizens believe and how institutions are rated.

All inputs are normalized to 0-100 scale with data provenance and confidence flags.

## Architecture

The codebase is organized into several key modules:

- **`api/`** - Fastify TypeScript API (code in `src/`)
- **`web/`** - Next.js application (routes/components in `app/`)
- **`etl/`** - Python ETL jobs (`jobs/`, `pipelines/`)
- **`db/`** - SQL migrations and seed data
- **`data/`** - Raw data, staging, and reference files
- **`scripts/`** - Development utilities

## Development Commands

### Core Development Workflow
```bash
make up      # Boot services (Postgres/Redis/MinIO), run migrations, seed demo data
make api     # Start API dev server on port 3001
make web     # Start web dev server on port 3000
make migrate # Apply db/migrations/000_init.sql to $POSTGRES_URL
make seed    # Load demo data rows
make etl-cpi # Stage CPI sample data
```

### Data Quality
```bash
make sweep      # Run full data quality sweep (flags to DB + CSV report)
make sweep-dry  # Dry run (report only, no DB writes)

# Run specific checks
python -m etl.data_quality.sweep --check statistical_outliers
python -m etl.data_quality.sweep --check yoy_anomalies
python -m etl.data_quality.sweep --check cross_source
python -m etl.data_quality.sweep --check methodology_mismatch
python -m etl.data_quality.sweep --check sample_size
python -m etl.data_quality.sweep --check coverage_gaps
```

### Database Schema
The project uses Postgres with these key tables:
- `countries` - ISO3, names, regions, income groups
- `observations` - Normalized trust data (0-100 scale) per source/year/country
- `country_year` - Materialized view with computed pillar scores and confidence tiers
- `data_quality_flags` - Tracks outliers and data quality issues for review

### Environment Setup
Copy `.env.example` to `.env` for local development. Uses Docker Compose for services:
- Postgres (port 5432)
- Redis (port 6379) 
- MinIO (ports 9000/9001)

## Data Sources & Methodology

### Approved Sources (Open/Programmatic Access Only)
- American National Election Studies (ANES) - bulk downloads (USA only)
- Canadian Election Study (CES) - bulk downloads (Canada only)
- European Social Survey (ESS) - API endpoints (reference only, excluded from pillars)
- European Values Study (EVS) - bulk downloads (interpersonal only, same A165 as WVS)
- Freedom House - annual CSV
- General Social Survey (GSS) - bulk downloads (USA only)
- OECD Trust Indicators - API via OECD.Stat (reference only)
- Regional Barometers (Afro/Arab/Latino/Asian) - bulk downloads (supplementary for survey pillars)
- Transparency International CPI - annual CSV
- V-Dem - annual bulk download
- World Bank WGI - API + bulk CSV
- World Justice Project - annual CSV
- World Values Survey (WVS) - bulk CSV/SPSS

### Prohibited Sources
- Gallup World Poll (proprietary)
- Edelman Trust Barometer (restricted redistribution)

### Pillar Methodology (v0.7.0)

**Interpersonal Trust:**
WVS-family sources take precedence: WVS, EVS, GSS, ANES, CES. Regional barometers (Afro/Arab/Asian/Latino) fill gaps where WVS-family data doesn't exist. ESS excluded (0-10 scale incompatible).

**Institutional Trust:**
WVS-family sources take precedence: WVS, ANES, CES. Regional barometers fill gaps. EVS excluded (inconsistent variable coverage across waves).

**Media Trust:**
Weighted average: Reuters DNR (40%), Eurobarometer (40%), WVS (20%). Missing sources have weight redistributed.

**Governance Benchmarking (within Institutions):**
Weighted average of available sources, shown as "How it's rated" alongside survey trust:
- CPI, WGI, WJP, WJP-Corruption: 20% each
- Freedom House, V-Dem: 10% each

WGI (-2.5 to +2.5) rescales to: `((raw + 2.5) / 5) * 100`

**No Composite Index:** We deliberately do not combine pillars into a single score. See BRAND.md for rationale.

### Confidence Tiers
- **A**: Current survey data (≤3y) + current governance proxy
- **B**: Survey >3y old OR only one pillar + governance proxy  
- **C**: Governance proxy only (no valid surveys within 7y)

## Code Style

### Web/CSS (MANDATORY)
**ALWAYS use global CSS classes from `web/app/globals.css` when creating or editing pages/components.**

Before writing inline Tailwind, check `globals.css` for existing component classes:
- Page layout: `.page-header`, `.page-title`, `.page-subtitle`, `.page-content`, `.page-back-link`
- Info boxes: `.info-box`, `.info-box-amber`, `.info-box-blue`, `.info-box-emerald`, `.info-box-slate`
- Cards: `.source-card`, `.source-card-header`, `.source-card-title`, `.source-card-badges`
- Badges: `.badge`, `.badge-slate`, `.badge-emerald`, `.badge-amber`
- Sections: `.section-header`, `.section-title`, `.section-subtitle`
- Code: `.code-block`, `.code-block-light`
- Hero: `.hero-section`, `.hero-title`, `.hero-subtitle`, `.hero-actions`
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-link`

**DO NOT** write verbose inline Tailwind when a global class exists. Use globals first, extend with Tailwind only when necessary.

### Charts (MANDATORY)
**When creating data story charts, follow the standards in `docs/CHART_STANDARDS.md`.**

Quick reference:
1. Copy `web/components/charts/_ChartTemplate.tsx` as starting point
2. Use builder functions from `@/lib/charts`: `line()`, `timeAxis()`, `percentAxis()`, `eventMarker()`, `periodBand()`
3. Define `PROVENANCE` metadata with id, title, sources, confidence tier
4. Generate `tableData` for accessibility (Chart/Table toggle)
5. Wrap with `ChartWithControls` component
6. Use `gridRight(endLabels)` for charts with end labels
7. Filter data to match x-axis range (avoid clipped dots)

**DO NOT** write raw ECharts config. Use the builder functions for consistency.

### TypeScript/JavaScript
- 2-space indentation
- ES modules
- camelCase variables, PascalCase React components
- Use `eslint` and `tsc --noEmit` for linting/type checking

### Python
- 4-space indentation
- snake_case for modules, functions, variables
- Use `black`, `ruff`, `mypy` for formatting/linting
- Tests under `etl/tests/test_*.py` using pytest

### SQL
- Lowercase keywords
- One statement per migration when feasible

## API Contract

Base URL: `https://api.trustatlas.org`

- `GET /trends/global?pillar=social|institutions|media` - Latest scores by pillar
- `GET /trends/countries?iso3=...[&pillar=social|institutions|media|financial]` - Multi-country trends (max 20)
- `GET /country/{iso3}` - Time series + pillar breakdown for a country
- `GET /trends/regions` - Regional averages and breakdowns
- `GET /methodology` - Current normalization/weights (versioned JSON/YAML)

**Pillars:** social, institutions, media
**Supplementary indicators:** financial (bank trust from WVS, not a pillar)

Legacy pillar names (interpersonal, institutional, governance) still work.

All responses use CDN caching with `s-maxage=86400`.

## Testing

- API/UI tests: `api/src/**/*.test.ts` and under `web/`
- ETL tests: `etl/tests/test_*.py` using pytest
- Focus on pillar calculations and API contract compliance

## Data Ethics & Quality

- All displayed values must show source + year provenance
- Store and expose license strings for each source
- Block export if license forbids redistribution
- Never commit raw source files >10MB
- Use semantic versioning for methodology and data releases

### Data Quality Checks (`etl/data_quality/`)

The sweep system detects and flags data quality issues:

| Check | Description | Threshold |
|-------|-------------|-----------|
| `statistical_outliers` | Scores outside expected ranges for trust type | Binary >60% or <10%, Institutional >95% or <5% |
| `yoy_anomalies` | Year-over-year changes within same source | >25 points (warning), >40 points (error) |
| `cross_source` | Same country/year differs between sources | >30 points (warning), >40 points (error) |
| `methodology_mismatch` | Scores unexpected for methodology type | Binary >55%, 0-10scale >70% |
| `sample_size` | Sample size issues | <100 (error <50), >100k, or NULL |
| `coverage_gaps` | Sources with few countries, sparse data | <5 countries per source |

Flags are persisted to `data_quality_flags` table with severity (`warning`/`error`) and can be resolved with notes. Run `make sweep` after ETL jobs to detect issues.

## Security

- Never commit secrets or API keys
- Use least-privilege credentials stored in secrets manager
- Respect robots.txt and terms-of-use for all sources
- Provide data removal path for sources changing licenses