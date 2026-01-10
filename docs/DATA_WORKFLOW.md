# Data Workflow

This document describes the data pipeline, database architecture, and sync procedures for Trust Atlas.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Raw Data      │ ──► │   ETL Pipeline  │ ──► │   PostgreSQL    │
│   (data/raw/)   │     │   (etl/jobs/)   │     │   (local/Neon)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                                               │
       │  Source of truth                              │  Derived
       │  (never modified)                             │  (reproducible)
       ▼                                               ▼
  Git-tracked                                    API → Frontend
  reference files
```

## Source of Truth Hierarchy

1. **Raw data files** (`data/raw/`) - Original downloads from sources
2. **Reference files** (`data/reference/`) - ISO mappings, country aliases
3. **ETL code** (`etl/`) - Transformation logic (versioned in git)
4. **Database** - Derived output (fully reproducible from above)

The database is **never** the source of truth. If the database is lost, it can be fully reconstructed by re-running the ETL pipeline.

## Environments

### Local Development (Docker)

```bash
# Start local Postgres
make up

# Connection details (from .env)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trust
POSTGRES_USER=trust
POSTGRES_PASSWORD=trust
```

### Production (Neon)

```bash
# Connection details (from Vercel env vars)
NEON_HOST=ep-dark-truth-adjuoybx.c-2.us-east-1.aws.neon.tech
NEON_DB=trustatlas
NEON_USER=neondb_owner
NEON_PASSWORD=<from Vercel dashboard>

# Full connection strings (Vercel trustatlas-api project):
DATABASE_URL=postgresql://neondb_owner:<pw>@ep-dark-truth-adjuoybx-pooler.c-2.us-east-1.aws.neon.tech/trustatlas?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:<pw>@ep-dark-truth-adjuoybx.c-2.us-east-1.aws.neon.tech/trustatlas?sslmode=require
```

Production uses Neon PostgreSQL with:
- SSL required (`sslmode=require`)
- Point-in-time recovery (PITR)
- Automatic daily backups

## Development Workflow

### Adding New Data

1. Download raw data to `data/raw/<source>/`
2. Create/update ETL job in `etl/jobs/<source>.py`
3. Run ETL locally: `make etl-<source> YEAR=2024`
4. Verify data: `make sweep-dry`
5. Run assembly: `make assemble YEAR=2024`
6. Test locally with `make api` and `make web`
7. Commit ETL code (raw data stays local if >10MB)
8. Sync to production: `make sync-to-prod`

### Full ETL Rebuild

```bash
# Re-run all ETL jobs for a year
make etl-all YEAR=2024

# Or run specific pillars
make etl-gov YEAR=2024   # CPI + WGI + assembly
make etl-cpi YEAR=2024   # Just CPI
```

## Production Sync

### Syncing Local to Production

```bash
# Preview row counts
make sync-verify

# Sync (requires confirmation)
make sync-to-prod
```

The sync:
1. Prompts for confirmation (destructive operation)
2. Truncates production tables (observations, country_year, data_quality_flags)
3. Dumps local database (data only, preserves schema)
4. Loads to Neon via SSL connection

### When to Sync

- After running new ETL jobs
- After fixing data quality issues
- After methodology changes requiring recalculation

### What Gets Synced

| Table | Synced | Notes |
|-------|--------|-------|
| observations | Yes | All normalized trust data |
| country_year | Yes | Aggregated scores per country/year |
| countries | Yes | ISO codes, names, regions |
| data_quality_flags | Yes | Quality sweep results |

## Backup Strategy

### Never-Lose-Data Guarantees

1. **Raw data files**: Kept in `data/raw/`, versioned separately
2. **ETL code**: Git-versioned, can regenerate all derived data
3. **Reference files**: Git-versioned in `data/reference/`
4. **Production DB**: Neon PITR + automatic backups
5. **Local DB**: Docker volume (disposable, regenerable)

### Recovery Procedures

**If local DB is lost:**
```bash
make up        # Recreates Postgres
make migrate   # Applies schema
make etl-all   # Regenerates all data
```

**If production DB is lost:**
1. Restore from Neon PITR (up to 7 days)
2. Or regenerate locally and sync: `make etl-all && make sync-to-prod`

**If raw data is lost:**
- Re-download from original sources
- Most sources have stable URLs (WGI API, CPI downloads)
- Survey data (WVS, ESS) may require re-registration

## Data Quality

### Quality Sweep

```bash
# Check for issues, save to DB
make sweep

# Dry run (no DB writes)
make sweep-dry
```

The sweep detects:
- Statistical outliers (>3 std dev from mean)
- Year-over-year anomalies (>25 point changes)
- Cross-source conflicts
- Methodology mismatches
- Sample size issues
- Coverage gaps

### Exclusion Flags

Problematic observations are flagged via `exclude_from_gti = TRUE` in the observations table. These are filtered out during assembly but preserved for audit.

## Troubleshooting

### Connection Issues

```bash
# Test local connection
PGPASSWORD=trust psql -h localhost -U trust -d trust -c "SELECT 1;"

# Test production connection
PGPASSWORD=$NEON_PASSWORD psql "postgresql://neondb_owner@ep-dark-truth-a56ypybx.us-east-2.aws.neon.tech/trustatlas?sslmode=require" -c "SELECT 1;"
```

### Sync Failures

1. Check Neon dashboard for connection limits
2. Verify `NEON_PASSWORD` is set in `.env`
3. Ensure local DB has data: `make sync-verify`

### Schema Mismatches

Production schema is managed via migrations. If sync fails due to schema:
```bash
# Apply migrations to production manually
PGPASSWORD=$NEON_PASSWORD psql "postgresql://..." -f db/migrations/XXX_migration.sql
```
