# Trust Atlas

**Live site: [trustatlas.org](https://trustatlas.org)**

An open data initiative measuring trust across societies using only programmatically accessible data sources. An open-source project from [Trust Revolution](https://trustrevolution.co).

## Overview

Trust Atlas tracks four independent pillars of trust:

1. **Interpersonal Trust** - Survey data on whether "most people can be trusted"
2. **Institutional Trust** - Confidence in national government and institutions
3. **Media Trust** - Trust in news media (Reuters DNR, Eurobarometer, WVS)
4. **Governance Quality** - Institutional quality measures (CPI, WGI, WJP, Freedom House, V-Dem)

Each pillar is displayed independently (no composite index). All inputs are normalized to a 0-100 scale with data provenance and confidence flags.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ and npm
- Python 3.9+ and pip
- Make

### Setup

1. Clone the repository:
```bash
git clone https://github.com/trustrevolution/trustatlas.git
cd trustatlas
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start services and initialize data:
```bash
make up
```

This command will:
- Start Docker services (Postgres, Redis, MinIO)
- Run database migrations
- Seed demo data
- Process sample CPI data

4. Start the development servers:
```bash
# Terminal 1: API server (port 3001)
make api

# Terminal 2: Web UI (port 3000)
make web
```

5. Visit the application at http://localhost:3000

## Architecture

```
├── api/          # Fastify TypeScript API
├── web/          # Next.js React frontend
├── etl/          # Python ETL pipelines
├── db/           # Database migrations and schema
├── data/         # Raw data and staging files
├── scripts/      # Development utilities
└── .github/      # CI/CD workflows
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make up` | Boot all services, migrate DB, seed data |
| `make down` | Stop all Docker services |
| `make api` | Start API dev server (port 3001) |
| `make web` | Start web dev server (port 3000) |
| `make migrate` | Apply database migrations |
| `make seed` | Load demo data |
| `make test` | Run all tests |
| `make lint` | Run linting |
| `make clean` | Clean containers and volumes |

### ETL Commands

| Command | Description |
|---------|-------------|
| `make etl-cpi` | Process CPI data |
| `make etl-wgi` | Process WGI data |
| `make etl-wvs` | Process WVS data |
| `make etl-ess` | Process ESS data |
| `make etl-gov` | Process all governance sources |
| `make assemble` | Assemble all sources into country_year |
| `make sweep` | Run data quality checks |
| `make sweep-dry` | Data quality dry run (no DB writes) |

## API Endpoints

### Core Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /countries` | List all countries with latest pillar scores |
| `GET /country/{iso3}` | Country detail with time series |
| `GET /score?year=&pillar=` | Scores by year and pillar |
| `GET /methodology` | Current methodology (v0.5.0) |
| `GET /stats` | Database statistics |

### Trends Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /trends/global?pillar=` | Global map data |
| `GET /trends/regions?pillar=` | Regional averages |
| `GET /trends/country/{iso3}` | Country time series by pillar |
| `GET /trends/countries` | Multi-country comparison |
| `GET /trends/usa` | USA-specific historical data |

### Source Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /sources` | List all data sources |
| `GET /sources/{source}` | Source details and coverage |

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for full documentation.

## Data Sources

**Current coverage:** 23 sources, 12,000+ observations across 210 countries (1958-2025)

> **Roadmap:** See [docs/data-sources/](docs/data-sources/) for expansion plans. Next priority: Briq GPS (free Gallup-derived trust data).

### Survey Sources (WVS-family only)

**Interpersonal trust:** WVS, EVS, GSS, ANES, CES
**Institutional trust:** WVS, ANES, CES (EVS excluded due to variable inconsistency)
**Media trust:** WVS (E069_07/08 press confidence)

| Source | Countries | Years |
|--------|-----------|-------|
| World Values Survey (WVS) | 108 | 1981-2023 |
| European Values Study (EVS) | 47 | 1981-2021 |
| General Social Survey (GSS) | USA | 1972-2024 |
| American National Election Studies (ANES) | USA | 1958-2024 |
| Canadian Election Study (CES) | Canada | 2008-2021 |

These sources share identical question wording (A165 for interpersonal), ensuring methodological consistency.

### Media Trust Sources

Weighted average of available sources:

| Source | Weight | Countries | Years |
|--------|--------|-----------|-------|
| Reuters Digital News Report | 40% | 46 | 2015-2025 |
| Eurobarometer | 40% | 27 (EU) | 2000-2024 |
| WVS (E069_07/08) | 20% | 108 | 1981-2022 |

### Governance Sources

Weighted average of available sources:

| Source | Weight | Countries | Years |
|--------|--------|-----------|-------|
| Transparency International CPI | 20% | 180+ | 2012-2024 |
| World Bank WGI | 20% | 206 | 2008-2023 |
| World Justice Project (WJP) | 20% | 142 | 2012-2024 |
| WJP Corruption Sub-index | 20% | 142 | 2012-2024 |
| Freedom House | 10% | 189 | 2013-2024 |
| V-Dem | 10% | 176 | 2000-2024 |

### Reference Data (Not in Pillars)
These sources are in the database but excluded from pillar calculations due to methodology differences:

| Source | Reason for Exclusion |
|--------|---------------------|
| European Social Survey (ESS) | Different scale (0-10 vs binary) |
| Afrobarometer | Different scale/wording than WVS |
| Latinobarometro | Methodology changes caused swings |
| Asian Barometer | Inverted scales in early waves |
| Arab Barometer | Different scale/wording than WVS |
| Eurobarometer | Non-commercial license |
| OECD Trust Survey | Different institutional definitions |

See [docs/data-sources/](docs/data-sources/) for integration status and expansion roadmap.

## Methodology

**Current version:** 0.5.0

Each pillar is tracked independently. No composite score is computed.

- **Survey pillars:** WVS-family sources with identical question wording
- **Governance pillar:** Weighted average (see table above); missing sources have weight redistributed
- **WGI scaling:** `((raw + 2.5) / 5) × 100` (converts -2.5 to +2.5 → 0-100)

### Confidence Tiers
- **A**: Current survey data (≤3y) + current governance proxy
- **B**: Survey >3y old OR only one pillar + governance proxy
- **C**: Governance proxy only (no valid surveys within 7y)

## Database Schema

Key tables:
- `countries` - ISO3 codes, names, regions, income groups
- `observations` - Normalized trust data per source/year/country
- `country_year` - Materialized view with pillar scores and confidence tiers
- `data_quality_flags` - Outliers and quality issues for review

See [docs/DATA_MODEL.md](docs/DATA_MODEL.md) for full schema.

## Testing

```bash
# API tests
cd api && npm test

# Web tests
cd web && npm test

# ETL tests
cd etl && python -m pytest tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes following the code style guidelines
4. Run tests and linting
5. Submit a pull request

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## Code Style

- **TypeScript/JavaScript**: 2-space indentation, ES modules, camelCase
- **Python**: 4-space indentation, snake_case, Black formatting
- **SQL**: Lowercase keywords, one statement per migration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Data Ethics

- All displayed values show source and year provenance
- Year-over-year changes >25 points are flagged for review
- Source licenses are stored and respected
- Data removal path available for license changes

## Support

For questions or issues, please:
1. Check existing [GitHub Issues](../../issues)
2. Review the [documentation](docs/)
3. Open a new issue with detailed information
