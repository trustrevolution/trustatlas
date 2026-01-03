# Architecture Overview

Trust Atlas is an open data platform that produces transparent, updateable trust metrics using only freely accessible data sources (some require free registration). This document describes the system architecture, component interactions, and design principles.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   WVS   │ │   ESS   │ │  OECD   │ │   CPI   │ │   WGI   │ │   GSS   │   │
│  │  (CSV)  │ │  (API)  │ │  (API)  │ │ (Excel) │ │  (API)  │ │ (.dta)  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │           │         │
│       └───────────┴───────────┴─────┬─────┴───────────┴───────────┘         │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ETL LAYER (Python)                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        etl/jobs/*.py                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ BaseProcessor│◄─┤  CPIProcessor│  │  WGIProcessor│  ...          │   │
│  │  │  (abstract)  │  │              │  │              │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    data/staging/*.csv                                │   │
│  │              (Normalized observations, 0-100 scale)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   etl/pipelines/assemble.py                          │   │
│  │            (Pillar score computation, confidence tiers)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (PostgreSQL)                              │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │   countries   │  │  observations │  │  country_year │  │   source_   │  │
│  │    (208)      │◄─┤    (6000+)    │  │   (computed)  │  │  metadata   │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Fastify)                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      api/src/routes/*.ts                             │   │
│  │  /countries  /score  /country/:iso3  /methodology  /trends/*        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                          Cache-Control: s-maxage=86400                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEB LAYER (Next.js)                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Homepage   │  │    Explore   │  │  Methodology │               │   │
│  │  │  (stories)   │  │  (map+panel) │  │   (details)  │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                      │   │
│  │  Components: Header, Footer, TrustMap, ExplorePanel, Charts/*       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Overview

### 1. ETL Layer (`etl/`)

The ETL layer handles data acquisition, normalization, and loading. It follows a processor pattern where each data source has a dedicated processor class.

**Directory Structure:**
```
etl/
├── jobs/                 # Source-specific processors
│   ├── cpi.py           # Transparency International CPI
│   ├── wgi.py           # World Bank WGI
│   ├── oecd.py          # OECD Trust Indicators
│   ├── wvs.py           # World Values Survey
│   ├── ess.py           # European Social Survey
│   ├── gss.py           # General Social Survey (USA)
│   ├── afrobarometer.py # African countries
│   ├── arabbarometer.py # Arab countries
│   └── asianbarometer.py# Asian countries
├── pipelines/
│   └── assemble.py      # GTI score computation
├── common/
│   ├── base.py          # BaseProcessor abstract class
│   ├── scaling.py       # Normalization functions
│   ├── countries.py     # ISO code mapping
│   └── http.py          # HTTP utilities
└── tests/               # pytest test suite
```

**Key Responsibilities:**
- Download raw data from sources (APIs, bulk files)
- Parse various formats (CSV, Excel, JSON, Stata .dta)
- Normalize all values to 0-100 scale
- Map country names to ISO3 codes
- Validate data quality (bounds, sample sizes)
- Stage intermediate CSVs for auditability
- Load observations to PostgreSQL
- Compute pillar scores with confidence tiers

### 2. Data Layer (`db/`)

PostgreSQL 16 serves as the primary data store with a normalized schema optimized for time-series queries and aggregations.

**Core Tables:**
- `countries` - Reference data (208 countries with ISO codes, regions, income groups)
- `observations` - Raw normalized data points from all sources
- `country_year` - Computed pillar scores with confidence tiers
- `source_metadata` - License and provenance information

See [DATA_MODEL.md](./DATA_MODEL.md) for complete schema documentation.

### 3. API Layer (`api/`)

Fastify-based TypeScript API providing RESTful endpoints for trust data access.

**Directory Structure:**
```
api/
├── src/
│   ├── server.ts        # Fastify app setup, CORS, routes
│   ├── routes/
│   │   ├── countries.ts # GET /countries
│   │   ├── score.ts     # GET /score
│   │   ├── country.ts   # GET /country/:iso3
│   │   ├── methodology.ts
│   │   ├── trends.ts    # /trends/global, /trends/regions
│   │   └── stats.ts
│   └── lib/
│       ├── db.ts        # PostgreSQL connection pool
│       └── schemas.ts   # Zod validation schemas
├── package.json
└── tsconfig.json
```

**Key Responsibilities:**
- Serve trust data via REST endpoints
- Validate requests with Zod schemas
- Query PostgreSQL efficiently
- Apply HTTP caching headers
- Version responses with methodology version header

See [API_REFERENCE.md](./API_REFERENCE.md) for endpoint documentation.

### 4. Web Layer (`web/`)

Next.js 14 React application providing interactive data exploration.

**Directory Structure:**
```
web/
├── app/
│   ├── page.tsx         # Homepage (story-first design)
│   ├── explore/
│   │   └── page.tsx     # Interactive map + detail panel
│   ├── methodology/
│   │   └── page.tsx     # Methodology explanation
│   └── layout.tsx       # Root layout, fonts
├── components/
│   ├── Header.tsx       # Shared site header
│   ├── Footer.tsx       # Shared site footer
│   ├── TrustMap.tsx     # ECharts world choropleth
│   ├── ExplorePanel.tsx # Country/region details
│   └── charts/
│       ├── USATrustTimeline.tsx
│       └── RegionComparison.tsx
├── lib/
│   ├── api.ts           # API client functions
│   ├── design-tokens.ts # Centralized colors/styles
│   └── store.ts         # Zustand state (minimal)
└── package.json
```

**Key Responsibilities:**
- Render interactive trust visualizations
- Fetch data from API layer
- Provide country/region exploration
- Explain methodology to users
- Tell data-driven stories

### 5. Infrastructure Layer

**Docker Compose Services:**
```yaml
services:
  postgres:   # Port 5432, PostgreSQL 16
  redis:      # Port 6379, Redis 7 (caching)
  minio:      # Ports 9000/9001, S3-compatible storage
```

**Make Targets:**
- `make up` - Boot services, migrate, seed
- `make api` - Start API dev server
- `make web` - Start web dev server
- `make etl-*` - Run ETL jobs
- `make assemble` - Compute pillar scores

## Data Flow

### 1. Ingestion Flow

```
External Source → download() → data/raw/{source}/{year}/
                      │
                      ▼
               process() → List[Observation]
                      │
                      ▼
           validate_observation() → QA warnings
                      │
                      ▼
          save_staging_data() → data/staging/{source}_{year}.csv
                      │
                      ▼
         load_to_database() → INSERT INTO observations
```

### 2. Computation Flow

```
observations table
       │
       ▼
fetch_pillar_scores() → Group by pillar, compute weighted averages
       │
       ▼
determine_confidence_tier() → Assign A/B/C tier based on data availability
       │
       ▼
save_country_year_scores() → INSERT INTO country_year
```

### 3. Request Flow

```
Browser → Next.js page
             │
             ▼
       lib/api.ts → fetch()
             │
             ▼
       Fastify API → routes/*.ts
             │
             ▼
       lib/db.ts → PostgreSQL pool.query()
             │
             ▼
       Response → Cache-Control headers → Browser
```

## Design Principles

### 1. Open Data Only

All data sources must be programmatically accessible without proprietary licenses. This ensures:
- Reproducibility by anyone
- No legal restrictions on redistribution
- Transparent methodology

**Prohibited:** Gallup World Poll, Edelman Trust Barometer

### 2. Auditability

Every data point maintains full provenance:
- Original source URL
- Download timestamp
- Raw value and unit
- Normalization method applied
- Sample size (for surveys)

Staging CSVs provide intermediate checkpoints for debugging.

### 3. Normalization to 0-100

All values are normalized to a 0-100 scale to enable:
- Cross-source comparisons
- Weighted aggregations
- Intuitive interpretation

Different sources use different normalization formulas:
- CPI: Already 0-100
- WGI: `((x + 2.5) / 5) * 100`
- ESS: `x * 10` (0-10 scale)
- Likert: Percentage selecting "trust" options

### 4. Confidence Transparency

Each pillar score includes a confidence tier reflecting data quality:
- **A (High):** Recent survey data (≤3 years) + governance proxy
- **B (Medium):** Older survey data (3-7 years) or single pillar + governance
- **C (Estimate):** Governance proxy only (no valid surveys within 7 years)

### 5. Versioning

- API responses include methodology version
- Methodology changes tracked in `data/reference/methodology.yaml`
- Database stores `version` column in `country_year`

## Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| ETL | Python 3.9+ | Rich data processing ecosystem (pandas, requests) |
| Database | PostgreSQL 16 | JSONB for sources_used, strong typing, indexes |
| API | Fastify (TypeScript) | Performance, schema validation, type safety |
| Web | Next.js 16 | SSR, app router, React ecosystem |
| Visualization | ECharts | World map choropleth, interactive charts |
| Styling | Tailwind CSS | Utility-first, dark theme support |
| Cache | Redis 7 | HTTP cache backend, session storage |
| Storage | MinIO | S3-compatible for raw file archival |

## Scaling Considerations

### Current State (MVP)
- Single PostgreSQL instance
- In-memory caching via HTTP headers
- ~6,000 observations, ~200 countries
- Local development with Docker Compose

### Future Considerations
- Read replicas for heavy query loads
- Redis caching layer for API responses
- CDN for static assets and cached responses
- Background job queue for ETL processing
- Separate staging/production databases

## Security Model

- No authentication required for read access (public data)
- Secrets stored in environment variables, never committed
- Database credentials via secrets manager in production
- All sources accessed with least-privilege credentials
- Robots.txt and terms-of-use respected for all sources

## Related Documentation

- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema details
- [ETL_PIPELINE.md](./ETL_PIPELINE.md) - ETL processor documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoint reference
- [METHODOLOGY.md](./METHODOLOGY.md) - GTI calculation methodology
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflows
- [DATA_SOURCES.md](./DATA_SOURCES.md) - Source documentation
- [ASSUMPTIONS.md](./ASSUMPTIONS.md) - Design decisions and trade-offs
